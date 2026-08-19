/**
 * api.js
 * ────────────────────────────────────────────────────────────
 * Zoho CRM API integration layer.
 */

import { MODULES, FIELDS } from './constants.js';

/**
 * Check if ZOHO CRM API is available.
 * @returns {boolean}
 */
export function isZohoEnvironment() {
  return (
    typeof window.ZOHO !== 'undefined' &&
    window.ZOHO.CRM &&
    window.ZOHO.CRM.API
  );
}

/**
 * Fetch a Product record by its ID from the Products module.
 * @param {string} productId
 * @returns {Promise<Object|null>}
 */
export async function getProductById(productId) {
  if (!productId) {
    throw new Error('Product ID is required');
  }

  if (!isZohoEnvironment()) {
    throw new Error('ZOHO.CRM.API is not available');
  }

  const response = await ZOHO.CRM.API.getRecord({
    Entity: MODULES.PRODUCTS,
    RecordID: productId
  });

  return response?.data?.[0] || null;
}

/**
 * Fetch Complaint Categories for a Product based on Product ID.
 * @param {string} productId
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function fetchComplaintCategories(productId) {
  if (!isZohoEnvironment()) return [];

  if (productId) {
    try {
      const query = `(${FIELDS.Select_Product}.id:equals:${productId})`;
      const response = await ZOHO.CRM.API.searchRecord({
        Entity: MODULES.COMPLAINT_X_PRODUCTS,
        Type: 'criteria',
        Query: query
      });

      if (response?.data?.length > 0) {
        console.log(response?.data, "response?.data")
        return response.data.map(item => ({
          id: item.Complaint_Category_in_Products?.id || item.id,
          name: item.Complaint_Category_in_Products?.name || item[FIELDS.CATEGORY_NAME] || item.Name || 'Unnamed Category'
        }));
      }
    } catch (err) { /* fallback below */ }
  }

  try {
    const allRes = await ZOHO.CRM.API.getAllRecords({
      Entity: MODULES.COMPLAINT_CATEGORY
    });

    if (allRes?.data?.length > 0) {
      console.log(allRes?.data, "allRes?.data")
      return allRes.data.map(item => ({
        id: item.id,
        name: item[FIELDS.CATEGORY_NAME] || item.Name || 'Unnamed Category'
      }));
    }
  } catch (err) { /* no categories */ }

  return [];
}

/**
 * Fetch Solutions for a Complaint Category.
 * @param {string} complaintId
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function fetchComplaintSolutions(complaintId) {
  if (!isZohoEnvironment()) return [];

  if (complaintId) {
    try {
      const query = `(${FIELDS.SOLUTION_COMPLAINT_LOOKUP}.id:equals:${complaintId})`;
      const response = await ZOHO.CRM.API.searchRecord({
        Entity: MODULES.COMPLAINT_SOLUTION,
        Type: 'criteria',
        Query: query
      });

      if (response?.data?.length > 0) {
        return response.data.map(item => ({
          id: item.id,
          name: item[FIELDS.SOLUTION_NAME] || item.Name || 'Unnamed Solution'
        }));
      }
    } catch (err) { /* fallback below */ }
  }

  try {
    const allRes = await ZOHO.CRM.API.getAllRecords({
      Entity: MODULES.COMPLAINT_SOLUTION
    });

    if (allRes?.data?.length > 0) {
      return allRes.data.map(item => ({
        id: item.id,
        name: item[FIELDS.SOLUTION_NAME] || item.Name || 'Unnamed Solution'
      }));
    }
  } catch (err) { /* no solutions */ }

  return [];
}

/**
 * Save Subform Rows to CRM Record.
 * @param {string} recordId
 * @param {Array} rows
 * @returns {Promise<any>}
 */
export async function saveSubformRows(recordId, rows) {
  if (!recordId) {
    throw new Error("Record ID is missing.");
  }

  if (!rows || rows.length === 0) {
    throw new Error("Subform row data is missing.");
  }

  if (!isZohoEnvironment()) {
    throw new Error("ZOHO.CRM.API is not available.");
  }

  console.log("========== SAVE SUBFORM ==========");
  console.log("recordId:", recordId);
  console.log("recordId type:", typeof recordId);
  console.log("module:", MODULES.CUSTOM_MODULE);
  console.log("rows:", rows);

  const subformPayload = rows.map((row) => ({
    [FIELDS.SUBFORM_COL_COMPLAINT]: {
      id: row.complaintId
    },

    [FIELDS.SUBFORM_COL_SOLUTION]: {
      id: row.solutionId
    }
  }));

  const APIData = {
    // data: {
    id: recordId,
    [FIELDS.SUBFORM_COMPLAINT]: subformPayload
    // }
  };

  console.log(
    "FINAL API PAYLOAD:",
    JSON.stringify(APIData, null, 2)
  );

  const response = await ZOHO.CRM.API.updateRecord({
    Entity: MODULES.CUSTOM_MODULE + '/' + recordId,
    APIData

  });

  console.log("ZOHO UPDATE RESPONSE:", response);

  return response;
}

/**
 * Close Zoho CRM Widget Popup.
 */
export function closeWidgetPopup() {
  try {
    if (isZohoEnvironment() && window.ZOHO.CRM.UI?.Popup) {
      window.ZOHO.CRM.UI.Popup.close();
    }
  } catch (err) { /* silent */ }
}

/**
 * Refresh Parent CRM Record Page.
 */
export function refreshParentRecord() {
  try {
    if (isZohoEnvironment() && window.ZOHO.CRM.UI?.Record) {
      window.ZOHO.CRM.UI.Record.refresh();
    }
  } catch (err) { /* silent */ }
}
