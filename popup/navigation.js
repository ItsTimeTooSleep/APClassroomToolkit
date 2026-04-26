let currentPage = 'main';
let currentFeatureId = null;
let isDetailPageLoaded = false;

function goToDetailPage(featureId) {
  console.log('[Debug] goToDetailPage called for feature:', featureId);
  currentPage = 'detail';
  currentFeatureId = featureId;

  const mainPage = document.getElementById('mainPage');
  const detailPage = document.getElementById('detailPage');

  mainPage.classList.remove('active');
  mainPage.classList.add('slide-out');

  setTimeout(() => {
    console.log('[Debug] Transition complete, rendering detail page');
    mainPage.classList.remove('slide-out');
    
    // 先渲染详细页面
    renderDetailPage(featureId);
    detailPage.classList.add('active');
    
    // 等待 DOM 更新后再加载设置
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        console.log('[Debug] Calling loadSettingsForDetailPage after DOM ready');
        loadSettingsForDetailPage();
      });
    });
  }, 150);
}

function goToMainPage() {
  console.log('[Debug] goToMainPage called');
  currentPage = 'main';

  const mainPage = document.getElementById('mainPage');
  const detailPage = document.getElementById('detailPage');

  detailPage.classList.remove('active');
  detailPage.classList.add('slide-out');

  setTimeout(() => {
    console.log('[Debug] Transition complete, rendering main page');
    detailPage.classList.remove('slide-out');
    mainPage.classList.add('active');
    renderMainPage();
    
    // 等待 DOM 更新后再加载设置
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        console.log('[Debug] Calling loadSettings after DOM ready');
        loadSettings();
      });
    });
    
    hideFooter();
    removeBottomPadding();
  }, 150);
}

