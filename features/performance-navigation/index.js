// Performance Navigation Feature
// Optimized navigation with debouncing to prevent accidental rapid navigation
(function() {
  'use strict';

  // Get settings from script tag data attribute (fix for isolated world)
  const scriptEl = document.getElementById('__ap_toolkit_performance-navigation');
  const settings = scriptEl ? JSON.parse(scriptEl.dataset.settings) : null;
  if (!settings || !settings.enabled) return;

  const PerformanceNavigation = {
    config: settings,
    lastNavigationTime: 0,
    boundKeydown: null,

    init: function() {
      this.boundKeydown = this.handleKeydown.bind(this);
      document.addEventListener('keydown', this.boundKeydown, true);
      console.log('[AP Toolkit] Performance Navigation module loaded');
    },

    destroy: function() {
      console.log('[AP Toolkit] Performance Navigation module destroyed');
      if (this.boundKeydown) {
        document.removeEventListener('keydown', this.boundKeydown, true);
        this.boundKeydown = null;
      }
    },

    handleKeydown: function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      const now = Date.now();
      if (now - this.lastNavigationTime < this.config.debounceDelay) {
        return;
      }

      let button = null;
      if (e.key === this.config.leftKey) {
        button = document.querySelector('[data-test-id="back-button"]') || 
                 document.querySelector('[data-cy="back-button"]');
      } else if (e.key === this.config.rightKey) {
        button = document.querySelector('[data-test-id="next-button"]') || 
                 document.querySelector('[data-cy="next-button"]');
      }

      if (button && !button.disabled) {
        e.preventDefault();
        this.lastNavigationTime = now;
        button.click();
        console.log('[AP Toolkit] Navigation triggered with debounce delay:', now - this.lastNavigationTime, 'ms');
      }
    },

    updateConfig: function(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
  };

  window['APToolkit_performance-navigation'] = PerformanceNavigation;
  PerformanceNavigation.init();
})();
