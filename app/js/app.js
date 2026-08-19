/**
 * app.js
 * ────────────────────────────────────────────────────────────
 * Main Widget Lifecycle Controller & Zoho CRM Embedded App Initialization.
 */

import { state, setState, subscribe } from './state.js';
import { getProductById, fetchComplaintCategories } from './api.js';
import { renderApp } from './render.js';
import { initEventListeners } from './events.js';
import { showToast } from './utils.js';

/**
 * Initialize the widget with data received from the Client Script.
 */
async function initialize(data) {
  const recordId = data?.recordId || null;
  const productId = data?.productId || null;
  const productName = data?.productName || '';
  const pickListValue = data?.pickListValue || '';

  // ── Only console: confirm Product info received or not ──
  console.log("[Product Widget] Product Info Received:", productId ? "YES" : "NO", { productId, productName, pickListValue });

  setState({
    recordId,
    productId,
    productName,
    pickListValue,
    loading: true,
    error: null
  }, 'INIT_START');

  if (!productId) {
    setState({
      loading: false,
      error: 'Product not selected.\nPlease select a Product from the CRM record.'
    }, 'PRODUCT_NOT_SELECTED');
    return;
  }

  try {
    const productRecord = await getProductById(productId);

    if (!productRecord) {
      setState({
        loading: false,
        error: 'Product record could not be found.'
      }, 'PRODUCT_NOT_FOUND');
      return;
    }

    const product = {
      ...productRecord,
      id: productRecord.id || productId,
      name: productRecord.Product_Name || productName || '-',
      code: productRecord.Product_Code || '-'
    };

    let complaints = [];
    try {
      complaints = await fetchComplaintCategories(productId);
    } catch (catErr) { /* no categories */ }

    setState({
      product,
      productName: product.name,
      complaints,
      loading: false,
      error: null
    }, 'INIT_SUCCESS');

    if (complaints.length === 0) {
      showToast(`No complaint categories found for ${product.name}`, 'info');
    }

  } catch (err) {
    setState({
      loading: false,
      error: 'Unable to load Product information.\nPlease try again.'
    }, 'PRODUCT_API_ERROR');
  }
}

/**
 * Wait for ZOHO SDK to become available.
 */
function waitForZohoSDK(maxWaitMs = 15000) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const poll = () => {
      if (typeof window.ZOHO !== 'undefined' && window.ZOHO.embeddedApp) {
        resolve(window.ZOHO.embeddedApp);
      } else if (Date.now() - startTime >= maxWaitMs) {
        resolve(null);
      } else {
        setTimeout(poll, 50);
      }
    };
    poll();
  });
}

/**
 * Bootstrap the Zoho Widget application.
 */
async function startZohoApp() {
  subscribe((currentState, changeType) => {
    try {
      renderApp(currentState, changeType);
    } catch (renderErr) { /* silent */ }
  });

  try {
    initEventListeners();
  } catch (eventErr) { /* silent */ }

  const embeddedApp = await waitForZohoSDK(15000);

  if (!embeddedApp) {
    setState({
      loading: false,
      error: 'Zoho CRM SDK is not available.\nPlease ensure this widget is opened from within Zoho CRM.'
    }, 'SDK_UNAVAILABLE');
    return;
  }

  // Register PageLoad BEFORE init()
  embeddedApp.on("PageLoad", async function (data) {
    await initialize(data);
  });

  try {
    await embeddedApp.init();
  } catch (err) {
    setState({
      loading: false,
      error: 'Failed to initialize Zoho CRM Widget.\nPlease reload and try again.'
    }, 'INIT_FAILED');
  }
}

// Start app
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startZohoApp);
} else {
  startZohoApp();
}
