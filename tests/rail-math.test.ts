import { describe, expect, it } from 'vitest';
import { clampRail, nearestRectIndex, railOpacity } from '../lib/rail-math';

describe('rail geometry', () => {
  it('keeps a rail visible when the source line is offscreen', () => {
    expect(clampRail({ top: -20, bottom: -2, left: 0, right: 20 }, 600)).toMatchObject({ top: 8, bottom: 30 });
  });

  it('selects the line nearest the reading position', () => {
    expect(nearestRectIndex([
      { top: 0, bottom: 20, left: 0, right: 20 },
      { top: 100, bottom: 120, left: 0, right: 20 },
    ], 96)).toBe(1);
  });

  it('bounds opacity to readable limits', () => {
    expect(railOpacity(0)).toBe('0.25');
    expect(railOpacity(1)).toBe('0.88');
  });
});
