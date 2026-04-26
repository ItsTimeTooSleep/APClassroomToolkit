const TransformRegistry = {
  'number-selection': {
    keys: {
      save: (value) => value.split(',').map(k => k.trim()),
      load: (value) => Array.isArray(value) ? value.join(', ') : value
    }
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
