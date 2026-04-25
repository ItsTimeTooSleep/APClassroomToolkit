let FeatureConfigs = [];
let initialSettings = {};
let isModified = false;

const TransformRegistry = {
  'number-selection': {
    keys: {
      save: (value) => value.split(',').map(k => k.trim()),
      load: (value) => Array.isArray(value) ? value.join(', ') : value
    }
  }
};

function getKeyDisplayName(key) {
  const keyNames = {
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    ' ': 'Space',
    'Enter': 'Enter'
  };
  return keyNames[key] || key.toUpperCase();
}

function getDefaultSettings() {
  const defaults = {};
  FeatureConfigs.forEach(config => {
    defaults[config.id] = config.defaultConfig;
  });
  return defaults;
}

function createToggleElement(config) {
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'toggle';
  
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `${config.id}_enabled`;
  input.checked = config.defaultConfig.enabled;
  
  const slider = document.createElement('span');
  slider.className = 'toggle-slider';
  
  toggleLabel.appendChild(input);
  toggleLabel.appendChild(slider);
  
  return toggleLabel;
}

function createFieldElement(field, configId) {
  const group = document.createElement('div');
  group.className = 'key-input-group';
  
  const label = document.createElement('label');
  label.textContent = field.label;
  
  let input;
  
  switch (field.type) {
    case 'key':
      input = document.createElement('input');
      input.type = 'text';
      input.id = `${configId}_${field.id}`;
      input.className = 'key-input';
      input.readOnly = true;
      input.dataset.actualKey = field.default;
      input.value = getKeyDisplayName(field.default);
      break;
      
    case 'text':
      input = document.createElement('input');
      input.type = 'text';
      input.id = `${configId}_${field.id}`;
      input.className = 'key-input';
      input.value = field.default;
      break;
      
    case 'number':
      input = document.createElement('input');
      input.type = 'number';
      input.id = `${configId}_${field.id}`;
      input.className = 'key-input';
      input.value = field.default;
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      break;
      
    case 'range':
      input = document.createElement('input');
      input.type = 'range';
      input.id = `${configId}_${field.id}`;
      input.className = 'key-input range-input';
      input.value = field.default;
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      if (field.step !== undefined) input.step = field.step;
      break;
      
    case 'checkbox':
      group.className = 'key-input-group checkbox-group';
      input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `${configId}_${field.id}`;
      input.checked = field.default;
      label.setAttribute('for', input.id);
      break;
  }
  
  if (field.type === 'checkbox') {
    group.appendChild(input);
    group.appendChild(label);
  } else {
    group.appendChild(label);
    group.appendChild(input);
  }
  
  return group;
}

function createModuleSection(config) {
  const section = document.createElement('section');
  section.className = 'module-section';
  section.dataset.featureId = config.id;
  
  const header = document.createElement('div');
  header.className = 'module-header';
  
  if (config.uiConfig.showToggle !== false) {
    const toggle = createToggleElement(config);
    header.appendChild(toggle);
  }
  
  const title = document.createElement('h2');
  title.textContent = config.name;
  header.appendChild(title);
  
  section.appendChild(header);
  
  if (config.description) {
    const desc = document.createElement('p');
    desc.className = 'module-desc';
    desc.textContent = config.description;
    section.appendChild(desc);
  }
  
  if (config.uiConfig.fields && config.uiConfig.fields.length > 0) {
    const fieldsContainer = document.createElement('div');
    fieldsContainer.className = 'key-settings';
    
    config.uiConfig.fields.forEach(field => {
      const fieldElement = createFieldElement(field, config.id);
      fieldsContainer.appendChild(fieldElement);
    });
    
    section.appendChild(fieldsContainer);
  }
  
  return section;
}

function renderUI() {
  const container = document.getElementById('featuresContainer');
  container.innerHTML = '';
  
  FeatureConfigs.forEach(config => {
    const section = createModuleSection(config);
    container.appendChild(section);
  });
}

