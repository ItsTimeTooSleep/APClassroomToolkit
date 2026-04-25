let FeatureManifests = {};
const modules = {};
let currentSettings = null;

function matchesUrl(urlPatterns) {
  if (!urlPatterns) return true;
  const currentUrl = window.location.href;
  const patterns = Array.isArray(urlPatterns) ? urlPatterns : [urlPatterns];
  return patterns.some(pattern => currentUrl.includes(pattern));
}

function getDefaultSettings() {
  const settings = {};
  for (const featureId in FeatureManifests) {
    const manifest = FeatureManifests[featureId];
    settings[featureId] = manifest.defaultConfig;
  }
  return settings;
}

function initializeModule(featureId, manifest, settings) {
  if (modules[featureId]) return;
  if (!matchesUrl(manifest.urlPatterns)) {
    console.log(`[AP Toolkit] Feature ${featureId} skipped - URL doesn't match`);
    return;
  }
  if (!settings.enabled) {
    console.log(`[AP Toolkit] Feature ${featureId} disabled`);
    return;
  }
  
  // Dynamically inject the script
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(`features/${featureId}/index.js`);
  script.type = 'text/javascript';
  
  // Store settings globally for the module to pick up
  window[`__APToolkit_${featureId}_settings__`] = settings;
  
  (document.head || document.documentElement).appendChild(script);
  
  console.log(`[AP Toolkit] Feature ${featureId} initialized`);
}

async function loadAllFeatures() {
  try {
    const featuresListUrl = chrome.runtime.getURL('features/features.json');
    const featuresListResponse = await fetch(featuresListUrl);
    const featuresList = await featuresListResponse.json();
    console.log('[AP Toolkit] Loaded features list:', featuresList);
    
    const promises = featuresList.map(async (featureId) => {
      const manifestUrl = chrome.runtime.getURL(`features/${featureId}/manifest.json`);
      const manifestResponse = await fetch(manifestUrl);
      const manifest = await manifestResponse.json();
      FeatureManifests[featureId] = manifest;
    });
    
    await Promise.all(promises);
    console.log('[AP Toolkit] Loaded all feature manifests:', FeatureManifests);
    
    // Load settings and initialize modules
    const defaultSettings = getDefaultSettings();
    chrome.storage.sync.get(defaultSettings, function(settings) {
      currentSettings = settings;
      for (const featureId in FeatureManifests) {
        const manifest = FeatureManifests[featureId];
        const featureSettings = settings[featureId];
        initializeModule(featureId, manifest, featureSettings);
      }
    });
    
    // Listen for settings updates
    chrome.storage.onChanged.addListener(function(changes) {
      for (const [key, { newValue }] of Object.entries(changes)) {
        if (modules[key]) {
          if (typeof modules[key].updateConfig === 'function') {
            modules[key].updateConfig(newValue);
            console.log('[AP Toolkit] Module', key, 'updated with:', newValue);
          }
        }
      }
    });
    
  } catch (error) {
    console.error('[AP Toolkit] Error loading features:', error);
  }
}

// Start loading features when DOM is ready
loadAllFeatures();
console.log('[AP Toolkit] Content script initialized');
