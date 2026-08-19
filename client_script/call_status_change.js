/**
 * Zoho CRM Client Script - Call Status Field Change Trigger
 * =========================================================
 * Module:      Test (CustomModule19)
 * Field:       Pick_List_1 (Call Status)
 * Event:       On Field Change
 * Target:      Opens the Complaint Solution Widget in a Popup Dialog
 * =========================================================
 */

(function (value, context) {
  try {
    console.log("[Client Script Debug] Execution started.");
    console.log("[Client Script Debug] 'value' parameter:", typeof value !== "undefined" ? value : "undefined");
    console.log("[Client Script Debug] 'context' parameter:", typeof context !== "undefined" ? context : "undefined");

    // Dynamic Page Object Resolver
    let pageObj = null;

    if (typeof ZDK !== "undefined" && ZDK.Page) {
      pageObj = ZDK.Page;
    } else if (typeof window !== "undefined" && window.ZDK && window.ZDK.Page) {
      pageObj = window.ZDK.Page;
    } else if (typeof context !== "undefined" && context && context.page) {
      pageObj = context.page;
    } else if (typeof context !== "undefined" && context && typeof context.getField === "function") {
      pageObj = context;
    }

    if (!pageObj || typeof pageObj.getField !== "function") {
      console.error("[Client Script Error] Page context is not available.", {
        ZDK: typeof ZDK !== "undefined" ? ZDK : null,
        context: typeof context !== "undefined" ? context : null
      });
      return;
    }

    console.log("[Client Script Debug] Resolved Page object successfully:", pageObj);

    // 1. Read Call Status (Pick_List_1) field value
    const statusField = pageObj.getField("Pick_List_1");
    const status = statusField ? statusField.getValue() : value;

    if (!status) {
      console.log("[Client Script] Pick_List_1 is empty, returning.");
      return;
    }

    // 2. Read Product lookup field value from current Test record page
    const productField = pageObj.getField("Product");
    const product = productField ? productField.getValue() : null;

    console.log("[Client Script Debug] Product field value:", product);

    if (!product || (!product.id && typeof product !== "string")) {
      const client = (typeof ZDK !== "undefined" && ZDK.Client) ? ZDK.Client : (typeof window !== "undefined" && window.ZDK ? window.ZDK.Client : null);
      if (client && typeof client.showAlert === "function") {
        client.showAlert({
          type: "warning",
          message: "Please select Product first."
        });
      } else {
        alert("Please select Product first.");
      }
      return;
    }

    // Extract Product ID and Name safely
    const productId = typeof product === "object" ? product.id : product;
    const productName = typeof product === "object" ? (product.name || product.Product_Name || "") : product;

    // 3. Obtain current record ID safely with URL fallback
    let recordId = typeof pageObj.getRecordId === "function" ? pageObj.getRecordId() : null;

    if (!recordId && typeof window !== "undefined" && window.location) {
      const match = window.location.href.match(/(\d{17,20})/);
      if (match) {
        recordId = match[1];
        console.log("[Client Script Debug] Extracted recordId from window.location.href fallback:", recordId);
      }
    }

    console.log("[Client Script Debug] Final recordId:", recordId, "productId:", productId, "productName:", productName);

    /**
     * 4. Open Widget Popup Dialog
     * Widget API Name matching Setup > Developer Space > Widgets (API Name column)
     */
    const widgetApiName = "Complaint_Solution_Widget";
    const client = (typeof ZDK !== "undefined" && ZDK.Client) ? ZDK.Client : (typeof window !== "undefined" && window.ZDK ? window.ZDK.Client : null);

    if (client && typeof client.openPopup === "function") {
      console.log("[Client Script] Opening Widget Popup via ZDK.Client.openPopup -> API Name:", widgetApiName);
      client.openPopup({
        api_name: widgetApiName,
        title: "Complaint & Solution Mapping",
        height: "640px",
        width: "820px",
        params: {
          recordId: recordId,
          productId: productId,
          productName: productName
        }
      });
    } else if (client && typeof client.openWidget === "function") {
      console.log("[Client Script] Opening Widget Popup via ZDK.Client.openWidget -> API Name:", widgetApiName);
      client.openWidget({
        api_name: widgetApiName,
        params: {
          Entity: "CustomModule19",
          EntityId: recordId,
          recordId: recordId,
          productId: productId,
          productName: productName
        }
      });
    } else {
      console.error("[Client Script Error] Neither ZDK.Client.openPopup nor ZDK.Client.openWidget is available.", client);
    }
  } catch (err) {
    console.error("[Client Script Exception]", err);
  }
})();
