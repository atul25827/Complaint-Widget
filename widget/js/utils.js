/**
 * utils.js
 * ────────────────────────────────────────────────────────────
 * Helper utilities for DOM manipulation, string escaping,
 * search filtering, and Zoho-styled toast notifications.
 */

// Structured logger utility for console debugging when hosting widget in Zoho CRM.
export const log = {
  info: (msg, data) => console.log(`%c[Zoho Widget INFO] ${msg}`, 'color: #2266e3; font-weight: bold;', data !== undefined ? data : ''),
  warn: (msg, data) => console.warn(`%c[Zoho Widget WARN] ${msg}`, 'color: #f59e0b; font-weight: bold;', data !== undefined ? data : ''),
  error: (msg, err) => console.error(`%c[Zoho Widget ERROR] ${msg}`, 'color: #ef4444; font-weight: bold;', err !== undefined ? err : '')
};

/**
 * DOM selector helper for ID or CSS selector.
 * @param {string} selector 
 * @returns {HTMLElement|null}
 */
export function $(selector) {
  if (!selector) return null;
  return document.getElementById(selector) || document.querySelector(selector);
}

/**
 * Clear all child nodes of an element safely.
 * @param {HTMLElement} el 
 */
export function clearChildren(el) {
  if (el) {
    el.innerHTML = '';
  }
}

/**
 * Create a DOM element with optional classes and attributes.
 * @param {string} tag 
 * @param {Array<string>} classes 
 * @param {Object} attrs 
 * @returns {HTMLElement}
 */
export function createElement(tag = 'div', classes = [], attrs = {}) {
  const el = document.createElement(tag);
  if (Array.isArray(classes)) {
    classes.forEach(c => c && el.classList.add(c));
  }
  if (attrs && typeof attrs === 'object') {
    Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
  }
  return el;
}

/**
 * Escape HTML to prevent XSS vulnerabilities in custom templates.
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

// Alias for case compatibility
export const escapeHTML = escapeHtml;

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
 * Debounce helper for input search handlers.
 * @param {Function} fn 
 * @param {number} delayMs 
 * @returns {Function}
 */
export function debounce(fn, delayMs = 250) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delayMs);
  };
}

/**
 * Display a Zoho CRM styled toast message notification.
 * @param {string} message 
 * @param {'success'|'error'|'warning'|'info'} type 
 * @param {number} durationMs 
 */
export function showToast(message, type = 'info', durationMs = 3000) {
  const container = document.getElementById('toastContainer') || document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `zc-toast zc-toast-${type} animate-fade-in`;

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
    toast.classList.add('animate-fade-out');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  };

  closeBtn.addEventListener('click', dismiss);
  container.appendChild(toast);

  if (durationMs > 0) {
    setTimeout(dismiss, durationMs);
  }
}
