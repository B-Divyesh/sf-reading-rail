import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, normalizeSettings, settingsForHost, updateHostSettings } from '../lib/settings';

describe('per-site settings', () => {
  it('returns private, inactive defaults for a new host', () => {
    expect(settingsForHost(undefined, 'example.com')).toEqual(DEFAULT_SETTINGS);
  });

  it('clamps unsafe dim values and accepts supported presets', () => {
    expect(normalizeSettings({ dim: 4, mode: 'paragraph', spacing: 'wide', enabled: true })).toEqual({
      dim: 0.88, mode: 'paragraph', spacing: 'wide', enabled: true,
    });
  });

  it('updates one host without changing another', () => {
    const first = updateHostSettings({}, 'news.example', { spacing: 'open' });
    const second = updateHostSettings(first, 'docs.example', { mode: 'paragraph' });
    expect(second['news.example'].spacing).toBe('open');
    expect(second['docs.example'].mode).toBe('paragraph');
  });
});
