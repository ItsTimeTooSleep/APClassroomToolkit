// Popup script for AP Classroom Toolkit

document.addEventListener('DOMContentLoaded', function() {
    const arrowNavigation = document.getElementById('arrow-navigation');
    const numberSelection = document.getElementById('number-selection');

    // Load saved settings
    chrome.storage.sync.get(['arrowNavigation', 'numberSelection'], function(result) {
        arrowNavigation.checked = result.arrowNavigation !== false;
        numberSelection.checked = result.numberSelection !== false;
    });

    // Save settings on change
    arrowNavigation.addEventListener('change', function() {
        chrome.storage.sync.set({ arrowNavigation: arrowNavigation.checked });
    });

    numberSelection.addEventListener('change', function() {
        chrome.storage.sync.set({ numberSelection: numberSelection.checked });
    });
});
