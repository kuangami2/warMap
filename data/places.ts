import type { HistoricalPlace, Source } from '@/lib/types';
import { QIN_HAN_SCENARIO_ID } from './scenarios';

const historicalAtlas: Source = {
  title: '谭其骧主编《中国历史地图集》第二册',
  kind: 'atlas',
  note: '用于秦汉时期郡国、县治与交通节点的专题化地望核对；本项目不复制图集行政边界。',
};

const transmittedSources: Source = {
  title: '《史记》与《汉书·地理志》',
  kind: 'primary',
  note: '用于事件相关城邑、郡国和关隘名称的文献参照。',
};

const QIN_HAN_TOPIC_END_YEAR = -200;

function place(input: Omit<HistoricalPlace, 'scenarioId' | 'sources'> & { sources?: Source[] }): HistoricalPlace {
  // The same named reference point can be useful for later Han history, but
  // this compact topic deliberately ends at the White Deng campaign. Keeping
  // the cap here prevents an otherwise empty timeline tail in this scenario.
  return { scenarioId: QIN_HAN_SCENARIO_ID, sources: [historicalAtlas, transmittedSources], ...input, endYear: Math.min(input.endYear, QIN_HAN_TOPIC_END_YEAR) };
}

/**
 * Named reference points, not reconstructed county polygons. Period ranges
 * describe when the label is useful in this Qin–Han topic, with uncertainty
 * disclosed per item where a historical location remains debated.
 */
