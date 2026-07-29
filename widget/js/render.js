/**
 * render.js
 * ────────────────────────────────────────────────────────────
 * Modular UI component renderers for Zoho CRM design system.
 */

import { escapeHtml, matchesSearch } from './utils.js';

/**
 * Main Render orchestrator called whenever state updates.
 * @param {import('./state.js').state} state 
 * @param {string} [changeType] 
 */
export function renderApp(state, changeType = 'ALL') {
  renderProductMetadata(state);
  renderComplaintDropdown(state);
  renderSolutionsDropdown(state);
  renderSelectedChips(state);
  renderStagingTable(state);
  renderFooterActions(state);
  renderStateOverlay(state);
}

/**
 * Render Product Header Metadata
 */
export function renderProductMetadata(state) {
  const productEl = document.getElementById('productNameDisplay');
  const recordEl = document.getElementById('recordIdDisplay');
  
  if (productEl) {
    productEl.textContent = state.productName || 'Loading Product...';
  }
  if (recordEl) {
    recordEl.textContent = state.recordId ? `Record ID: ${state.recordId}` : 'ID: --';
  }
}

/**
 * Render Complaint Dropdown items & trigger button text
 */
export function renderComplaintDropdown(state) {
  const triggerBtn = document.getElementById('complaintDropdownBtn');
  const triggerText = document.getElementById('complaintDropdownSelectedText');
  const menuList = document.getElementById('complaintDropdownList');
  const searchInput = document.getElementById('complaintSearchInput');

  if (!triggerText || !menuList) return;

  // Selected item text
  if (state.selectedComplaint) {
    triggerText.textContent = state.selectedComplaint.name;
    triggerBtn?.classList.add('has-value');
  } else {
    triggerText.textContent = 'Select Complaint Category';
    triggerBtn?.classList.remove('has-value');
  }

  // Filter items
  const filtered = state.complaints.filter(c => matchesSearch(c.name, state.complaintSearch));

  if (state.loadingComplaints) {
    menuList.innerHTML = `
      <div class="zc-dropdown-skeleton">
        <div class="zc-skeleton zc-skeleton-line"></div>
        <div class="zc-skeleton zc-skeleton-line"></div>
        <div class="zc-skeleton zc-skeleton-line"></div>
      </div>
    `;
    return;
  }

  if (filtered.length === 0) {
    menuList.innerHTML = `
      <div class="zc-dropdown-empty">
        <span>No complaint categories found ${state.complaintSearch ? 'matching search' : 'for this product'}</span>
      </div>
    `;
    return;
  }

  menuList.innerHTML = filtered.map(c => {
    const isSelected = state.selectedComplaint && state.selectedComplaint.id === c.id;
    return `
      <div class="zc-dropdown-item ${isSelected ? 'selected' : ''}" data-complaint-id="${escapeHtml(c.id)}" data-complaint-name="${escapeHtml(c.name)}" role="option" aria-selected="${isSelected}">
        <span class="zc-dropdown-item-text">${escapeHtml(c.name)}</span>
        ${isSelected ? `<svg class="zc-icon-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
      </div>
    `;
  }).join('');
}

/**
 * Render Solutions Multi-Select dropdown options
 */
export function renderSolutionsDropdown(state) {
  const triggerBtn = document.getElementById('solutionDropdownBtn');
  const triggerText = document.getElementById('solutionDropdownText');
  const menuList = document.getElementById('solutionDropdownList');
  const countBadge = document.getElementById('solutionCountBadge');
  const addBtn = document.getElementById('addComplaintBtn');

  if (!triggerText || !menuList) return;

  const isComplaintSelected = Boolean(state.selectedComplaint);

  if (!isComplaintSelected) {
    triggerBtn.disabled = true;
    triggerText.textContent = 'Select a Complaint first...';
    menuList.innerHTML = `
      <div class="zc-dropdown-empty">
        <span>Please select a Complaint Category to view solutions.</span>
      </div>
    `;
    if (countBadge) countBadge.style.display = 'none';
    if (addBtn) addBtn.disabled = true;
    return;
  }

  triggerBtn.disabled = false;

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

  // Enable Add button if complaint & at least 1 solution selected
  if (addBtn) {
    addBtn.disabled = !(isComplaintSelected && selectedCount > 0);
  }

  if (state.loadingSolutions) {
    menuList.innerHTML = `
      <div class="zc-dropdown-skeleton">
        <div class="zc-skeleton zc-skeleton-line"></div>
        <div class="zc-skeleton zc-skeleton-line"></div>
        <div class="zc-skeleton zc-skeleton-line"></div>
      </div>
    `;
    return;
  }

  const filtered = state.solutions.filter(s => matchesSearch(s.name, state.solutionSearch));

  if (filtered.length === 0) {
    menuList.innerHTML = `
      <div class="zc-dropdown-empty">
        <span>${state.solutions.length === 0 ? 'No solutions linked to this category' : 'No solutions match search'}</span>
      </div>
    `;
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

/**
 * Render Selected Solution Tag Chips
 */
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
    <div class="zc-chip animate-pop" data-solution-id="${escapeHtml(s.id)}">
      <span class="zc-chip-label">${escapeHtml(s.name)}</span>
      <button type="button" class="zc-chip-remove" aria-label="Remove solution ${escapeHtml(s.name)}" data-action="remove-chip" data-solution-id="${escapeHtml(s.id)}">&times;</button>
    </div>
  `).join('');
}

/**
 * Render Staging Table & Row Count
 */
export function renderStagingTable(state) {
  const tbody = document.getElementById('stagingTableBody');
  const emptyState = document.getElementById('tableEmptyState');
  const tableWrapper = document.getElementById('tableWrapper');
  const rowCountBadge = document.getElementById('tableRowCountBadge');

  if (!tbody || !emptyState || !tableWrapper) return;

  const totalRows = state.rows.length;
  if (rowCountBadge) {
    rowCountBadge.textContent = `${totalRows} row${totalRows === 1 ? '' : 's'}`;
  }

  if (totalRows === 0) {
    tableWrapper.style.display = 'none';
    emptyState.style.display = 'flex';
    tbody.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  tableWrapper.style.display = 'block';

  tbody.innerHTML = state.rows.map((row, index) => `
    <tr class="zc-table-row animate-fade-in" data-row-index="${index}">
      <td class="zc-td zc-td-num">${index + 1}</td>
      <td class="zc-td zc-td-complaint">
        <span class="zc-cell-badge zc-badge-complaint">${escapeHtml(row.complaintName)}</span>
      </td>
      <td class="zc-td zc-td-solution">
        <span class="zc-cell-solution">${escapeHtml(row.solutionName)}</span>
      </td>
      <td class="zc-td zc-td-action">
        <button type="button" class="zc-btn-icon-delete" title="Delete mapping" aria-label="Delete mapping" data-action="delete-row" data-index="${index}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </td>
    </tr>
  `).join('');
}

/**
 * Render Footer Action Buttons
 */
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

/**
 * Render Main Screen Loading or Error Overlays
 */
export function renderStateOverlay(state) {
  const loadingOverlay = document.getElementById('mainLoadingOverlay');
  const errorOverlay = document.getElementById('mainErrorOverlay');
  const errorMessageEl = document.getElementById('errorMessageText');

  if (loadingOverlay) {
    loadingOverlay.style.display = state.loadingRecord ? 'flex' : 'none';
  }

  if (errorOverlay) {
    if (state.error) {
      errorOverlay.style.display = 'flex';
      if (errorMessageEl) errorMessageEl.textContent = state.error;
    } else {
      errorOverlay.style.display = 'none';
    }
  }
}
