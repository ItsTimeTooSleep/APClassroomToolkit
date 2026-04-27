let FeatureManifests = {};
const modules = {};
const injectedScripts = {};
let currentSettings = null;
let currentUrl = window.location.href;

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
  if (!settings.enabled) {
    console.log(`[AP Toolkit] Feature ${featureId} disabled`);
    return;
  }
  
  if (!matchesUrl(manifest.urlPatterns)) {
    console.log(`[AP Toolkit] Feature ${featureId} skipped - URL doesn't match`);
    return;
  }
  
  if (injectedScripts[featureId]) {
    console.log(`[AP Toolkit] Feature ${featureId} already injected`);
    return;
  }
  
  const existingScript = document.getElementById(`__ap_toolkit_${featureId}`);
  if (existingScript) {
    existingScript.remove();
  }
  
  if (featureId === 'question-copy') {
    const oldIcon = document.getElementById('ap-toolkit-copy-icon');
    if (oldIcon) {
      oldIcon.remove();
    }
    const oldNotification = document.getElementById('ap-toolkit-notification');
    if (oldNotification) {
      oldNotification.remove();
    }
    const oldStyles = document.getElementById('ap-toolkit-notification-styles');
    if (oldStyles) {
      oldStyles.remove();
    }
  }
  
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(`features/${featureId}/index.js`);
  script.type = 'text/javascript';
  script.id = `__ap_toolkit_${featureId}`;
  script.dataset.settings = JSON.stringify(settings);
  
  (document.head || document.documentElement).appendChild(script);
  injectedScripts[featureId] = script;
  
  console.log(`[AP Toolkit] Feature ${featureId} initialized`);
}

function destroyModule(featureId) {
  const module = window[`APToolkit_${featureId}`];
  if (module && typeof module.destroy === 'function') {
    module.destroy();
  }
  
  const script = injectedScripts[featureId];
  if (script) {
    script.remove();
    delete injectedScripts[featureId];
  }
  
  delete window[`APToolkit_${featureId}`];
  
  if (featureId === 'question-copy') {
    const oldIcon = document.getElementById('ap-toolkit-copy-icon');
    if (oldIcon) {
      oldIcon.remove();
    }
    const oldNotification = document.getElementById('ap-toolkit-notification');
    if (oldNotification) {
      oldNotification.remove();
    }
    const oldStyles = document.getElementById('ap-toolkit-notification-styles');
    if (oldStyles) {
      oldStyles.remove();
    }
  }
  
  console.log(`[AP Toolkit] Feature ${featureId} destroyed`);
}

function handleUrlChange() {
  const newUrl = window.location.href;
  if (newUrl === currentUrl) return;
  
  console.log(`[AP Toolkit] URL changed from ${currentUrl} to ${newUrl}`);
  currentUrl = newUrl;
  
  if (!currentSettings) return;
  
  for (const featureId in FeatureManifests) {
    const manifest = FeatureManifests[featureId];
    const shouldBeActive = currentSettings[featureId]?.enabled && matchesUrl(manifest.urlPatterns);
    const isActive = injectedScripts[featureId] !== undefined;
    
    if (!shouldBeActive && isActive) {
      destroyModule(featureId);
    } else if (shouldBeActive) {
      // 对 question-navigation 特殊处理：URL 变化时总是重新初始化
      if (featureId === 'question-navigation') {
        if (isActive) {
          destroyModule(featureId);
        }
        initializeModule(featureId, manifest, currentSettings[featureId]);
      } else if (!isActive) {
        // 其他功能只在未激活时初始化
        initializeModule(featureId, manifest, currentSettings[featureId]);
      }
    }
  }
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
    
    const defaultSettings = getDefaultSettings();
    chrome.storage.sync.get(defaultSettings, (settings) => {
      currentSettings = settings;
      for (const featureId in FeatureManifests) {
        const manifest = FeatureManifests[featureId];
        const featureSettings = settings[featureId];
        initializeModule(featureId, manifest, featureSettings);
      }
    });
    
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace !== 'sync') return;
      
      for (const [featureId, { newValue }] of Object.entries(changes)) {
        if (!currentSettings) continue;
        currentSettings[featureId] = newValue;
        
        const module = window[`APToolkit_${featureId}`];
        if (module && typeof module.updateConfig === 'function') {
          module.updateConfig(newValue);
          console.log('[AP Toolkit] Module', featureId, 'updated with:', newValue);
        }
        
        if (!FeatureManifests[featureId]) continue;
        
        const shouldBeActive = newValue?.enabled && matchesUrl(FeatureManifests[featureId].urlPatterns);
        const isActive = injectedScripts[featureId] !== undefined;
        
        if (!shouldBeActive && isActive) {
          destroyModule(featureId);
        } else if (shouldBeActive && !isActive) {
          initializeModule(featureId, FeatureManifests[featureId], newValue);
        }
      }
    });
    
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(this, args);
      setTimeout(handleUrlChange, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      setTimeout(handleUrlChange, 0);
    };
    
    window.addEventListener('popstate', handleUrlChange);
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        handleUrlChange();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    let lastUrl = window.location.href;
    setInterval(() => {
      const newUrl = window.location.href;
      if (newUrl !== lastUrl) {
        lastUrl = newUrl;
        handleUrlChange();
      }
    }, 500);
    
  } catch (error) {
    console.error('[AP Toolkit] Error loading features:', error);
  }
}

loadAllFeatures();
console.log('[AP Toolkit] Content script initialized');
