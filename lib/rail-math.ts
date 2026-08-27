export interface RailRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function clampRail(rect: RailRect, viewportHeight: number, pad = 8): RailRect {
  const height = Math.max(22, Math.min(rect.bottom - rect.top, viewportHeight - pad * 2));
  const top = Math.min(viewportHeight - pad - height, Math.max(pad, rect.top));
  return { ...rect, top, bottom: top + height };
}

export function nearestRectIndex(rects: RailRect[], targetY: number): number {
  if (!rects.length) return -1;
  return rects.reduce((best, rect, index) => {
    const distance = Math.abs((rect.top + rect.bottom) / 2 - targetY);
    const bestRect = rects[best];
    const bestDistance = Math.abs((bestRect.top + bestRect.bottom) / 2 - targetY);
    return distance < bestDistance ? index : best;
  }, 0);
}

export function railOpacity(dim: number): string {
  return String(Math.min(0.88, Math.max(0.25, dim)));
}
