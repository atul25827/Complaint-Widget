/**
 * state.js
 * ────────────────────────────────────────────────────────────
 * Centralized widget state store with pub/sub subscriber pattern
 * to trigger clean UI re-renders on state mutation.
 */

export const state = {
  recordId: null,
  productId: null,
  productName: '',

  complaints: [],         // Array<{ id, name }>
  solutions: [],          // Array<{ id, name }>

  selectedComplaint: null,// { id, name } or null
  selectedSolutions: [],  // Array<{ id, name }>

  rows: [],               // Array<{ complaintId, complaintName, solutionId, solutionName }>

  // UI operational states
  loadingRecord: true,
  loadingComplaints: false,
  loadingSolutions: false,
  saving: false,
  error: null,

  // Dropdown search inputs
  complaintSearch: '',
  solutionSearch: ''
};

const listeners = [];

/**
 * Register a change listener to receive updates when state changes.
 * @param {Function} listenerFn 
 */
export function subscribe(listenerFn) {
  if (typeof listenerFn === 'function') {
    listeners.push(listenerFn);
  }
}

/**
 * Notify all subscribers of state changes.
 * @param {string} [changeType] 
 */
export function notify(changeType = 'ALL') {
  listeners.forEach(fn => {
    try {
      fn(state, changeType);
    } catch (e) {
      console.error('[Widget State] Listener error:', e);
    }
  });
}

/**
 * Update state object and notify subscribers.
 * @param {Partial<typeof state>} updates 
 * @param {string} [changeType]
 */
export function setState(updates, changeType = 'ALL') {
  Object.assign(state, updates);
  notify(changeType);
}

/**
 * Reset dropdown selections and solution items.
 */
export function resetSelections() {
  state.selectedComplaint = null;
  state.selectedSolutions = [];
  state.solutions = [];
  state.complaintSearch = '';
  state.solutionSearch = '';
  notify('SELECTION_RESET');
}
