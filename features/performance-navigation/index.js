// Performance Navigation Feature
// Optimized navigation with debouncing to prevent accidental rapid navigation
(function() {
  'use strict';

  const settings = window['__APToolkit_performance-navigation_settings__'];
  if (!settings || !settings.enabled) return;

  const PerformanceNavigation = {
    config: settings,
    lastNavigationTime: 0,

    init: function() {
      document.addEventListener('keydown', this.handleKeydown.bind(this), true);
      console.log('[AP Toolkit] Performance Navigation module loaded');
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
