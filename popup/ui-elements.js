function createToggleElement(config, isMainPage = false) {
  const toggleLabel = document.createElement('label');
  toggleLabel.className = 'toggle';

  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = `${config.id}_enabled`;
  // 初始值先设为默认
  input.checked = config.defaultConfig.enabled;
  
  console.log(`[Debug] Creating toggle for ${config.id}, isMainPage=${isMainPage}, defaultChecked=${config.defaultConfig.enabled}`);

  if (isMainPage) {
    input.addEventListener('change', () => {
      console.log(`[Debug] Main page toggle changed for ${config.id}, checked=${input.checked}`);
      saveSingleFeatureToggle(config.id, input.checked);
    });
  }

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
      input.dataset.defaultKey = field.default;
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

function createModuleCard(config) {
  const card = document.createElement('section');
  card.className = 'module-section';
  card.dataset.featureId = config.id;

  const header = document.createElement('div');
  header.className = 'module-header';

  if (config.uiConfig.showToggle !== false) {
    const toggle = createToggleElement(config, true);
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    header.appendChild(toggle);
  }

  const title = document.createElement('h2');
  title.textContent = config.name;
  header.appendChild(title);

  const arrowBtn = document.createElement('div');
  arrowBtn.className = 'arrow-btn';
  arrowBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  header.appendChild(arrowBtn);

  card.appendChild(header);

  if (config.description) {
    const desc = document.createElement('p');
    desc.className = 'module-desc';
    desc.textContent = config.description;
    card.appendChild(desc);
  }

  card.addEventListener('click', () => {
    goToDetailPage(config.id);
  });

  return card;
}

function createDetailModule(config) {
  const section = document.createElement('section');
  section.className = 'detail-module-section';

  if (config.description) {
    const desc = document.createElement('p');
    desc.className = 'module-desc';
    desc.style.marginBottom = '20px';
    desc.style.fontSize = '13px';
    desc.textContent = config.description;
    section.appendChild(desc);
  }

  if (config.uiConfig.showToggle !== false) {
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'key-input-group';
    toggleContainer.style.marginBottom = '16px';

    const toggleLabel = document.createElement('label');
    toggleLabel.textContent = 'Enable Feature';
    toggleLabel.style.fontWeight = '600';

    const toggle = createToggleElement(config, false);

    toggleContainer.appendChild(toggleLabel);
    toggleContainer.appendChild(toggle);
    section.appendChild(toggleContainer);
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

function renderMainPage() {
  const container = document.getElementById('featuresContainer');
  container.innerHTML = '';

  FeatureConfigs.forEach(config => {
    const card = createModuleCard(config);
    container.appendChild(card);
  });
}

function renderDetailPage(featureId) {
  const container = document.getElementById('detailContainer');
  const titleEl = document.getElementById('detailTitle');
  container.innerHTML = '';

  const config = FeatureConfigs.find(c => c.id === featureId);
  if (config) {
    titleEl.textContent = config.name;
    const detailModule = createDetailModule(config);
    container.appendChild(detailModule);
  }
}

function renderUI() {
  if (currentPage === 'main') {
    renderMainPage();
  } else {
    renderDetailPage(currentFeatureId);
  }
}
