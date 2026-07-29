/**
 * events.js
 * ────────────────────────────────────────────────────────────
 * Event listeners and action handlers for user interaction,
 * duplicate validation, row management, and CRM subform save.
 */

import { state, setState, resetSelections } from './state.js';
import { fetchComplaintSolutions, saveSubformRows, closeWidgetPopup, refreshParentRecord } from './api.js';
import { showToast, log } from './utils.js';

let isEventsBound = false;

/**
 * Initialize all DOM event listeners.
 */
export function initEventListeners() {
  if (isEventsBound) return;
  isEventsBound = true;

  log.info('Binding DOM event listeners...');

  // 1. Complaint Dropdown Toggle & Item Selection
  setupComplaintDropdown();

  // 2. Solution Multi-Select Dropdown Toggle & Checkbox Selection
  setupSolutionDropdown();

  // 3. Add Complaint Action Button
  setupAddComplaintAction();

  // 4. Staging Table Row Actions (Delete) & Chip Removal
  setupTableAndChipActions();

  // 5. Footer Actions (Save & Cancel)
  setupFooterActions();

  // 6. Global Click outside to close dropdown menus & ESC key handler
  setupGlobalDismiss();
}

/**
 * Complaint Dropdown Handler
 */
function setupComplaintDropdown() {
  const btn = document.getElementById('complaintDropdownBtn');
  const menu = document.getElementById('complaintDropdownMenu');
  const searchInput = document.getElementById('complaintSearchInput');
  const list = document.getElementById('complaintDropdownList');

  if (btn && menu) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeAllDropdowns('complaintDropdownMenu');
      const isVisible = menu.classList.contains('show');
      if (isVisible) {
        menu.classList.remove('show');
      } else {
        menu.classList.add('show');
        if (searchInput) {
          setTimeout(() => searchInput.focus(), 50);
        }
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      setState({ complaintSearch: e.target.value }, 'SEARCH_UPDATE');
    });
  }

  if (list) {
    list.addEventListener('click', async (e) => {
      const item = e.target.closest('.zc-dropdown-item');
      if (!item) return;

      const id = item.dataset.complaintId;
      const name = item.dataset.complaintName;

      if (!id || !name) return;

      // If selecting a new complaint, reset solutions
      if (!state.selectedComplaint || state.selectedComplaint.id !== id) {
        const selectedComplaint = { id, name };
        log.info(`User selected Complaint Category -> ID: "${id}", Name: "${name}"`);
        
        setState({
          selectedComplaint,
          selectedSolutions: [],
          solutions: [],
          loadingSolutions: true,
          complaintSearch: ''
        }, 'COMPLAINT_SELECTED');

        if (menu) menu.classList.remove('show');

        // Fetch solutions for selected complaint
        try {
          const solutions = await fetchComplaintSolutions(id);
          setState({
            solutions,
            loadingSolutions: false
          }, 'SOLUTIONS_LOADED');
        } catch (err) {
          log.error(`Error fetching solutions for Complaint ID: "${id}"`, err);
          setState({
            solutions: [],
            loadingSolutions: false
          }, 'SOLUTIONS_ERROR');
          showToast('Failed to load solutions for selected complaint', 'error');
        }
      } else {
        if (menu) menu.classList.remove('show');
      }
    });
  }
}

/**
 * Solution Multi-Select Dropdown Handler
 */
function setupSolutionDropdown() {
  const btn = document.getElementById('solutionDropdownBtn');
  const menu = document.getElementById('solutionDropdownMenu');
  const searchInput = document.getElementById('solutionSearchInput');
  const list = document.getElementById('solutionDropdownList');
  const selectAllBtn = document.getElementById('selectAllSolutionsBtn');
  const clearAllBtn = document.getElementById('clearAllSolutionsBtn');

  if (btn && menu) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!state.selectedComplaint) {
        showToast('Please select a Complaint Category first', 'warning');
        return;
      }
      closeAllDropdowns('solutionDropdownMenu');
      const isVisible = menu.classList.contains('show');
      if (isVisible) {
        menu.classList.remove('show');
      } else {
        menu.classList.add('show');
        if (searchInput) {
          setTimeout(() => searchInput.focus(), 50);
        }
      }
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      setState({ solutionSearch: e.target.value }, 'SEARCH_UPDATE');
    });
  }

  if (list) {
    list.addEventListener('click', (e) => {
      const option = e.target.closest('.zc-multiselect-option');
      if (!option) return;

      const id = option.dataset.solutionId;
      const name = option.dataset.solutionName;

      // Toggle logic
      const isCurrentlySelected = state.selectedSolutions.some(s => s.id === id);
      let updatedSelected;

      if (isCurrentlySelected) {
        updatedSelected = state.selectedSolutions.filter(s => s.id !== id);
        log.info(`Deselected Solution -> ID: "${id}", Name: "${name}"`);
      } else {
        updatedSelected = [...state.selectedSolutions, { id, name }];
        log.info(`Selected Solution -> ID: "${id}", Name: "${name}"`);
      }

      setState({ selectedSolutions: updatedSelected }, 'SOLUTION_SELECTION_CHANGED');
    });
  }

  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const allFiltered = state.solutions;
      log.info(`Select All Solutions clicked. Selected ${allFiltered.length} items.`);
      setState({ selectedSolutions: [...allFiltered] }, 'SOLUTION_SELECT_ALL');
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      log.info('Clear All Solutions clicked.');
      setState({ selectedSolutions: [] }, 'SOLUTION_CLEAR_ALL');
    });
  }
}

