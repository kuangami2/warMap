import { defaultScenarioId, loadScenarioPackage, resolveScenarioPackageId } from '@/data/scenario-registry';
import { scenarios } from '@/data/scenarios';

/**
 * The UI reads through this module so the static TypeScript source can later be
 * replaced by build-time JSON, SQLite, or a service without rewriting components.
 */
export { defaultScenarioId };

export function getScenario(id = defaultScenarioId) {
  const scenario = scenarios.find((item) => item.id === id);
  if (!scenario) throw new Error(`Unknown historical scenario: ${id}`);
  return scenario;
}

export function resolveScenarioId(id?: string) {
  return resolveScenarioPackageId(id);
}

export function getScenarioData(id = defaultScenarioId) {
  return loadScenarioPackage(id);
}
