/**
 * Mini Game Arcade - Secret Owner Admin Portal
 * 100% Hidden from regular users: No visible export or database buttons.
 * Only the owner can access this portal using a secret trigger + PIN.
 */

(function () {
  'use strict';

  const ADMIN_PIN = 'admin2026';
  let clickCount = 0;
  let clickTimer = null;

  function initSecretDataPortal() {
    const modal = document.createElement('div');
    modal.className = 'data-modal-overlay';
    modal.id = 'secret-admin-portal';

    modal.innerHTML = `
      <div class="data-modal-card">
        <div class="data-modal-header">
          <div>
            <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(79,70,229,0.12); color:var(--primary); font-size:0.75rem; font-weight:800; padding:2px 8px; border-radius:999px; margin-bottom:6px;">
              🔒 OWNER ONLY PANEL
            </div>
            <h3 class="data-modal-title">Mini Game Arcade Database</h3>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
              Private owner dashboard for user inquiries, gameplay records, and data backups.
            </p>
          </div>
          <button id="btn-close-admin-modal" style="background:none; border:none; font-size:1.4rem; color:var(--text-dim); cursor:pointer;">✕</button>
        </div>

        <div>
          <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main); margin-bottom: 0.5rem;">📥 Export Stored Records</h4>
          <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 0.75rem;">
            Download all collected data directly to your device (users cannot see or access this):
          </p>
          <div class="data-export-buttons">
            <button id="btn-export-json" class="btn btn-primary btn-sm">Download Full Database (JSON)</button>
            <button id="btn-export-csv" class="btn btn-secondary btn-sm">Export Contact Messages (CSV)</button>
            <button id="btn-clear-db" class="btn btn-secondary btn-sm" style="color: #E11D48;">Reset Stored Data</button>
          </div>
        </div>

        <div style="margin-top: 1.5rem; border-top: 1px solid var(--border-color); padding-top: 1rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <h4 style="font-size: 0.95rem; font-weight: 700; color: var(--text-main);">📬 Received Contact Messages (<span id="contact-count">0</span>)</h4>
            <button id="btn-refresh-contacts" style="background:none; border:none; color:var(--primary); font-size:0.8rem; font-weight:700; cursor:pointer;">↻ Refresh</button>
          </div>
          <div class="contacts-preview-list" id="contacts-preview-list">
            <p style="font-size: 0.85rem; color: var(--text-dim);">No messages recorded yet.</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const btnClose = modal.querySelector('#btn-close-admin-modal');
    const btnExportJSON = modal.querySelector('#btn-export-json');
    const btnExportCSV = modal.querySelector('#btn-export-csv');
    const btnClearDB = modal.querySelector('#btn-clear-db');
    const btnRefresh = modal.querySelector('#btn-refresh-contacts');
    const contactsListEl = modal.querySelector('#contacts-preview-list');
    const contactCountEl = modal.querySelector('#contact-count');

    function refreshContactsList() {
      if (!window.arcadeDB) return;
      const contacts = window.arcadeDB.getContacts();
      contactCountEl.textContent = contacts.length;

      if (contacts.length === 0) {
        contactsListEl.innerHTML = `<p style="font-size: 0.85rem; color: var(--text-dim); padding:1rem; text-align:center;">No messages received yet.</p>`;
        return;
      }

      contactsListEl.innerHTML = contacts.map(c => `
        <div class="contact-item-card">
          <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
            <strong style="color:var(--text-main);">${escapeHtml(c.name)}</strong>
            <span style="font-size:0.75rem; color:var(--text-dim);">${new Date(c.timestamp).toLocaleString()}</span>
          </div>
          <div style="font-size:0.8rem; color:var(--primary); margin-bottom:4px;">✉ ${escapeHtml(c.email)} • Topic: <strong>${escapeHtml(c.topic)}</strong></div>
          <div style="color:var(--text-muted); font-size:0.85rem; white-space:pre-wrap; background:rgba(0,0,0,0.03); padding:6px 8px; border-radius:4px;">${escapeHtml(c.message)}</div>
        </div>
      `).join('');
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text || '';
      return div.innerHTML;
    }

    function openPortalWithAuth() {
      const pin = prompt('Enter Owner Security PIN:');
      if (pin === ADMIN_PIN || pin === '2026') {
        refreshContactsList();
        modal.classList.add('open');
        if (window.soundManager) window.soundManager.playMatch();
      } else if (pin !== null) {
        alert('Access denied.');
      }
    }

    btnClose.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });

    btnRefresh.addEventListener('click', refreshContactsList);

    btnExportJSON.addEventListener('click', () => {
      if (window.arcadeDB) window.arcadeDB.exportAllAsJSON();
    });

    btnExportCSV.addEventListener('click', () => {
      if (window.arcadeDB) window.arcadeDB.exportContactsCSV();
    });

    btnClearDB.addEventListener('click', () => {
      if (window.arcadeDB) window.arcadeDB.clearAllData();
    });

    // --- Secret Triggers (Completely Invisible to Regular Users) ---

    // 1. Keyboard Shortcut: Ctrl + Shift + A  (or Cmd + Shift + A on Mac)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        openPortalWithAuth();
      }
    });

    // 2. Secret URL Query Parameter: ?admin=true or #admin
    if (window.location.search.includes('admin=true') || window.location.hash === '#admin') {
      setTimeout(() => openPortalWithAuth(), 400);
    }

    // 3. Secret Triple-Click on Footer Copyright text
    const copyrightEls = document.querySelectorAll('.footer-bottom p');
    copyrightEls.forEach(el => {
      el.style.cursor = 'default';
      el.addEventListener('click', () => {
        clickCount++;
        clearTimeout(clickTimer);
        clickTimer = setTimeout(() => { clickCount = 0; }, 2000);
        if (clickCount >= 5) {
          clickCount = 0;
          openPortalWithAuth();
        }
      });
    });
  }

  window.addEventListener('DOMContentLoaded', initSecretDataPortal);
})();
