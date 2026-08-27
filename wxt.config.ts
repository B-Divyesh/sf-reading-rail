import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: '.',
  manifest: {
    name: 'Reading Rail',
    short_name: 'Reading Rail',
    description: 'Keep your place in dense browser text with a movable, private focus rail.',
    version: '1.0.0',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Open Reading Rail',
    },
    commands: {
      'toggle-rail': {
        suggested_key: { default: 'Alt+Shift+R', mac: 'Alt+Shift+R' },
        description: 'Show or hide Reading Rail',
      },
      'speak-line': {
        suggested_key: { default: 'Alt+Shift+S', mac: 'Alt+Shift+S' },
        description: 'Read or stop the current line',
      },
    },
  },
});
