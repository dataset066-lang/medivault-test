/* MediVault ? Step 8 ? Sidebar and provider controls. */
'use strict';

// ════════════════════════════════════════
//  SIDEBAR
// ════════════════════════════════════════
const SIDEBAR_NAV = [
  { page: 'dashboard',       href: 'dashboard.html',       label: 'Dashboard',            icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' },
  { page: 'acquisition',     href: 'acquisition.html',     label: 'Image Acquisition',    icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>' },
  { page: 'preprocessing',   href: 'preprocessing.html',   label: 'Preprocessing',        icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>' },
  { page: 'encryption',      href: 'encryption.html',      label: 'Encryption & Security', icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>' },
  { page: 'ipfs-storage',    href: 'ipfs-storage.html',    label: 'IPFS Storage',         icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>' },
  { page: 'blockchain',      href: 'blockchain.html',      label: 'Blockchain Network',   icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="6" height="6" rx="1"/><rect x="16" y="7" width="6" height="6" rx="1"/><rect x="9" y="14" width="6" height="6" rx="1"/><path d="M5 13v2a1 1 0 0 0 1 1h3M19 13v2a1 1 0 0 1-1 1h-3M12 7V5"/></svg>' },
  { page: 'smart-contracts', href: 'smart-contracts.html', label: 'Smart Contracts',      icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' },
  { page: 'retrieval',       href: 'retrieval.html',       label: 'Secure Retrieval',     icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>' },
  { page: 'audit-logs',      href: 'audit-logs.html',      label: 'Audit Logs',           icon: '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>' },
];

function initSidebar(activePage) {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const navItems = SIDEBAR_NAV.map(item => `
    <a href="${item.href}" class="nav-item${item.page === activePage ? ' active' : ''}" data-page="${item.page}" title="${item.label}">
      <span class="nav-icon">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
    </a>
  `).join('');

  const logoSVG = `<svg width="32" height="32" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 2L4 8v10c0 7.7 6 14.9 14 16.9C26 32.9 32 25.7 32 18V8L18 2z" fill="#2563EB" opacity="0.12"/>
    <path d="M18 4L6 9.6V18c0 6.9 5.3 13.3 12 15.1 6.7-1.8 12-8.2 12-15.1V9.6L18 4z" stroke="#2563EB" stroke-width="2" fill="none"/>
    <path d="M18 11v8M14 15h8" stroke="#2563EB" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`;

  container.innerHTML = `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-brand">
      <div class="brand-logo">${logoSVG}</div>
      <div class="brand-text">
        <span class="brand-name">MediVault</span>
        <span class="brand-tagline">Secure Medical Storage</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-title">MAIN MENU</div>
      ${navItems}
    </nav>
    <div class="sidebar-footer">
      <div class="nav-section-title">SYSTEM</div>
      <a href="#" class="nav-item" title="Settings">
        <span class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg></span>
        <span class="nav-label">Settings</span>
      </a>
      <a href="#" class="nav-item" title="Help &amp; Support">
        <span class="nav-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>
        <span class="nav-label">Help &amp; Support</span>
      </a>
      <div class="connection-status" id="sidebar-conn-status">
        <div class="conn-dot" id="conn-blockchain"></div>
        <span>Blockchain</span>
        <div class="conn-dot" id="conn-ipfs" style="margin-left:6px;"></div>
        <span>IPFS</span>
      </div>
    </div>
    <button class="sidebar-arrow-toggle" id="sidebar-arrow-toggle" onclick="toggleSidebar()" title="Toggle Sidebar">
      <span class="arrow-open"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></span>
      <span class="arrow-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg></span>
    </button>
  </aside>`;

  // Restore collapsed state
  const collapsed = localStorage.getItem('mv_sidebar_collapsed') === '1';
  if (collapsed) document.getElementById('sidebar')?.classList.add('collapsed');
  _updateWalletUI(false, '', '');
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  if (!sb) return;
  sb.classList.toggle('collapsed');
  localStorage.setItem('mv_sidebar_collapsed', sb.classList.contains('collapsed') ? '1' : '0');
}

// ════════════════════════════════════════
//  IPFS PROVIDER CHANGE
// ════════════════════════════════════════
function onProviderChange() {
  const v = document.getElementById('ipfs-provider')?.value;
  const show = (id, vis) => { const el = document.getElementById(id); if(el) el.style.display = vis ? 'block' : 'none'; };
  show('wrap-pinata',      v === 'pinata');
  show('wrap-web3storage', v === 'web3storage');
  show('wrap-local',       v === 'local');
}
