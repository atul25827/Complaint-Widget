/**
 * constants.js
 * ────────────────────────────────────────────────────────────
 * Central API configuration, module API names, and field mappings.
 * ALL MOCK DATASETS REMOVED - STRICTLY LIVE DATA ONLY.
 */

// Zoho CRM Module API Names
export const MODULES = {
  TEST: 'Test',
  COMPLAINT_CATEGORY: 'Complaint_Category',
  COMPLAINT_SOLUTION: 'Complaint_Solution'
};

// Zoho CRM Field API Names
export const FIELDS = {
  // Test Module Fields
  PRODUCT: 'Product',
  CALL_STATUS: 'Pick_List_1',
  SUBFORM_COMPLAINT: 'Complaint',

  // Complaint Category Module Fields
  CATEGORY_PRODUCT_LOOKUP: 'Product_Name',
  CATEGORY_NAME: 'Name',

  // Complaint Solution Module Fields
  SOLUTION_COMPLAINT_LOOKUP: 'Complaint_Category',
  SOLUTION_NAME: 'Name',

  // Subform Column API Names
  SUBFORM_COL_COMPLAINT: 'Complaint',
  SUBFORM_COL_SOLUTION: 'Solution'
};
