/**
 * utils.js
 * ────────────────────────────────────────────────────────────
 * Helper utilities for DOM manipulation, string escaping,
 * search filtering, and Zoho-styled toast notifications.
 */

/**
 * Escape HTML to prevent XSS in templates.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Case-insensitive search match test.
 * @param {string} text
 * @param {string} query
 * @returns {boolean}
 */
export function matchesSearch(text, query) {
  if (!query || !query.trim()) return true;
  if (!text) return false;
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

/**
 * Display a Zoho CRM styled toast notification.
 * @param {string} message
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {number} durationMs
 */
export function showToast(message, type = 'info', durationMs = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `zc-toast zc-toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg class="zc-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
  } else if (type === 'error') {
    iconSvg = `<svg class="zc-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg class="zc-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
  } else {
    iconSvg = `<svg class="zc-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  toast.innerHTML = `
    ${iconSvg}
    <span class="zc-toast-text">${escapeHtml(message)}</span>
    <button type="button" class="zc-toast-close" aria-label="Close notification">&times;</button>
  `;

  const closeBtn = toast.querySelector('.zc-toast-close');
  const dismiss = () => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  };

  closeBtn.addEventListener('click', dismiss);
  container.appendChild(toast);

  if (durationMs > 0) {
    setTimeout(dismiss, durationMs);
  }
}

/**
 * Format a value for display. Handles objects, booleans, null, etc.
 * @param {any} value
 * @returns {string}
 */
export function formatDisplayValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    if (value.name) return value.name;
    if (value.display_value) return value.display_value;
    return JSON.stringify(value);
  }
  return String(value);
}
