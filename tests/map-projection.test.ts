import { describe, expect, it } from 'vitest';
import { historicalMapProjection } from '../components/HistoricalMap';

describe('historical map projection', () => {
  it('fits the historical theatre itself instead of the complementary whole world', () => {
    const southwest = historicalMapProjection([73, 18]);
    const northeast = historicalMapProjection([135, 54]);
    expect(southwest).not.toBeNull();
    expect(northeast).not.toBeNull();
    const width = Math.abs((northeast?.[0] ?? 0) - (southwest?.[0] ?? 0));
    const height = Math.abs((northeast?.[1] ?? 0) - (southwest?.[1] ?? 0));
    expect(width).toBeGreaterThan(500);
    expect(height).toBeGreaterThan(350);
  });
});
