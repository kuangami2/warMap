import type { Confidence, HistoricalPlace, Polity, ScenarioData, Source, TerritorySnapshot, TimelineScenario, WarEvent } from './types';
import { END_YEAR, START_YEAR } from './timeline';

const confidenceLevels: Confidence[] = ['high', 'medium', 'low'];
const sourceKinds = ['primary', 'atlas', 'modern-study'];

function validateSources(sources: Source[], id: string, errors: string[]) {
  if (!sources.length) errors.push(`${id}: missing source`);
  for (const source of sources) {
    if (!source.title?.trim()) errors.push(`${id}: source missing title`);
    if (source.kind && !sourceKinds.includes(source.kind)) errors.push(`${id}: invalid source kind`);
  }
}

function validateRange(startYear: number, endYear: number, scenario: TimelineScenario | undefined, id: string, errors: string[]) {
  if (startYear > endYear) errors.push(`${id}: invalid year range`);
  const range = scenario ?? { startYear: START_YEAR, endYear: END_YEAR };
  if (startYear < range.startYear || endYear > range.endYear) errors.push(`${id}: invalid year range`);
}

export function validateWars(wars: WarEvent[], polities?: Polity[], scenario?: TimelineScenario): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const polityIds = polities ? new Set(polities.map((polity) => polity.id)) : undefined;
  for (const war of wars) {
    if (ids.has(war.id)) errors.push(`${war.id}: duplicated id`);
    ids.add(war.id);
    if (!war.scenarioId) errors.push(`${war.id}: missing scenario`);
    if (!war.kind) errors.push(`${war.id}: missing event kind`);
    validateRange(war.startYear, war.endYear, scenario, war.id, errors);
    validateSources(war.sources, war.id, errors);
    if (!war.locations.length) errors.push(`${war.id}: missing location`);
    if (!confidenceLevels.includes(war.confidence)) errors.push(`${war.id}: invalid confidence`);
    if (![war.summary, war.background, war.result, war.impact].every((field) => field.trim())) errors.push(`${war.id}: missing narrative field`);
    if (!war.tags.length) errors.push(`${war.id}: missing tag`);
    for (const participant of war.participants) {
      if (participant.polityId && polityIds && !polityIds.has(participant.polityId)) errors.push(`${war.id}: unknown participant polity`);
    }
    for (const location of war.locations) {
      if (!location.name.trim() || !location.modernName?.trim()) errors.push(`${war.id}: incomplete location name`);
      if (location.latitude < 15 || location.latitude > 55 || location.longitude < 70 || location.longitude > 140) errors.push(`${war.id}: location out of map bounds`);
    }
    for (const route of war.routes ?? []) {
      if (route.points.length < 2) errors.push(`${war.id}: route needs at least two points`);
    }
  }
  return errors;
}

export function validateTerritories(snapshots: TerritorySnapshot[], polities: Polity[], scenario?: TimelineScenario): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const polityIds = new Set(polities.map((polity) => polity.id));
  for (const snapshot of snapshots) {
    if (ids.has(snapshot.id)) errors.push(`${snapshot.id}: duplicated id`);
    ids.add(snapshot.id);
    if (!snapshot.scenarioId) errors.push(`${snapshot.id}: missing scenario`);
    if (!polityIds.has(snapshot.polityId)) errors.push(`${snapshot.id}: unknown polity`);
    validateRange(snapshot.startYear, snapshot.endYear, scenario, snapshot.id, errors);
    validateSources(snapshot.sources, snapshot.id, errors);
    if (!snapshot.description.trim()) errors.push(`${snapshot.id}: missing description`);
    if (!confidenceLevels.includes(snapshot.confidence)) errors.push(`${snapshot.id}: invalid confidence`);
    if (!['core', 'influence', 'contested', 'activity'].includes(snapshot.control)) errors.push(`${snapshot.id}: invalid control level`);
    if (snapshot.geometry.type !== 'Polygon' && snapshot.geometry.type !== 'MultiPolygon') errors.push(`${snapshot.id}: unsupported geometry`);
    const polygons = snapshot.geometry.type === 'Polygon' ? [snapshot.geometry.coordinates] : snapshot.geometry.coordinates;
    for (const polygon of polygons) {
      if (!polygon.length || polygon.some((ring) => ring.length < 4)) errors.push(`${snapshot.id}: polygon ring needs at least four points`);
      for (const ring of polygon) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first && last && (first[0] !== last[0] || first[1] !== last[1])) errors.push(`${snapshot.id}: polygon ring is not closed`);
        for (const point of ring) {
          if (point.length < 2 || point[1] < 15 || point[1] > 55 || point[0] < 70 || point[0] > 140) errors.push(`${snapshot.id}: geometry point out of map bounds`);
        }
      }
    }
  }
  return errors;
}

