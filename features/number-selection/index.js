// Number Selection Feature
(function() {
  'use strict';

  // Get settings from script tag data attribute (fix for isolated world)
  const scriptEl = document.getElementById('__ap_toolkit_number-selection');
  const settings = scriptEl ? JSON.parse(scriptEl.dataset.settings) : null;
  if (!settings || !settings.enabled) return;

  const NumberSelection = {
    config: settings,
    boundKeydown: null,

    init: function() {
      this.boundKeydown = this.handleKeydown.bind(this);
      document.addEventListener('keydown', this.boundKeydown, true);
      console.log('[AP Toolkit] Number Selection module loaded');
    },

    destroy: function() {
      console.log('[AP Toolkit] Number Selection module destroyed');
      if (this.boundKeydown) {
        document.removeEventListener('keydown', this.boundKeydown, true);
        this.boundKeydown = null;
      }
    },

    getKeyToOptionMap: function() {
      const keyMap = {};
      const optionKeys = ['optionA', 'optionB', 'optionC', 'optionD', 'optionE'];
      optionKeys.forEach((key, index) => {
        if (this.config[key]) {
          keyMap[this.config[key]] = index;
        }
      });
      return keyMap;
    },

    handleKeydown: function(e) {
      if (e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

      const keyMap = this.getKeyToOptionMap();
      const keyIndex = keyMap[e.key];
      if (keyIndex === undefined) return;

      const allOptions = document.querySelectorAll('li.lrn-mcq-option');
      const visibleOptions = Array.from(allOptions).filter(opt => {
        const style = window.getComputedStyle(opt);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               opt.offsetParent !== null;
      });

      if (visibleOptions.length > keyIndex) {
        const option = visibleOptions[keyIndex];
        const radioInput = option.querySelector('input.lrn-input[type="radio"]');

        if (radioInput && !radioInput.disabled) {
          e.stopPropagation();
          e.preventDefault();

          const label = option.querySelector('label.lrn-label');
          if (label) {
            label.click();
          } else {
            radioInput.click();
          }
        }
      }
    },

    updateConfig: function(newConfig) {
      this.config = { ...this.config, ...newConfig };
    }
  };

  window['APToolkit_number-selection'] = NumberSelection;
  NumberSelection.init();
})();
