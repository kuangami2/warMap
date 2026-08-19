import type { CoverageWindow, Era, HistoricalPlace, LandmarkImage, Polity, ResearchRegion, ScenarioData, ScenarioManifest, Source, SourceCatalogEntry, TerritorySnapshot, TimelineScenario, WarEvent } from './types';

function hash(value: string) {
  let result = 2166136261;
  for (const character of value) {
    result ^= character.codePointAt(0) ?? 0;
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

/** Stable across builds while keeping legacy source literals concise. */
export function sourceId(source: Pick<Source, 'title' | 'kind'>) {
  return `source-${hash(`${source.kind ?? 'primary'}:${source.title}`)}`;
}

function normalizeSources(sources: Source[]): Source[] {
  return sources.map((source) => ({ ...source, id: source.id ?? sourceId(source), kind: source.kind ?? 'primary' }));
}

function normalizeCatalog(records: Source[]): SourceCatalogEntry[] {
  const catalog = new Map<string, SourceCatalogEntry>();
  for (const source of records) {
    const id = source.id ?? sourceId(source);
    const next: SourceCatalogEntry = { id, title: source.title, kind: source.kind ?? 'primary', note: source.note, citation: source.citation, claim: source.claim };
    const previous = catalog.get(id);
    if (previous && (previous.title !== next.title || previous.kind !== next.kind)) throw new Error(`Source id collision: ${id}`);
    catalog.set(id, next);
  }
  return [...catalog.values()].sort((left, right) => left.id.localeCompare(right.id));
}

export type ScenarioPackageParts = {
  manifest: ScenarioManifest;
  scenario: TimelineScenario;
  eras: Era[];
  polities: Polity[];
  wars: WarEvent[];
  territories: TerritorySnapshot[];
  places: HistoricalPlace[];
  narrativeEventIds: readonly string[];
  regions: ResearchRegion[];
  coverage: CoverageWindow[];
  landmarkImages?: LandmarkImage[];
};

export function assembleScenarioPackage(parts: ScenarioPackageParts): ScenarioData {
  const wars = parts.wars.map((war) => ({ ...war, sources: normalizeSources(war.sources), locations: war.locations.map((location) => ({ ...location, note: location.note ?? location.modernName })) }));
  const territories = parts.territories.map((territory) => ({ ...territory, sources: normalizeSources(territory.sources) }));
  const places = parts.places.map((place) => ({ ...place, sources: normalizeSources(place.sources) }));
  return {
    ...parts,
    wars,
    territories,
    places,
    sourceCatalog: normalizeCatalog([...wars.flatMap((war) => war.sources), ...territories.flatMap((territory) => territory.sources), ...places.flatMap((place) => place.sources)]),
    landmarkImages: parts.landmarkImages ?? [],
  };
}
