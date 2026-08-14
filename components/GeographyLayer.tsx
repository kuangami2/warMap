import { memo, useMemo } from 'react';
import type { GeoProjection } from 'd3-geo';
import { naturalEarthLakeRings, naturalEarthLandRings, naturalEarthRiverLines, physicalLabelAnchors } from '@/data/naturalEarth10m';
import { mapDetailForScale } from '@/lib/mapDetail';

function projectedPath(coordinates: [number, number][], projection: GeoProjection, closed = false) {
  const points = coordinates.map((coordinate) => projection(coordinate)).filter((point): point is [number, number] => Boolean(point));
  if (!points.length) return '';
  return `M${points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join('L')}${closed ? 'Z' : ''}`;
}

/**
 * The geometry in this layer is a locally bundled, cropped derivative of the
 * Natural Earth 1:10m physical dataset.  It deliberately contains no modern
 * administrative borders and makes no claim about period-specific terrain.
 */
export const GeographyLayer = memo(function GeographyLayer({ projection, zoom, performanceMode = false }: { projection: GeoProjection; zoom: number; performanceMode?: boolean }) {
  const detail = mapDetailForScale(zoom);
  const paths = useMemo(() => {
    const land = naturalEarthLandRings
      .map((ring) => ({ d: projectedPath(ring, projection, true), complexity: ring.length }))
      .filter((item) => Boolean(item.d));
    return {
      // Rendering every geometry as its own SVG element made normal pan and
      // pinch gestures reconcile more than a thousand paths. Joining paths
      // keeps the exact locally bundled 1:10m geometry while reducing the
      // painted DOM to a small, GPU-friendly set of layers.
      land: land.map((item) => item.d).join(' '),
      narrativeLand: [...land].sort((left, right) => right.complexity - left.complexity).slice(0, 18).map((item) => item.d).join(' '),
      lakes: naturalEarthLakeRings.map((ring) => projectedPath(ring, projection, true)).filter(Boolean).join(' '),
      primaryRivers: naturalEarthRiverLines.filter((_, index) => index % 4 === 0).map((line) => projectedPath(line, projection)).filter(Boolean).join(' '),
      secondaryRivers: naturalEarthRiverLines.filter((_, index) => index % 4 !== 0).map((line) => projectedPath(line, projection)).filter(Boolean).join(' '),
    };
  }, [projection]);

  // The full 1:10m coastline is retained for normal reading. During story-camera
  // movement, the largest coastline rings keep the land/sea silhouette legible
  // without asking a mobile GPU to composite hundreds of detailed island paths.
  if (performanceMode) return <g className="geography-layer geography-layer-performance" aria-label="叙事播放中的简化自然地理底图">
    <rect x="0" y="0" width="800" height="520" className="map-ocean-10m map-ocean-narrative" />
    <g className="physical-narrative-land-layer">
      <path d={paths.narrativeLand} className="map-narrative-land" />
    </g>
    <g className="physical-river-layer physical-detail-overview">
      <path d={paths.primaryRivers} className="map-river-10m map-river-major" />
    </g>
  </g>;

  return <g className="geography-layer" aria-label="Natural Earth 1:10m 专业自然地理底图">
    <defs>
      <radialGradient id="physicalTerrainWash" cx="24%" cy="34%" r="76%" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#5f472a" stopOpacity=".48" />
        <stop offset=".42" stopColor="#80623a" stopOpacity=".2" />
        <stop offset="1" stopColor="#d3bd85" stopOpacity=".03" />
      </radialGradient>
      <linearGradient id="physicalCoastHighlight" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#faedc6" stopOpacity=".62" />
        <stop offset="1" stopColor="#6d4f2b" stopOpacity=".12" />
      </linearGradient>
      <pattern id="physicalLandGrain" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(23)">
        <path d="M0 1 H11" stroke="#4f3b23" strokeOpacity=".11" strokeWidth=".65" />
      </pattern>
      <clipPath id="physicalLandClip"><path d={paths.land} fillRule="evenodd" clipRule="evenodd" /></clipPath>
    </defs>
    <rect x="0" y="0" width="800" height="520" className="map-ocean-10m" />
    <g className="physical-land-layer">
      <path d={paths.land} className="map-land-10m" fillRule="evenodd" />
    </g>
    <g className="physical-relief-layer" aria-hidden="true">
      <path d={paths.land} className="map-land-relief" fillRule="evenodd" />
      <path d={paths.land} className="map-land-grain" fillRule="evenodd" />
      <g className="physical-relief-masses" clipPath="url(#physicalLandClip)" aria-label="地形晕染示意">
        {[[96, 34, 150, 94], [104, 31, 82, 48], [113, 34, 74, 40], [119, 28, 54, 32]].map(([longitude, latitude, rx, ry], index) => {
          const point = projection([longitude, latitude]);
          return point ? <ellipse key={index} cx={point[0]} cy={point[1]} rx={rx} ry={ry} /> : null;
        })}
      </g>
      <path d={paths.land} className="map-coastline-highlight" />
    </g>
    <g className={`physical-lake-layer physical-detail-${detail}`}>
      <path d={paths.lakes} className="map-lake-10m" />
    </g>
    <g className={`physical-river-layer physical-detail-${detail}`}>
      <path d={paths.secondaryRivers} className="map-river-10m map-river-minor" />
      <path d={paths.primaryRivers} className="map-river-10m map-river-major" />
    </g>
    <g className="physical-label-layer">
      {physicalLabelAnchors.map((label) => {
        const point = projection(label.coordinate);
        if (!point) return null;
        const labelVisible = label.kind === 'river' || label.kind === 'mountain' || detail !== 'overview';
        return <g key={label.id} className={`geography-label geography-label-${label.kind} ${labelVisible ? '' : 'geography-label-hidden'}`} transform={`translate(${point[0]} ${point[1]}) scale(${1 / zoom})`}>
          {label.kind === 'mountain' && <path d="M-13 4 L-7 -6 L-2 1 L3 -9 L12 4 Z" className="mountain-mark" />}
          <text x={label.kind === 'mountain' ? 15 : 0} y={label.kind === 'mountain' ? 4 : 0}>{label.name}</text>
        </g>;
      })}
    </g>
  </g>;
});
