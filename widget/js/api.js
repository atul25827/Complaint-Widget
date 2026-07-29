/**
 * api.js
 * ────────────────────────────────────────────────────────────
 * Production Zoho CRM API Integration Layer with dynamic module resolution
 * supporting CustomModule19, Test Only, and Test modules.
 */

import { MODULES, FIELDS } from './constants.js';
import { log } from './utils.js';

/**
 * Check if running within active Zoho CRM Embedded Environment.
 * @returns {boolean}
 */
export function isZohoEnvironment() {
  return (
    typeof window.ZOHO !== 'undefined' &&
    typeof window.ZOHO.CRM !== 'undefined' &&
    typeof window.ZOHO.CRM.API !== 'undefined'
  );
}

/**
 * Helper to extract Product object from CRM record
 * @param {any} record 
 * @returns {{id: string, name: string}|null}
 */
function extractProductFromRecord(record) {
  if (!record) return null;
  const product = record[FIELDS.PRODUCT] || record.Product;
  if (!product) return null;

  let id = null;
  let name = '';

  if (typeof product === 'object' && product !== null) {
    id = product.id || product.ID || null;
    name = product.name || product.Product_Name || product.display_value || '';
  } else if (typeof product === 'string') {
    id = product;
    name = product;
  }

  if (id) {
    return { id, name };
  }
  return null;
}

/**
 * API 1: Get Current Record with Dynamic Module Resolution
 * Checks target entityName (e.g. CustomModule19), falling back to Test / Test_Only.
 * @param {string} recordId 
 * @param {string} [entityName]
 * @returns {Promise<{id: string, name: string}>} Product object
 */
export async function getCurrentRecordProduct(recordId, entityName = null) {
  log.info(`Executing ZOHO.CRM.API.getRecord for RecordID: "${recordId}", Primary Entity: "${entityName}"`);

  if (!isZohoEnvironment()) {
    const errorMsg = 'ZOHO.CRM.API is not initialized on window object. Ensure the widget is running inside Zoho CRM.';
    log.error(errorMsg);
    throw new Error(errorMsg);
  }

  const entitiesToTry = [];
  if (entityName) entitiesToTry.push(entityName);
  if (!entitiesToTry.includes('CustomModule19')) entitiesToTry.push('CustomModule19');
  if (!entitiesToTry.includes('Test')) entitiesToTry.push('Test');
  if (!entitiesToTry.includes('Test_Only')) entitiesToTry.push('Test_Only');

  let lastError = null;
  for (const entity of entitiesToTry) {
    try {
      log.info(`Attempt: Calling ZOHO.CRM.API.getRecord for Entity "${entity}" (ID: ${recordId})...`);
      const response = await window.ZOHO.CRM.API.getRecord({
        Entity: entity,
        RecordID: recordId
      });

      log.info(`ZOHO.CRM.API.getRecord ("${entity}") Response:`, response);

      if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
        const product = extractProductFromRecord(response.data[0]);
        if (product) {
          log.info(`Successfully loaded Product from Entity "${entity}":`, product);
          return product;
        }
      }
    } catch (err) {
      log.warn(`getRecord for Entity "${entity}" failed:`, err);
      lastError = err;
    }
  }

  throw new Error(`Product lookup field is empty or record could not be fetched for Record ID: ${recordId}`);
}

