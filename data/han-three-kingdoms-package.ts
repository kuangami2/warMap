import { hanThreeKingdomsEras, hanThreeKingdomsPlaces, hanThreeKingdomsPolities, hanThreeKingdomsTerritories, hanThreeKingdomsWars, HAN_THREE_KINGDOMS_NARRATIVE_EVENT_IDS } from './hanThreeKingdoms';
import { coverageWindows, researchRegions } from './research';
import { HAN_THREE_KINGDOMS_SCENARIO_ID, scenarios } from './scenarios';
import { assembleScenarioPackage } from '@/lib/scenario-package';
import type { HistoricalPlace, WarEvent } from '@/lib/types';
import { landmarkImages } from './landmark-images';

const researchNotes: Record<string, string> = {
  'tk-red-cliffs': '赤壁古战场位置存在多种讨论；本条仅以长江中游的概括参考点和叙事路线说明战局。',
  'tk-lumeng-takes-jingzhou': '荆州易手由多处城邑、水路和政治关系共同构成，地图不以单一线路替代完整军事过程。',
  'tk-hanzhong-campaign': '汉中战役包含多个阶段和山地通道，本条以定军山和阳平关方向组织研究入口。',
  'tk-yiling-battle': '夷陵战场的具体地望和部队活动范围有讨论，地图使用宜昌一带的概括定位。',
  'tk-first-northern-expedition': '祁山、街亭与陇右的路线仅按史料叙事概括，不构成精确行军日程。',
  'tk-wei-conquers-shu': '灭蜀战役以剑阁、阴平、成都为研究节点，山地路线表达的是可审校的方向关系。',
  'tk-western-jin-conquers-wu': '西晋伐吴涉及多路军队与长江水路，本条不将路线简化为唯一航线或固定战场边界。',
};

function regionIdsForWar(war: WarEvent) {
  const text = `${war.name} ${war.tags.join(' ')} ${war.locations.map((location) => location.name).join(' ')}`;
  const ids: string[] = [];
  if (/荆州|赤壁|夷陵|长江|江陵|樊城|关羽|孙刘/.test(text)) ids.push('han-jingzhou-yangtze');
  if (/汉中|北伐|祁山|街亭|五丈原|陈仓|关中|陇右|渭/.test(text)) ids.push('han-hanzhong-longyou');
  if (/合肥|寿春|魏吴|淮南|石亭|东兴|濡须/.test(text)) ids.push('han-huainan-river-defense');
  if (/益州|蜀地|灭蜀|阴平|剑阁|成都|巴蜀/.test(text)) ids.push('han-shu-jiange-chengdu');
  return ids;
}

function regionIdsForPlace(place: HistoricalPlace) {
  const text = `${place.name} ${place.note}`;
  if (/荆州|赤壁|乌林|夏口|夷陵|江陵|襄阳|樊城|公安|麦城|寻阳/.test(text)) return ['han-jingzhou-yangtze'];
  if (/汉中|祁山|街亭|五丈原|陈仓|阳平|关中/.test(text)) return ['han-hanzhong-longyou'];
  if (/合肥|寿春|石亭|东兴|濡须/.test(text)) return ['han-huainan-river-defense'];
  if (/成都|剑阁|江油|阴平|益州|雒城/.test(text)) return ['han-shu-jiange-chengdu'];
  return [];
}

const routeReferencePlaces: HistoricalPlace[] = [
  { id: 'tk-maicheng', scenarioId: HAN_THREE_KINGDOMS_SCENARIO_ID, name: '麦城', modernName: '今湖北当阳东南一带，旧址有讨论', kind: 'city', longitude: 111.8, latitude: 30.67, startYear: 219, endYear: 220, minZoom: 1.25, priority: 78, confidence: 'low', note: '关羽撤退与荆州局势变化的参考点；不表示唯一城址或行军路线。', sources: [{ title: '《三国志·关羽传》', kind: 'primary', citation: '关羽败亡叙事。', claim: '用于关羽撤退阶段的概括地望。' }, { title: '谭其骧主编《中国历史地图集》第四册', kind: 'atlas', note: '用于地望概括核对；不复制行政边界。' }] },
  { id: 'tk-ruxu', scenarioId: HAN_THREE_KINGDOMS_SCENARIO_ID, name: '濡须', modernName: '今安徽无为东北一带', kind: 'city', longitude: 117.8, latitude: 31.3, startYear: 213, endYear: 280, minZoom: 1.2, priority: 80, confidence: 'medium', note: '魏吴江防与濡须口战事的参考点。', sources: [{ title: '《三国志·武帝纪》', kind: 'primary', citation: '濡须方向战事记载。', claim: '用于江防对峙的概括定位。' }, { title: '谭其骧主编《中国历史地图集》第四册', kind: 'atlas', note: '用于地望概括核对；不复制行政边界。' }] },
  { id: 'tk-yinping', scenarioId: HAN_THREE_KINGDOMS_SCENARIO_ID, name: '阴平', modernName: '今甘肃文县至四川平武一线，具体路径有讨论', kind: 'pass', longitude: 104.8, latitude: 32.95, startYear: 263, endYear: 263, minZoom: 1.25, priority: 82, confidence: 'medium', note: '邓艾入蜀路线的概括参考点；不复原险道的精确轨迹。', sources: [{ title: '《三国志·邓艾传》', kind: 'primary', citation: '阴平道入蜀叙事。', claim: '用于灭蜀战役山地通道的研究入口。' }, { title: '谭其骧主编《中国历史地图集》第四册', kind: 'atlas', note: '用于地望概括核对；不复制行政边界。' }] },
];

export function createHanThreeKingdomsPackage() {
  return assembleScenarioPackage({
    manifest: { id: HAN_THREE_KINGDOMS_SCENARIO_ID, contentVersion: '2.6.0', editorialStatus: 'curated', coverageNote: '两汉至三国主线已审校；研究区域用于检索和叙事分组，不表示任何行政边界。' },
    scenario: scenarios.find((scenario) => scenario.id === HAN_THREE_KINGDOMS_SCENARIO_ID)!,
    eras: hanThreeKingdomsEras,
    polities: hanThreeKingdomsPolities,
    wars: hanThreeKingdomsWars.map((war) => ({ ...war, regionIds: regionIdsForWar(war), researchNote: researchNotes[war.id], uncertaintyNote: war.confidence === 'high' ? researchNotes[war.id] : researchNotes[war.id] ?? '地点、路线或战事规模存在史料与地望讨论，地图仅作概括表达。' })),
    territories: hanThreeKingdomsTerritories,
    places: [...hanThreeKingdomsPlaces, ...routeReferencePlaces].map((place) => ({ ...place, regionIds: regionIdsForPlace(place) })),
    narrativeEventIds: HAN_THREE_KINGDOMS_NARRATIVE_EVENT_IDS,
    regions: researchRegions.filter((region) => region.scenarioId === HAN_THREE_KINGDOMS_SCENARIO_ID),
    coverage: coverageWindows.filter((window) => window.scenarioId === HAN_THREE_KINGDOMS_SCENARIO_ID),
    landmarkImages: landmarkImages.filter((image) => image.scenarioId === HAN_THREE_KINGDOMS_SCENARIO_ID),
  });
}
