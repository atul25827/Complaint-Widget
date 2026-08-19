/**
 * render.js
 * ────────────────────────────────────────────────────────────
 * DOM-based UI renderers for the Complaint & Solution Widget.
 */

import { PRODUCT_DISPLAY_FIELDS } from './constants.js';
import { escapeHtml, matchesSearch, formatDisplayValue } from './utils.js';

/**
 * Main render orchestrator — called on every state change.
 */
export function renderApp(state, changeType = 'ALL') {
  renderProductInfo(state);
  renderComplaintDropdown(state);
  renderSolutionsDropdown(state);
  renderSelectedChips(state);
  renderStagingTable(state);
  renderFooterActions(state);
  renderStateOverlay(state);
}

// ─── PRODUCT INFORMATION SECTION ───

export function renderProductInfo(state) {
  const container = document.getElementById('productInfoContainer');
  if (!container) return;

  if (state.loading) {
    container.innerHTML = `
      <div class="zc-product-info-card">
        <div class="zc-product-info-header">
          <svg class="zc-product-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <h2 class="zc-product-info-title">Product Information</h2>
        </div>
        <div class="zc-product-info-loading">
          <div class="zc-spinner-sm"></div>
          <span>Loading Product information...</span>
        </div>
      </div>
    `;
    return;
  }

  if (state.error) {
    container.innerHTML = `
      <div class="zc-product-info-card zc-product-info-error">
        <div class="zc-product-info-header">
          <svg class="zc-product-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--zc-danger);">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2 class="zc-product-info-title">Product Information</h2>
        </div>
        <div class="zc-product-info-empty">
          <p>${escapeHtml(state.error)}</p>
        </div>
      </div>
    `;
    return;
  }

  if (!state.productId) {
    container.innerHTML = `
      <div class="zc-product-info-card">
        <div class="zc-product-info-header">
          <svg class="zc-product-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <h2 class="zc-product-info-title">Product Information</h2>
        </div>
        <div class="zc-product-info-empty">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--zc-text-disabled); margin-bottom: 8px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p class="zc-product-info-empty-title">Product not selected.</p>
          <p class="zc-product-info-empty-desc">Please select a Product from the CRM record.</p>
        </div>
      </div>
    `;
    return;
  }

  const product = state.product;
  const pickListValue = state.pickListValue || '-';

  let fieldsHtml = '';

  fieldsHtml += `
    <div class="zc-product-field-row">
      <span class="zc-product-field-label">Pick List 1</span>
      <span class="zc-product-field-value">${escapeHtml(pickListValue)}</span>
    </div>
  `;

  if (product) {
    for (const field of PRODUCT_DISPLAY_FIELDS) {
      const rawValue = product[field.key];
      if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
        fieldsHtml += `
          <div class="zc-product-field-row">
            <span class="zc-product-field-label">${escapeHtml(field.label)}</span>
            <span class="zc-product-field-value">${escapeHtml(formatDisplayValue(rawValue))}</span>
          </div>
        `;
      }
    }

    if (state.productId) {
      fieldsHtml += `
        <div class="zc-product-field-row">
          <span class="zc-product-field-label">Product ID</span>
          <span class="zc-product-field-value zc-product-field-mono">${escapeHtml(state.productId)}</span>
        </div>
      `;
    }
  } else {
    fieldsHtml += `
      <div class="zc-product-field-row">
        <span class="zc-product-field-label">Product Name</span>
        <span class="zc-product-field-value">${escapeHtml(state.productName || '-')}</span>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="zc-product-info-card">
      <div class="zc-product-info-header">
        <svg class="zc-product-info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
        <h2 class="zc-product-info-title">Product Information</h2>
        <span class="zc-header-badge">Live</span>
      </div>
      <div class="zc-product-field-grid">
        ${fieldsHtml}
      </div>
    </div>
  `;
}

// ─── PRODUCT HEADER CARD ───

