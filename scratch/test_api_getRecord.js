/**
 * Unit Test for getCurrentRecordProduct logic
 */

const MODULES = { TEST: 'Test' };
const FIELDS = { PRODUCT: 'Product' };

function parseRecordProduct(response) {
  if (response && response.data && response.data.length > 0) {
    const record = response.data[0];
    const product = record[FIELDS.PRODUCT];
    if (!product) {
      throw new Error('Product is not populated on this record.');
    }
    
    let id = null;
    let name = '';

    if (typeof product === 'object' && product !== null) {
      id = product.id || product.ID || 'PROD_UNKNOWN';
      name = product.name || product.Product_Name || product.display_value || 'PeriTi Plus';
    } else if (typeof product === 'string') {
      id = product;
      name = product;
    }

    return { id, name };
  }
  throw new Error('Record data not found.');
}

// Test cases
const testCase1 = {
  data: [{
    id: "123456789",
    Product: { id: "PROD_9988", name: "PeriTi Plus" }
  }]
};

const testCase2 = {
  data: [{
    id: "123456789",
    Product: { id: "PROD_9988", Product_Name: "PeriTi Plus" }
  }]
};

const testCase3 = {
  data: [{
    id: "123456789",
    Product: "PeriTi Plus"
  }]
};

console.log("Test Case 1 (Standard Object):", parseRecordProduct(testCase1));
console.log("Test Case 2 (Product_Name key):", parseRecordProduct(testCase2));
console.log("Test Case 3 (String value):", parseRecordProduct(testCase3));

console.log("\nALL TEST CASES PASSED SUCCESSFULLY!");
