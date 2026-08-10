'use client';

import { useEffect, useMemo, useState } from 'react';
import { geoGraticule10, geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import countries from 'world-atlas/countries-110m.json';
import { Legend } from '@/components/Legend';
import { RouteLayer } from '@/components/RouteLayer';
import { TerritoryLayer } from '@/components/TerritoryLayer';
import { WarCloudLayer } from '@/components/WarCloudLayer';
import type { Polity, TerritorySnapshot, WarEvent } from '@/lib/types';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 520;
const scaleSize = { S: 11, A: 9, B: 7.5, C: 6, D: 5 };
const typeColor: Record<WarEvent['type'], string> = { unification: '#fbbf24', rebellion: '#fb7185', 'civil-war': '#ef4444', border: '#38bdf8', campaign: '#fb923c' };
const worldTopology = countries as unknown as { objects: { countries: unknown } };
const countryCollection = feature(worldTopology as never, worldTopology.objects.countries as never) as unknown as { features: Array<{ id?: string | number; geometry: unknown }> };
const mainlandFeature = countryCollection.features.find((country) => String(country.id) === '156');
const taiwanFeature = countryCollection.features.find((country) => String(country.id) === '158');
const chinaFeatures = [mainlandFeature, taiwanFeature].filter(Boolean) as Array<{ id?: string | number; geometry: unknown }>;
const chinaCollection = { type: 'FeatureCollection', features: chinaFeatures };
const projection = geoMercator();
if (chinaFeatures.length) projection.fitExtent([[52, 38], [748, 482]], chinaCollection as never);
else projection.center([104.5, 35.7]).scale(600).translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
const path = geoPath(projection);
const graticulePath = path(geoGraticule10());
const mainlandPath = mainlandFeature ? path(mainlandFeature as never) : '';
const taiwanPath = taiwanFeature ? path(taiwanFeature as never) : '';
const yangtzePath = path({ type: 'LineString', coordinates: [[91, 31.2], [96, 30.7], [101, 29.5], [106, 29.5], [110, 30.4], [114, 30.6], [118, 31.2], [121.5, 31.3]] } as never);
const yellowRiverPath = path({ type: 'LineString', coordinates: [[96, 35.2], [101, 36.1], [104, 37.8], [108, 37.5], [111, 35.1], [114, 35.6], [118.3, 37.1]] } as never);
const taiwanLabelPoint = projection([121, 23.7]);

function layoutEventNodes(wars: WarEvent[]) {
  const nodes = wars.flatMap((war) => war.locations.map((location) => {
    const point = projection([location.longitude, location.latitude]);
    return point ? { war, location, x: point[0], y: point[1] } : null;
  })).filter(Boolean) as Array<{ war: WarEvent; location: WarEvent['locations'][number]; x: number; y: number }>;
  const groups = new Map<string, typeof nodes>();
  for (const node of nodes) {
    const key = `${Math.round(node.x / 14)}-${Math.round(node.y / 14)}`;
    const group = groups.get(key) ?? [];
    group.push(node);
    groups.set(key, group);
  }
  return Array.from(groups.values()).flatMap((group) => group.map((node, index) => {
    if (group.length === 1) return node;
    const angle = (Math.PI * 2 * index) / group.length - Math.PI / 2;
    const distance = Math.min(20, 8 + group.length * 1.9);
    return { ...node, x: node.x + Math.cos(angle) * distance, y: node.y + Math.sin(angle) * distance };
  }));
}

export type MapLayers = { territories: boolean; clouds: boolean; nodes: boolean; routes: boolean };

type HistoricalMapProps = {
  wars: WarEvent[];
  territories: TerritorySnapshot[];
  polities: Polity[];
  selectedWar?: WarEvent;
  hoveredWar?: WarEvent;
  onSelect: (war: WarEvent) => void;
  onHover: (war?: WarEvent) => void;
  layers: MapLayers;
  animations: boolean;
  onLayers: (layers: MapLayers) => void;
  onAnimations: (enabled: boolean) => void;
};

export function HistoricalMap({ wars, territories, polities, selectedWar, hoveredWar, onSelect, onHover, layers, animations, onLayers, onAnimations }: HistoricalMapProps) {
  const [zoom, setZoom] = useState(1);
  const [legendOpen, setLegendOpen] = useState(false);
  const eventNodes = useMemo(() => layoutEventNodes(wars), [wars]);
  const nodeDensityClass = wars.length <= 5 ? 'map-nodes-sparse' : 'map-nodes-dense';
  const mapTransform = `translate(${MAP_WIDTH / 2} ${MAP_HEIGHT / 2}) scale(${zoom}) translate(${-MAP_WIDTH / 2} ${-MAP_HEIGHT / 2})`;
  const activeWar = hoveredWar ?? selectedWar;
  const activePolityIds = useMemo(() => Array.from(new Set(activeWar?.participants.map((participant) => participant.polityId).filter(Boolean) as string[] ?? [])), [activeWar]);
  const toggleLayer = (layer: keyof MapLayers) => onLayers({ ...layers, [layer]: !layers[layer] });

  useEffect(() => {
    if (!legendOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setLegendOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [legendOpen]);

  return <section className="map-frame relative aspect-[20/13] overflow-hidden" aria-label="中国历史战争地图" onClick={() => setLegendOpen(false)}>
    <div className="map-paper-texture" />
    <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="img" aria-label={`当前显示 ${wars.length} 个历史事件`}>
      <defs>
        <filter id="mapGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="landShadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#000" floodOpacity=".55" /></filter>
        <radialGradient id="landTint" cx="44%" cy="34%" r="76%"><stop stopColor="#75634a" /><stop offset=".55" stopColor="#504331" /><stop offset="1" stopColor="#30291f" /></radialGradient>
        <linearGradient id="coastHighlight" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f5d58b" stopOpacity=".78" /><stop offset="1" stopColor="#9b7740" stopOpacity=".45" /></linearGradient>
        <marker id="routeArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#fde68a" /></marker>
      </defs>
      {graticulePath && <path d={graticulePath} className="map-graticule" />}
      <g transform={mapTransform} className="map-zoom-layer">
        <g filter="url(#landShadow)">{mainlandPath && <path d={mainlandPath} className="map-land-real" />}{taiwanPath && <path d={taiwanPath} className="map-land-real map-land-taiwan" />}</g>
        {mainlandPath && <path d={mainlandPath} className="map-coast-highlight" />}{taiwanPath && <path d={taiwanPath} className="map-coast-highlight" />}
        {layers.territories && <TerritoryLayer territories={territories} polities={polities} projection={projection} activePolityIds={activePolityIds} animated={animations} />}
        {yangtzePath && <path d={yangtzePath} className="map-river" filter="url(#mapGlow)" />}{yellowRiverPath && <path d={yellowRiverPath} className="map-river map-river-subtle" />}
        {taiwanLabelPoint && <text x={taiwanLabelPoint[0] + 12} y={taiwanLabelPoint[1] + 2} className="map-region-label">台湾省</text>}
        {layers.clouds && <WarCloudLayer wars={wars} projection={projection} animated={animations} activeWarId={activeWar?.id} />}
        {layers.routes && <RouteLayer war={selectedWar} projection={projection} animated={animations} />}
        {layers.nodes && <g className={nodeDensityClass}>{eventNodes.map(({ war, location, x, y }) => {
          const selected = war.id === selectedWar?.id;
          const active = war.id === activeWar?.id;
          const muted = Boolean(activeWar && !active);
          const radius = scaleSize[war.scale];
          return <g key={`${war.id}-${location.id}`} className={`event-node event-node-${war.type} ${selected ? 'event-node-selected' : ''} ${active ? 'event-node-active' : ''} ${muted ? 'event-node-muted' : ''}`} role="button" tabIndex={0} aria-label={`查看${war.name}详情`} onMouseEnter={() => onHover(war)} onMouseLeave={() => onHover(undefined)} onFocus={() => onHover(war)} onBlur={() => onHover(undefined)} onClick={(event) => { event.stopPropagation(); onSelect(war); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(war); } }}>
            <circle cx={x} cy={y} r={radius + 10} fill={typeColor[war.type]} className="event-node-aura" />
            <circle cx={x} cy={y} r={radius + 4} fill="none" stroke={typeColor[war.type]} className="event-node-ring" />
            <circle cx={x} cy={y} r={radius} fill={typeColor[war.type]} className="event-node-core" />
            <text x={x} y={y + radius + 18} textAnchor="middle" className="event-node-label">{war.name}</text>
          </g>;
        })}</g>}
      </g>
    </svg>
    <div className="map-toolbar" aria-label="地图显示控制" onClick={(event) => event.stopPropagation()}><div className="toolbar-group"><button className={layers.territories ? 'toolbar-active' : ''} aria-pressed={layers.territories} onClick={() => toggleLayer('territories')}>势力</button><button className={layers.clouds ? 'toolbar-active' : ''} aria-pressed={layers.clouds} onClick={() => toggleLayer('clouds')}>热区</button><button className={layers.nodes ? 'toolbar-active' : ''} aria-pressed={layers.nodes} onClick={() => toggleLayer('nodes')}>事件</button><button className={layers.routes ? 'toolbar-active' : ''} aria-pressed={layers.routes} onClick={() => toggleLayer('routes')}>路线</button></div><button className={!animations ? 'toolbar-active' : ''} onClick={() => onAnimations(!animations)}>{animations ? '关闭动效' : '开启动效'}</button></div>
    <div className="zoom-toolbar" aria-label="地图缩放" onClick={(event) => event.stopPropagation()}><button onClick={() => setZoom((value) => Math.min(1.65, value + .15))} aria-label="放大地图">＋</button><button onClick={() => setZoom((value) => Math.max(.85, value - .15))} aria-label="缩小地图">－</button><button onClick={() => setZoom(1)} aria-label="重置地图缩放">复位</button></div>
    <div className="map-note"><p className="eyebrow">地理底图</p><p>现代地理轮廓用于辅助定位，台湾省已纳入统一地图层；历史政权边界不以此底图代替。</p></div>
    <button type="button" className="legend-toggle" aria-expanded={legendOpen} aria-controls="map-legend" onClick={(event) => { event.stopPropagation(); setLegendOpen((value) => !value); }}>图例</button>
    <Legend open={legendOpen} territories={territories} polities={polities} onClose={() => setLegendOpen(false)} />
    <div className="map-credit">Natural Earth · 1:110m</div>
  </section>;
}
