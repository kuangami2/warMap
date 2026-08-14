import { describe, expect, it } from 'vitest';
import { INITIAL_MAP_VIEWPORT, MAP_CENTER, MAX_MAP_SCALE, MIN_MAP_SCALE, constrainMapViewport, panMapViewport, zoomMapViewport } from '../lib/mapViewport';

describe('map viewport', () => {
  it('clamps zoom to the supported range', () => {
    expect(MAX_MAP_SCALE).toBeGreaterThanOrEqual(6);
    expect(constrainMapViewport({ scale: 20, x: 0, y: 0 }).scale).toBe(MAX_MAP_SCALE);
    expect(constrainMapViewport({ scale: .1, x: 0, y: 0 }).scale).toBe(MIN_MAP_SCALE);
  });

  it('does not pan the whole-map view into empty space', () => {
    expect(panMapViewport(INITIAL_MAP_VIEWPORT, { x: 200, y: -200 })).toEqual(INITIAL_MAP_VIEWPORT);
  });

  it('allows bounded panning only after zooming in', () => {
    const enlarged = zoomMapViewport(INITIAL_MAP_VIEWPORT, 2, MAP_CENTER);
    const moved = panMapViewport(enlarged, { x: 900, y: -900 });
    expect(moved.x).toBeGreaterThan(0);
    expect(moved.x).toBeLessThan(400);
    expect(moved.y).toBeLessThan(0);
    expect(moved.y).toBeGreaterThan(-300);
  });

  it('keeps the wheel focus point fixed when the target scale permits it', () => {
    const focus = { x: 300, y: 260 };
    const viewport = zoomMapViewport(INITIAL_MAP_VIEWPORT, 2, focus);
    const transformedPoint = {
      x: MAP_CENTER.x + viewport.scale * (focus.x - MAP_CENTER.x) + viewport.x,
      y: MAP_CENTER.y + viewport.scale * (focus.y - MAP_CENTER.y) + viewport.y,
    };
    expect(transformedPoint).toEqual(focus);
  });
});