/**
 * API 2: Fetch Complaint Categories for a Product via ZOHO.CRM.API.searchRecord
 * @param {string} productId 
 * @param {string} [productName]
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function fetchComplaintCategories(productId, productName = '') {
  log.info(`Executing ZOHO.CRM.API.searchRecord for Complaint_Category (Product ID: "${productId}", Name: "${productName}")`);

  if (!isZohoEnvironment()) {
    log.error('ZOHO.CRM.API is not initialized. Cannot perform searchRecord.');
    return [];
  }

  try {
    const primaryQuery = `(${FIELDS.CATEGORY_PRODUCT_LOOKUP}.id:equals:${productId})`;
    log.info(`Executing Primary Search Query: "${primaryQuery}"`);

    let response = await window.ZOHO.CRM.API.searchRecord({
      Entity: MODULES.COMPLAINT_CATEGORY,
      Type: 'criteria',
      Query: primaryQuery
    });

    log.info('Raw Complaint_Category Primary Search Response:', response);

    // Fallback search by Product Name if ID query yields no matches
    if ((!response || !response.data || !Array.isArray(response.data) || response.data.length === 0) && productName) {
      const secondaryQuery = `(${FIELDS.CATEGORY_PRODUCT_LOOKUP}:equals:${productName})`;
      log.warn(`Primary ID query yielded no results. Retrying search by Product Name: "${secondaryQuery}"`);

      response = await window.ZOHO.CRM.API.searchRecord({
        Entity: MODULES.COMPLAINT_CATEGORY,
        Type: 'criteria',
        Query: secondaryQuery
      });

      log.info('Raw Complaint_Category Secondary Search Response:', response);
    }

    if (response && response.data && Array.isArray(response.data)) {
      const list = response.data.map(item => ({
        id: item.id,
        name: item[FIELDS.CATEGORY_NAME] || item.Name || 'Unnamed Category'
      }));
      log.info(`Successfully fetched ${list.length} Complaint Category records from CRM:`, list);
      return list;
    }

    log.warn(`No Complaint Categories found in CRM matching Product ID: "${productId}"`, response);
    return [];
  } catch (err) {
    log.error(`ZOHO.CRM.API.searchRecord failed for Complaint_Category (Product ID: ${productId})`, err);
    return [];
  }
}

/**
 * API 3: Fetch Solutions for a Complaint Category
 * @param {string} complaintId 
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function fetchComplaintSolutions(complaintId) {
  log.info(`Executing ZOHO.CRM.API.searchRecord for Complaint_Solution with Complaint ID: "${complaintId}"`);

  if (!isZohoEnvironment()) {
    log.error('ZOHO.CRM.API is not initialized. Cannot perform searchRecord.');
    return [];
  }

  try {
    const query = `(${FIELDS.SOLUTION_COMPLAINT_LOOKUP}.id:equals:${complaintId})`;
    log.info(`Executing Search Query: "${query}"`);

    const response = await window.ZOHO.CRM.API.searchRecord({
      Entity: MODULES.COMPLAINT_SOLUTION,
      Type: 'criteria',
      Query: query
    });

    log.info('Raw Complaint_Solution Search Response:', response);

    if (response && response.data && Array.isArray(response.data)) {
      const list = response.data.map(item => ({
        id: item.id,
        name: item[FIELDS.SOLUTION_NAME] || item.Name || 'Unnamed Solution'
      }));
      log.info(`Successfully fetched ${list.length} Complaint Solution records from CRM:`, list);
      return list;
    }

    log.warn(`No Complaint Solutions found in CRM matching Complaint ID: "${complaintId}"`, response);
    return [];
  } catch (err) {
    log.error(`ZOHO.CRM.API.searchRecord failed for Complaint_Solution (Complaint ID: ${complaintId})`, err);
    return [];
  }
}

/**
 * API 4: Save Subform Rows to Record with Dynamic Module Resolution
 * @param {string} recordId 
 * @param {Array<{complaintId: string, solutionId: string}>} rows 
 * @param {string} [entityName]
 * @returns {Promise<any>}
 */
export async function saveSubformRows(recordId, rows, entityName = null) {
  if (!recordId || !rows || rows.length === 0) {
    throw new Error('Record ID or subform row data missing.');
  }

  const subformPayload = rows.map(row => ({
    [FIELDS.SUBFORM_COL_COMPLAINT]: { id: row.complaintId },
    [FIELDS.SUBFORM_COL_SOLUTION]: { id: row.solutionId }
  }));

  const entitiesToTry = [];
  if (entityName) entitiesToTry.push(entityName);
  if (!entitiesToTry.includes('CustomModule19')) entitiesToTry.push('CustomModule19');
  if (!entitiesToTry.includes('Test')) entitiesToTry.push('Test');
  if (!entitiesToTry.includes('Test_Only')) entitiesToTry.push('Test_Only');

  if (!isZohoEnvironment()) {
    throw new Error('ZOHO.CRM.API is not initialized.');
  }

  let lastErr = null;
  for (const entity of entitiesToTry) {
    try {
      log.info(`Saving subform rows to Entity "${entity}"...`);
      const res = await window.ZOHO.CRM.API.updateRecord({
        Entity: entity,
        APIData: {
          id: recordId,
          [FIELDS.SUBFORM_COMPLAINT]: subformPayload
        }
      });
      log.info(`updateRecord ("${entity}") response:`, res);
      return res;
    } catch (err) {
      log.warn(`updateRecord for "${entity}" failed:`, err);
      lastErr = err;
    }
  }

  throw lastErr || new Error('Failed to update record subform.');
}

/**
 * Close Zoho CRM Widget Popup
 */
export function closeWidgetPopup() {
  try {
    if (isZohoEnvironment() && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Popup) {
      window.ZOHO.CRM.UI.Popup.close();
    }
  } catch (err) {
    log.error('Error closing popup', err);
  }
}

/**
 * Refresh Parent CRM Record Page
 */
export function refreshParentRecord() {
  try {
    if (isZohoEnvironment() && window.ZOHO.CRM.UI && window.ZOHO.CRM.UI.Record) {
      window.ZOHO.CRM.UI.Record.refresh();
    }
  } catch (err) {
    log.error('Error refreshing parent record', err);
  }
}
