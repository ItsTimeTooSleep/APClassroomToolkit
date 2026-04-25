// Question Navigation Feature
// Enables arrow key navigation between questions
(function() {
  'use strict';

  // Get settings from global variable
  const settings = window['__APToolkit_question-navigation_settings__'];
  if (!settings || !settings.enabled) return;

  const QuestionNavigation = {
    config: settings,

    init: function() {
      document.addEventListener('keydown', this.handleKeydown.bind(this), true);
      console.log('[AP Toolkit] Question Navigation module loaded');
    },

    handleKeydown: function(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      let button = null;
      if (e.key === this.config.leftKey) {
        button = document.querySelector('[data-test-id="back-button"]') || 
                 document.querySelector('[data-cy="back-button"]') ||
                 document.querySelector('[aria-label="Previous question"]');
      } else if (e.key === this.config.rightKey) {
        button = document.querySelector('[data-test-id="next-button"]') || 
                 document.querySelector('[data-cy="next-button"]') ||
                 document.querySelector('[aria-label="Next question"]');
      }

      if (button && !button.disabled) {
        e.preventDefault();
        button.click();
        console.log('[AP Toolkit] Navigation triggered');
      }
    },

    updateConfig: function(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
  };

  // Register the module
  window['APToolkit_question-navigation'] = QuestionNavigation;
  QuestionNavigation.init();
})();
