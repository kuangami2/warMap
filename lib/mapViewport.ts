export type MapPoint = { x: number; y: number };

export type MapViewport = MapPoint & { scale: number };
export type MapFocusTarget = { id: string; coordinate: [number, number]; scale: number };

export const MAP_WIDTH = 800;
export const MAP_HEIGHT = 520;
export const MAP_CENTER: MapPoint = { x: MAP_WIDTH / 2, y: MAP_HEIGHT / 2 };
export const MAP_CONTENT_BOUNDS = { left: 52, top: 38, right: 748, bottom: 482 };
export const MIN_MAP_SCALE = 0.85;
export const MAX_MAP_SCALE = 6;
export const INITIAL_MAP_VIEWPORT: MapViewport = { scale: 1, x: 0, y: 0 };

export function clampMapScale(scale: number) {
  return Math.min(MAX_MAP_SCALE, Math.max(MIN_MAP_SCALE, scale));
}

/**
 * Keeps the map within its visible land extent once it has been enlarged.
 * At the default scale the map intentionally retains the existing coastal margin.
 */
export function constrainMapViewport(viewport: MapViewport): MapViewport {
  const scale = clampMapScale(viewport.scale);
  const contentWidth = (MAP_CONTENT_BOUNDS.right - MAP_CONTENT_BOUNDS.left) * scale;
  const contentHeight = (MAP_CONTENT_BOUNDS.bottom - MAP_CONTENT_BOUNDS.top) * scale;
  const maxX = Math.max(0, (contentWidth - MAP_WIDTH) / 2);
  const maxY = Math.max(0, (contentHeight - MAP_HEIGHT) / 2);

  return {
    scale,
    x: maxX === 0 ? 0 : Math.min(maxX, Math.max(-maxX, viewport.x)),
    y: maxY === 0 ? 0 : Math.min(maxY, Math.max(-maxY, viewport.y)),
  };
}

export function panMapViewport(viewport: MapViewport, delta: MapPoint) {
  return constrainMapViewport({ ...viewport, x: viewport.x + delta.x, y: viewport.y + delta.y });
}

/**
 * Zooms around the geographic point that was under `fromPoint`, placing it at
 * `toPoint`. Passing the same point for both preserves wheel/double-click focus;
 * a changing point supports two-finger panning while pinching.
 */
export function zoomMapViewport(viewport: MapViewport, targetScale: number, fromPoint: MapPoint, toPoint = fromPoint) {
  const scale = clampMapScale(targetScale);
  const sourceX = MAP_CENTER.x + (fromPoint.x - MAP_CENTER.x - viewport.x) / viewport.scale;
  const sourceY = MAP_CENTER.y + (fromPoint.y - MAP_CENTER.y - viewport.y) / viewport.scale;
  return constrainMapViewport({
    scale,
    x: toPoint.x - MAP_CENTER.x - scale * (sourceX - MAP_CENTER.x),
    y: toPoint.y - MAP_CENTER.y - scale * (sourceY - MAP_CENTER.y),
  });
}

export function inverseMapScale(scale: number) {
  return 1 / scale;
}
