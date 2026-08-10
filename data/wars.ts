import type { Confidence, Location, RouteSegment, Scale, Source, WarEvent, WarType } from '@/lib/types';

type EventInput = {
  id: string; name: string; years: [number, number]; type: WarType; scale: Scale; summary: string;
  background: string; result: string; impact: string; sides: string[]; place: [string, string, number, number, Location['role']]; source: string;
  confidence?: Confidence; estimate?: string; tags: string[];
};

function inferPolityId(name: string): string | undefined {
  if (name.includes('韩信') || name.includes('刘邦') || name.includes('汉军') || name.includes('汉廷') || name.includes('汉联盟')) return 'han';
  if (name.includes('项羽') || name.includes('西楚') || name.includes('楚军')) return 'western-chu';
  if (name.includes('陈胜') || name.includes('吴广') || name.includes('张楚') || name.includes('反秦')) return 'zhangchu';
  if (name.includes('匈奴')) return 'xiongnu';
  if (name.includes('南越')) return 'nanyue';
  if (name.includes('秦')) return 'qin';
  if (name === '韩' || name.includes('韩国')) return 'han-state';
  if (name.includes('赵')) return 'zhao';
  if (name.includes('魏')) return 'wei';
  if (name.includes('燕')) return 'yan';
  if (name.includes('齐')) return 'qi';
  if (name.includes('楚')) return 'chu';
  return undefined;
}

function event(input: EventInput): WarEvent {
  const [name, modernName, latitude, longitude, role] = input.place;
  const sources: Source[] = [{ title: input.source }];
  return {
    id: input.id, name: input.name, startYear: input.years[0], endYear: input.years[1], type: input.type, scale: input.scale,
    confidence: input.confidence ?? 'high', summary: input.summary, background: input.background, result: input.result, impact: input.impact,
    participants: input.sides.map((side, index) => ({ id: `${input.id}-${index}`, name: side, polityId: inferPolityId(side) })),
    locations: [{ id: `${input.id}-location`, name, modernName, latitude, longitude, role }],
    troopEstimate: input.estimate ? { display: input.estimate } : undefined, routes: routesByEvent[input.id], sources, tags: input.tags,
  };
}

const routesByEvent: Record<string, RouteSegment[]> = {
  'qin-conquest-chu': [{ actorId: 'qin', description: '秦军由中原南下，经陈、平舆一带逼近寿春。', points: [
    { name: '咸阳', latitude: 34.39, longitude: 108.71 }, { name: '陈', latitude: 33.73, longitude: 114.86 }, { name: '平舆', latitude: 32.96, longitude: 114.62 }, { name: '寿春', latitude: 32.57, longitude: 116.78 },
  ] }],
  'qin-conquest-yan': [{ actorId: 'qin', description: '秦军自赵地向燕都蓟城方向推进。', points: [
    { name: '邯郸', latitude: 36.63, longitude: 114.54 }, { name: '易水', latitude: 39.10, longitude: 115.52 }, { name: '蓟城', latitude: 39.90, longitude: 116.38 },
  ] }],
  'qin-xiongnu-campaign': [{ actorId: 'qin', description: '蒙恬军由关中北上，向河套地区推进。', points: [
    { name: '咸阳', latitude: 34.39, longitude: 108.71 }, { name: '上郡', latitude: 37.50, longitude: 109.50 }, { name: '河套', latitude: 40.80, longitude: 108.70 },
  ] }],
  'qin-lingnan-campaign': [{ actorId: 'qin', description: '秦军从长江中游与湘江流域向岭南展开多路推进。', points: [
    { name: '长沙', latitude: 28.23, longitude: 112.94 }, { name: '湘江上游', latitude: 25.62, longitude: 111.95 }, { name: '桂林地区', latitude: 25.27, longitude: 110.29 }, { name: '岭南', latitude: 23.50, longitude: 113.20 },
  ] }],
  'liu-bang-enter-guanzhong': [{ actorId: 'liu-bang', description: '刘邦军由南阳方向经武关进入关中。', points: [
    { name: '宛', latitude: 32.99, longitude: 112.53 }, { name: '武关', latitude: 33.49, longitude: 110.61 }, { name: '峣关', latitude: 34.02, longitude: 109.33 }, { name: '咸阳', latitude: 34.39, longitude: 108.71 },
  ] }],
  'three-qin-war': [{ actorId: 'han', description: '汉军由汉中翻越秦岭，经陈仓进入关中。', points: [
    { name: '汉中', latitude: 33.07, longitude: 107.03 }, { name: '陈仓', latitude: 34.37, longitude: 107.37 }, { name: '废丘', latitude: 34.43, longitude: 108.47 }, { name: '栎阳', latitude: 34.68, longitude: 109.23 },
  ] }],
  'han-conquest-wei': [{ actorId: 'han-xin', description: '韩信军由关中东渡黄河，进攻魏地。', points: [
    { name: '临晋', latitude: 35.15, longitude: 110.77 }, { name: '夏阳', latitude: 35.48, longitude: 110.44 }, { name: '安邑', latitude: 35.14, longitude: 111.22 },
  ] }],
  'jingxing-battle': [{ actorId: 'han-xin', description: '汉军越太行山井陉口进入赵地。', points: [
    { name: '太原', latitude: 37.87, longitude: 112.55 }, { name: '井陉口', latitude: 38.03, longitude: 114.14 }, { name: '绵蔓水', latitude: 38.12, longitude: 114.43 }, { name: '襄国', latitude: 37.07, longitude: 114.50 },
  ] }],
  'gaixia-battle': [{ actorId: 'han-alliance', description: '汉军及诸侯军从多个方向压缩楚军活动空间，最终合围垓下。', points: [
    { name: '荥阳', latitude: 34.79, longitude: 113.38 }, { name: '固陵', latitude: 33.80, longitude: 114.90 }, { name: '垓下', latitude: 33.47, longitude: 117.55 }, { name: '乌江', latitude: 31.73, longitude: 118.37 },
  ] }],
  'baideng-siege': [{ actorId: 'han', description: '汉军由晋阳北进平城，在白登山附近受围。', points: [
    { name: '晋阳', latitude: 37.87, longitude: 112.55 }, { name: '平城', latitude: 40.08, longitude: 113.30 }, { name: '白登', latitude: 40.12, longitude: 113.39 },
  ] }],
};

