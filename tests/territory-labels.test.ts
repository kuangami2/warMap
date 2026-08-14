import { describe, expect, it } from 'vitest';
import { layoutTerritoryLabels } from '../lib/territoryLabels';

describe('territory label layout', () => {
  it('prioritizes active and core labels when anchors overlap', () => {
    const labels = layoutTerritoryLabels([
      { id: 'activity', polityId: 'xiongnu', shortName: '匈奴', x: 100, y: 100, control: 'activity', active: false },
      { id: 'core', polityId: 'qin', shortName: '秦', x: 100, y: 100, control: 'core', active: false },
      { id: 'active', polityId: 'han', shortName: '汉', x: 100, y: 100, control: 'contested', active: true },
    ], false);

    expect(labels.find((label) => label.id === 'active')?.visible).toBe(true);
    expect(labels.find((label) => label.id === 'core')?.visible).toBe(true);
    expect(labels.find((label) => label.id === 'activity')?.visible).toBe(true);
    expect(new Set(labels.filter((label) => label.visible).map((label) => `${label.x}:${label.y}`)).size).toBe(3);
  });

  it('keeps only core and active labels on mobile', () => {
    const labels = layoutTerritoryLabels([
      { id: 'core', polityId: 'qin', shortName: '秦', x: 100, y: 100, control: 'core', active: false },
      { id: 'influence', polityId: 'han', shortName: '汉', x: 160, y: 100, control: 'influence', active: false },
      { id: 'active', polityId: 'xiongnu', shortName: '匈奴', x: 220, y: 100, control: 'activity', active: true },
    ], true);

    expect(labels.find((label) => label.id === 'core')?.visible).toBe(true);
    expect(labels.find((label) => label.id === 'active')?.visible).toBe(true);
    expect(labels.find((label) => label.id === 'influence')?.visible).toBe(false);
  });
});
