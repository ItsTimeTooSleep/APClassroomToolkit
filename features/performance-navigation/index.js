// Performance Navigation Feature
// Optimized navigation with debouncing to prevent accidental rapid navigation

const PerformanceNavigation = {
  ...PerformanceNavigationConfig,
  
  config: null,
  lastNavigationTime: 0,

  init(config) {
    this.config = { ...this.defaultConfig, ...config };
    console.log('[AP Toolkit] Performance Navigation module initializing with config:', this.config);
    if (!this.config.enabled) {
      console.log('[AP Toolkit] Performance Navigation module disabled');
      return;
    }
    
    document.addEventListener('keydown', this.handleKeydown.bind(this), true);
    console.log('[AP Toolkit] Performance Navigation module loaded');
  },

  handleKeydown(e) {
    // Ignore if typing in input/textarea
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
      return;
    }

    const now = Date.now();
    
    // Debounce: prevent rapid navigation
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

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
};