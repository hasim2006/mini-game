/**
 * Mini Game Arcade - Universal High-Performance Dark & Light Mode Theme Switcher
 * Features:
 * - Zero Flash of Unstyled Content (FOUC)
 * - Automatic OS color scheme preference detection
 * - Cross-tab synchronization via storage events
 * - bfcache restoration support via pageshow events
 * - Delegated click handling (works dynamically)
 * - Animated dual-state sliding switch UI
 * - Synchronized smooth theme-transitioning state
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'arcade_theme';

  function getPreferredTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {
      // localStorage may fail in private browsing mode
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  // Immediate theme application to <html>
  const initialTheme = getPreferredTheme();
  const root = document.documentElement;
  root.setAttribute('data-theme', initialTheme);
  root.style.colorScheme = initialTheme;

  class ThemeManager {
    constructor() {
      this.currentTheme = initialTheme;
      this._transitionTimer = null;

      // Ensure initUI runs whether DOM is already loaded or still loading
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initUI());
      } else {
        this.initUI();
      }

      // Sync across multiple browser tabs
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && (e.newValue === 'light' || e.newValue === 'dark')) {
          this.applyTheme(e.newValue, false);
        }
      });

      // Handle back/forward cache navigation
      window.addEventListener('pageshow', () => {
        const pref = getPreferredTheme();
        if (pref !== this.currentTheme) {
          this.applyTheme(pref, false);
        }
      });

      // Listen for OS preference change if user hasn't set explicit preference
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          let hasExplicit = false;
          try {
            hasExplicit = !!localStorage.getItem(STORAGE_KEY);
          } catch (err) {}
          if (!hasExplicit) {
            this.applyTheme(e.matches ? 'dark' : 'light', false);
          }
        });
      }

      // Document-level delegated click for 100% reliable toggle action
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.theme-toggle-btn');
        if (btn) {
          e.preventDefault();
          this.toggle();
        }
      });
    }

    initUI() {
      this.updateButtons();
    }

    toggle() {
      const targetTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(targetTheme);

      // Play soft click feedback if soundManager is active
      if (window.soundManager && typeof window.soundManager.playClick === 'function') {
        window.soundManager.playClick();
      }
    }

    setTheme(theme) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (e) {}
      this.applyTheme(theme, true);
    }

    applyTheme(theme, enableTransition = true) {
      if (theme !== 'dark' && theme !== 'light') return;
      this.currentTheme = theme;

      // Apply temporary transition class for silky smooth animation
      if (enableTransition) {
        root.classList.add('theme-transitioning');
        clearTimeout(this._transitionTimer);
        this._transitionTimer = setTimeout(() => {
          root.classList.remove('theme-transitioning');
        }, 280);
      }

      root.setAttribute('data-theme', theme);
      root.style.colorScheme = theme;
      this.updateButtons();
    }

    updateButtons() {
      const isDark = this.currentTheme === 'dark';
      const buttons = document.querySelectorAll('.theme-toggle-btn');

      buttons.forEach(btn => {
        btn.setAttribute('role', 'switch');
        btn.setAttribute('aria-checked', isDark ? 'true' : 'false');
        btn.setAttribute(
          'aria-label',
          isDark ? 'Dark mode active. Click to switch to Light mode' : 'Light mode active. Click to switch to Dark mode'
        );
        btn.setAttribute(
          'title',
          isDark ? 'Dark Mode (Click for Light Mode)' : 'Light Mode (Click for Dark Mode)'
        );

        btn.classList.toggle('is-dark', isDark);
        btn.classList.toggle('is-light', !isDark);

        // Inject dual-state sliding switch if not already rendered
        if (!btn.querySelector('.theme-toggle-track')) {
          btn.innerHTML = `
            <span class="theme-toggle-track">
              <span class="theme-toggle-icon icon-sun" aria-hidden="true">☀️</span>
              <span class="theme-toggle-icon icon-moon" aria-hidden="true">🌙</span>
              <span class="theme-toggle-thumb" aria-hidden="true"></span>
            </span>
          `;
        }
      });
    }

    getTheme() {
      return this.currentTheme;
    }
  }

  window.themeManager = new ThemeManager();
})();
