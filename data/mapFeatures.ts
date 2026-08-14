import { physicalMapAssets } from '@/data/naturalEarth10m';
import { naturalEarthPopulatedPlacesAsset } from '@/data/modernPlaces';

/**
 * Backward-compatible source list used by the explanatory page and data
 * contract. Geometry now lives in naturalEarth10m.ts rather than hand-drawn
 * topic lines; modern reference points (Natural Earth populated places) are
 * registered here as a separate public-domain asset.
 */
const attributionAssets = [...physicalMapAssets, naturalEarthPopulatedPlacesAsset];

export const mapFeatureSources = attributionAssets.map((asset) => ({
  id: asset.id,
  title: asset.source,
  license: asset.license,
  usage: `${asset.coverage}；${asset.processingNote}`,
  version: asset.version,
  sourceUrl: asset.sourceUrl,
  geometry: asset.geometry,
})) as ReadonlyArray<{
  id: string;
  title: string;
  license: string;
  usage: string;
  version: string;
  sourceUrl: string;
  geometry: 'polygon' | 'line' | 'point' | 'style-reference';
}>;