export const historicalPlaces: HistoricalPlace[] = [
  place({ id: 'xianyang', name: '咸阳', modernName: '今陕西咸阳东北一带', kind: 'capital', longitude: 108.73, latitude: 34.36, startYear: -230, endYear: -207, minZoom: .85, priority: 100, confidence: 'medium', note: '秦都地望采用概括定位。' }),
  place({ id: 'chang-an', name: '长安', modernName: '今陕西西安西北一带', kind: 'capital', longitude: 108.94, latitude: 34.34, startYear: -206, endYear: -200, minZoom: .85, priority: 100, confidence: 'high', note: '汉初都城位置以概括点位表达。' }),
  place({ id: 'hanzhong-commandery', name: '汉中郡', modernName: '治南郑，今陕西汉中一带', kind: 'commandery', longitude: 107.02, latitude: 33.07, startYear: -206, endYear: -180, minZoom: .85, priority: 92, confidence: 'medium', note: '用于表示汉中战略区域，不绘制郡界。' }),
  place({ id: 'shudong-commandery', name: '蜀郡', modernName: '治成都，今四川成都一带', kind: 'commandery', longitude: 104.07, latitude: 30.67, startYear: -230, endYear: -180, minZoom: .85, priority: 88, confidence: 'high', note: '以治所概括蜀地行政与交通中心。' }),
  place({ id: 'hedong-commandery', name: '河东郡', modernName: '治安邑，今山西夏县一带', kind: 'commandery', longitude: 111.22, latitude: 35.14, startYear: -230, endYear: -180, minZoom: .85, priority: 90, confidence: 'medium', note: '用于表示黄河东岸的重要郡级区域。' }),
  place({ id: 'nanyang-commandery', name: '南阳郡', modernName: '治宛，今河南南阳一带', kind: 'commandery', longitude: 112.53, latitude: 33.00, startYear: -230, endYear: -180, minZoom: .85, priority: 87, confidence: 'medium', note: '以治所概括南阳郡的历史地望。' }),
  place({ id: 'yingchuan-commandery', name: '颍川郡', modernName: '治阳翟，今河南禹州一带', kind: 'commandery', longitude: 113.48, latitude: 34.15, startYear: -230, endYear: -180, minZoom: .85, priority: 86, confidence: 'medium', note: '以治所概括颍川郡地望。' }),
  place({ id: 'jiujiang-commandery', name: '九江郡', modernName: '治寿春，今安徽寿县一带', kind: 'commandery', longitude: 116.79, latitude: 32.58, startYear: -206, endYear: -180, minZoom: .85, priority: 84, confidence: 'medium', note: '汉初相关地名按治所概括，非郡界复原。' }),
  place({ id: 'shang-commandery', name: '上郡', modernName: '今陕西北部一带', kind: 'commandery', longitude: 109.52, latitude: 37.50, startYear: -230, endYear: -180, minZoom: 1.05, priority: 76, confidence: 'low', note: '北方边地治所与辖区变化较大，仅作概括定位。' }),
  place({ id: 'hangu-pass', name: '函谷关', modernName: '今河南灵宝东北一带', kind: 'pass', longitude: 110.89, latitude: 34.70, startYear: -230, endYear: -180, minZoom: 1.1, priority: 96, confidence: 'medium', note: '关址存在研究差异，采用战事叙事中的概括位置。' }),
  place({ id: 'wu-pass', name: '武关', modernName: '今陕西丹凤东南一带', kind: 'pass', longitude: 110.43, latitude: 33.21, startYear: -230, endYear: -180, minZoom: 1.15, priority: 80, confidence: 'medium', note: '作为关中与汉中方向交通节点的概括标记。' }),
  place({ id: 'chen-county', name: '陈', modernName: '今河南淮阳一带', kind: 'county', longitude: 114.86, latitude: 33.73, startYear: -230, endYear: -180, minZoom: 1.3, priority: 83, confidence: 'medium', note: '陈胜起事及汉初相关事件的城邑定位。' }),
  place({ id: 'pei-county', name: '沛', modernName: '今江苏沛县一带', kind: 'county', longitude: 116.94, latitude: 34.73, startYear: -230, endYear: -180, minZoom: 1.3, priority: 78, confidence: 'high', note: '刘邦起兵相关县邑。' }),
  place({ id: 'xingyang-county', name: '荥阳', modernName: '今河南荥阳一带', kind: 'county', longitude: 113.38, latitude: 34.79, startYear: -230, endYear: -180, minZoom: 1.3, priority: 94, confidence: 'high', note: '楚汉相持的关键城邑。' }),
  place({ id: 'chenggao-county', name: '成皋', modernName: '今河南荥阳西北一带', kind: 'county', longitude: 113.14, latitude: 34.52, startYear: -230, endYear: -180, minZoom: 1.35, priority: 88, confidence: 'medium', note: '楚汉相持相关城邑，采用概括定位。' }),
  place({ id: 'handan-city', name: '邯郸', modernName: '今河北邯郸', kind: 'city', longitude: 114.54, latitude: 36.63, startYear: -230, endYear: -180, minZoom: 1.2, priority: 90, confidence: 'high', note: '赵地政治与军事中心。' }),
  place({ id: 'julu-county', name: '巨鹿', modernName: '今河北平乡一带', kind: 'county', longitude: 115.03, latitude: 37.07, startYear: -230, endYear: -180, minZoom: 1.3, priority: 92, confidence: 'medium', note: '巨鹿之战地望采用战役数据中的概括位置。' }),
  place({ id: 'linzi-city', name: '临淄', modernName: '今山东淄博临淄一带', kind: 'city', longitude: 118.31, latitude: 36.82, startYear: -230, endYear: -180, minZoom: 1.2, priority: 89, confidence: 'high', note: '齐地政治与军事中心。' }),
  place({ id: 'dingtao-county', name: '定陶', modernName: '今山东定陶一带', kind: 'county', longitude: 115.57, latitude: 35.08, startYear: -230, endYear: -180, minZoom: 1.35, priority: 78, confidence: 'medium', note: '秦末战事相关城邑。' }),
  place({ id: 'pengcheng-county', name: '彭城', modernName: '今江苏徐州一带', kind: 'county', longitude: 117.19, latitude: 34.26, startYear: -206, endYear: -180, minZoom: 1.3, priority: 90, confidence: 'high', note: '楚汉战争中的重要城市。' }),
];