/**
 * Setup "Add Complaint" Button Click Logic
 */
function setupAddComplaintAction() {
  const addBtn = document.getElementById('addComplaintBtn');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    const { selectedComplaint, selectedSolutions, rows } = state;

    if (!selectedComplaint) {
      showToast('Please select a Complaint Category first', 'warning');
      return;
    }

    if (selectedSolutions.length === 0) {
      showToast('Please select at least one Solution', 'warning');
      return;
    }

    let addedCount = 0;
    let duplicateCount = 0;
    const newRows = [...rows];

    selectedSolutions.forEach(solution => {
      // DUPLICATE VALIDATION
      const exists = newRows.some(row =>
        row.complaintId === selectedComplaint.id &&
        row.solutionId === solution.id
      );

      if (exists) {
        log.warn(`Duplicate pair skipped -> Complaint: "${selectedComplaint.name}", Solution: "${solution.name}"`);
        duplicateCount++;
      } else {
        newRows.push({
          complaintId: selectedComplaint.id,
          complaintName: selectedComplaint.name,
          solutionId: solution.id,
          solutionName: solution.name
        });
        addedCount++;
      }
    });

    if (duplicateCount > 0 && addedCount === 0) {
      showToast('Already added', 'warning');
      return;
    }

    if (duplicateCount > 0 && addedCount > 0) {
      showToast(`Added ${addedCount} mapping(s). ${duplicateCount} duplicate(s) skipped ("Already added")`, 'info');
    } else {
      showToast(`Successfully added ${addedCount} mapping(s) to table`, 'success');
    }

    log.info(`Staged ${addedCount} new row(s). Total staged rows: ${newRows.length}`, newRows);

    // Update state with new rows and reset selections for next entry
    setState({
      rows: newRows,
      selectedSolutions: []
    }, 'ROWS_ADDED');

    // Close solution menu
    const menu = document.getElementById('solutionDropdownMenu');
    if (menu) menu.classList.remove('show');
  });
}

/**
 * Handle Chip Removals & Table Row Deletion
 */
function setupTableAndChipActions() {
  // Chips Container Remove Handler
  const chipsContainer = document.getElementById('selectedChipsContainer');
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-action="remove-chip"]');
      if (!removeBtn) return;

      const solutionId = removeBtn.dataset.solutionId;
      const updated = state.selectedSolutions.filter(s => s.id !== solutionId);
      log.info(`Removed solution chip ID: "${solutionId}"`);
      setState({ selectedSolutions: updated }, 'CHIP_REMOVED');
    });
  }

  // Staging Table Row Delete Handler
  const tbody = document.getElementById('stagingTableBody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-action="delete-row"]');
      if (!deleteBtn) return;

      const index = parseInt(deleteBtn.dataset.index, 10);
      if (isNaN(index)) return;

      const deletedRow = state.rows[index];
      const updatedRows = state.rows.filter((_, i) => i !== index);

      log.info(`Deleted staging table row index ${index}:`, deletedRow);
      setState({ rows: updatedRows }, 'ROW_DELETED');
      showToast(`Removed "${deletedRow.solutionName}"`, 'info');
    });
  }
}

/**
 * Setup Sticky Footer Buttons (Save Subform & Cancel)
 */
function setupFooterActions() {
  const saveBtn = document.getElementById('saveSubformBtn');
  const cancelBtn = document.getElementById('cancelWidgetBtn');
  const retryBtn = document.getElementById('retryInitializeBtn');

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (state.rows.length === 0) {
        showToast('Please add at least one Complaint + Solution row before saving.', 'warning');
        return;
      }

      log.info(`Initiating subform save for ${state.rows.length} row(s)...`);
      setState({ saving: true }, 'SAVE_START');

      try {
        await saveSubformRows(state.recordId, state.rows);

        log.info('Subform saved successfully to Zoho CRM!');
        showToast('Saved Successfully', 'success');
        setState({ saving: false }, 'SAVE_SUCCESS');

        // Close widget & refresh record as per specification
        setTimeout(() => {
          closeWidgetPopup();
          refreshParentRecord();
        }, 600);
      } catch (err) {
        log.error('Failed to save subform to Zoho CRM:', err);
        setState({ saving: false }, 'SAVE_ERROR');
        showToast(`Failed to save subform: ${err.message || 'Unknown error'}`, 'error');
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      log.info('Cancel button clicked. Closing widget...');
      closeWidgetPopup();
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      log.info('Retry button clicked. Reloading page...');
      window.location.reload();
    });
  }
}

/**
 * Dismiss dropdown menus on outside click or Escape key press
 * @param {string} [exceptMenuId] 
 */
function closeAllDropdowns(exceptMenuId) {
  ['complaintDropdownMenu', 'solutionDropdownMenu'].forEach(menuId => {
    if (menuId !== exceptMenuId) {
      const menu = document.getElementById(menuId);
      if (menu) menu.classList.remove('show');
    }
  });
}

function setupGlobalDismiss() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.zc-dropdown-container')) {
      closeAllDropdowns();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
    }
  });
}
