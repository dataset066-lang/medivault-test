/* MediVault ? Step 1 ? Shared UI and workflow utilities. */
'use strict';

// ════════════════════════════════════════
//  UTILITY FUNCTIONS
// ════════════════════════════════════════
function toast(msg, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  const icons = { success: '[OK]', error: '[ERR]', warning: '[WARN]', info: '[INFO]' };
  el.innerHTML = `<span class="toast-label">${icons[type] || icons.info}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.classList.add('fade-out'); setTimeout(() => el.remove(), 300); }, 3500);
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024)        return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!', 'success'));
}

function setElProgress(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = pct + '%';
}

function setStepStatus(id, status) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'step-num ' + status;
  if (status === 'done')    el.textContent = '✓';
  else if (status === 'error') el.textContent = '✗';
  else if (status === 'running') el.textContent = '…';
}

function setStepDesc(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
