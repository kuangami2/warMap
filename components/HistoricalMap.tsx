'use client';

import { useState } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import countries from 'world-atlas/countries-110m.json';
import { Legend } from '@/components/Legend';
import { RouteLayer } from '@/components/RouteLayer';
import { WarCloudLayer } from '@/components/WarCloudLayer';
import type { WarEvent } from '@/lib/types';

const MAP_WIDTH = 800;
const MAP_HEIGHT = 520;
const scaleSize = { S: 11, A: 9, B: 7.5, C: 6, D: 5 };
const typeColor: Record<WarEvent['type'], string> = { unification: '#fbbf24', rebellion: '#fb7185', 'civil-war': '#ef4444', border: '#38bdf8', campaign: '#fb923c' };
const worldTopology = countries as unknown as { objects: { countries: unknown } };
const countryCollection = feature(worldTopology as never, worldTopology.objects.countries as never) as unknown as { features: Array<{ id?: string | number; geometry: unknown }> };
const chinaFeature = countryCollection.features.find((country) => String(country.id) === '156');
const projection = geoMercator();
if (chinaFeature) projection.fitExtent([[55, 42], [745, 478]], chinaFeature as never);
else projection.center([104.5, 35.7]).scale(600).translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);
const path = geoPath(projection);
const chinaPath = chinaFeature ? path(chinaFeature as never) : '';
const yangtzePath = path({ type: 'LineString', coordinates: [[91, 31.2], [96, 30.7], [101, 29.5], [106, 29.5], [110, 30.4], [114, 30.6], [118, 31.2], [121.5, 31.3]] } as never);
const yellowRiverPath = path({ type: 'LineString', coordinates: [[96, 35.2], [101, 36.1], [104, 37.8], [108, 37.5], [111, 35.1], [114, 35.6], [118.3, 37.1]] } as never);

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
    const distance = Math.min(18, 7 + group.length * 1.8);
    return { ...node, x: node.x + Math.cos(angle) * distance, y: node.y + Math.sin(angle) * distance };
  }));
}

export type LayerMode = 'both' | 'cloud' | 'nodes';

export function HistoricalMap({ wars, selectedWar, onSelect, layerMode, animations, onLayerMode, onAnimations }: { wars: WarEvent[]; selectedWar?: WarEvent; onSelect: (war: WarEvent) => void; layerMode: LayerMode; animations: boolean; onLayerMode: (mode: LayerMode) => void; onAnimations: (enabled: boolean) => void }) {
  const [zoom, setZoom] = useState(1);
  const showClouds = layerMode === 'both' || layerMode === 'cloud';
  const showNodes = layerMode === 'both' || layerMode === 'nodes';
  const eventNodes = layoutEventNodes(wars);
  const nodeDensityClass = wars.length <= 5 ? 'map-nodes-sparse' : 'map-nodes-dense';
  const mapTransform = `translate(${MAP_WIDTH / 2} ${MAP_HEIGHT / 2}) scale(${zoom}) translate(${-MAP_WIDTH / 2} ${-MAP_HEIGHT / 2})`;
  return <section className="map-frame relative aspect-[20/13] overflow-hidden" aria-label="中国历史战争地图">
    <div className="map-grid" />
    <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 h-full w-full" role="img" aria-label={`当前显示 ${wars.length} 个历史事件`}>
      <defs><filter id="mapGlow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter><radialGradient id="landTint" cx="45%" cy="35%" r="72%"><stop stopColor="#746044" /><stop offset="1" stopColor="#322a20" /></radialGradient><marker id="routeArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#fde68a" /></marker></defs>
      <g transform={mapTransform} className="map-zoom-layer">
        {chinaPath && <path d={chinaPath} className="map-land-real" />}
        {yangtzePath && <path d={yangtzePath} className="map-river" filter="url(#mapGlow)" />}{yellowRiverPath && <path d={yellowRiverPath} className="map-river map-river-subtle" />}
        {showClouds && <WarCloudLayer wars={wars} projection={projection} animated={animations} />}
        <RouteLayer war={selectedWar} projection={projection} animated={animations} />
        {showNodes && <g className={nodeDensityClass}>{eventNodes.map(({ war, location, x, y }) => { const selected = war.id === selectedWar?.id; const radius = scaleSize[war.scale]; return <g key={`${war.id}-${location.id}`} className={`event-node ${selected ? 'event-node-selected' : ''}`} role="button" tabIndex={0} aria-label={`查看${war.name}详情`} onClick={() => onSelect(war)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(war); } }}><title>{war.name}：{war.summary}</title><circle cx={x} cy={y} r={radius + 7} fill={typeColor[war.type]} opacity=".12" /><circle cx={x} cy={y} r={radius} fill={typeColor[war.type]} className="event-node-core" /><text x={x} y={y + radius + 17} textAnchor="middle" className="event-node-label">{war.name}</text></g>; })}</g>}
      </g>
    </svg>
    <div className="map-toolbar" aria-label="地图显示控制"><div className="toolbar-group"><button className={layerMode === 'both' ? 'toolbar-active' : ''} onClick={() => onLayerMode('both')}>综合</button><button className={layerMode === 'cloud' ? 'toolbar-active' : ''} onClick={() => onLayerMode('cloud')}>云团</button><button className={layerMode === 'nodes' ? 'toolbar-active' : ''} onClick={() => onLayerMode('nodes')}>节点</button></div><button className={!animations ? 'toolbar-active' : ''} onClick={() => onAnimations(!animations)}>{animations ? '关闭动效' : '开启动效'}</button></div>
    <div className="zoom-toolbar" aria-label="地图缩放"><button onClick={() => setZoom((value) => Math.min(1.65, value + .15))} aria-label="放大地图">＋</button><button onClick={() => setZoom((value) => Math.max(.85, value - .15))} aria-label="缩小地图">－</button><button onClick={() => setZoom(1)} aria-label="重置地图缩放">复位</button></div>
    <div className="map-note"><p className="eyebrow">地理底图</p><p>Natural Earth 现代地理轮廓仅作定位参考，不表示秦汉行政边界。</p></div>
    <Legend />
    <div className="map-credit">Natural Earth · 1:110m</div>
  </section>;
}