function updateProductHeader(state) {
  const productEl = document.getElementById('productNameDisplay');
  const recordEl = document.getElementById('recordIdDisplay');

  if (productEl) {
    productEl.textContent = state.product?.Product_Name || state.productName || 'No Product';
  }
  if (recordEl) {
    recordEl.textContent = state.recordId ? `ID: ${state.recordId}` : 'ID: --';
  }
}

// ─── COMPLAINT DROPDOWN ───

export function renderComplaintDropdown(state) {
  const triggerBtn = document.getElementById('complaintDropdownBtn');
  const triggerText = document.getElementById('complaintDropdownSelectedText');
  const menuList = document.getElementById('complaintDropdownList');

  if (!triggerText || !menuList) return;

  if (state.selectedComplaint) {
    triggerText.textContent = state.selectedComplaint.name;
    triggerBtn?.classList.add('has-value');
  } else {
    triggerText.textContent = 'Select Complaint Category';
    triggerBtn?.classList.remove('has-value');
  }

  const filtered = state.complaints.filter(c => matchesSearch(c.name, state.complaintSearch));

  if (state.loadingComplaints) {
    menuList.innerHTML = `<div class="zc-dropdown-empty"><span>Loading categories...</span></div>`;
    return;
  }

  if (filtered.length === 0) {
    menuList.innerHTML = `<div class="zc-dropdown-empty"><span>No complaint categories found${state.complaintSearch ? ' matching search' : ''}</span></div>`;
    return;
  }

  menuList.innerHTML = filtered.map(c => {
    const isSelected = state.selectedComplaint?.id === c.id;
    return `
      <div class="zc-dropdown-item ${isSelected ? 'selected' : ''}" data-complaint-id="${escapeHtml(c.id)}" data-complaint-name="${escapeHtml(c.name)}" role="option" aria-selected="${isSelected}">
        <span class="zc-dropdown-item-text">${escapeHtml(c.name)}</span>
        ${isSelected ? `<svg class="zc-icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
      </div>
    `;
  }).join('');
}

// ─── SOLUTIONS DROPDOWN ───

export function renderSolutionsDropdown(state) {
  const triggerBtn = document.getElementById('solutionDropdownBtn');
  const triggerText = document.getElementById('solutionDropdownText');
  const menuList = document.getElementById('solutionDropdownList');
  const countBadge = document.getElementById('solutionCountBadge');
  const addBtn = document.getElementById('addComplaintBtn');

  if (!triggerText || !menuList) return;

  const isComplaintSelected = Boolean(state.selectedComplaint);

  if (!isComplaintSelected) {
    if (triggerBtn) triggerBtn.disabled = true;
    triggerText.textContent = 'Select a Complaint first...';
    menuList.innerHTML = `<div class="zc-dropdown-empty"><span>Please select a Complaint Category to view solutions.</span></div>`;
    if (countBadge) countBadge.style.display = 'none';
    if (addBtn) addBtn.disabled = true;
    return;
  }

  if (triggerBtn) triggerBtn.disabled = false;

  const selectedCount = state.selectedSolutions.length;
  if (selectedCount > 0) {
    triggerText.textContent = `${selectedCount} solution${selectedCount > 1 ? 's' : ''} selected`;
    if (countBadge) {
      countBadge.textContent = selectedCount;
      countBadge.style.display = 'inline-flex';
    }
  } else {
    triggerText.textContent = 'Search and select solutions...';
    if (countBadge) countBadge.style.display = 'none';
  }

  if (addBtn) addBtn.disabled = !(isComplaintSelected && selectedCount > 0);

  if (state.loadingSolutions) {
    menuList.innerHTML = `<div class="zc-dropdown-empty"><span>Loading solutions...</span></div>`;
    return;
  }

  const filtered = state.solutions.filter(s => matchesSearch(s.name, state.solutionSearch));

  if (filtered.length === 0) {
    menuList.innerHTML = `<div class="zc-dropdown-empty"><span>${state.solutions.length === 0 ? 'No solutions linked to this category' : 'No solutions match search'}</span></div>`;
    return;
  }

  menuList.innerHTML = filtered.map(s => {
    const isChecked = state.selectedSolutions.some(sel => sel.id === s.id);
    return `
      <label class="zc-multiselect-option ${isChecked ? 'selected' : ''}" data-solution-id="${escapeHtml(s.id)}" data-solution-name="${escapeHtml(s.name)}">
        <input type="checkbox" class="zc-checkbox" ${isChecked ? 'checked' : ''} value="${escapeHtml(s.id)}">
        <span class="zc-checkbox-custom">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </span>
        <span class="zc-option-label">${escapeHtml(s.name)}</span>
      </label>
    `;
  }).join('');
}

// ─── CHIPS ───

export function renderSelectedChips(state) {
  const chipsContainer = document.getElementById('selectedChipsContainer');
  const chipsWrapper = document.getElementById('chipsWrapper');
  if (!chipsContainer || !chipsWrapper) return;

  if (state.selectedSolutions.length === 0) {
    chipsWrapper.style.display = 'none';
    chipsContainer.innerHTML = '';
    return;
  }

  chipsWrapper.style.display = 'block';
  chipsContainer.innerHTML = state.selectedSolutions.map(s => `
    <div class="zc-chip" data-solution-id="${escapeHtml(s.id)}">
      <span class="zc-chip-label">${escapeHtml(s.name)}</span>
      <button type="button" class="zc-chip-remove" data-action="remove-chip" data-solution-id="${escapeHtml(s.id)}">&times;</button>
    </div>
  `).join('');
}

// ─── STAGING TABLE ───

export function renderStagingTable(state) {
  const tbody = document.getElementById('stagingTableBody');
  const emptyState = document.getElementById('tableEmptyState');
  const tableWrapper = document.getElementById('tableWrapper');
  const rowCountBadge = document.getElementById('tableRowCountBadge');

  if (!tbody || !emptyState || !tableWrapper) return;

  const totalRows = state.rows.length;
  if (rowCountBadge) rowCountBadge.textContent = `${totalRows} row${totalRows === 1 ? '' : 's'}`;

  if (totalRows === 0) {
    tableWrapper.style.display = 'none';
    emptyState.style.display = 'flex';
    tbody.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  tableWrapper.style.display = 'block';

  tbody.innerHTML = state.rows.map((row, index) => `
    <tr class="zc-table-row" data-row-index="${index}">
      <td class="zc-td zc-td-num">${index + 1}</td>
      <td class="zc-td zc-td-complaint">
        <span class="zc-cell-badge zc-badge-complaint">${escapeHtml(row.complaintName)}</span>
      </td>
      <td class="zc-td zc-td-solution">${escapeHtml(row.solutionName)}</td>
      <td class="zc-td zc-td-action">
        <button type="button" class="zc-btn-icon-delete" data-action="delete-row" data-index="${index}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

// ─── FOOTER ───

export function renderFooterActions(state) {
  const saveBtn = document.getElementById('saveSubformBtn');
  const saveSpinner = document.getElementById('saveBtnSpinner');
  const saveText = document.getElementById('saveBtnText');

  if (!saveBtn) return;

  if (state.saving) {
    saveBtn.disabled = true;
    if (saveSpinner) saveSpinner.style.display = 'inline-block';
    if (saveText) saveText.textContent = 'Saving to CRM...';
  } else {
    saveBtn.disabled = state.rows.length === 0;
    if (saveSpinner) saveSpinner.style.display = 'none';
    if (saveText) saveText.textContent = `Save All Mappings (${state.rows.length})`;
  }
}

// ─── OVERLAYS ───

export function renderStateOverlay(state) {
  const loadingOverlay = document.getElementById('mainLoadingOverlay');
  const errorOverlay = document.getElementById('mainErrorOverlay');
  const errorMessageEl = document.getElementById('errorMessageText');

  if (loadingOverlay) loadingOverlay.style.display = state.loading ? 'flex' : 'none';

  if (errorOverlay) {
    if (state.error && !state.loading) {
      errorOverlay.style.display = 'flex';
      if (errorMessageEl) errorMessageEl.textContent = state.error;
    } else {
      errorOverlay.style.display = 'none';
    }
  }

  updateProductHeader(state);
}
