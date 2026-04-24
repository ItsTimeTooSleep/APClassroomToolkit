const NumberSelection = {
  name: 'numberSelection',
  defaultConfig: {
    enabled: true,
    keys: ['1', '2', '3', '4', '5']
  },

  init(config) {
    this.config = { ...this.defaultConfig, ...config };
    if (!this.config.enabled) return;
    
    document.addEventListener('keydown', this.handleKeydown.bind(this), true);
    console.log('[AP Toolkit] Number Selection module loaded');
  },

  handleKeydown(e) {
    if (e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

    const keyIndex = this.config.keys.indexOf(e.key);
    if (keyIndex === -1) return;

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

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
};