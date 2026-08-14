import type { TerritoryControl } from './types';

export type TerritoryLabelCandidate = {
  id: string;
  polityId: string;
  shortName: string;
  x: number;
  y: number;
  control: TerritoryControl;
  active: boolean;
};

export type TerritoryLabelLayout = TerritoryLabelCandidate & {
  x: number;
  y: number;
  width: number;
  visible: boolean;
  mobileVisible: boolean;
};

const controlPriority: Record<TerritoryControl, number> = {
  core: 3,
  influence: 2,
  contested: 1,
  activity: 0,
};

const offsets: Array<[number, number]> = [
  [0, 0],
  [0, -28],
  [0, 28],
  [-42, 0],
  [42, 0],
  [-34, -25],
  [34, -25],
  [-34, 25],
  [34, 25],
];

function labelWidth(shortName: string): number {
  return Math.max(34, shortName.length * 11 + 14);
}

function overlaps(a: TerritoryLabelLayout, b: TerritoryLabelLayout): boolean {
  const horizontalGap = (a.width + b.width) / 2 + 7;
  return Math.abs(a.x - b.x) < horizontalGap && Math.abs(a.y - b.y) < 23;
}

function sortCandidates(a: TerritoryLabelCandidate, b: TerritoryLabelCandidate): number {
  const priorityA = (a.active ? 100 : 0) + controlPriority[a.control];
  const priorityB = (b.active ? 100 : 0) + controlPriority[b.control];
  return priorityB - priorityA || a.y - b.y || a.x - b.x || a.id.localeCompare(b.id);
}

export function layoutTerritoryLabels(candidates: TerritoryLabelCandidate[], mobile: boolean): TerritoryLabelLayout[] {
  const layouts: TerritoryLabelLayout[] = [];
  const accepted: TerritoryLabelLayout[] = [];

  for (const candidate of [...candidates].sort(sortCandidates)) {
    const mobileVisible = candidate.active || candidate.control === 'core';
    const eligible = mobile ? mobileVisible : true;
    const width = labelWidth(candidate.shortName);
    const placement = offsets
      .map(([offsetX, offsetY]) => ({ x: candidate.x + offsetX, y: candidate.y + offsetY }))
      .find((point) => !accepted.some((item) => overlaps({ ...candidate, ...point, width, visible: true, mobileVisible }, item)));

    if (!eligible || !placement) {
      layouts.push({ ...candidate, x: candidate.x, y: candidate.y, width, visible: false, mobileVisible });
      continue;
    }

    const layout = { ...candidate, ...placement, width, visible: true, mobileVisible };
    accepted.push(layout);
    layouts.push(layout);
  }

  return layouts;
}
