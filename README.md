# Zoho CRM Complaint & Solution Mapping Widget

Production-ready Zoho CRM Widget and Client Script integration to search, map, and save multiple Complaint Categories and Complaint Solutions directly into the record's subform when the Call Status field changes.

---

## 📁 Repository & Widget Folder Structure

```
Complaint_Widget/
├── widget/                           # Primary Widget Application Folder
│   ├── index.html                    # Main HTML shell (Zoho CRM Enterprise UI)
│   ├── css/
│   │   └── styles.css                # Zoho CRM CSS design tokens & components
│   ├── js/
│   │   ├── app.js                    # Widget Lifecycle & ZOHO.embeddedApp.on PageLoad
│   │   ├── api.js                    # Zoho CRM SDK API Layer (getRecord, searchRecord, updateRecord)
│   │   ├── state.js                  # Centralized reactive state store
│   │   ├── render.js                 # Modular UI renderers (Dropdowns, Multi-select, Chips, Table)
│   │   ├── events.js                 # Interaction handlers, duplicate validation, row management
│   │   ├── utils.js                  # DOM helpers, search filtering, toast notifications
│   │   └── constants.js              # Module API names, field API names & fallback mock dataset
│   └── sdk/
│       └── ZohoEmbededAppSDK.min.js  # Embedded App SDK script helper
│
├── client_script/
│   └── call_status_change.js         # Zoho CRM Client Script for Pick_List_1 trigger
│
├── app/                              # ZET CLI Compatibility mirror
└── server/                           # Local development Express SSL server
```

---

## ⚙️ Zoho CRM Field & Module Setup

Ensure your Zoho CRM environment has the following modules and API names configured:

### 1. Main Module (`Test`)
* **Module API Name**: `Test`
* **Product Field**: `Product` (Lookup to Product)
* **Call Status Field**: `Pick_List_1` (Picklist / Dropdown)
* **Subform Name**: `Complaint`
  * **Subform Column 1**: `Complaint` (Lookup to Complaint_Category)
  * **Subform Column 2**: `Solution` (Lookup to Complaint_Solution)

### 2. Complaint Category Module (`Complaint_Category`)
* **Module API Name**: `Complaint_Category`
* **Product Lookup API Name**: `Product_Name`
* **Complaint Name API Name**: `Name`

### 3. Complaint Solution Module (`Complaint_Solution`)
* **Module API Name**: `Complaint_Solution`
* **Complaint Lookup API Name**: `Complaint_Category`
* **Solution Name API Name**: `Name`

---

## 🚀 Step-by-Step Widget Deployment Guide

### Step 1: Package the Widget
1. Select the contents inside the `widget` folder (or `app` folder if using ZET CLI).
2. Create a `.zip` archive containing `index.html`, `css/`, `js/`, and `sdk/`.

### Step 2: Upload to Zoho CRM Setup
1. Log in to Zoho CRM as an Administrator.
2. Go to **Setup** (gear icon) > **Developer Space** > **Widgets**.
3. Click **Create First Widget** or **Create Widget**.
4. Fill in the configuration:
   * **Widget Name**: `Complaint Solution Mapper`
   * **Widget API Name**: `Complaint_Solution_Mapper`
   * **Widget Type**: `Popup`
   * **Hosting**: `Zoho` (Upload Zip)
   * **Upload File**: Select the `.zip` package created in Step 1.
   * **Index Page**: `/index.html` (or `/widget.html`)
5. Click **Save**.

### Step 3: Install the Client Script
1. Go to **Setup** > **Developer Space** > **Client Scripts**.
2. Click **Create Script**.
3. Fill in details:
   * **Name**: `On Call Status Change - Open Mapping Widget`
   * **Page**: `Record Page` (Detail Page / Edit Page)
   * **Module**: `Test`
   * **Event**: `Field Change`
   * **Field**: `Pick_List_1` (Call Status)
4. Paste the code from [`client_script/call_status_change.js`](file:///c:/Windows/System32/Complaint_Widget/client_script/call_status_change.js).
5. Ensure `widgetApiName` matches the API name from Step 2 (`Complaint_Solution_Mapper`).
6. Click **Save & Execute** / **Save**.

---

## 🧪 Local Testing & Standalone Mode

To test locally before deploying to Zoho CRM:

1. Run the local Express server:
   ```bash
   npm start
   ```
2. Open your browser to `https://127.0.0.1:5000/widget/index.html`.
3. The widget will automatically run in **Standalone / Mock Mode**, utilizing simulated latency and mock datasets for cooling issues, noise problems, and solutions.

---

## 🔄 API Flow Summary

1. **PageLoad**: Receives `recordId` from Zoho CRM widget trigger.
2. **API 1**: Reads current `Product` ID & Name from `Test` record via `ZOHO.CRM.API.getRecord`.
3. **API 2**: Queries `Complaint_Category` records matching `(Product_Name.id:equals:${productId})` via `ZOHO.CRM.API.searchRecord`.
4. **API 3**: When user picks a category, queries `Complaint_Solution` records matching `(Complaint_Category.id:equals:${complaintId})`.
5. **Duplicate Check**: Prevents identical `Complaint + Solution` pairs from entering the staging table.
6. **API 4**: On **Save**, formats array into `{ Complaint: { id }, Solution: { id } }` subform payload and executes `ZOHO.CRM.API.updateRecord`.
7. **After Save**: Shows success toast, closes widget popup (`ZOHO.CRM.UI.Popup.close()`), and refreshes parent record (`ZOHO.CRM.UI.Record.refresh()`).
