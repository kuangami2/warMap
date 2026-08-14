'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { geoGraticule10, geoMercator, geoPath } from 'd3-geo';
import { Legend } from '@/components/Legend';
import { HistoricalPlaceLayer } from '@/components/HistoricalPlaceLayer';
import { ModernPlaceLayer } from '@/components/ModernPlaceLayer';
import { RouteLayer } from '@/components/RouteLayer';
import { TerritoryLayer } from '@/components/TerritoryLayer';
import { WarCloudLayer } from '@/components/WarCloudLayer';
import { eventsForMapDetail, mapDetailForScale } from '@/lib/mapDetail';
import { INITIAL_MAP_VIEWPORT, MAP_CENTER, MAP_HEIGHT, MAP_WIDTH, panMapViewport, type MapFocusTarget, type MapPoint, type MapViewport, zoomMapViewport } from '@/lib/mapViewport';
import type { HistoricalPlace, Polity, TerritorySnapshot, WarEvent } from '@/lib/types';

const GeographyLayer = dynamic(() => import('@/components/GeographyLayer').then((module) => module.GeographyLayer), { ssr: false });

const scaleSize = { S: 11, A: 9, B: 7.5, C: 6, D: 5 };
const typeColor: Record<WarEvent['type'], string> = { unification: '#fbbf24', rebellion: '#fb7185', 'civil-war': '#ef4444', border: '#38bdf8', campaign: '#fb923c' };
const projection = geoMercator();
projection.fitExtent([[54, 38], [746, 482]], {
  type: 'Polygon',
  // d3-geo treats polygon winding as spherical area. Clockwise here means
  // "the historical theatre", rather than the complementary whole world.
  coordinates: [[[73, 18], [73, 54], [135, 54], [135, 18], [73, 18]]],
} as never);
export const historicalMapProjection = projection;
const path = geoPath(projection);
const graticulePath = path(geoGraticule10());
const taiwanLabelPoint = projection([121, 23.7]);

