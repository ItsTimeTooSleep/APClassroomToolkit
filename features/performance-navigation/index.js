// Performance Navigation Feature
// Enables arrow key navigation between performance questions
(function() {
  'use strict';

  // Get settings from script tag data attribute (fix for isolated world)
  const scriptEl = document.getElementById('__ap_toolkit_performance-navigation');
  const settings = scriptEl ? JSON.parse(scriptEl.dataset.settings) : null;
  if (!settings || !settings.enabled) return;

  const NAVIGATION_ACTIONS = {
    previous: {
      configKey: 'leftKey',
      selectors: [
        'a.RI_header__button[aria-label="Previous response"]',
        '[aria-label="Previous response"]'
      ]
    },
    next: {
      configKey: 'rightKey',
      selectors: [
        'a.RI_header__button[aria-label="Next response"]',
        '[aria-label="Next response"]'
      ]
    }
  };

  const PerformanceNavigation = {
    config: settings,
    boundKeydown: null,

    init: function() {
      this.boundKeydown = this.handleKeydown.bind(this);
      window.addEventListener('keydown', this.boundKeydown, {
        capture: true,
        passive: false
      });
      console.log('[AP Toolkit] Performance Navigation module loaded');
    },

    destroy: function() {
      console.log('[AP Toolkit] Performance Navigation module destroyed');
      if (this.boundKeydown) {
        window.removeEventListener('keydown', this.boundKeydown, true);
        this.boundKeydown = null;
      }
    },

    isEditableTarget: function(target) {
      if (!target || target.isContentEditable) {
        return true;
      }

      const editableElement = target.closest('textarea, [contenteditable=""], [contenteditable="true"]');
      if (editableElement) {
        return true;
      }

      const input = target.closest('input');
      if (input) {
        const nonTextInputTypes = new Set([
          'button',
          'checkbox',
          'color',
          'file',
          'image',
          'radio',
          'range',
          'reset',
          'submit'
        ]);

        return !nonTextInputTypes.has((input.type || 'text').toLowerCase());
      }

      return Boolean(target.closest('select'));
    },

    getActionNameForKey: function(key) {
      return Object.keys(NAVIGATION_ACTIONS).find(actionName => {
        const action = NAVIGATION_ACTIONS[actionName];
        return this.config[action.configKey] === key;
      }) || null;
    },

    getButtonForAction: function(actionName) {
      const action = NAVIGATION_ACTIONS[actionName];
      if (!action) return null;

      for (const selector of action.selectors) {
        const button = document.querySelector(selector);
        if (button) {
          return button;
        }
      }

      return null;
    },

    suppressEvent: function(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      e.stopPropagation();
      e.cancelBubble = true;
      e.returnValue = false;
    },

    handleKeydown: function(e) {
      const actionName = this.getActionNameForKey(e.key);
      if (!actionName) {
        return;
      }

      if (this.isEditableTarget(e.target)) {
        return;
      }

      this.suppressEvent(e);

      const button = this.getButtonForAction(actionName);
      if (button) {
        button.click();
        console.log('[AP Toolkit] Performance Navigation triggered:', actionName);
      }
    },

    updateConfig: function(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
  };

  // Register the module
  window['APToolkit_performance-navigation'] = PerformanceNavigation;
  PerformanceNavigation.init();
})();
