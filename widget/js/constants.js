/**
 * constants.js
 * ────────────────────────────────────────────────────────────
 * Central API configuration, module API names, and field mappings.
 */

// Zoho CRM Module API Names
export const MODULES = {
  CUSTOM_MODULE: 'Test_Only',
  PRODUCTS: 'Products',
  COMPLAINT_CATEGORY: 'Complaint_Category',
  COMPLAINT_SOLUTION: 'Complaint_Solution',
  COMPLAINT_X_PRODUCTS: 'Complaint_X_Products'
};

// Zoho CRM Field API Names
export const FIELDS = {
  // CustomModule19 Fields
  PRODUCT: 'Product',
  CALL_STATUS: 'Pick_List_1',
  SUBFORM_COMPLAINT: 'test_subform',

  // Products Module Fields
  PRODUCT_NAME: 'Product_Name',
  PRODUCT_CODE: 'Product_Code',

  // Complaint Category Module Fields
  CATEGORY_PRODUCT_LOOKUP: 'Product_Name',
  CATEGORY_NAME: 'Name',
  Select_Product: 'Select_Product',

  // Complaint Solution Module Fields
  SOLUTION_COMPLAINT_LOOKUP: 'Complaint_Category',
  SOLUTION_NAME: 'Name',

  // Subform Column API Names
  SUBFORM_COL_COMPLAINT: 'Complaint',
  SUBFORM_COL_SOLUTION: 'Solution'
};

// Fields to display in the Product Information card (label → API field name)
export const PRODUCT_DISPLAY_FIELDS = [
  { label: 'Product Name', key: 'Product_Name' },
  { label: 'Product Code', key: 'Product_Code' },
  { label: 'Product Category', key: 'Product_Category' },
  { label: 'Unit Price', key: 'Unit_Price' },
  { label: 'Manufacturer', key: 'Manufacturer' },
  { label: 'Description', key: 'Description' },
  { label: 'Product Active', key: 'Product_Active' },
  { label: 'Created Time', key: 'Created_Time' },
  { label: 'Modified Time', key: 'Modified_Time' }
];