export function layoutEventNodes(wars: WarEvent[]) {
  const nodes = wars.flatMap((war) => war.locations.map((location) => {
    const point = projection([location.longitude, location.latitude]);
    return point ? { war, location, x: point[0], y: point[1] } : null;
  })).filter(Boolean) as Array<{ war: WarEvent; location: WarEvent['locations'][number]; x: number; y: number }>;
  nodes.sort((a, b) => a.war.id.localeCompare(b.war.id) || a.location.id.localeCompare(b.location.id));
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

export type MapLayers = { geography: boolean; places: boolean; modern: boolean; territories: boolean; clouds: boolean; nodes: boolean; routes: boolean };

type HistoricalMapProps = {
  wars: WarEvent[];
  places: HistoricalPlace[];
  currentYear: number;
  viewport: MapViewport;
  focusTarget?: MapFocusTarget;
  territories: TerritorySnapshot[];
  polities: Polity[];
  selectedWar?: WarEvent;
  hoveredWar?: WarEvent;
  onSelect: (war: WarEvent) => void;
  onHover: (war?: WarEvent) => void;
  layers: MapLayers;
  animations: boolean;
  narrativeMode?: boolean;
  onLayers: (layers: MapLayers) => void;
  onAnimations: (enabled: boolean) => void;
  onViewportChange: (viewport: MapViewport) => void;
};

type Gesture =
  | { kind: 'drag'; pointerId: number; point: MapPoint; viewport: MapViewport }
  | { kind: 'pinch'; pointerIds: [number, number]; midpoint: MapPoint; distance: number; viewport: MapViewport };

function midpoint(first: MapPoint, second: MapPoint): MapPoint {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function distance(first: MapPoint, second: MapPoint) {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function eventPoint(event: Pick<MouseEvent, 'clientX' | 'clientY'> & { currentTarget: SVGSVGElement }): MapPoint {
  const rect = event.currentTarget.getBoundingClientRect();
  const scale = Math.min(rect.width / MAP_WIDTH, rect.height / MAP_HEIGHT);
  const width = MAP_WIDTH * scale;
  const height = MAP_HEIGHT * scale;
  return { x: (event.clientX - rect.left - (rect.width - width) / 2) / scale, y: (event.clientY - rect.top - (rect.height - height) / 2) / scale };
}

function transformForViewport(viewport: MapViewport) {
  return `translate(${viewport.x} ${viewport.y}) translate(${MAP_CENTER.x} ${MAP_CENTER.y}) scale(${viewport.scale}) translate(${-MAP_CENTER.x} ${-MAP_CENTER.y})`;
}

export function HistoricalMap({ wars, places, currentYear, viewport, focusTarget, territories, polities, selectedWar, hoveredWar, onSelect, onHover, layers, animations, narrativeMode = false, onLayers, onAnimations, onViewportChange }: HistoricalMapProps) {
  const [legendOpen, setLegendOpen] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomLayerRef = useRef<SVGGElement>(null);
  const viewportRef = useRef(viewport);
  const pendingViewportRef = useRef(viewport);
  const viewportAnimationFrameRef = useRef<number>();
  const wheelCommitTimerRef = useRef<number>();
  const [displayViewport, setDisplayViewport] = useState(viewport);
  const pointersRef = useRef(new Map<number, MapPoint>());
  const gestureRef = useRef<Gesture>();
  const dragMovedRef = useRef(false);
  const eventNodes = useMemo(() => layoutEventNodes(wars), [wars]);
  const detail = mapDetailForScale(displayViewport.scale);
  const nodeDensityClass = `${wars.length <= 5 ? 'map-nodes-sparse' : 'map-nodes-dense'} map-nodes-${detail}`;
  const mapTransform = transformForViewport(displayViewport);
  const activeWar = hoveredWar ?? selectedWar;
  const activePolityIds = useMemo(() => Array.from(new Set(activeWar?.participants.map((participant) => participant.polityId).filter(Boolean) as string[] ?? [])), [activeWar]);
  const toggleLayer = (layer: keyof MapLayers) => onLayers({ ...layers, [layer]: !layers[layer] });

  const renderViewport = useCallback((nextViewport: MapViewport) => {
    viewportRef.current = nextViewport;
    pendingViewportRef.current = nextViewport;
    zoomLayerRef.current?.setAttribute('transform', transformForViewport(nextViewport));
    if (viewportAnimationFrameRef.current !== undefined) return;
    viewportAnimationFrameRef.current = window.requestAnimationFrame(() => {
      viewportAnimationFrameRef.current = undefined;
      setDisplayViewport(pendingViewportRef.current);
    });
  }, []);

  const commitViewport = useCallback((nextViewport: MapViewport) => {
    renderViewport(nextViewport);
    if (viewportAnimationFrameRef.current !== undefined) {
      window.cancelAnimationFrame(viewportAnimationFrameRef.current);
      viewportAnimationFrameRef.current = undefined;
    }
    setDisplayViewport(nextViewport);
    onViewportChange(nextViewport);
  }, [onViewportChange, renderViewport]);

  useEffect(() => {
    viewportRef.current = viewport;
    pendingViewportRef.current = viewport;
    zoomLayerRef.current?.setAttribute('transform', transformForViewport(viewport));
    // Parent updates are deliberately published at gesture boundaries. Queue
    // the visual sync so React does not perform a second synchronous render
    // in the same effect that received that external update.
    const frame = window.requestAnimationFrame(() => setDisplayViewport(viewport));
    return () => window.cancelAnimationFrame(frame);
  }, [viewport]);

  useEffect(() => () => {
    if (viewportAnimationFrameRef.current !== undefined) window.cancelAnimationFrame(viewportAnimationFrameRef.current);
    if (wheelCommitTimerRef.current !== undefined) window.clearTimeout(wheelCommitTimerRef.current);
  }, []);

  useEffect(() => {
    if (!focusTarget) return;
    const point = projection(focusTarget.coordinate);
    if (!point) return;
    const nextViewport = zoomMapViewport(viewportRef.current, focusTarget.scale, { x: point[0], y: point[1] }, MAP_CENTER);
    viewportRef.current = nextViewport;
    onViewportChange(nextViewport);
  }, [focusTarget, onViewportChange]);

  function startGestureFromPointers() {
    const entries = Array.from(pointersRef.current.entries()).sort(([first], [second]) => first - second);
    if (entries.length >= 2) {
      const [first, second] = entries;
      const firstPoint = first[1];
      const secondPoint = second[1];
      gestureRef.current = { kind: 'pinch', pointerIds: [first[0], second[0]], midpoint: midpoint(firstPoint, secondPoint), distance: Math.max(1, distance(firstPoint, secondPoint)), viewport: viewportRef.current };
    } else if (entries.length === 1) {
      gestureRef.current = { kind: 'drag', pointerId: entries[0][0], point: entries[0][1], viewport: viewportRef.current };
    } else {
      gestureRef.current = undefined;
    }
  }

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const point = eventPoint(event);
    pointersRef.current.set(event.pointerId, point);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Synthetic pointer events do not always create a capture target. */ }
    dragMovedRef.current = false;
    startGestureFromPointers();
    setIsInteracting(true);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (!pointersRef.current.has(event.pointerId)) return;
    const point = eventPoint(event);
    pointersRef.current.set(event.pointerId, point);
    const gesture = gestureRef.current;
    if (!gesture) return;

    if (gesture.kind === 'drag' && gesture.pointerId === event.pointerId) {
      const delta = { x: point.x - gesture.point.x, y: point.y - gesture.point.y };
      if (Math.hypot(delta.x, delta.y) > 3) dragMovedRef.current = true;
      renderViewport(panMapViewport(gesture.viewport, delta));
      event.preventDefault();
      return;
    }

    if (gesture.kind === 'pinch') {
      const firstPoint = pointersRef.current.get(gesture.pointerIds[0]);
      const secondPoint = pointersRef.current.get(gesture.pointerIds[1]);
      if (!firstPoint || !secondPoint) return;
      const nextMidpoint = midpoint(firstPoint, secondPoint);
      const nextDistance = distance(firstPoint, secondPoint);
      if (Math.hypot(nextMidpoint.x - gesture.midpoint.x, nextMidpoint.y - gesture.midpoint.y) > 3 || Math.abs(nextDistance - gesture.distance) > 3) dragMovedRef.current = true;
      renderViewport(zoomMapViewport(gesture.viewport, gesture.viewport.scale * (nextDistance / gesture.distance), gesture.midpoint, nextMidpoint));
      event.preventDefault();
    }
  }

  function handlePointerEnd(event: React.PointerEvent<SVGSVGElement>) {
    pointersRef.current.delete(event.pointerId);
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    } catch { /* The pointer may already have been cancelled by the browser. */ }
    startGestureFromPointers();
    if (pointersRef.current.size === 0) {
      setIsInteracting(false);
      commitViewport(viewportRef.current);
      window.setTimeout(() => { dragMovedRef.current = false; }, 0);
    }
  }

  useEffect(() => {
    const canvas = svgRef.current;
    if (!canvas) return;

    const handleNativeWheel = (event: WheelEvent) => {
      // React delegates wheel events and browsers may treat that listener as passive.
      // The map deliberately owns the wheel only while the pointer is over this canvas.
      event.preventDefault();
      const point = eventPoint(event as WheelEvent & { currentTarget: SVGSVGElement });
      const targetScale = viewportRef.current.scale * Math.exp(-event.deltaY * 0.0012);
      renderViewport(zoomMapViewport(viewportRef.current, targetScale, point));
      if (wheelCommitTimerRef.current !== undefined) window.clearTimeout(wheelCommitTimerRef.current);
      wheelCommitTimerRef.current = window.setTimeout(() => commitViewport(viewportRef.current), 130);
    };

    canvas.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', handleNativeWheel);
  }, [commitViewport, renderViewport]);

  function handleDoubleClick(event: React.MouseEvent<SVGSVGElement>) {
    event.preventDefault();
    const point = eventPoint(event);
    commitViewport(zoomMapViewport(viewportRef.current, viewportRef.current.scale * 1.5, point));
  }

  useEffect(() => {
    if (!legendOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setLegendOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [legendOpen]);

  return <section className="map-frame relative aspect-[20/13] overflow-hidden" aria-label="中国历史战争地图" onClick={() => { if (!dragMovedRef.current) setLegendOpen(false); }}>
    <div className="map-paper-texture" />
    <svg ref={svgRef} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} preserveAspectRatio="xMidYMid meet" className="map-canvas absolute inset-0 h-full w-full" role="img" aria-label={`当前显示 ${wars.length} 个历史事件；可拖动、捏合或滚轮缩放地图`} data-map-scale={displayViewport.scale.toFixed(3)} data-map-translate-x={displayViewport.x.toFixed(2)} data-map-translate-y={displayViewport.y.toFixed(2)} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} onDoubleClick={handleDoubleClick}>
      <defs>
        <filter id="mapGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <filter id="territorySoftEdge" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceGraphic" stdDeviation="1.35" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <marker id="routeArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#fde68a" /></marker>
      </defs>
      <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} className="map-ocean-backdrop" aria-hidden="true" />
      {graticulePath && <path d={graticulePath} className="map-graticule" />}
      <g ref={zoomLayerRef} transform={mapTransform} className={`map-zoom-layer ${isInteracting ? 'map-zoom-layer-interacting' : ''}`}>
        {layers.geography && <GeographyLayer projection={projection} zoom={displayViewport.scale} performanceMode={narrativeMode} />}
        {layers.places && <HistoricalPlaceLayer places={places} year={currentYear} projection={projection} zoom={displayViewport.scale} />}
        {layers.modern && <ModernPlaceLayer projection={projection} zoom={displayViewport.scale} />}
        {layers.territories && <TerritoryLayer territories={territories} polities={polities} projection={projection} activePolityIds={activePolityIds} animated={animations && !narrativeMode} zoom={displayViewport.scale} />}
        {taiwanLabelPoint && <g transform={`translate(${taiwanLabelPoint[0]} ${taiwanLabelPoint[1]}) scale(${1 / displayViewport.scale})`}><text x="12" y="2" className="map-region-label">台湾省</text></g>}
        {layers.clouds && !narrativeMode && <WarCloudLayer wars={wars} projection={projection} animated={animations} activeWarId={activeWar?.id} detail={detail} />}
        {layers.routes && <RouteLayer war={selectedWar} projection={projection} animated={animations && !narrativeMode} />}
        {layers.nodes && <g className={nodeDensityClass}>{eventNodes.filter(({ war }) => eventsForMapDetail([war], detail).length > 0).map(({ war, location, x, y }) => {
          const selected = war.id === selectedWar?.id;
          const active = war.id === activeWar?.id;
          const muted = Boolean(activeWar && !active);
          const radius = scaleSize[war.scale];
          return <g key={`${war.id}-${location.id}`} className={`event-node event-node-${war.type} ${selected ? 'event-node-selected' : ''} ${active ? 'event-node-active' : ''} ${muted ? 'event-node-muted' : ''}`} transform={`translate(${x} ${y}) scale(${1 / displayViewport.scale})`} role="button" tabIndex={0} aria-label={`查看${war.name}详情`} onMouseEnter={() => onHover(war)} onMouseLeave={() => onHover(undefined)} onFocus={() => onHover(war)} onBlur={() => onHover(undefined)} onClick={(event) => { event.stopPropagation(); if (!dragMovedRef.current) onSelect(war); }} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(war); } }}>
            <circle r={radius + 10} fill={typeColor[war.type]} className="event-node-aura" />
            <circle r={radius + 4} fill="none" stroke={typeColor[war.type]} className="event-node-ring" />
            <circle r={radius} fill={typeColor[war.type]} className="event-node-core" />
            <text y={radius + 18} textAnchor="middle" className="event-node-label">{war.name}</text>
          </g>;
        })}</g>}
      </g>
    </svg>
    {wars.length === 0 && <div className="map-empty-state" role="status" aria-live="polite"><strong>当前窗口暂无收录事件</strong><span>地图仍保留当前阶段的地理与势力范围示意，请继续拖动时间轴。</span></div>}
    <div className="map-toolbar" aria-label="地图显示控制" onClick={(event) => event.stopPropagation()}><div className="toolbar-group"><button type="button" className={layers.geography ? 'toolbar-active' : ''} aria-pressed={layers.geography} onClick={() => toggleLayer('geography')}>地形</button><button type="button" className={layers.places ? 'toolbar-active' : ''} aria-pressed={layers.places} onClick={() => toggleLayer('places')}>古地名</button><button type="button" className={layers.modern ? 'toolbar-active' : ''} aria-pressed={layers.modern} onClick={() => toggleLayer('modern')}>今地名</button><button type="button" className={layers.territories ? 'toolbar-active' : ''} aria-pressed={layers.territories} onClick={() => toggleLayer('territories')}>势力</button><button type="button" className={layers.clouds ? 'toolbar-active' : ''} aria-pressed={layers.clouds} onClick={() => toggleLayer('clouds')}>热区</button><button type="button" className={layers.nodes ? 'toolbar-active' : ''} aria-pressed={layers.nodes} onClick={() => toggleLayer('nodes')}>事件</button><button type="button" className={layers.routes ? 'toolbar-active' : ''} aria-pressed={layers.routes} onClick={() => toggleLayer('routes')}>路线</button></div><button type="button" className={!animations ? 'toolbar-active' : ''} aria-pressed={!animations} onClick={() => onAnimations(!animations)}>{animations ? '关闭动效' : '开启动效'}</button></div>
    <div className="zoom-toolbar" aria-label="地图缩放" onClick={(event) => event.stopPropagation()}><button type="button" onClick={() => commitViewport(zoomMapViewport(viewportRef.current, viewportRef.current.scale + .25, MAP_CENTER))} aria-label="放大地图">＋</button><button type="button" onClick={() => commitViewport(zoomMapViewport(viewportRef.current, viewportRef.current.scale - .25, MAP_CENTER))} aria-label="缩小地图">－</button><button type="button" onClick={() => commitViewport(INITIAL_MAP_VIEWPORT)} aria-label="重置地图缩放">复位</button><span className="zoom-indicator" aria-live="polite">{Math.round(displayViewport.scale * 100)}%</span></div>
    <div className="map-note"><p className="eyebrow">{narrativeMode ? '叙事性能模式' : '专业自然地理'}</p><p>{narrativeMode ? '播放时保留海陆轮廓、主要河流、事件、路线和古地名；细密地形与热区暂时简化，退出叙事即恢复完整底图。' : '海陆设色、海岸线、主要湖河与淡褐地形晕染共同提供空间骨架；势力范围和点位均不替代精确历史行政区面。'}</p></div>
    <button type="button" className="legend-toggle" aria-expanded={legendOpen} aria-controls="map-legend" onClick={(event) => { event.stopPropagation(); setLegendOpen((value) => !value); }}>图例</button>
    <Legend open={legendOpen} territories={territories} polities={polities} onClose={() => setLegendOpen(false)} />
    <div className="map-credit">Natural Earth · 1:10m · 本地裁切</div>
  </section>;
}
