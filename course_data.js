// コースデータベース
// 出典: ウマ娘.攻略.tools/race/tracks
// thresholdStats: コース補正（Race Course Modifier）の対象ステータス
//   [] = なし, ['stamina'] = スタミナのみ, ['stamina','guts'] = スタミナ・根性
// surface: 'turf'=芝, 'dirt'=ダート
// direction: 'right'=右, 'left'=左, 'straight'=直線

const COURSE_DB = {
  // ===== マスターズチャレンジ =====
  10501: { venue: '中山',   distance: 1200, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10805: { venue: '京都',   distance: 1600, surface: 'turf', direction: 'right',    thresholdStats: ['speed'] },
  10606: { venue: '東京',   distance: 2400, surface: 'turf', direction: 'left',     thresholdStats: [] },
  10506: { venue: '中山',   distance: 2500, surface: 'turf', direction: 'right',    thresholdStats: ['stamina', 'guts'] },

  // ===== 札幌 =====
  10101: { venue: '札幌',   distance: 1200, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10102: { venue: '札幌',   distance: 1500, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10103: { venue: '札幌',   distance: 1800, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10104: { venue: '札幌',   distance: 2000, surface: 'turf', direction: 'right',    thresholdStats: ['power'] },
  10105: { venue: '札幌',   distance: 2600, surface: 'turf', direction: 'right',    thresholdStats: ['stamina'] },
  10106: { venue: '札幌',   distance: 1000, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  10107: { venue: '札幌',   distance: 1700, surface: 'dirt', direction: 'right',    thresholdStats: ['speed'] },
  10108: { venue: '札幌',   distance: 2400, surface: 'dirt', direction: 'right',    thresholdStats: [] },

  // ===== 函館 =====
  10201: { venue: '函館',   distance: 1000, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10202: { venue: '函館',   distance: 1200, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10203: { venue: '函館',   distance: 1800, surface: 'turf', direction: 'right',    thresholdStats: ['power'] },
  10204: { venue: '函館',   distance: 2000, surface: 'turf', direction: 'right',    thresholdStats: ['speed'] },
  10205: { venue: '函館',   distance: 2600, surface: 'turf', direction: 'right',    thresholdStats: ['stamina'] },
  10206: { venue: '函館',   distance: 1000, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  10207: { venue: '函館',   distance: 1700, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  10208: { venue: '函館',   distance: 2400, surface: 'dirt', direction: 'right',    thresholdStats: ['stamina'] },

  // ===== 新潟 =====
  10301: { venue: '新潟',   distance: 1000, surface: 'turf', direction: 'straight', thresholdStats: ['power'] },
  10302: { venue: '新潟',   distance: 1200, surface: 'turf', direction: 'left',     thresholdStats: [] },
  10303: { venue: '新潟',   distance: 1400, surface: 'turf', direction: 'left',     thresholdStats: [] },
  10304: { venue: '新潟',   distance: 1600, surface: 'turf', direction: 'left',     thresholdStats: [] },
  10305: { venue: '新潟',   distance: 1800, surface: 'turf', direction: 'left',     thresholdStats: ['power'] },
  10306: { venue: '新潟',   distance: 2000, surface: 'turf', direction: 'left',     thresholdStats: ['stamina', 'power'] },
  10307: { venue: '新潟',   distance: 2000, surface: 'turf', direction: 'left',     thresholdStats: ['stamina', 'power'] },
  10308: { venue: '新潟',   distance: 2200, surface: 'turf', direction: 'left',     thresholdStats: ['speed'] },
  10309: { venue: '新潟',   distance: 2400, surface: 'turf', direction: 'left',     thresholdStats: [] },
  10310: { venue: '新潟',   distance: 1200, surface: 'dirt', direction: 'left',     thresholdStats: [] },
  10311: { venue: '新潟',   distance: 1800, surface: 'dirt', direction: 'left',     thresholdStats: ['wiz'] },
  10312: { venue: '新潟',   distance: 2500, surface: 'dirt', direction: 'left',     thresholdStats: [] },

  // ===== 福島 =====
  10401: { venue: '福島',   distance: 1200, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10402: { venue: '福島',   distance: 1800, surface: 'turf', direction: 'right',    thresholdStats: ['stamina'] },
  10403: { venue: '福島',   distance: 2000, surface: 'turf', direction: 'right',    thresholdStats: ['stamina'] },
  10404: { venue: '福島',   distance: 2600, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10405: { venue: '福島',   distance: 1150, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  10406: { venue: '福島',   distance: 1700, surface: 'dirt', direction: 'right',    thresholdStats: ['power'] },
  10407: { venue: '福島',   distance: 2400, surface: 'dirt', direction: 'right',    thresholdStats: ['stamina'] },

  // ===== 中山 =====
  10502: { venue: '中山',   distance: 1600, surface: 'turf', direction: 'right',    thresholdStats: ['power'] },
  10503: { venue: '中山',   distance: 1800, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10504: { venue: '中山',   distance: 2000, surface: 'turf', direction: 'right',    thresholdStats: ['speed'] },
  10505: { venue: '中山',   distance: 2200, surface: 'turf', direction: 'right',    thresholdStats: ['stamina', 'guts'] },
  10507: { venue: '中山',   distance: 3600, surface: 'turf', direction: 'right',    thresholdStats: ['stamina'] },
  10508: { venue: '中山',   distance: 1200, surface: 'dirt', direction: 'right',    thresholdStats: ['power'] },
  10509: { venue: '中山',   distance: 1800, surface: 'dirt', direction: 'right',    thresholdStats: ['power'] },
  10510: { venue: '中山',   distance: 2400, surface: 'dirt', direction: 'right',    thresholdStats: ['stamina'] },
  10511: { venue: '中山',   distance: 2500, surface: 'dirt', direction: 'right',    thresholdStats: [] },

  // ===== 東京 =====
  10601: { venue: '東京',   distance: 1400, surface: 'turf', direction: 'left',     thresholdStats: ['stamina', 'power'] },
  10602: { venue: '東京',   distance: 1600, surface: 'turf', direction: 'left',     thresholdStats: ['stamina', 'guts'] },
  10603: { venue: '東京',   distance: 1800, surface: 'turf', direction: 'left',     thresholdStats: ['speed'] },
  10604: { venue: '東京',   distance: 2000, surface: 'turf', direction: 'left',     thresholdStats: [] },
  10605: { venue: '東京',   distance: 2300, surface: 'turf', direction: 'left',     thresholdStats: ['power'] },
  10607: { venue: '東京',   distance: 2500, surface: 'turf', direction: 'left',     thresholdStats: ['stamina'] },
  10608: { venue: '東京',   distance: 3400, surface: 'turf', direction: 'left',     thresholdStats: [] },
  10609: { venue: '東京',   distance: 1300, surface: 'dirt', direction: 'left',     thresholdStats: ['speed'] },
  10610: { venue: '東京',   distance: 1400, surface: 'dirt', direction: 'left',     thresholdStats: ['stamina'] },
  10611: { venue: '東京',   distance: 1600, surface: 'dirt', direction: 'left',     thresholdStats: ['speed', 'stamina'] },
  10612: { venue: '東京',   distance: 2100, surface: 'dirt', direction: 'left',     thresholdStats: [] },
  10613: { venue: '東京',   distance: 2400, surface: 'dirt', direction: 'left',     thresholdStats: ['stamina'] },

  // ===== 中京 =====
  10701: { venue: '中京',   distance: 1200, surface: 'turf', direction: 'left',     thresholdStats: [] },
  10702: { venue: '中京',   distance: 1400, surface: 'turf', direction: 'left',     thresholdStats: [] },
  10703: { venue: '中京',   distance: 1600, surface: 'turf', direction: 'left',     thresholdStats: ['speed'] },
  10704: { venue: '中京',   distance: 2000, surface: 'turf', direction: 'left',     thresholdStats: [] },
  10705: { venue: '中京',   distance: 2200, surface: 'turf', direction: 'left',     thresholdStats: ['stamina'] },
  10706: { venue: '中京',   distance: 1200, surface: 'dirt', direction: 'left',     thresholdStats: [] },
  10707: { venue: '中京',   distance: 1400, surface: 'dirt', direction: 'left',     thresholdStats: [] },
  10708: { venue: '中京',   distance: 1800, surface: 'dirt', direction: 'left',     thresholdStats: ['stamina'] },
  10709: { venue: '中京',   distance: 1900, surface: 'dirt', direction: 'left',     thresholdStats: [] },

  // ===== 京都 =====
  10801: { venue: '京都',   distance: 1200, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10802: { venue: '京都',   distance: 1400, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10803: { venue: '京都',   distance: 1400, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10804: { venue: '京都',   distance: 1600, surface: 'turf', direction: 'right',    thresholdStats: ['speed'] },
  10806: { venue: '京都',   distance: 1800, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10807: { venue: '京都',   distance: 2000, surface: 'turf', direction: 'right',    thresholdStats: ['power'] },
  10808: { venue: '京都',   distance: 2200, surface: 'turf', direction: 'right',    thresholdStats: ['speed'] },
  10809: { venue: '京都',   distance: 2400, surface: 'turf', direction: 'right',    thresholdStats: ['power'] },
  10810: { venue: '京都',   distance: 3000, surface: 'turf', direction: 'right',    thresholdStats: ['power', 'wiz'] },
  10811: { venue: '京都',   distance: 3200, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10812: { venue: '京都',   distance: 1200, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  10813: { venue: '京都',   distance: 1400, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  10814: { venue: '京都',   distance: 1800, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  10815: { venue: '京都',   distance: 1900, surface: 'dirt', direction: 'right',    thresholdStats: [] },

  // ===== 阪神 =====
  10901: { venue: '阪神',   distance: 1200, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10902: { venue: '阪神',   distance: 1400, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10903: { venue: '阪神',   distance: 1600, surface: 'turf', direction: 'right',    thresholdStats: ['power'] },
  10904: { venue: '阪神',   distance: 1800, surface: 'turf', direction: 'right',    thresholdStats: ['power'] },
  10905: { venue: '阪神',   distance: 2000, surface: 'turf', direction: 'right',    thresholdStats: ['guts'] },
  10906: { venue: '阪神',   distance: 2200, surface: 'turf', direction: 'right',    thresholdStats: ['speed'] },
  10907: { venue: '阪神',   distance: 2400, surface: 'turf', direction: 'right',    thresholdStats: ['power'] },
  10908: { venue: '阪神',   distance: 2600, surface: 'turf', direction: 'right',    thresholdStats: [] },
  10909: { venue: '阪神',   distance: 3000, surface: 'turf', direction: 'right',    thresholdStats: ['power'] },
  10910: { venue: '阪神',   distance: 1200, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  10911: { venue: '阪神',   distance: 1400, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  10912: { venue: '阪神',   distance: 1800, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  10913: { venue: '阪神',   distance: 2000, surface: 'dirt', direction: 'right',    thresholdStats: ['stamina', 'power'] },
  10914: { venue: '阪神',   distance: 3200, surface: 'turf', direction: 'right',    thresholdStats: [] },

  // ===== 小倉 =====
  11001: { venue: '小倉',   distance: 1200, surface: 'turf', direction: 'right',    thresholdStats: ['speed'] },
  11002: { venue: '小倉',   distance: 1800, surface: 'turf', direction: 'right',    thresholdStats: [] },
  11003: { venue: '小倉',   distance: 2000, surface: 'turf', direction: 'right',    thresholdStats: ['power'] },
  11004: { venue: '小倉',   distance: 2600, surface: 'turf', direction: 'right',    thresholdStats: ['stamina'] },
  11005: { venue: '小倉',   distance: 1000, surface: 'dirt', direction: 'right',    thresholdStats: ['speed'] },
  11006: { venue: '小倉',   distance: 1700, surface: 'dirt', direction: 'right',    thresholdStats: [] },
  11007: { venue: '小倉',   distance: 2400, surface: 'dirt', direction: 'right',    thresholdStats: [] },

  // ===== 大井 =====
  11101: { venue: '大井',   distance: 1200, surface: 'dirt', direction: 'right',    thresholdStats: ['guts', 'wiz'] },
  11102: { venue: '大井',   distance: 1800, surface: 'dirt', direction: 'right',    thresholdStats: ['power'] },
  11103: { venue: '大井',   distance: 2000, surface: 'dirt', direction: 'right',    thresholdStats: ['stamina'] },

  // ===== ロンシャン =====
  11201: { venue: 'ロンシャン',       distance: 1000, surface: 'turf', direction: 'straight', thresholdStats: [] },
  11202: { venue: 'ロンシャン',       distance: 1400, surface: 'turf', direction: 'right',    thresholdStats: [] },
  11203: { venue: 'ロンシャン',       distance: 2400, surface: 'turf', direction: 'right',    thresholdStats: ['stamina', 'power'] },

  // ===== 川崎 =====
  11301: { venue: '川崎',   distance: 1400, surface: 'dirt', direction: 'left',     thresholdStats: ['wiz'] },
  11302: { venue: '川崎',   distance: 1600, surface: 'dirt', direction: 'left',     thresholdStats: ['wiz'] },
  11303: { venue: '川崎',   distance: 2100, surface: 'dirt', direction: 'left',     thresholdStats: ['stamina', 'wiz'] },

  // ===== 船橋 =====
  11401: { venue: '船橋',   distance: 1000, surface: 'dirt', direction: 'left',     thresholdStats: ['speed'] },
  11402: { venue: '船橋',   distance: 1600, surface: 'dirt', direction: 'left',     thresholdStats: [] },
  11403: { venue: '船橋',   distance: 1800, surface: 'dirt', direction: 'left',     thresholdStats: [] },
  11404: { venue: '船橋',   distance: 2400, surface: 'dirt', direction: 'left',     thresholdStats: ['stamina'] },

  // ===== 盛岡 =====
  11501: { venue: '盛岡',   distance: 1200, surface: 'dirt', direction: 'left',     thresholdStats: ['stamina'] },
  11502: { venue: '盛岡',   distance: 1600, surface: 'dirt', direction: 'left',     thresholdStats: ['stamina', 'wiz'] },
  11503: { venue: '盛岡',   distance: 1800, surface: 'dirt', direction: 'left',     thresholdStats: ['stamina', 'wiz'] },
  11504: { venue: '盛岡',   distance: 2000, surface: 'dirt', direction: 'left',     thresholdStats: ['stamina'] },

  // ===== サンタアニタパーク =====
  11612: { venue: 'サンタアニタパーク', distance: 2000, surface: 'turf', direction: 'left',   thresholdStats: ['stamina'] },
  11613: { venue: 'サンタアニタパーク', distance: 1000, surface: 'turf', direction: 'left',   thresholdStats: ['speed', 'power'] },
  11614: { venue: 'サンタアニタパーク', distance: 1600, surface: 'turf', direction: 'left',   thresholdStats: ['wiz'] },
  11615: { venue: 'サンタアニタパーク', distance: 2000, surface: 'turf', direction: 'left',   thresholdStats: ['stamina', 'wiz'] },
  11616: { venue: 'サンタアニタパーク', distance: 2400, surface: 'turf', direction: 'left',   thresholdStats: ['stamina', 'guts'] },
  11617: { venue: 'サンタアニタパーク', distance: 1200, surface: 'dirt', direction: 'left',   thresholdStats: ['speed', 'power'] },
  11618: { venue: 'サンタアニタパーク', distance: 1400, surface: 'dirt', direction: 'left',   thresholdStats: ['speed'] },
  11619: { venue: 'サンタアニタパーク', distance: 1600, surface: 'dirt', direction: 'left',   thresholdStats: ['power', 'wiz'] },
  11620: { venue: 'サンタアニタパーク', distance: 1800, surface: 'dirt', direction: 'left',   thresholdStats: ['power'] },
  11621: { venue: 'サンタアニタパーク', distance: 2000, surface: 'dirt', direction: 'left',   thresholdStats: ['power', 'wiz'] },

  // ===== デルマー =====
  11701: { venue: 'デルマー', distance: 1000, surface: 'turf', direction: 'left',   thresholdStats: ['speed', 'power'] },
  11702: { venue: 'デルマー', distance: 1600, surface: 'turf', direction: 'left',   thresholdStats: ['wiz'] },
  11703: { venue: 'デルマー', distance: 2200, surface: 'turf', direction: 'left',   thresholdStats: ['power', 'wiz'] },
  11704: { venue: 'デルマー', distance: 2400, surface: 'turf', direction: 'left',   thresholdStats: ['stamina', 'guts'] },
  11705: { venue: 'デルマー', distance: 1200, surface: 'dirt', direction: 'left',   thresholdStats: ['speed', 'power'] },
  11706: { venue: 'デルマー', distance: 1400, surface: 'dirt', direction: 'left',   thresholdStats: ['speed'] },
  11707: { venue: 'デルマー', distance: 1600, surface: 'dirt', direction: 'left',   thresholdStats: ['power', 'wiz'] },
  11708: { venue: 'デルマー', distance: 1800, surface: 'dirt', direction: 'left',   thresholdStats: ['power'] },
  11709: { venue: 'デルマー', distance: 2000, surface: 'dirt', direction: 'left',   thresholdStats: ['power', 'wiz'] },
};

// コース選択UI用：会場名の表示順
const VENUE_ORDER = [
  '札幌', '函館', '新潟', '福島', '中山', '東京',
  '中京', '京都', '阪神', '小倉',
  '大井', '川崎', '船橋', '盛岡',
  'ロンシャン', 'サンタアニタパーク', 'デルマー',
];

// 距離カテゴリ
function getDistanceCategory(distance) {
  if (distance <= 1400) return '短距離';
  if (distance <= 1800) return 'マイル';
  if (distance <= 2400) return '中距離';
  return '長距離';
}

// コースの表示名を生成
function getCourseLabel(id) {
  const c = COURSE_DB[id];
  if (!c) return '';
  const surface = c.surface === 'turf' ? '芝' : 'ダート';
  const dir = c.direction === 'right' ? '右' : c.direction === 'left' ? '左' : '直線';
  return `${c.venue} ${c.distance}m ${surface} ${dir}`;
}

// 会場ごとにコースIDをグルーピング
function getCoursesByVenue() {
  const map = {};
  for (const id of Object.keys(COURSE_DB)) {
    const venue = COURSE_DB[id].venue;
    if (!map[venue]) map[venue] = [];
    map[venue].push(Number(id));
  }
  // 各会場内でIDでソート
  for (const venue of Object.keys(map)) {
    map[venue].sort((a, b) => a - b);
  }
  return map;
}
