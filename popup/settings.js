let initialSettings = {};
let persistedSettings = {};
let isModified = false;
let lastScrollTop = 0;
let bottomPaddingAdded = false;

function cloneSettings(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDefaultSettings() {
  const defaults = {};
  FeatureConfigs.forEach(config => {
    defaults[config.id] = cloneSettings(config.defaultConfig);
  });
  return defaults;
}

function saveSingleFeatureToggle(featureId, enabled) {
  const defaultSettings = getDefaultSettings();
  
  chrome.storage.sync.get(defaultSettings, (settings) => {
    const nextFeatureSettings = settings[featureId]
      ? cloneSettings(settings[featureId])
      : cloneSettings(defaultSettings[featureId]);

    nextFeatureSettings.enabled = enabled;
    
    chrome.storage.sync.set({ [featureId]: nextFeatureSettings }, () => {
      console.log(`[AP Toolkit] Feature ${featureId} ${enabled ? 'enabled' : 'disabled'}`);
      showQuickSaveNotification();
    });
  });
}

function showQuickSaveNotification() {
  const tempStatus = document.createElement('div');
  tempStatus.className = 'quick-save-notification';
  tempStatus.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span>Saved!</span>
  `;
  document.body.appendChild(tempStatus);

  setTimeout(() => tempStatus.classList.add('show'), 10);
  setTimeout(() => {
    tempStatus.classList.remove('show');
    setTimeout(() => tempStatus.remove(), 300);
  }, 2000);
}

function areSettingsEqual(settings1, settings2) {
  const deepEqual = (obj1, obj2) => {
    if (obj1 === obj2) return true;

    if (typeof obj1 !== typeof obj2) {
      if ((typeof obj1 === 'number' && !isNaN(obj1) && typeof obj2 === 'string') ||
          (typeof obj2 === 'number' && !isNaN(obj2) && typeof obj1 === 'string')) {
        return Number(obj1) === Number(obj2);
      }
      if ((typeof obj1 === 'boolean' && typeof obj2 === 'string') ||
          (typeof obj2 === 'boolean' && typeof obj1 === 'string')) {
        return String(obj1).toLowerCase() === String(obj2).toLowerCase();
      }
      return false;
    }

    if (obj1 == null || obj2 == null) return false;

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!deepEqual(obj1[i], obj2[i])) return false;
      }
      return true;
    }

    if (typeof obj1 === 'object' && typeof obj2 === 'object') {
      const keys1 = Object.keys(obj1).sort();
      const keys2 = Object.keys(obj2).sort();

      if (keys1.length !== keys2.length) return false;

      for (let i = 0; i < keys1.length; i++) {
        if (keys1[i] !== keys2[i]) return false;
        if (!deepEqual(obj1[keys1[i]], obj2[keys2[i]])) return false;
      }
      return true;
    }

    return obj1 === obj2;
  };

  const result = deepEqual(settings1, settings2);
  console.log('[AP Toolkit Popup] Settings equal:', result, { settings1, settings2 });
  return result;
}

function getCurrentSettingsInternal(forComparison = false) {
  const settings = currentPage === 'detail'
    ? getDetailPageBaseline(forComparison)
    : getDefaultSettings();
  console.log(`[Debug] getCurrentSettingsInternal called, currentPage=${currentPage}, currentFeatureId=${currentFeatureId}`);

  FeatureConfigs.forEach(config => {
    const isCurrentFeature = currentPage === 'detail' && currentFeatureId === config.id;

    if (!settings[config.id]) {
      settings[config.id] = cloneSettings(config.defaultConfig);
    }

    if (currentPage === 'detail' && !isCurrentFeature) {
      return;
    }

    const featureRoot = getFeatureRoot(config.id);

    if (config.uiConfig.showToggle !== false) {
      const toggleEl = findFeatureElement(featureRoot, `${config.id}_enabled`);
      settings[config.id].enabled = toggleEl ? toggleEl.checked : settings[config.id].enabled;
      console.log(`[Debug] Read toggle for ${config.id}:`, settings[config.id].enabled);
    }

    if (config.uiConfig.fields) {
      config.uiConfig.fields.forEach(field => {
        const fieldEl = findFeatureElement(featureRoot, `${config.id}_${field.id}`);
        if (!fieldEl) return;

        let value;

        if (field.type === 'key') {
          value = fieldEl.dataset.actualKey || field.default;
        } else if (field.type === 'checkbox') {
          value = fieldEl.checked;
        } else if (field.type === 'number') {
          const numValue = Number(fieldEl.value);
          value = isNaN(numValue) ? field.default : numValue;
        } else if (field.type === 'range') {
          value = parseFloat(fieldEl.value) || field.default;
        } else {
          value = fieldEl.value;
        }

        if (!forComparison && TransformRegistry[config.id] && TransformRegistry[config.id][field.id] && TransformRegistry[config.id][field.id].save) {
          try {
            value = TransformRegistry[config.id][field.id].save(value);
          } catch(e) {
            console.error('Error applying save transform:', e);
          }
        }

        settings[config.id][field.id] = value;
        console.log(`[Debug] Read field ${config.id}.${field.id}:`, value);
      });
    }
  });

  console.log(`[Debug] getCurrentSettingsInternal returning:`, settings);
  return settings;
}

function getCurrentSettingsForComparison() {
  return getCurrentSettingsInternal(true);
}

function getCurrentSettings() {
  return getCurrentSettingsInternal(false);
}

function getDetailPageBaseline(forComparison = false) {
  const snapshot = forComparison ? initialSettings : persistedSettings;

  if (snapshot && Object.keys(snapshot).length > 0) {
    return cloneSettings(snapshot);
  }

  return getDefaultSettings();
}

function getFeatureRoot(featureId) {
  if (currentPage === 'detail' && currentFeatureId === featureId) {
    return document.getElementById('detailContainer');
  }

  return document.querySelector(`.module-section[data-feature-id="${featureId}"]`);
}

function findFeatureElement(root, elementId) {
  return root ? root.querySelector(`[id="${elementId}"]`) : null;
}

function applyFieldValueToElement(fieldEl, field, value, configId) {
  if (TransformRegistry[configId] && TransformRegistry[configId][field.id] && TransformRegistry[configId][field.id].load) {
    try {
      value = TransformRegistry[configId][field.id].load(value);
    } catch(e) {
      console.error('Error applying load transform:', e);
    }
  }

  if (field.type === 'key') {
    fieldEl.value = getKeyDisplayName(value);
    fieldEl.dataset.actualKey = value;
  } else if (field.type === 'checkbox') {
    fieldEl.checked = value;
  } else {
    fieldEl.value = value;
  }
}

function loadSettingsInternal(saveInitial = false) {
  const defaultSettings = getDefaultSettings();
  console.log('[Debug] loadSettingsInternal starting, saveInitial=', saveInitial, 'defaultSettings=', defaultSettings);

  chrome.storage.sync.get(defaultSettings, (settings) => {
    console.log('[AP Toolkit Popup] Loading settings from storage:', settings);

    FeatureConfigs.forEach(config => {
      const featureSettings = settings[config.id] || cloneSettings(defaultSettings[config.id]);
      const featureRoot = getFeatureRoot(config.id);
      console.log(`[Debug] Loading settings for ${config.id}:`, featureSettings);

      if (config.uiConfig.showToggle !== false) {
        const toggleEl = findFeatureElement(featureRoot, `${config.id}_enabled`);
        console.log(`[Debug] Toggle element for ${config.id}:`, toggleEl);
        if (toggleEl) {
          console.log(`[Debug] Setting toggle ${config.id} from ${toggleEl.checked} to ${featureSettings.enabled}`);
          toggleEl.checked = featureSettings.enabled;
          console.log(`[Debug] Toggle ${config.id} now set to:`, toggleEl.checked);
        }
      }

      if (config.uiConfig.fields) {
        config.uiConfig.fields.forEach(field => {
          const fieldEl = findFeatureElement(featureRoot, `${config.id}_${field.id}`);
          if (!fieldEl) return;
          let value = Object.prototype.hasOwnProperty.call(featureSettings, field.id)
            ? featureSettings[field.id]
            : field.default;
          console.log(`[Debug] Setting field ${config.id}.${field.id} to:`, value);
          applyFieldValueToElement(fieldEl, field, value, config.id);
        });
      }
    });

    setTimeout(handleScroll, 300);
    console.log('[AP Toolkit Popup] Settings loaded successfully');

    if (saveInitial) {
      setTimeout(() => {
        persistedSettings = cloneSettings(settings);
        initialSettings = cloneSettings(getCurrentSettingsForComparison());
        isModified = false;
        console.log('[Debug] Initial settings saved:', initialSettings);
        updateFooterVisibility();
      }, 50);
    }
  });
}

function loadSettings() {
  loadSettingsInternal(false);
}

function loadSettingsForDetailPage() {
  loadSettingsInternal(true);
}

function checkForChanges() {
  const currentSettings = getCurrentSettingsForComparison();
  console.log('[Debug] checkForChanges called');
  console.log('[Debug] Current settings:', currentSettings);
  console.log('[Debug] Initial settings:', initialSettings);
  
  const modified = !areSettingsEqual(currentSettings, initialSettings);
  console.log('[Debug] Settings are modified:', modified);

  isModified = modified;
  updateFooterVisibility();
}

function updateFooterVisibility() {
  console.log('[Debug] updateFooterVisibility called, isModified=', isModified, 'currentPage=', currentPage);
  const footer = document.getElementById('footerActions');
  
  if (isModified && currentPage === 'detail') {
    console.log('[Debug] Showing discard/save footer');
    footer.classList.add('show');
    addBottomPadding();
  } else {
    console.log('[Debug] Hiding discard/save footer');
    footer.classList.remove('show');
    removeBottomPadding();
  }
}

function hideFooter() {
  const footer = document.getElementById('footerActions');
  footer.classList.remove('show');
}

function handleScroll() {
  // 移除旧的滚动处理逻辑，因为我们新的 floating-footer 始终固定在底部
  // 不再需要根据滚动位置动态调整底部内边距
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  lastScrollTop = scrollTop;
}

function addBottomPadding() {
  const container = document.querySelector('.container');
  if (container) {
    container.style.paddingBottom = '140px';
    bottomPaddingAdded = true;
  }
}

function removeBottomPadding() {
  const container = document.querySelector('.container');
  if (container) {
    container.style.paddingBottom = '';
    bottomPaddingAdded = false;
  }
}

function saveSettings() {
  const settings = getCurrentSettings();
  console.log('[AP Toolkit Popup] Saving settings:', settings);

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('saveStatus');
    status.classList.add('show');
    console.log('[AP Toolkit Popup] Settings saved successfully');

    persistedSettings = cloneSettings(settings);
    initialSettings = cloneSettings(getCurrentSettingsForComparison());
    isModified = false;
    updateFooterVisibility();

    setTimeout(() => {
      status.classList.remove('show');
    }, 2500);
  });
}

function discardChanges() {
  loadSettingsForDetailPage();
}
