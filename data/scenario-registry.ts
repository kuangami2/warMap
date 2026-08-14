import { createHanThreeKingdomsPackage } from './han-three-kingdoms-package';
import { createQinHanPackage } from './qin-han-package';
import { QIN_HAN_SCENARIO_ID } from './scenarios';
import type { ScenarioData, ScenarioManifest } from '@/lib/types';

export const defaultScenarioId = QIN_HAN_SCENARIO_ID;

export const scenarioManifests: ScenarioManifest[] = [
  createQinHanPackage().manifest,
  createHanThreeKingdomsPackage().manifest,
];

const loaders: Record<string, () => ScenarioData> = {
  'qin-han': createQinHanPackage,
  'han-three-kingdoms': createHanThreeKingdomsPackage,
};

export function resolveScenarioPackageId(id?: string) {
  return id && loaders[id] ? id : defaultScenarioId;
}

export function loadScenarioPackage(id?: string) {
  return loaders[resolveScenarioPackageId(id)]();
}
