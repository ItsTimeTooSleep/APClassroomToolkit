const TransformRegistry = {
  'number-selection': {
    // 不再需要keys的transform，因为现在使用独立的option字段
  }
};

const KEY_NAMES = {
  'ArrowLeft': '←',
  'ArrowRight': '→',
  'ArrowUp': '↑',
  'ArrowDown': '↓',
  ' ': 'Space',
  'Enter': 'Enter'
};

function getKeyDisplayName(key) {
  return KEY_NAMES[key] || key.toUpperCase();
}
