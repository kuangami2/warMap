export type WarType = 'unification' | 'rebellion' | 'civil-war' | 'border' | 'campaign';
export type Scale = 'S' | 'A' | 'B' | 'C' | 'D';
export type Confidence = 'high' | 'medium' | 'low';

export type Location = {
  id: string;
  name: string;
  modernName?: string;
  latitude: number;
  longitude: number;
  role: 'capital' | 'battlefield' | 'siege' | 'origin' | 'destination' | 'region';
};

export type Participant = { id: string; name: string; side?: string; polityId?: string };
export type Source = { title: string; note?: string };
export type Estimate = { display: string; note?: string };
export type RoutePoint = { name: string; latitude: number; longitude: number };
export type RouteSegment = { actorId: string; description: string; points: RoutePoint[] };

export type WarEvent = {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  type: WarType;
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
};

export type Era = { id: string; name: string; startYear: number; endYear: number; description: string };

export type Polity = {
  id: string;
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
  polityId: string;
  startYear: number;
  endYear: number;
  geometry: GeoPolygon | GeoMultiPolygon;
  labelPosition?: [number, number];
  description: string;
  confidence: Confidence;
  sources: Source[];
};
