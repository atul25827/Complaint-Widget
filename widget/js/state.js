/**
 * state.js
 * ────────────────────────────────────────────────────────────
 * Centralized widget state store with pub/sub subscriber pattern.
 */

export const state = {
  // Context from Client Script PageLoad
  recordId: null,
  productId: null,
  productName: '',
  pickListValue: '',

  // Product record from Products API
  product: null,

  // Complaint/Solution mapping data
  complaints: [],
  solutions: [],
  selectedComplaint: null,
  selectedSolutions: [],
  rows: [],

  // UI states
  loading: true,
  loadingComplaints: false,
  loadingSolutions: false,
  saving: false,
  error: null,

  // Dropdown search
  complaintSearch: '',
  solutionSearch: ''
};

const listeners = [];

/**
 * Register a state change listener.
 * @param {Function} listenerFn
 */
export function subscribe(listenerFn) {
  if (typeof listenerFn === 'function') {
    listeners.push(listenerFn);
  }
}

/**
 * Notify all subscribers.
 * @param {string} changeType
 */
function notify(changeType = 'ALL') {
  listeners.forEach(fn => {
    try {
      fn(state, changeType);
    } catch (e) {
      /* silent */
    }
  });
}

/**
 * Update state and notify subscribers.
 * @param {Partial<typeof state>} updates
 * @param {string} changeType
 */
export function setState(updates, changeType = 'ALL') {
  Object.assign(state, updates);
  notify(changeType);
}

/**
 * Reset dropdown selections.
 */
export function resetSelections() {
  state.selectedComplaint = null;
  state.selectedSolutions = [];
  state.solutions = [];
  state.complaintSearch = '';
  state.solutionSearch = '';
  notify('SELECTION_RESET');
}