export function validateHistoricalPlaces(places: HistoricalPlace[], scenario?: TimelineScenario): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const place of places) {
    if (ids.has(place.id)) errors.push(`${place.id}: duplicated id`);
    ids.add(place.id);
    if (!place.scenarioId) errors.push(`${place.id}: missing scenario`);
    if (!place.name.trim() || !place.modernName.trim()) errors.push(`${place.id}: missing place name`);
    if (!['capital', 'commandery', 'county', 'pass', 'city'].includes(place.kind)) errors.push(`${place.id}: invalid place kind`);
    validateRange(place.startYear, place.endYear, scenario, place.id, errors);
    if (place.latitude < 15 || place.latitude > 55 || place.longitude < 70 || place.longitude > 140) errors.push(`${place.id}: location out of map bounds`);
    if (place.minZoom < .85 || place.minZoom > 3) errors.push(`${place.id}: invalid display zoom`);
    if (place.priority < 0) errors.push(`${place.id}: invalid priority`);
    if (!place.note.trim()) errors.push(`${place.id}: missing note`);
    if (!confidenceLevels.includes(place.confidence)) errors.push(`${place.id}: invalid confidence`);
    validateSources(place.sources, place.id, errors);
  }
  return errors;
}

/** Validates the packaged boundary used by the UI and release audit. */
export function validateScenarioPackage(data: ScenarioData): string[] {
  const errors = [
    ...validateWars(data.wars, data.polities, data.scenario),
    ...validateTerritories(data.territories, data.polities, data.scenario),
    ...validateHistoricalPlaces(data.places, data.scenario),
  ];
  if (data.manifest.id !== data.scenario.id) errors.push(`${data.scenario.id}: manifest id mismatch`);
  if (!data.manifest.contentVersion) errors.push(`${data.scenario.id}: missing content version`);
  if (!data.coverage.length) errors.push(`${data.scenario.id}: missing coverage declaration`);
  const regionIds = new Set(data.regions.map((region) => region.id));
  const sourceIds = new Set(data.sourceCatalog.map((source) => source.id));
  if (sourceIds.size !== data.sourceCatalog.length) errors.push(`${data.scenario.id}: duplicated source id`);
  for (const window of data.coverage) {
    if (window.scenarioId !== data.scenario.id) errors.push(`${window.id}: cross-scenario coverage`);
    validateRange(window.startYear, window.endYear, data.scenario, window.id, errors);
    if (!window.note.trim()) errors.push(`${window.id}: missing coverage note`);
  }
  const validateRecord = (record: { id: string; scenarioId: string; sources: Source[]; regionIds?: string[]; confidence: Confidence; note?: string; uncertaintyNote?: string }) => {
    if (record.scenarioId !== data.scenario.id) errors.push(`${record.id}: cross-scenario record`);
    for (const source of record.sources) {
      if (!source.id || !sourceIds.has(source.id)) errors.push(`${record.id}: unresolved source id`);
      if (!source.kind) errors.push(`${record.id}: source missing type`);
    }
    for (const regionId of record.regionIds ?? []) if (!regionIds.has(regionId)) errors.push(`${record.id}: unknown research region`);
    if (record.confidence !== 'high' && !record.uncertaintyNote && !record.note) errors.push(`${record.id}: low/medium confidence needs qualification`);
  };
  data.wars.forEach(validateRecord);
  data.places.forEach(validateRecord);
  for (const narrativeId of data.narrativeEventIds) if (!data.wars.some((war) => war.id === narrativeId)) errors.push(`${data.scenario.id}: narrative references unknown event ${narrativeId}`);
  return errors;
}
