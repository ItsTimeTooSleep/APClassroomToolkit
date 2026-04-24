const FeatureConfigs = [
  QuestionNavigationConfig,
  PerformanceNavigationConfig,
  NumberSelectionConfig,
  QuestionCopyConfig
];

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
    defaults[config.name] = config.defaultConfig;
  });
  return defaults;
}

function createToggleElement(config) {
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'toggle';
  
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `${config.name}_enabled`;
  input.checked = config.defaultConfig.enabled;
  
  const slider = document.createElement('span');
  slider.className = 'toggle-slider';
  
  toggleLabel.appendChild(input);
  toggleLabel.appendChild(slider);
  
  return toggleLabel;
}

function createFieldElement(field, configName) {
  const group = document.createElement('div');
  group.className = 'key-input-group';
  
  const label = document.createElement('label');
  label.textContent = field.label;
  
  let input;
  
  switch (field.type) {
    case 'key':
      input = document.createElement('input');
      input.type = 'text';
      input.id = `${configName}_${field.id}`;
      input.className = 'key-input';
      input.readOnly = true;
      input.dataset.actualKey = field.default;
      input.value = getKeyDisplayName(field.default);
      break;
      
    case 'text':
      input = document.createElement('input');
      input.type = 'text';
      input.id = `${configName}_${field.id}`;
      input.className = 'key-input';
      input.value = field.default;
      break;
      
    case 'number':
      input = document.createElement('input');
      input.type = 'number';
      input.id = `${configName}_${field.id}`;
      input.className = 'key-input';
      input.value = field.default;
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      break;
      
    case 'range':
      input = document.createElement('input');
      input.type = 'range';
      input.id = `${configName}_${field.id}`;
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
      input.id = `${configName}_${field.id}`;
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
  section.dataset.featureName = config.name;
  
  const header = document.createElement('div');
  header.className = 'module-header';
  
  if (config.uiConfig.showToggle !== false) {
    const toggle = createToggleElement(config);
    header.appendChild(toggle);
  }
  
  const title = document.createElement('h2');
  title.textContent = config.title;
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
      const fieldElement = createFieldElement(field, config.name);
      fieldsContainer.appendChild(fieldElement);
    });
    
    section.appendChild(fieldsContainer);
  }
  
  return section;
}

function renderUI() {
  const container = document.querySelector('.container');
  const header = container.querySelector('header');
  const footer = container.querySelector('footer');
  
  const existingSections = container.querySelectorAll('.module-section');
  existingSections.forEach(section => section.remove());
  
  FeatureConfigs.forEach(config => {
    const section = createModuleSection(config);
    container.insertBefore(section, footer);
  });
}

function loadSettings() {
  const defaultSettings = getDefaultSettings();
  
  chrome.storage.sync.get(defaultSettings, function(settings) {
    console.log('[AP Toolkit Popup] Loading settings:', settings);
    
    FeatureConfigs.forEach(config => {
      const featureSettings = settings[config.name];
      
      if (config.uiConfig.showToggle !== false) {
        const toggleEl = document.getElementById(`${config.name}_enabled`);
        if (toggleEl) {
          toggleEl.checked = featureSettings.enabled;
        }
      }
      
      if (config.uiConfig.fields) {
        config.uiConfig.fields.forEach(field => {
          const fieldEl = document.getElementById(`${config.name}_${field.id}`);
          if (!fieldEl) return;
          
          let value = featureSettings[field.id];
          
          if (field.transform && field.transform.load) {
            value = field.transform.load(value);
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
    
    console.log('[AP Toolkit Popup] Settings loaded successfully');
  });
}

function saveSettings() {
  const settings = {};
  
  FeatureConfigs.forEach(config => {
    settings[config.name] = {};
    
    if (config.uiConfig.showToggle !== false) {
      const toggleEl = document.getElementById(`${config.name}_enabled`);
      settings[config.name].enabled = toggleEl ? toggleEl.checked : config.defaultConfig.enabled;
    }
    
    if (config.uiConfig.fields) {
      config.uiConfig.fields.forEach(field => {
        const fieldEl = document.getElementById(`${config.name}_${field.id}`);
        if (!fieldEl) return;
        
        let value;
        
        if (field.type === 'key') {
          value = fieldEl.dataset.actualKey || field.default;
        } else if (field.type === 'checkbox') {
          value = fieldEl.checked;
        } else if (field.type === 'number') {
          value = parseInt(fieldEl.value) || field.default;
        } else if (field.type === 'range') {
          value = parseFloat(fieldEl.value) || field.default;
        } else {
          value = fieldEl.value;
        }
        
        if (field.transform && field.transform.save) {
          value = field.transform.save(value);
        }
        
        settings[config.name][field.id] = value;
      });
    }
  });

  console.log('[AP Toolkit Popup] Saving settings:', settings);

  chrome.storage.sync.set(settings, function() {
    const status = document.getElementById('saveStatus');
    status.textContent = 'Saved!';
    status.classList.add('show');
    console.log('[AP Toolkit Popup] Settings saved successfully');
    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
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

document.addEventListener('DOMContentLoaded', function() {
  renderUI();
  loadSettings();
  setupKeyCapture();
  
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
});