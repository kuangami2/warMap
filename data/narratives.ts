/**
 * The story sequence is an editorial index, not a second historical source.
 * Each item resolves to an existing, sourced WarEvent and reuses that event's
 * title, years, summary, confidence and source attribution at runtime.
 */
export const NARRATIVE_EVENT_IDS = [
  'qin-conquest-han',
  'qin-conquest-zhao',
  'qin-conquest-chu',
  'qin-conquest-qi',
  'qin-xiongnu-campaign',
  'dazexiang-uprising',
  'julu-battle',
  'liu-bang-enter-guanzhong',
  'qins-destruction',
  'three-qin-war',
  'pengcheng-battle',
  'xingyang-chenggao',
  'jingxing-battle',
  'han-conquest-qi',
  'gaixia-battle',
  'baideng-siege',
] as const;
