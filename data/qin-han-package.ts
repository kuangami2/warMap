import { eras } from './eras';
import { NARRATIVE_EVENT_IDS } from './narratives';
import { historicalPlaces } from './places';
import { polities } from './polities';
import { coverageWindows, researchRegions } from './research';
import { QIN_HAN_SCENARIO_ID, scenarios } from './scenarios';
import { territories } from './territories';
import { wars } from './wars';
import { assembleScenarioPackage } from '@/lib/scenario-package';
import { landmarkImages } from './landmark-images';

export function createQinHanPackage() {
  return assembleScenarioPackage({
    manifest: { id: QIN_HAN_SCENARIO_ID, contentVersion: '2.6.1', editorialStatus: 'curated', coverageNote: '秦统一至汉初主线已审校；本专题不把空白时间窗口解释为没有历史活动。' },
    scenario: scenarios.find((scenario) => scenario.id === QIN_HAN_SCENARIO_ID)!,
    eras: eras.filter((era) => era.scenarioId === QIN_HAN_SCENARIO_ID),
    polities: polities.filter((polity) => polity.scenarioId === QIN_HAN_SCENARIO_ID),
    wars: wars.filter((war) => war.scenarioId === QIN_HAN_SCENARIO_ID).map((war) => ({ ...war, regionIds: war.type === 'border' ? ['qin-northern-frontier'] : ['qin-guanzhong'], uncertaintyNote: war.confidence === 'high' ? undefined : '事件地点、规模或行动方向含有史料与地望讨论，地图仅作概括表达。' })),
    territories: territories.filter((territory) => territory.scenarioId === QIN_HAN_SCENARIO_ID),
    places: historicalPlaces.filter((place) => place.scenarioId === QIN_HAN_SCENARIO_ID).map((place) => ({ ...place, regionIds: /河套|上郡/.test(place.name) ? ['qin-northern-frontier'] : ['qin-guanzhong'] })),
    narrativeEventIds: NARRATIVE_EVENT_IDS,
    regions: researchRegions.filter((region) => region.scenarioId === QIN_HAN_SCENARIO_ID),
    coverage: coverageWindows.filter((window) => window.scenarioId === QIN_HAN_SCENARIO_ID),
    landmarkImages: landmarkImages.filter((image) => image.scenarioId === QIN_HAN_SCENARIO_ID),
  });
}
