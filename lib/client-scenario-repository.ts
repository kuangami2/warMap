import { createQinHanPackage } from '@/data/qin-han-package';
import { QIN_HAN_SCENARIO_ID, scenarios } from '@/data/scenarios';
import type { ScenarioData } from './types';

/**
 * Client-facing scenario loader.  The large Han–Three Kingdoms editorial
 * dataset stays out of the initial Qin map chunk and is fetched only when it
 * is needed (or warmed during browser idle time).  The synchronous repository
 * remains available to validation and build-time tests.
 */
export const initialScenarioId = QIN_HAN_SCENARIO_ID;

export function resolveClientScenarioId(id?: string) {
  return scenarios.some((scenario) => scenario.id === id) ? id! : initialScenarioId;
}

export function initialScenarioData(): ScenarioData {
  return createQinHanPackage();
}

let hanScenarioModule: Promise<typeof import('@/data/han-three-kingdoms-package')> | undefined;

function loadHanScenarioModule() {
  hanScenarioModule ??= import('@/data/han-three-kingdoms-package');
  return hanScenarioModule;
}

export function preloadClientScenario(id: string) {
  if (resolveClientScenarioId(id) === 'han-three-kingdoms') void loadHanScenarioModule();
}

export async function loadClientScenarioData(id?: string): Promise<ScenarioData> {
  const scenarioId = resolveClientScenarioId(id);
  if (scenarioId !== 'han-three-kingdoms') return initialScenarioData();
  const han = await loadHanScenarioModule();
  return han.createHanThreeKingdomsPackage();
}
