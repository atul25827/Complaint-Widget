/**
 * events.js
 * ────────────────────────────────────────────────────────────
 * DOM event listeners for user interaction: dropdowns, chips,
 * table row management, footer actions, and global dismiss.
 */

import { state, setState, resetSelections } from './state.js';
import { fetchComplaintSolutions, saveSubformRows, closeWidgetPopup, refreshParentRecord } from './api.js';
import { showToast } from './utils.js';

let isEventsBound = false;

/**
 * Initialize all DOM event listeners.
 */
export function initEventListeners() {
  if (isEventsBound) return;
  isEventsBound = true;

  setupComplaintDropdown();
  setupSolutionDropdown();
  setupAddComplaintAction();
  setupTableAndChipActions();
  setupFooterActions();
  setupGlobalDismiss();
}

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
        if (searchInput) setTimeout(() => searchInput.focus(), 50);
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

      if (!state.selectedComplaint || state.selectedComplaint.id !== id) {
        setState({
          selectedComplaint: { id, name },
          selectedSolutions: [],
          solutions: [],
          loadingSolutions: true,
          complaintSearch: ''
        }, 'COMPLAINT_SELECTED');

        if (menu) menu.classList.remove('show');

        try {
          const solutions = await fetchComplaintSolutions(id);
          setState({ solutions, loadingSolutions: false }, 'SOLUTIONS_LOADED');
        } catch (err) {
          setState({ solutions: [], loadingSolutions: false }, 'SOLUTIONS_ERROR');
          showToast('Failed to load solutions for selected complaint', 'error');
        }
      } else {
        if (menu) menu.classList.remove('show');
      }
    });
  }
}

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
        if (searchInput) setTimeout(() => searchInput.focus(), 50);
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

      const isCurrentlySelected = state.selectedSolutions.some(s => s.id === id);
      let updatedSelected;

      if (isCurrentlySelected) {
        updatedSelected = state.selectedSolutions.filter(s => s.id !== id);
      } else {
        updatedSelected = [...state.selectedSolutions, { id, name }];
      }

      setState({ selectedSolutions: updatedSelected }, 'SOLUTION_SELECTION_CHANGED');
    });
  }

  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setState({ selectedSolutions: [...state.solutions] }, 'SOLUTION_SELECT_ALL');
    });
  }

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setState({ selectedSolutions: [] }, 'SOLUTION_CLEAR_ALL');
    });
  }
}

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
      const exists = newRows.some(row =>
        row.complaintId === selectedComplaint.id &&
        row.solutionId === solution.id
      );

      if (exists) {
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
      showToast(`Added ${addedCount} mapping(s). ${duplicateCount} duplicate(s) skipped.`, 'info');
    } else {
      showToast(`Successfully added ${addedCount} mapping(s)`, 'success');
    }

    setState({ rows: newRows, selectedSolutions: [] }, 'ROWS_ADDED');

    const menu = document.getElementById('solutionDropdownMenu');
    if (menu) menu.classList.remove('show');
  });
}

function setupTableAndChipActions() {
  const chipsContainer = document.getElementById('selectedChipsContainer');
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('[data-action="remove-chip"]');
      if (!removeBtn) return;

      const solutionId = removeBtn.dataset.solutionId;
      const updated = state.selectedSolutions.filter(s => s.id !== solutionId);
      setState({ selectedSolutions: updated }, 'CHIP_REMOVED');
    });
  }

  const tbody = document.getElementById('stagingTableBody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('[data-action="delete-row"]');
      if (!deleteBtn) return;

      const index = parseInt(deleteBtn.dataset.index, 10);
      if (isNaN(index)) return;

      const deletedRow = state.rows[index];
      const updatedRows = state.rows.filter((_, i) => i !== index);

      setState({ rows: updatedRows }, 'ROW_DELETED');
      showToast(`Removed "${deletedRow.solutionName}"`, 'info');
    });
  }
}

function setupFooterActions() {
  const saveBtn = document.getElementById('saveSubformBtn');
  const cancelBtn = document.getElementById('cancelWidgetBtn');
  const retryBtn = document.getElementById('retryInitializeBtn');

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (state.rows.length === 0) {
        showToast('Please add at least one row before saving.', 'warning');
        return;
      }

      setState({ saving: true }, 'SAVE_START');

      try {
        await saveSubformRows(state.recordId, state.rows);
        showToast('Saved Successfully', 'success');
        setState({ saving: false }, 'SAVE_SUCCESS');

        setTimeout(() => {
          closeWidgetPopup();
          refreshParentRecord();
        }, 600);
      } catch (err) {
        setState({ saving: false }, 'SAVE_ERROR');
        showToast(`Failed to save: ${err.message || 'Unknown error'}`, 'error');
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      closeWidgetPopup();
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

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
