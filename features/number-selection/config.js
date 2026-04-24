const NumberSelectionConfig = {
  name: 'numberSelection',
  title: 'Number Selection',
  description: 'Press number keys to select options quickly',
  urlPatterns: ['/assessments/assignments/'],
  defaultConfig: {
    enabled: true,
    keys: ['1', '2', '3', '4', '5']
  },
  uiConfig: {
    showToggle: true,
    fields: [
      {
        type: 'text',
        id: 'keys',
        label: 'Selection Keys',
        default: '1, 2, 3, 4, 5',
        transform: {
          save: (value) => value.split(',').map(k => k.trim()),
          load: (value) => Array.isArray(value) ? value.join(', ') : value
        }
      }
    ]
  }
};