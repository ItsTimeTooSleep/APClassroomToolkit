document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
    return;
  }

  if (e.key === 'ArrowLeft') {
    const backButton = document.querySelector('[data-test-id="back-button"]') || 
                       document.querySelector('[data-cy="back-button"]');
    if (backButton && !backButton.disabled) {
      e.preventDefault();
      backButton.click();
    }
  } else if (e.key === 'ArrowRight') {
    const nextButton = document.querySelector('[data-test-id="next-button"]') || 
                       document.querySelector('[data-cy="next-button"]');
    if (nextButton && !nextButton.disabled) {
      e.preventDefault();
      nextButton.click();
    }
  }
});