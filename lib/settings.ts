export type RailMode = 'line' | 'paragraph';
export type SpacingPreset = 'original' | 'open' | 'wide';

export interface SiteSettings {
  enabled: boolean;
  dim: number;
  mode: RailMode;
  spacing: SpacingPreset;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  enabled: false,
  dim: 0.68,
  mode: 'line',
  spacing: 'original',
};

export const SETTINGS_KEY = 'readingRailSites';

export function normalizeSettings(value: unknown): SiteSettings {
  const input = typeof value === 'object' && value !== null ? value as Partial<SiteSettings> : {};
  return {
    enabled: typeof input.enabled === 'boolean' ? input.enabled : DEFAULT_SETTINGS.enabled,
    dim: typeof input.dim === 'number' && Number.isFinite(input.dim)
      ? Math.min(0.88, Math.max(0.25, input.dim))
      : DEFAULT_SETTINGS.dim,
    mode: input.mode === 'paragraph' ? 'paragraph' : 'line',
    spacing: input.spacing === 'open' || input.spacing === 'wide' ? input.spacing : 'original',
  };
}

export function settingsForHost(store: unknown, host: string): SiteSettings {
  if (typeof store !== 'object' || store === null) return { ...DEFAULT_SETTINGS };
  return normalizeSettings((store as Record<string, unknown>)[host]);
}

export function updateHostSettings(
  store: unknown,
  host: string,
  patch: Partial<SiteSettings>,
): Record<string, SiteSettings> {
  const all = typeof store === 'object' && store !== null ? { ...store as Record<string, SiteSettings> } : {};
  all[host] = normalizeSettings({ ...settingsForHost(all, host), ...patch });
  return all;
}

export const SPACING_VALUES: Record<SpacingPreset, { lineHeight: string; letterSpacing: string; label: string }> = {
  original: { lineHeight: 'normal', letterSpacing: 'normal', label: 'Page original' },
  open: { lineHeight: '1.5', letterSpacing: '0.04em', label: 'Open spacing' },
  wide: { lineHeight: '1.7', letterSpacing: '0.12em', label: 'Wide spacing' },
};
