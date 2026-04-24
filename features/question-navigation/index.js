// Question Navigation Feature
// Use arrow keys to navigate between questions

const QuestionNavigation = {
  ...QuestionNavigationConfig,
  
  config: null,

  init(config) {
    this.config = { ...this.defaultConfig, ...config };
    console.log('[AP Toolkit] Question Navigation module initializing with config:', this.config);
    if (!this.config.enabled) {
      console.log('[AP Toolkit] Question Navigation module disabled');
      return;
    }
    
    document.addEventListener('keydown', this.handleKeydown.bind(this), true);
    console.log('[AP Toolkit] Question Navigation module loaded');
  },

  handleKeydown(e) {
    // Ignore if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }

    if (e.key === this.config.leftKey) {
      const backButton = document.querySelector('[data-test-id="back-button"]') || 
                         document.querySelector('[data-cy="back-button"]');
      if (backButton && !backButton.disabled) {
        e.preventDefault();
        backButton.click();
      }
    } else if (e.key === this.config.rightKey) {
      const nextButton = document.querySelector('[data-test-id="next-button"]') || 
                         document.querySelector('[data-cy="next-button"]');
      if (nextButton && !nextButton.disabled) {
        e.preventDefault();
        nextButton.click();
      }
    }
  },

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
};