// 年份均以负整数表示公元前。地点为现代行政区附近的辅助定位，具体古地望有异说时已在名称中标识。
export const wars: WarEvent[] = [
  event({ id: 'qin-conquest-han', name: '秦灭韩', years: [-230, -230], type: 'unification', scale: 'A', summary: '内史腾攻取韩国，韩亡。', background: '韩国地处秦东进要道，国力已弱。', result: '韩国灭亡。', impact: '秦统一六国的最后阶段正式展开。', sides: ['秦', '韩'], place: ['新郑', '今河南新郑', 34.39, 113.74, 'capital'], source: '《史记·秦始皇本纪》', tags: ['统一', '韩国'] }),
  event({ id: 'qin-conquest-zhao', name: '秦灭赵', years: [-229, -228], type: 'unification', scale: 'S', summary: '秦军攻取邯郸，赵国主体覆亡。', background: '赵国在长平战后国力大损，内部政治亦多变。', result: '邯郸失守，赵国主体灭亡。', impact: '秦军得以继续向燕、齐方向推进。', sides: ['秦', '赵'], place: ['邯郸', '今河北邯郸', 36.63, 114.54, 'capital'], source: '《史记·赵世家》', tags: ['统一', '赵国'] }),
  event({ id: 'qin-conquest-wei', name: '秦灭魏', years: [-225, -225], type: 'unification', scale: 'A', summary: '王贲引水灌大梁，魏国投降。', background: '魏都大梁据守，但难以单独抵抗秦军。', result: '大梁陷落，魏亡。', impact: '秦进一步控制中原要地。', sides: ['秦', '魏'], place: ['大梁', '今河南开封', 34.80, 114.31, 'capital'], source: '《史记·魏世家》', tags: ['统一', '魏国'] }),
  event({ id: 'qin-conquest-chu', name: '秦灭楚', years: [-225, -223], type: 'unification', scale: 'S', summary: '秦军南下击败楚国主力，楚亡使统一进程进入决定性阶段。', background: '楚国幅员广阔，是秦统一六国过程中的关键对手。', result: '楚国灭亡。', impact: '秦取得向东南推进的战略优势。', sides: ['秦', '楚'], place: ['寿春', '今安徽寿县一带', 32.57, 116.78, 'capital'], source: '《史记·秦始皇本纪》', estimate: '相关兵力记载存在差异，未采用精确数值。', tags: ['统一', '楚国'] }),
  event({ id: 'qin-conquest-yan', name: '秦灭燕', years: [-226, -222], type: 'unification', scale: 'A', summary: '秦军在易水以北持续进攻，燕王终被俘。', background: '荆轲刺秦失败后，秦对燕的军事压力持续加大。', result: '燕国灭亡。', impact: '秦完成对北方战国诸侯的清除。', sides: ['秦', '燕'], place: ['蓟城', '今北京城区西南一带', 39.90, 116.38, 'capital'], source: '《史记·燕召公世家》', tags: ['统一', '燕国'] }),
  event({ id: 'qin-conquest-qi', name: '秦灭齐', years: [-221, -221], type: 'unification', scale: 'A', summary: '齐国在秦军压迫下覆亡，战国时代结束。', background: '其余五国相继灭亡后，齐国已陷入孤立。', result: '齐国灭亡，秦完成统一。', impact: '中国历史进入秦帝国时期。', sides: ['秦', '齐'], place: ['临淄', '今山东淄博一带', 36.82, 118.31, 'capital'], source: '《史记·秦始皇本纪》', tags: ['统一', '齐国'] }),
  event({ id: 'qin-xiongnu-campaign', name: '秦北击匈奴', years: [-215, -214], type: 'border', scale: 'A', summary: '蒙恬率军北进，夺取河套一带并修筑防御体系。', background: '统一后，秦试图处理北方游牧势力与河套地区的安全问题。', result: '秦军推进至河套，边防经营加强。', impact: '北方军事压力成为秦帝国长期负担之一。', sides: ['秦军', '匈奴诸部'], place: ['河套地区', '今内蒙古河套附近', 40.80, 108.70, 'region'], source: '《史记·蒙恬列传》', confidence: 'medium', tags: ['边疆', '匈奴'] }),
  event({ id: 'qin-lingnan-campaign', name: '秦南征百越', years: [-221, -214], type: 'border', scale: 'A', summary: '秦军持续向岭南地区推进，设置郡县并经营南方通道。', background: '秦统一后向南扩展控制范围，遭遇复杂地理与地方抵抗。', result: '岭南被纳入秦的郡县经营体系。', impact: '南方征发和驻军增加了帝国治理成本。', sides: ['秦军', '百越诸部'], place: ['岭南地区', '今广西、广东北部一带', 24.70, 109.40, 'region'], source: '《史记·秦始皇本纪》', confidence: 'medium', tags: ['边疆', '岭南'] }),
  event({ id: 'dazexiang-uprising', name: '大泽乡起义', years: [-209, -208], type: 'rebellion', scale: 'A', summary: '陈胜、吴广起兵，成为秦末大规模反抗的导火点。', background: '徭役、征发与严苛法令加剧社会紧张。', result: '起义最终失败，但反秦浪潮扩散。', impact: '秦朝统治基础迅速动摇。', sides: ['陈胜、吴广起义军', '秦军'], place: ['大泽乡', '今安徽宿州一带', 33.64, 117.02, 'origin'], source: '《史记·陈涉世家》', tags: ['起义', '秦末'] }),
  event({ id: 'zhangchu-expansion', name: '张楚政权扩张', years: [-209, -208], type: 'rebellion', scale: 'A', summary: '陈胜称王后，反秦力量由局部起事扩散到多地。', background: '大泽乡起义引发各地响应，旧六国区域的政治记忆再次活跃。', result: '张楚政权不久瓦解。', impact: '反秦战争从单点起义转为跨区域动荡。', sides: ['张楚政权', '秦军'], place: ['陈县', '今河南淮阳一带', 33.73, 114.86, 'capital'], source: '《史记·陈涉世家》', tags: ['起义', '张楚'] }),
  event({ id: 'liu-bang-pei-uprising', name: '刘邦沛县起兵', years: [-209, -207], type: 'rebellion', scale: 'B', summary: '刘邦在沛地集结力量，逐步成为反秦诸军中的重要一支。', background: '秦末各地起事，沛县集团依托地方网络组织兵众。', result: '刘邦势力向关中方向发展。', impact: '为其后进入关中和参与楚汉相争奠定基础。', sides: ['刘邦集团', '秦军'], place: ['沛县', '今江苏沛县', 34.73, 116.94, 'origin'], source: '《史记·高祖本纪》', tags: ['起义', '刘邦'] }),
  event({ id: 'xiang-liang-uprising', name: '项梁、项羽江东起兵', years: [-208, -207], type: 'rebellion', scale: 'A', summary: '项梁、项羽在江东起兵并拥立楚怀王后裔。', background: '旧楚区域反秦力量活跃，项氏凭借地方威望迅速壮大。', result: '楚军成为反秦主力之一。', impact: '项羽在反秦战争中走向核心位置。', sides: ['项梁、项羽集团', '秦军'], place: ['会稽', '今浙江绍兴一带', 30.00, 120.58, 'origin'], source: '《史记·项羽本纪》', tags: ['起义', '项羽'] }),
  event({ id: 'julu-battle', name: '巨鹿之战', years: [-207, -207], type: 'rebellion', scale: 'S', summary: '项羽军击败秦军主力，反秦力量取得决定性胜利。', background: '秦军围攻巨鹿，诸侯援军一度观望。', result: '秦军主力受挫。', impact: '项羽声望上升，秦朝灭亡加速。', sides: ['楚军', '秦军'], place: ['巨鹿', '今河北平乡一带', 37.07, 115.03, 'battlefield'], source: '《史记·项羽本纪》', tags: ['秦末', '项羽'] }),
  event({ id: 'liu-bang-enter-guanzhong', name: '刘邦入关', years: [-207, -207], type: 'campaign', scale: 'A', summary: '刘邦军先入关中，秦王子婴投降。', background: '楚怀王曾与诸将约定先入关者王之。', result: '秦朝在关中结束统治。', impact: '刘邦与项羽围绕关中归属的矛盾加深。', sides: ['刘邦军', '秦朝守军'], place: ['咸阳', '今陕西咸阳东北一带', 34.39, 108.71, 'capital'], source: '《史记·高祖本纪》', tags: ['秦末', '关中'] }),
  event({ id: 'qins-destruction', name: '秦朝灭亡', years: [-207, -207], type: 'campaign', scale: 'S', summary: '子婴向刘邦投降，统一帝国仅存的中央政权终结。', background: '巨鹿失利与关中失守使秦朝失去继续维持统治的能力。', result: '秦朝灭亡。', impact: '反秦联盟内部开始争夺战后秩序。', sides: ['刘邦军', '秦朝'], place: ['咸阳', '今陕西咸阳东北一带', 34.39, 108.71, 'capital'], source: '《史记·秦始皇本纪》', tags: ['秦末', '政权更替'] }),
  event({ id: 'hongmen-feast', name: '鸿门宴前后对峙', years: [-206, -206], type: 'civil-war', scale: 'B', summary: '项羽军进入关中后与刘邦集团短暂对峙，冲突未当场爆发。', background: '先入关约定与军事力量差距使双方关系紧张。', result: '刘邦暂时脱险，项羽掌握关中局势。', impact: '楚汉冲突由潜在矛盾走向公开竞争。', sides: ['项羽军', '刘邦集团'], place: ['鸿门', '今陕西西安临潼一带（地点有异说）', 34.39, 109.20, 'battlefield'], source: '《史记·项羽本纪》', confidence: 'medium', tags: ['楚汉', '关中'] }),
  event({ id: 'eighteen-kings', name: '项羽分封十八诸侯', years: [-206, -206], type: 'civil-war', scale: 'A', summary: '项羽重组关中及各地封国，形成新的权力格局。', background: '秦亡后缺乏统一的战后安排，诸军与旧贵族均要求分配利益。', result: '刘邦被封汉王，三秦据守关中。', impact: '分封安排很快成为楚汉战争的重要导火索。', sides: ['西楚霸王集团', '诸侯诸军'], place: ['关中', '今陕西中部', 34.30, 108.90, 'region'], source: '《史记·项羽本纪》', tags: ['楚汉', '分封'] }),
  event({ id: 'liu-bang-hanzhong', name: '刘邦入汉中', years: [-206, -206], type: 'campaign', scale: 'B', summary: '刘邦受封汉王后进入汉中，重新整顿力量。', background: '关中为项羽控制，刘邦被迫离开核心地区。', result: '汉军在汉中完成战略立足。', impact: '为随后出兵三秦创造条件。', sides: ['汉军', '西楚集团'], place: ['汉中', '今陕西汉中', 33.07, 107.03, 'destination'], source: '《史记·高祖本纪》', tags: ['楚汉', '汉中'] }),
  event({ id: 'three-qin-war', name: '还定三秦', years: [-206, -206], type: 'civil-war', scale: 'A', summary: '刘邦军自汉中北出，击败雍、塞、翟三王并控制关中。', background: '项羽分封的三秦诸王构成汉军东出的首要障碍。', result: '汉军夺取关中。', impact: '刘邦获得稳定后方并正式与项羽争衡。', sides: ['汉军', '三秦诸王'], place: ['陈仓', '今陕西宝鸡陈仓一带', 34.37, 107.37, 'battlefield'], source: '《史记·高祖本纪》', tags: ['楚汉', '关中'] }),
  event({ id: 'pengcheng-battle', name: '彭城之战', years: [-205, -205], type: 'civil-war', scale: 'S', summary: '项羽回军反击，在彭城重创汉军。', background: '刘邦乘项羽北方用兵时一度攻占彭城。', result: '汉军大败，刘邦退却。', impact: '楚汉战争转入更长期、更复杂的相持。', sides: ['楚军', '汉军'], place: ['彭城', '今江苏徐州', 34.26, 117.18, 'battlefield'], source: '《史记·项羽本纪》', estimate: '兵力与伤亡数字在不同史料叙述中差异很大。', tags: ['楚汉', '项羽', '刘邦'] }),
  event({ id: 'han-conquest-wei', name: '韩信平魏', years: [-205, -205], type: 'campaign', scale: 'B', summary: '韩信率军渡河作战，击败魏王豹。', background: '魏地控制黄河要道，是汉军北方战略的重要环节。', result: '魏地归汉。', impact: '汉军北进赵、齐的通道得到加强。', sides: ['汉军', '魏王豹集团'], place: ['安邑', '今山西夏县一带', 35.14, 111.22, 'battlefield'], source: '《史记·淮阴侯列传》', tags: ['楚汉', '韩信'] }),
  event({ id: 'xingyang-chenggao', name: '荥阳、成皋相持', years: [-205, -203], type: 'civil-war', scale: 'S', summary: '楚汉双方围绕荥阳、成皋反复争夺，中原战线长期拉锯。', background: '彭城之后，双方均需控制关中与中原之间的交通要地。', result: '战局多次反复，最终汉军逐渐占优。', impact: '为韩信北方作战和最终合围争取时间。', sides: ['楚军', '汉军'], place: ['荥阳', '今河南荥阳', 34.79, 113.38, 'siege'], source: '《史记·高祖本纪》', tags: ['楚汉', '相持'] }),
  event({ id: 'jingxing-battle', name: '井陉之战', years: [-204, -204], type: 'campaign', scale: 'A', summary: '韩信以背水布阵击败赵军，打开北方局面。', background: '赵地兵力较强，汉军需要尽快取得北方战略成果。', result: '赵军失败，赵地归汉。', impact: '韩信成为汉军北方战场的关键统帅。', sides: ['汉军', '赵军'], place: ['井陉', '今河北井陉一带', 38.03, 114.14, 'battlefield'], source: '《史记·淮阴侯列传》', estimate: '“背水一战”细节以《史记》叙事为主，兵力数字不作确定值。', tags: ['楚汉', '韩信', '赵地'] }),
  event({ id: 'han-conquest-qi', name: '韩信攻齐', years: [-204, -203], type: 'campaign', scale: 'A', summary: '韩信东进齐地，楚汉双方争夺山东地区。', background: '齐地资源与战略位置对最终决战具有重要意义。', result: '齐地大体归汉军控制。', impact: '楚军的东部战略空间被压缩。', sides: ['汉军', '齐军', '楚军'], place: ['临淄', '今山东淄博一带', 36.82, 118.31, 'capital'], source: '《史记·淮阴侯列传》', tags: ['楚汉', '齐地', '韩信'] }),
  event({ id: 'wei-river-battle', name: '潍水之战', years: [-203, -203], type: 'civil-war', scale: 'A', summary: '韩信在潍水一线击败来援楚军。', background: '楚军试图挽回齐地战局，双方在山东展开决战。', result: '楚军失利。', impact: '汉军在东部取得决定性优势。', sides: ['汉军', '楚军'], place: ['潍水', '今山东潍河流域（战场地点有异说）', 36.40, 119.20, 'battlefield'], source: '《史记·淮阴侯列传》', confidence: 'medium', tags: ['楚汉', '齐地'] }),
  event({ id: 'gaixia-battle', name: '垓下之战', years: [-202, -202], type: 'civil-war', scale: 'S', summary: '汉军合围楚军，项羽败亡，楚汉战争基本结束。', background: '楚汉双方长期相持，韩信、彭越等力量参与合围。', result: '项羽败亡，刘邦取得胜利。', impact: '汉朝建立的军事基础得以巩固。', sides: ['汉军', '楚军'], place: ['垓下', '今安徽灵璧南一带（说法不一）', 33.47, 117.55, 'battlefield'], source: '《史记·项羽本纪》', confidence: 'medium', estimate: '参战兵力及具体地点存在史学讨论。', tags: ['楚汉战争', '汉初'] }),
  event({ id: 'xiang-yu-death', name: '项羽乌江败亡', years: [-202, -202], type: 'civil-war', scale: 'A', summary: '项羽在垓下突围后于乌江一带败亡。', background: '垓下合围失败后，楚军已无法重建主力。', result: '项羽死亡，西楚势力瓦解。', impact: '刘邦得以完成对全国主要军事对手的压制。', sides: ['项羽余部', '汉军追击部队'], place: ['乌江', '今安徽和县乌江镇一带（说法有异）', 31.73, 118.37, 'battlefield'], source: '《史记·项羽本纪》', confidence: 'medium', tags: ['楚汉战争', '项羽'] }),
  event({ id: 'baideng-siege', name: '白登之围', years: [-200, -200], type: 'border', scale: 'A', summary: '刘邦北上作战时一度受困于白登，后得以脱险。', background: '汉初北方力量薄弱，与匈奴的关系迅速紧张。', result: '汉军脱困，未能建立稳定北进优势。', impact: '汉初对匈奴的政策趋于谨慎。', sides: ['汉军', '匈奴军'], place: ['白登', '今山西大同东北一带（地点有异说）', 40.12, 113.39, 'siege'], source: '《史记·高祖本纪》', confidence: 'medium', tags: ['汉初', '边疆', '匈奴'] }),
  event({ id: 'han-xin-arrest', name: '韩信被擒与改封', years: [-201, -201], type: 'civil-war', scale: 'B', summary: '汉廷以韩信可能反叛为由将其由楚王改封为淮阴侯。', background: '汉初开始重组异姓诸侯与功臣的权力关系。', result: '韩信失去楚王地位。', impact: '中央与异姓诸侯的紧张关系公开化。', sides: ['汉廷', '韩信集团'], place: ['陈县', '今河南淮阳一带', 33.73, 114.86, 'battlefield'], source: '《史记·淮阴侯列传》', confidence: 'medium', tags: ['汉初', '诸侯'] }),
  event({ id: 'han-xin-execution', name: '韩信遇害', years: [-196, -196], type: 'civil-war', scale: 'B', summary: '韩信在长安被杀，异姓功臣集团受到进一步清理。', background: '陈豨事件后，汉廷对异姓诸侯和军事功臣更为警惕。', result: '韩信死亡。', impact: '汉初中央集权与异姓诸侯的矛盾继续升级。', sides: ['汉廷', '韩信集团'], place: ['长安', '今陕西西安一带', 34.26, 108.95, 'capital'], source: '《史记·淮阴侯列传》', confidence: 'medium', tags: ['汉初', '诸侯'] }),
  event({ id: 'peng-yue-campaign', name: '彭越集团被清除', years: [-196, -196], type: 'civil-war', scale: 'B', summary: '梁王彭越被废杀，其势力被汉廷收束。', background: '汉初持续调整异姓诸侯的军事与政治空间。', result: '彭越集团瓦解。', impact: '中央对东方诸侯地区的控制加强。', sides: ['汉廷', '彭越集团'], place: ['梁地', '今河南东部、山东西部一带', 34.75, 115.80, 'region'], source: '《史记·魏豹彭越列传》', confidence: 'medium', tags: ['汉初', '诸侯'] }),
  event({ id: 'ying-bu-rebellion', name: '英布之乱', years: [-196, -195], type: 'civil-war', scale: 'A', summary: '淮南王英布起兵反汉，刘邦亲征平乱。', background: '异姓诸侯接连受清理，英布与中央关系恶化。', result: '英布败亡，叛乱平定。', impact: '异姓诸侯体系进一步被改组。', sides: ['汉军', '英布军'], place: ['淮南', '今安徽中部一带', 32.60, 116.30, 'region'], source: '《史记·黥布列传》', tags: ['汉初', '诸侯', '叛乱'] }),
  event({ id: 'nanyue-submission', name: '南越与汉初关系重建', years: [-196, -196], type: 'border', scale: 'C', summary: '汉廷与南越建立册封关系，边疆采取以外交和军事威慑并用的策略。', background: '岭南在秦末汉初形成相对独立的南越政权。', result: '南越接受汉廷册封。', impact: '汉初南方边疆暂时稳定。', sides: ['汉廷', '南越政权'], place: ['番禺', '今广东广州', 23.13, 113.26, 'capital'], source: '《史记·南越列传》', confidence: 'medium', tags: ['汉初', '边疆', '南越'] }),
];