function loadSettings() {
  const defaultSettings = getDefaultSettings();
  
  chrome.storage.sync.get(defaultSettings, function(settings) {
    console.log('[AP Toolkit Popup] Loading settings:', settings);
    
    FeatureConfigs.forEach(config => {
      const featureSettings = settings[config.id];
      
      if (config.uiConfig.showToggle !== false) {
        const toggleEl = document.getElementById(`${config.id}_enabled`);
        if (toggleEl) {
          toggleEl.checked = featureSettings.enabled;
        }
      }
      
      if (config.uiConfig.fields) {
        config.uiConfig.fields.forEach(field => {
          const fieldEl = document.getElementById(`${config.id}_${field.id}`);
          if (!fieldEl) return;
          
          let value = featureSettings[field.id];
          
          if (TransformRegistry[config.id] && TransformRegistry[config.id][field.id] && TransformRegistry[config.id][field.id].load) {
            try {
              value = TransformRegistry[config.id][field.id].load(value);
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
        });
      }
    });
    
    // 保存初始设置 - 但要确保是UI上显示的原始格式，不应用转换
    // 我们需要从UI中读取当前状态作为初始状态
    setTimeout(() => {
      initialSettings = JSON.parse(JSON.stringify(getSettingsForComparison()));
      isModified = false;
      updateFooterVisibility();
      console.log('[AP Toolkit Popup] Initial settings saved:', initialSettings);
    }, 50);
    
    // 延迟检查滚动位置
    setTimeout(handleScroll, 300);
    
    console.log('[AP Toolkit Popup] Settings loaded successfully');
  });
}

function setupChangeListener() {
  const featuresContainer = document.getElementById('featuresContainer');
  
  featuresContainer.addEventListener('change', function(e) {
    checkForChanges();
  });
  
  featuresContainer.addEventListener('input', function(e) {
    checkForChanges();
  });
  
  // 监听键盘捕获完成
  document.addEventListener('blur', function(e) {
    if (e.target.classList.contains('key-input') && e.target.readOnly) {
      setTimeout(checkForChanges, 50);
    }
  }, true);
}

function getCurrentSettings(forComparison = false) {
  const settings = {};
  
  FeatureConfigs.forEach(config => {
    settings[config.id] = {};
    
    if (config.uiConfig.showToggle !== false) {
      const toggleEl = document.getElementById(`${config.id}_enabled`);
      settings[config.id].enabled = toggleEl ? toggleEl.checked : config.defaultConfig.enabled;
    }
    
    if (config.uiConfig.fields) {
      config.uiConfig.fields.forEach(field => {
        const fieldEl = document.getElementById(`${config.id}_${field.id}`);
        if (!fieldEl) return;
        
        let value;
        
        if (field.type === 'key') {
          value = fieldEl.dataset.actualKey || field.default;
        } else if (field.type === 'checkbox') {
          value = fieldEl.checked;
        } else if (field.type === 'number') {
          // 处理可能的空值或非数字情况，正确匹配类型
          const numValue = Number(fieldEl.value);
          value = isNaN(numValue) ? field.default : numValue;
        } else if (field.type === 'range') {
          value = parseFloat(fieldEl.value) || field.default;
        } else {
          value = fieldEl.value;
        }
        
        // 只有在保存时才应用 save 转换，比较时不应用
        if (!forComparison && TransformRegistry[config.id] && TransformRegistry[config.id][field.id] && TransformRegistry[config.id][field.id].save) {
          try {
            value = TransformRegistry[config.id][field.id].save(value);
          } catch(e) {
            console.error('Error applying save transform:', e);
          }
        }
        
        settings[config.id][field.id] = value;
      });
    }
  });
  
  return settings;
}

// 获取用于比较的设置（不应用 save 转换）
function getSettingsForComparison() {
  return getCurrentSettings(true);
}

// 改进的设置比较函数，处理类型转换问题
function areSettingsEqual(settings1, settings2) {
  // 深度比较，确保类型正确匹配
  const deepEqual = (obj1, obj2) => {
    // 严格相等检查
    if (obj1 === obj2) return true;
    
    // 类型检查
    if (typeof obj1 !== typeof obj2) {
      // 特殊处理：数字和字符串数字的比较
      if ((typeof obj1 === 'number' && !isNaN(obj1) && typeof obj2 === 'string') ||
          (typeof obj2 === 'number' && !isNaN(obj2) && typeof obj1 === 'string')) {
        return Number(obj1) === Number(obj2);
      }
      // 特殊处理：布尔和字符串布尔的比较
      if ((typeof obj1 === 'boolean' && typeof obj2 === 'string') ||
          (typeof obj2 === 'boolean' && typeof obj1 === 'string')) {
        return String(obj1).toLowerCase() === String(obj2).toLowerCase();
      }
      return false;
    }
    
    // null/undefined 检查
    if (obj1 == null || obj2 == null) return false;
    
    // 数组检查
    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      for (let i = 0; i < obj1.length; i++) {
        if (!deepEqual(obj1[i], obj2[i])) return false;
      }
      return true;
    }
    
    // 对象检查
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
    
    // 默认使用严格相等
    return obj1 === obj2;
  };
  
  const result = deepEqual(settings1, settings2);
  console.log('[AP Toolkit Popup] Settings equal:', result, { settings1, settings2 });
  return result;
}

function checkForChanges() {
  const currentSettings = getSettingsForComparison();
  const modified = !areSettingsEqual(currentSettings, initialSettings);
  
  console.log('[AP Toolkit Popup] Checking changes:', { 
    current: currentSettings, 
    initial: initialSettings, 
    modified 
  });
  
  // 即使状态没有改变，我们也确保UI保持正确
  isModified = modified;
  updateFooterVisibility();
}

function updateFooterVisibility() {
  const footer = document.getElementById('footerActions');
  if (isModified) {
    footer.classList.add('show');
  } else {
    footer.classList.remove('show');
  }
}

// 滚动相关的功能
let lastScrollTop = 0;
let bottomPaddingAdded = false;

function setupScrollListener() {
  const content = document.getElementById('featuresContainer');
  
  // 监听 body 的滚动，这在 popup 中通常是主要的滚动区域
  document.body.addEventListener('scroll', function() {
    handleScroll();
  }, { passive: true });
  
  // 也监听 window 的滚动
  window.addEventListener('scroll', function() {
    handleScroll();
  }, { passive: true });
  
  // 监听 resize 事件，处理尺寸变化
  window.addEventListener('resize', function() {
    handleScroll();
  });
}

function handleScroll() {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.offsetHeight,
    document.body.clientHeight,
    document.documentElement.clientHeight
  );
  
  // 检查是否滚动到底部附近（120px 范围内）
  const isNearBottom = (scrollTop + windowHeight) >= (documentHeight - 120);
  
  if (isNearBottom && !bottomPaddingAdded && isModified) {
    // 在底部附近，添加额外的 padding 避免遮挡
    addBottomPadding();
  } else if (!isNearBottom && bottomPaddingAdded) {
    // 往上滚动了，移除额外的 padding
    removeBottomPadding();
  }
  
  lastScrollTop = scrollTop;
}

