import type { Confidence, Era, HistoricalPlace, Polity, ResearchRegion, ScenarioData, WarEvent, WarType } from './types';

export type ExplorerFilters = {
  query: string;
  eraIds: string[];
  polityIds: string[];
  regionIds: string[];
  types: WarType[];
  confidences: Confidence[];
};

export type ExplorerResult = {
  kind: 'event' | 'place';
  id: string;
  name: string;
  detail: string;
  scenarioId: string;
  confidence: Confidence;
  matches: string[];
};

export const emptyExplorerFilters = (): ExplorerFilters => ({ query: '', eraIds: [], polityIds: [], regionIds: [], types: [], confidences: [] });

const filterKeys = {
  query: 'q',
  eraIds: 'era',
  polityIds: 'polity',
  regionIds: 'region',
  types: 'type',
  confidences: 'confidence',
} as const;

function includesQuery(query: string, ...values: Array<string | undefined>) {
  const normalized = query.trim().toLocaleLowerCase();
  return !normalized || values.some((value) => value?.toLocaleLowerCase().includes(normalized));
}

function overlaps(era: Era, event: { startYear: number; endYear: number }) {
  return era.startYear <= event.endYear && era.endYear >= event.startYear;
}

function hasAny(selected: string[], candidates: Array<string | undefined>) {
  return !selected.length || candidates.some((candidate) => candidate !== undefined && selected.includes(candidate));
}

function formatYearRange(startYear: number, endYear: number) {
  const year = (value: number) => value < 0 ? `前${Math.abs(value)}年` : `${value}年`;
  return startYear === endYear ? year(startYear) : `${year(startYear)}—${year(endYear)}`;
}

export function sanitizeExplorerFilters(filters: ExplorerFilters, data: ScenarioData): ExplorerFilters {
  const ids = <T extends { id: string }>(values: string[], records: T[]) => values.filter((value, index) => records.some((record) => record.id === value) && values.indexOf(value) === index);
  const eventTypes: WarType[] = ['unification', 'rebellion', 'civil-war', 'border', 'campaign'];
  const confidences: Confidence[] = ['high', 'medium', 'low'];
  return {
    query: filters.query.trim().slice(0, 120),
    eraIds: ids(filters.eraIds, data.eras),
    polityIds: ids(filters.polityIds, data.polities),
    regionIds: ids(filters.regionIds, data.regions),
    types: filters.types.filter((value, index) => eventTypes.includes(value) && filters.types.indexOf(value) === index),
    confidences: filters.confidences.filter((value, index) => confidences.includes(value) && filters.confidences.indexOf(value) === index),
  };
}

export function explorerFiltersFromUrl(parameters: URLSearchParams, data: ScenarioData): ExplorerFilters {
  const list = (key: string) => (parameters.get(key) ?? '').split(',').map((value) => value.trim()).filter(Boolean);
  return sanitizeExplorerFilters({
    query: parameters.get(filterKeys.query) ?? '',
    eraIds: list(filterKeys.eraIds),
    polityIds: list(filterKeys.polityIds),
    regionIds: list(filterKeys.regionIds),
    types: list(filterKeys.types) as WarType[],
    confidences: list(filterKeys.confidences) as Confidence[],
  }, data);
}

export function writeExplorerFiltersToUrl(parameters: URLSearchParams, filters: ExplorerFilters) {
  for (const [field, key] of Object.entries(filterKeys) as Array<[keyof typeof filterKeys, string]>) {
    const value = field === 'query' ? filters.query : filters[field].join(',');
    if (value) parameters.set(key, value); else parameters.delete(key);
  }
}

function matchingLabelsForWar(war: WarEvent, filters: ExplorerFilters, eras: Era[], polities: Polity[], regions: ResearchRegion[]) {
  const labels: string[] = [];
  if (filters.query) labels.push('关键词');
  if (filters.eraIds.length) labels.push(...eras.filter((era) => filters.eraIds.includes(era.id) && overlaps(era, war)).map((era) => era.name));
  if (filters.polityIds.length) labels.push(...polities.filter((polity) => filters.polityIds.includes(polity.id) && war.participants.some((participant) => participant.polityId === polity.id)).map((polity) => polity.shortName));
  if (filters.regionIds.length) labels.push(...regions.filter((region) => filters.regionIds.includes(region.id) && war.regionIds?.includes(region.id)).map((region) => region.name));
  if (filters.types.length) labels.push('事件类型');
  if (filters.confidences.length) labels.push('可信度');
  return labels;
}

