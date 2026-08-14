export type WarType = 'unification' | 'rebellion' | 'civil-war' | 'border' | 'campaign';
export type EventKind = 'war' | 'battle' | 'siege' | 'uprising' | 'political' | 'diplomatic' | 'campaign';
export type Scale = 'S' | 'A' | 'B' | 'C' | 'D';
export type Confidence = 'high' | 'medium' | 'low';
export type TerritoryControl = 'core' | 'influence' | 'contested' | 'activity';

export type Location = {
  id: string;
  name: string;
  modernName?: string;
  latitude: number;
  longitude: number;
  role: 'capital' | 'battlefield' | 'siege' | 'origin' | 'destination' | 'region';
  /** Historical-geography qualification for a reference point, never a boundary claim. */
  note?: string;
};

export type Participant = { id: string; name: string; side?: string; polityId?: string };
export type SourceKind = 'primary' | 'atlas' | 'modern-study';
export type Source = { id?: string; title: string; note?: string; kind?: SourceKind; citation?: string; claim?: string };
export type SourceCatalogEntry = Required<Pick<Source, 'id' | 'title' | 'kind'>> & Pick<Source, 'note' | 'citation' | 'claim'>;
export type Estimate = { display: string; note?: string };
export type RoutePoint = { name: string; latitude: number; longitude: number };
export type RouteSegment = { actorId: string; description: string; points: RoutePoint[] };

export type WarEvent = {
  id: string;
  scenarioId: string;
  name: string;
  startYear: number;
  endYear: number;
  type: WarType;
  kind: EventKind;
  parentEventId?: string;
  scale: Scale;
  confidence: Confidence;
  summary: string;
  background: string;
  result: string;
  impact: string;
  participants: Participant[];
  locations: Location[];
  troopEstimate?: Estimate;
  routes?: RouteSegment[];
  sources: Source[];
  tags: string[];
  regionIds?: string[];
  researchNote?: string;
  uncertaintyNote?: string;
};

export type Era = { id: string; scenarioId: string; name: string; startYear: number; endYear: number; description: string };

export type TimelineScenario = {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  description: string;
};

export type Polity = {
  id: string;
  scenarioId: string;
  name: string;
  shortName: string;
  color: string;
  labelColor: string;
  textColor: string;
};

export type GeoPolygon = { type: 'Polygon'; coordinates: number[][][] };
export type GeoMultiPolygon = { type: 'MultiPolygon'; coordinates: number[][][][] };

export type TerritorySnapshot = {
  id: string;
  scenarioId: string;
  polityId: string;
  startYear: number;
  endYear: number;
  geometry: GeoPolygon | GeoMultiPolygon;
  labelPosition?: [number, number];
  description: string;
  control: TerritoryControl;
  confidence: Confidence;
  sources: Source[];
};

export type HistoricalPlaceKind = 'capital' | 'commandery' | 'county' | 'pass' | 'city';

export type HistoricalPlace = {
  id: string;
  scenarioId: string;
  name: string;
  modernName: string;
  kind: HistoricalPlaceKind;
  longitude: number;
  latitude: number;
  startYear: number;
  endYear: number;
  minZoom: number;
  priority: number;
  confidence: Confidence;
  note: string;
  sources: Source[];
  regionIds?: string[];
};

export type ResearchRegion = { id: string; scenarioId: string; name: string; description: string };
export type CoverageWindow = { id: string; scenarioId: string; startYear: number; endYear: number; status: 'curated' | 'not-curated'; note: string };
export type ScenarioManifest = { id: string; contentVersion: string; editorialStatus: 'curated'; coverageNote: string };

/** Reserved for an explicitly licensed future package; no geometry ships in 2.x. */
export type AdministrativeGeographyDataset = {
  id: string;
  version: string;
  license: string;
  citation: string;
  periods: Array<{ id: string; startYear: number; endYear: number; level: 'commandery' | 'kingdom' | 'province' | 'county'; coverage: string }>;
  status: 'disabled-awaiting-license' | 'approved';
};

export type NarrativeMoment = {
  id: string;
  eventId: string;
  order: number;
  startYear: number;
  endYear: number;
  title: string;
  text: string;
  confidence: Confidence;
  sourceTitle: string;
  focus: { coordinate: [number, number]; scale: number };
  hasRoute: boolean;
};

export type ScenarioData = {
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
  sourceCatalog: SourceCatalogEntry[];
};