function addBottomPadding() {
  const container = document.querySelector('.container');
  if (container) {
    container.style.paddingBottom = '120px';
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

// 修改 updateFooterVisibility 也处理滚动状态
const originalUpdateFooterVisibility = updateFooterVisibility;
updateFooterVisibility = function() {
  originalUpdateFooterVisibility();
  
  // 如果菜单隐藏了，也确保移除底部 padding
  if (!isModified && bottomPaddingAdded) {
    removeBottomPadding();
  }
}

function discardChanges() {
  loadSettings();
}

function saveSettings() {
  const settings = getCurrentSettings();
  console.log('[AP Toolkit Popup] Saving settings:', settings);

  chrome.storage.sync.set(settings, function() {
    const status = document.getElementById('saveStatus');
    status.classList.add('show');
    console.log('[AP Toolkit Popup] Settings saved successfully');
    
    // 更新初始设置为当前设置 - 使用UI当前的状态，而不是保存后的状态
    initialSettings = JSON.parse(JSON.stringify(getSettingsForComparison()));
    isModified = false;
    updateFooterVisibility();
    
    setTimeout(() => {
      status.classList.remove('show');
    }, 2500);
  });
}

function setupKeyCapture() {
  document.addEventListener('focus', function(e) {
    if (e.target.classList.contains('key-input') && e.target.readOnly) {
      e.target.value = 'Press a key...';
      e.target.classList.add('capturing');
    }
  }, true);

  document.addEventListener('keydown', function(e) {
    if (e.target.classList.contains('key-input') && e.target.readOnly) {
      e.preventDefault();
      e.target.value = getKeyDisplayName(e.key);
      e.target.dataset.actualKey = e.key;
      e.target.classList.remove('capturing');
      e.target.blur();
    }
  }, true);

  document.addEventListener('blur', function(e) {
    if (e.target.classList.contains('key-input') && e.target.readOnly) {
      if (e.target.classList.contains('capturing')) {
        e.target.value = getKeyDisplayName(e.target.dataset.actualKey || 'ArrowLeft');
        e.target.classList.remove('capturing');
      }
    }
  }, true);
}

async function loadAllFeatures() {
  try {
    const featuresListUrl = chrome.runtime.getURL('features/features.json');
    const featuresListResponse = await fetch(featuresListUrl);
    const featuresList = await featuresListResponse.json();
    console.log('[AP Toolkit Popup] Loaded features list:', featuresList);
    
    const promises = featuresList.map(async (featureId) => {
      const manifestUrl = chrome.runtime.getURL(`features/${featureId}/manifest.json`);
      const manifestResponse = await fetch(manifestUrl);
      const manifest = await manifestResponse.json();
      return { id: featureId, ...manifest };
    });
    
    FeatureConfigs = await Promise.all(promises);
    console.log('[AP Toolkit Popup] Loaded all feature manifests:', FeatureConfigs);
    
    renderUI();
    loadSettings();
  } catch (error) {
    console.error('[AP Toolkit Popup] Error loading features:', error);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  setupKeyCapture();
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('discardBtn').addEventListener('click', discardChanges);
  loadAllFeatures();
  setTimeout(setupChangeListener, 100); // 延迟设置监听器，确保 DOM 已渲染
  setTimeout(setupScrollListener, 150); // 延迟设置滚动监听器
});