function matchingLabelsForPlace(place: HistoricalPlace, filters: ExplorerFilters, eras: Era[], regions: ResearchRegion[]) {
  const labels: string[] = [];
  if (filters.query) labels.push('关键词');
  if (filters.eraIds.length) labels.push(...eras.filter((era) => filters.eraIds.includes(era.id) && overlaps(era, place)).map((era) => era.name));
  if (filters.regionIds.length) labels.push(...regions.filter((region) => filters.regionIds.includes(region.id) && place.regionIds?.includes(region.id)).map((region) => region.name));
  if (filters.confidences.length) labels.push('可信度');
  return labels;
}

export function exploreScenario(data: ScenarioData, rawFilters: ExplorerFilters): ExplorerResult[] {
  const filters = sanitizeExplorerFilters(rawFilters, data);
  const warResults = data.wars
    .filter((war) => includesQuery(filters.query, war.name, war.summary, war.background, ...war.tags, ...war.locations.flatMap((location) => [location.name, location.modernName, location.note]), ...war.sources.flatMap((source) => [source.title, source.note, source.citation, source.claim])))
    .filter((war) => hasAny(filters.eraIds, data.eras.filter((era) => overlaps(era, war)).map((era) => era.id)))
    .filter((war) => hasAny(filters.polityIds, war.participants.map((participant) => participant.polityId)))
    .filter((war) => hasAny(filters.regionIds, war.regionIds ?? []))
    .filter((war) => hasAny(filters.types, [war.type]))
    .filter((war) => hasAny(filters.confidences, [war.confidence]))
    .sort((left, right) => left.startYear - right.startYear || left.name.localeCompare(right.name, 'zh-Hans-CN'))
    .map((war) => ({ kind: 'event' as const, id: war.id, name: war.name, detail: `${formatYearRange(war.startYear, war.endYear)} · ${war.locations[0]?.name ?? '地点待考'}`, scenarioId: war.scenarioId, confidence: war.confidence, matches: matchingLabelsForWar(war, filters, data.eras, data.polities, data.regions) }));
  const placeResults = data.places
    .filter((place) => includesQuery(filters.query, place.name, place.modernName, place.note, ...place.sources.flatMap((source) => [source.title, source.note, source.citation, source.claim])))
    .filter((place) => hasAny(filters.eraIds, data.eras.filter((era) => overlaps(era, place)).map((era) => era.id)))
    .filter((place) => !filters.polityIds.length)
    .filter((place) => hasAny(filters.regionIds, place.regionIds ?? []))
    .filter((place) => !filters.types.length)
    .filter((place) => hasAny(filters.confidences, [place.confidence]))
    .sort((left, right) => right.priority - left.priority || left.name.localeCompare(right.name, 'zh-Hans-CN'))
    .map((place) => ({ kind: 'place' as const, id: place.id, name: place.name, detail: `${place.modernName} · ${formatYearRange(place.startYear, place.endYear)}`, scenarioId: place.scenarioId, confidence: place.confidence, matches: matchingLabelsForPlace(place, filters, data.eras, data.regions) }));
  // Preserve both research object classes in a bounded result set instead of
  // allowing a dense event query to hide all auditable reference places.
  return [...warResults.slice(0, 15), ...placeResults.slice(0, 15)];
}

/** Legacy search adapter retained for existing integrations. */
export function searchExplorer(query: string, wars: WarEvent[], places: HistoricalPlace[]) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return [];
  return [
    ...wars.filter((war) => includesQuery(normalized, war.name, war.summary, ...war.tags)).slice(0, 5).map((war) => ({ kind: 'event' as const, id: war.id, name: war.name, detail: `${formatYearRange(war.startYear, war.endYear)} · ${war.locations[0]?.name ?? '地点待考'}` })),
    ...places.filter((place) => includesQuery(normalized, place.name, place.modernName)).slice(0, 5).map((place) => ({ kind: 'place' as const, id: place.id, name: place.name, detail: place.modernName })),
  ];
}
