let FeatureConfigs = [];

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
    
    // 等待 DOM 渲染完成后再加载设置
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        loadSettings();
      });
    });
  } catch (error) {
    console.error('[AP Toolkit Popup] Error loading features:', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  setupKeyCapture();
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('discardBtn').addEventListener('click', discardChanges);
  document.getElementById('backBtn').addEventListener('click', goToMainPage);
  document.getElementById('aboutBtn').addEventListener('click', goToAboutPage);
  document.getElementById('backFromAboutBtn').addEventListener('click', goToMainPageFromAbout);
  loadAllFeatures();
  setTimeout(setupChangeListener, 100);
  setTimeout(setupScrollListener, 150);
});
