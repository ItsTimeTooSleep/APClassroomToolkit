function setupChangeListener() {
  const detailContainer = document.getElementById('detailContainer');
  
  detailContainer.addEventListener('input', (e) => {
    if (
      currentPage === 'detail' &&
      e.target.type !== 'checkbox' &&
      !(e.target.classList.contains('key-input') && e.target.readOnly)
    ) {
      console.log('[Debug] Input field changed, calling checkForChanges');
      checkForChanges();
    }
  });

  detailContainer.addEventListener('change', (e) => {
    if (currentPage === 'detail' && e.target.type === 'checkbox') {
      console.log('[Debug] Checkbox changed, calling checkForChanges');
      checkForChanges();
    }
  });

  document.addEventListener('blur', (e) => {
    if (e.target.classList.contains('key-input') && e.target.readOnly && currentPage === 'detail') {
      setTimeout(checkForChanges, 50);
    }
  }, true);
}

function setupScrollListener() {
  document.body.addEventListener('scroll', () => {
    handleScroll();
  }, { passive: true });

  window.addEventListener('scroll', () => {
    handleScroll();
  }, { passive: true });

  window.addEventListener('resize', () => {
    handleScroll();
  });
}

function setupKeyCapture() {
  document.addEventListener('focus', (e) => {
    if (e.target.classList.contains('key-input') && e.target.readOnly) {
      e.target.value = 'Press a key...';
      e.target.classList.add('capturing');
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('key-input') && e.target.readOnly) {
      e.preventDefault();
      e.target.value = getKeyDisplayName(e.key);
      e.target.dataset.actualKey = e.key;
      e.target.classList.remove('capturing');
      e.target.blur();
    }
  }, true);

  document.addEventListener('blur', (e) => {
    if (e.target.classList.contains('key-input') && e.target.readOnly) {
      if (e.target.classList.contains('capturing')) {
        const fallbackKey = e.target.dataset.actualKey || e.target.dataset.defaultKey || '';
        e.target.value = getKeyDisplayName(fallbackKey);
        e.target.classList.remove('capturing');
      }
    }
  }, true);
}
