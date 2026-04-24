// Question Navigation Configuration
const QuestionNavigationConfig = {
  name: 'questionNavigation',
  title: 'Question Navigation',
  description: 'Use arrow keys to navigate between questions',
  urlPatterns: ['/assessments/assignments/'],
  defaultConfig: {
    enabled: true,
    leftKey: 'ArrowLeft',
    rightKey: 'ArrowRight'
  },
  uiConfig: {
    showToggle: true,
    fields: [
      {
        type: 'key',
        id: 'leftKey',
        label: 'Previous Question Key',
        default: 'ArrowLeft'
      },
      {
        type: 'key',
        id: 'rightKey',
        label: 'Next Question Key',
        default: 'ArrowRight'
      }
    ]
  }
};

// Performance Navigation Configuration
const PerformanceNavigationConfig = {
  name: 'performanceNavigation',
  title: 'Performance Navigation',
  description: 'Optimized navigation with debouncing',
  urlPatterns: ['/assessments/assignments/'],
  defaultConfig: {
    enabled: true,
    debounceDelay: 100
  },
  uiConfig: {
    showToggle: true,
    fields: [
      {
        type: 'number',
        id: 'debounceDelay',
        label: 'Debounce Delay (ms)',
        default: 100,
        min: 50,
        max: 500
      }
    ]
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    QuestionNavigationConfig,
    PerformanceNavigationConfig,
    NumberSelectionConfig,
    QuestionCopyConfig
  };
}

// Initialize all features when content script loads
(function initializeFeatures() {
  const features = [
    typeof QuestionNavigation !== 'undefined' ? QuestionNavigation : null,
    typeof PerformanceNavigation !== 'undefined' ? PerformanceNavigation : null,
    typeof NumberSelection !== 'undefined' ? NumberSelection : null,
    typeof QuestionCopy !== 'undefined' ? QuestionCopy : null
  ].filter(f => f !== null);

  // Load saved config from chrome storage if available
  if (typeof chrome !== 'undefined' && chrome.storage) {
    const defaultSettings = {};
    features.forEach(feature => {
      defaultSettings[feature.name] = feature.defaultConfig;
    });

    chrome.storage.sync.get(defaultSettings, function(settings) {
      console.log('[AP Toolkit] Loading saved settings:', settings);
      features.forEach(feature => {
        if (settings[feature.name]) {
          feature.init(settings[feature.name]);
        } else {
          feature.init({});
        }
      });
    });
  } else {
    // No chrome storage, init with defaults
    features.forEach(feature => {
      feature.init({});
    });
  }
})();
