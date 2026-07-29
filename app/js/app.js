/**
 * app.js
 * ────────────────────────────────────────────────────────────
 * Main Widget Lifecycle Controller & Zoho CRM Embedded App Initialization.
 * STRICTLY LIVE CRM DATA ONLY - ASYNC SDK LOAD GUARD.
 */

import { state, setState, subscribe } from './state.js';
import { getCurrentRecordProduct, fetchComplaintCategories } from './api.js';
import { renderApp } from './render.js';
import { initEventListeners } from './events.js';
import { showToast, log } from './utils.js';

let isAppInitialized = false;

// Global Unhandled Exception Listener for Host Environment Debugging
window.addEventListener('error', (event) => {
  log.error(`Global Uncaught Exception: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  log.error(`Global Unhandled Promise Rejection: ${event.reason}`, event.reason);
});

/**
 * Initialize Widget data & UI for target Record ID via Live Zoho CRM APIs.
 * @param {string} recordId 
 * @param {string} [entityName]
 */
export async function initialize(recordId, entityName = null) {
  if (isAppInitialized) {
    log.warn(`initialize() called again for RecordID: "${recordId}", skipping duplicate call.`);
    return;
  }
  isAppInitialized = true;

  log.info(`Initializing Widget for Live Record ID: "${recordId}", Entity: "${entityName}"`);

  // Subscribe UI renderer to state changes
  subscribe((currentState, changeType) => {
    try {
      renderApp(currentState, changeType);
    } catch (renderErr) {
      log.error(`UI Render failed during state change: ${changeType}`, renderErr);
    }
  });

  // Bind all interactive DOM event listeners
  try {
    initEventListeners();
  } catch (eventErr) {
    log.error('Failed to bind event listeners', eventErr);
  }

  setState({
    recordId,
    loadingRecord: true,
    error: null
  }, 'INIT_START');

  try {
    // 1. Get Product from CRM record via Live API
    log.info(`Calling ZOHO.CRM.API.getRecord for RecordID: "${recordId}", Entity: "${entityName}"...`);
    const product = await getCurrentRecordProduct(recordId, entityName);

    if (!product || !product.id) {
      throw new Error(`Product is not selected or invalid on Record ID: "${recordId}".`);
    }

    log.info(`Live Product Loaded -> ID: "${product.id}", Name: "${product.name}"`);

    // 2. Fetch Complaint Categories for Product via Live CRM API
    log.info(`Calling ZOHO.CRM.API.searchRecord for Complaint_Category (Product ID: "${product.id}", Name: "${product.name}")...`);
    const complaints = await fetchComplaintCategories(product.id, product.name);

    setState({
      productId: product.id,
      productName: product.name,
      complaints,
      loadingRecord: false
    }, 'INIT_SUCCESS');

    if (complaints.length === 0) {
      log.warn(`No complaint categories found in Zoho CRM for Product: "${product.name}"`);
      showToast(`No complaint categories found for ${product.name}`, 'info');
    } else {
      log.info(`Loaded ${complaints.length} complaint category options from Zoho CRM.`);
    }

  } catch (err) {
    log.error(`Widget Initialization Failed for Record ID: "${recordId}"`, err);
    setState({
      loadingRecord: false,
      productName: '--',
      error: err.message || 'Failed to initialize record metadata from Zoho CRM.'
    }, 'INIT_ERROR');
  }
}

/**
 * Extract Record ID from Zoho Embedded App PageLoad data, params object, or URL string.
 * Supports Zoho CRM 18-digit numerical IDs (e.g. 143890000591299037).
 * @param {any} data 
 * @returns {string|null}
 */
function extractRecordId(data) {
  if (data) {
    if (data.EntityId && Array.isArray(data.EntityId) && data.EntityId.length > 0) {
      return data.EntityId[0];
    }
    if (data.EntityId && typeof data.EntityId === 'string') {
      return data.EntityId;
    }
    if (data.Entity && data.Entity.id) {
      return data.Entity.id;
    }
    if (data.params && data.params.recordId) {
      return data.params.recordId;
    }
    if (data.params && data.params.EntityId) {
      return data.params.EntityId;
    }
    if (data.recordId) {
      return data.recordId;
    }
    if (data.rec_id) {
      return data.rec_id;
    }
    if (data.id) {
      return data.id;
    }
  }

  // Check URL Query parameters
  const urlParams = new URLSearchParams(window.location.search);
  let id = urlParams.get('recordId') || urlParams.get('EntityId') || urlParams.get('rec_id') || urlParams.get('id');

  // Fallback: Regex match 17-20 digit numerical ID from iframe location URL
  if (!id) {
    const match = window.location.href.match(/(\d{17,20})/);
    if (match) {
      id = match[1];
    }
  }

  return id;
}

/**
 * Extract Module API Name passed from Zoho CRM
 * @param {any} data 
 * @returns {string|null}
 */
function extractEntityName(data) {
  if (data) {
    if (data.Entity && typeof data.Entity === 'string') return data.Entity;
    if (data.EntityName && typeof data.EntityName === 'string') return data.EntityName;
    if (data.module && typeof data.module === 'string') return data.module;
  }
  return 'CustomModule19';
}

/**
 * Wait for window.ZOHO.embeddedApp to become available.
 * Polls every 20ms up to maxWaitMs (5000ms) while SDK script downloads.
 * @param {number} maxWaitMs 
 * @returns {Promise<any>}
 */
function waitForZohoSDK(maxWaitMs = 5000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const poll = () => {
      if (typeof window.ZOHO !== 'undefined' && window.ZOHO.embeddedApp) {
        resolve(window.ZOHO.embeddedApp);
      } else if (Date.now() - startTime >= maxWaitMs) {
        resolve(null);
      } else {
        setTimeout(poll, 20);
      }
    };
    poll();
  });
}

/**
 * Helper to bootstrap ZOHO.embeddedApp initialization with network delay tolerance
 */
async function startZohoApp() {
  log.info('DOM Content Loaded. Waiting for ZOHO.embeddedApp SDK script to load...');

  const embeddedApp = await waitForZohoSDK(5000);

  if (!embeddedApp) {
    log.warn('ZOHO.embeddedApp SDK script did not load within 5s. Checking URL query parameters...');
    const recordId = extractRecordId(null);
    const entityName = extractEntityName(null);

    if (recordId) {
      log.info(`Extracted recordId from URL query: "${recordId}", Entity: "${entityName}"`);
      initialize(recordId, entityName);
    } else {
      const errorMsg = 'ZOHO.embeddedApp SDK is not available and no recordId URL parameter was provided.';
      log.error(errorMsg);
      setState({
        loadingRecord: false,
        productName: '--',
        error: errorMsg
      }, 'NO_SDK');
    }
    return;
  }

  log.info('ZOHO.embeddedApp detected! Registering PageLoad event handler...');

  embeddedApp.on("PageLoad", async function (data) {
    log.info('ZOHO.embeddedApp PageLoad event received! Raw Payload:', data);

    const recordId = extractRecordId(data);
    const entityName = extractEntityName(data);

    if (!recordId) {
      const errorMsg = 'No valid Record ID received from Zoho CRM PageLoad event.';
      log.error(errorMsg, data);
      setState({
        loadingRecord: false,
        productName: '--',
        error: errorMsg
      }, 'NO_RECORD_ID');
      return;
    }

    await initialize(recordId, entityName);
  });

  log.info('Executing ZOHO.embeddedApp.init()...');
  embeddedApp.init().then(() => {
    log.info('ZOHO.embeddedApp.init() resolved successfully.');
  }).catch(err => {
    log.error('ZOHO.embeddedApp.init() rejected with error:', err);
  });
}

// Start app as soon as script evaluates or on DOMReady
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startZohoApp);
} else {
  startZohoApp();
}
