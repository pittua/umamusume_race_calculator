// ============================================================
// ステータス計算モジュール
// ============================================================

const MOTIVATION_COEF = {
  excellent: 1.04,  // 絶好調
  good:      1.02,  // 好調
  normal:    1.00,  // 普通
  bad:       0.98,  // 不調
  terrible:  0.96,  // 絶不調
};

const STRATEGY_PROFICIENCY_MODIFIER = {
  S: 1.1, A: 1.0, B: 0.85, C: 0.75, D: 0.6, E: 0.4, F: 0.2, G: 0.1,
};

const GROUND_SPEED_MODIFIER = {
  turf:  { good: 0, slightly_heavy: 0, heavy: 0, bad: -50 },
  dirt:  { good: 0, slightly_heavy: 0, heavy: 0, bad: -50 },
};

const GROUND_POWER_MODIFIER = {
  turf:  { good: 0, slightly_heavy: -50, heavy: -50, bad: -50 },
  dirt:  { good: -100, slightly_heavy: -50, heavy: -100, bad: -100 },
};

const STAT_CAP = 2500;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * 基礎ステータス → ベースステータス変換
 * 1200超の部分は半減してからやる気係数を乗算
 */
function calcBaseStat(rawStat, motivationKey, aoharuBonus = 0) {
  let adjusted = rawStat;
  if (rawStat > 1200) {
    adjusted = 1200 + (rawStat - 1200) / 2;
  }
  const coef = MOTIVATION_COEF[motivationKey] ?? 1.0;
  return clamp((adjusted + aoharuBonus) * coef, 1, STAT_CAP);
}

/**
 * 調整後スピード
 */
function calcAdjustedSpeed(baseSpeed, raceCourseModifier, groundType, groundCondition) {
  const groundMod = GROUND_SPEED_MODIFIER[groundType]?.[groundCondition] ?? 0;
  return clamp(baseSpeed * raceCourseModifier + groundMod, 1, STAT_CAP);
}

/**
 * 調整後パワー
 */
function calcAdjustedPower(basePower, groundType, groundCondition) {
  const groundMod = GROUND_POWER_MODIFIER[groundType]?.[groundCondition] ?? 0;
  return clamp(basePower + groundMod, 1, STAT_CAP);
}

/**
 * 調整後スタミナ（補正なし）
 */
function calcAdjustedStamina(baseStamina) {
  return clamp(baseStamina, 1, STAT_CAP);
}

/**
 * 調整後根性（補正なし）
 */
function calcAdjustedGuts(baseGuts) {
  return clamp(baseGuts, 1, STAT_CAP);
}

/**
 * 調整後賢さ（脚質適性補正を乗算）
 */
function calcAdjustedWiz(baseWiz, strategyProficiencyKey) {
  const mod = STRATEGY_PROFICIENCY_MODIFIER[strategyProficiencyKey] ?? 1.0;
  return clamp(baseWiz * mod, 1, STAT_CAP);
}

/**
 * コース補正（Race Course Modifier）を計算
 * thresholdStats: コースの閾値ステータスの配列（0〜2個）
 * baseStats: 対応するベースステータスの配列
 */
function calcRaceCourseModifier(thresholdStats) {
  if (!thresholdStats || thresholdStats.length === 0) return 1.0;

  const bonuses = thresholdStats.map(stat => {
    if (stat <= 300)       return 0.05;
    if (stat <= 600)       return 0.10;
    if (stat <= 900)       return 0.15;
    return 0.20;
  });

  const avg = bonuses.reduce((a, b) => a + b, 0) / bonuses.length;
  return 1.0 + avg;
}

// ============================================================
// HP・スタミナ計算モジュール
// ============================================================

// 脚質係数（MaxHP用）
const STRATEGY_HP_COEF = {
  front_runner: 0.95,
  pace_chaser:  0.89,
  late_surger:  1.0,
  end_closer:   0.995,
  oonige:       0.86,
};

// HP消費のバ場補正
const HP_GROUND_MODIFIER = {
  turf: { good: 1.0, slightly_heavy: 1.0, heavy: 1.02, bad: 1.02 },
  dirt: { good: 1.0, slightly_heavy: 1.0, heavy: 1.01, bad: 1.02 },
};

/** MaxHP */
function calcMaxHP(adjStamina, strategyKey, courseDistance) {
  return 0.8 * (STRATEGY_HP_COEF[strategyKey] ?? 1.0) * adjStamina + courseDistance;
}

/** 根性補正（終盤・ラストスパートのHP消費に乗算） */
function calcGutsModifier(adjGuts) {
  return 1.0 + 200.0 / Math.sqrt(600.0 * adjGuts);
}

/** HP消費/秒（ある速度での概算・根性補正は呼び出し側で乗算） */
function calcHPConsPerSecond(currentSpeed, baseRaceSpeed, groundType, groundCondition) {
  const groundMod = HP_GROUND_MODIFIER[groundType]?.[groundCondition] ?? 1.0;
  return 20.0 * Math.pow(currentSpeed - baseRaceSpeed + 12.0, 2) / 144.0 * groundMod;
}

/** スキル発動率（ベース賢さを使用） */
function calcSkillActivationChance(baseWiz) {
  return Math.max(100 - 9000 / baseWiz, 20);
}

/**
 * 持久力温存 発動確率
 * ⚠️ MD原文でも「非常に推測的」と明記。実測値と乖離あり（賢さ1000 → 式:約67% / 実測:約93%）
 */
function calcStaminaKeepChance(adjWiz) {
  return clamp(30.0 * (adjWiz / 1000.0 + Math.pow(adjWiz, 0.03)), 0, 100);
}

/** HP・スタミナ計算まとめ */
function calcAllHP(params) {
  const {
    adjStamina, adjGuts, adjWiz, baseWiz,
    strategyKey, courseDistance,
    groundType, groundCondition,
    baseRaceSpeed,
    targetSpeeds,      // { early, mid, late }
    lastSpurtSpeedMax,
  } = params;

  const maxHP   = calcMaxHP(adjStamina, strategyKey, courseDistance);
  const gutsMod = calcGutsModifier(adjGuts);

  const hpCons = {
    early:     calcHPConsPerSecond(targetSpeeds.early, baseRaceSpeed, groundType, groundCondition),
    mid:       calcHPConsPerSecond(targetSpeeds.mid,   baseRaceSpeed, groundType, groundCondition),
    late:      calcHPConsPerSecond(targetSpeeds.late,  baseRaceSpeed, groundType, groundCondition) * gutsMod,
    lastSpurt: calcHPConsPerSecond(lastSpurtSpeedMax,  baseRaceSpeed, groundType, groundCondition) * gutsMod,
  };

  return {
    maxHP,
    gutsMod,
    hpCons,
    skillActivationChance: calcSkillActivationChance(baseWiz),
    staminaKeepChance:     calcStaminaKeepChance(adjWiz),
  };
}

// ============================================================
// 速度計算モジュール
// ============================================================

// 脚質フェーズ係数（目標速度用）
const STRATEGY_PHASE_COEF_SPEED = {
  front_runner: { early: 1.0,   mid: 0.98,  lateAndLast: 0.962 },
  pace_chaser:  { early: 0.978, mid: 0.991, lateAndLast: 0.975 },
  late_surger:  { early: 0.938, mid: 0.998, lateAndLast: 0.994 },
  end_closer:   { early: 0.931, mid: 1.0,   lateAndLast: 1.0   },
  oonige:       { early: 1.063, mid: 0.962, lateAndLast: 0.95  },
};

// 距離適性補正（目標速度・加速度の終盤/ラストスパート項）
const DISTANCE_PROFICIENCY_MODIFIER = {
  S: 1.05, A: 1.0, B: 0.9, C: 0.8, D: 0.6, E: 0.4, F: 0.2, G: 0.1,
};

/** 基準速度 */
function calcBaseRaceSpeed(courseDistance) {
  return 20.0 - (courseDistance - 2000) / 1000;
}

/** 基準目標速度（序盤・中盤）: スピード依存なし */
function calcBaseTargetSpeedEarlyMid(baseRaceSpeed, strategyKey, phase) {
  const coef = phase === 'early'
    ? STRATEGY_PHASE_COEF_SPEED[strategyKey].early
    : STRATEGY_PHASE_COEF_SPEED[strategyKey].mid;
  return baseRaceSpeed * coef;
}

/** 基準目標速度（終盤・ラストスパート）: スピード依存あり */
function calcBaseTargetSpeedLate(baseRaceSpeed, strategyKey, adjSpeed, distanceProfKey) {
  const coef    = STRATEGY_PHASE_COEF_SPEED[strategyKey].lateAndLast;
  const distMod = DISTANCE_PROFICIENCY_MODIFIER[distanceProfKey] ?? 1.0;
  return baseRaceSpeed * coef + Math.sqrt(500 * adjSpeed) * distMod * 0.002;
}

/** ラストスパート最大速度 */
function calcLastSpurtSpeedMax(baseRaceSpeed, strategyKey, adjSpeed, adjGuts, distanceProfKey) {
  const distMod       = DISTANCE_PROFICIENCY_MODIFIER[distanceProfKey] ?? 1.0;
  const baseTargetLate = calcBaseTargetSpeedLate(baseRaceSpeed, strategyKey, adjSpeed, distanceProfKey);
  return (baseTargetLate + 0.01 * baseRaceSpeed) * 1.05
    + Math.sqrt(500 * adjSpeed) * distMod * 0.002
    + Math.pow(450 * adjGuts, 0.597) * 0.0001;
}

/** 最低速度（HP切れ時の目標速度） */
function calcMinSpeed(baseRaceSpeed, adjGuts) {
  return 0.85 * baseRaceSpeed + Math.sqrt(200.0 * adjGuts) * 0.001;
}

/**
 * セクション乱数範囲（目標速度への加算量 = BaseSpeed × randomPct / 100）
 * adjWiz: 調整後賢さ, baseWiz: ベース賢さ（やる気補正後・脚質適性前）
 */
function calcSectionRandomness(adjWiz, baseWiz) {
  const maxPct = (adjWiz / 5500) * Math.log10(baseWiz * 0.1);
  const minPct = maxPct - 0.65;
  return { maxPct, minPct };
}

/**
 * 速度計算まとめ
 */
function calcAllSpeeds(params) {
  const { courseDistance, strategyKey, distanceProfKey, adjSpeed, adjGuts, adjWiz, baseWiz } = params;

  const baseRaceSpeed = calcBaseRaceSpeed(courseDistance);

  return {
    baseRaceSpeed,
    targetSpeed: {
      early: calcBaseTargetSpeedEarlyMid(baseRaceSpeed, strategyKey, 'early'),
      mid:   calcBaseTargetSpeedEarlyMid(baseRaceSpeed, strategyKey, 'mid'),
      late:  calcBaseTargetSpeedLate(baseRaceSpeed, strategyKey, adjSpeed, distanceProfKey),
    },
    lastSpurtSpeedMax: calcLastSpurtSpeedMax(baseRaceSpeed, strategyKey, adjSpeed, adjGuts, distanceProfKey),
    minSpeed:          calcMinSpeed(baseRaceSpeed, adjGuts),
    randomness:        calcSectionRandomness(adjWiz, baseWiz),
  };
}

// ============================================================
// 加速度計算モジュール
// ============================================================

// 脚質フェーズ係数（加速度用）
const STRATEGY_PHASE_COEF_ACCEL = {
  front_runner: { early: 1.0,   mid: 1.0,  lateAndLast: 0.996 },
  pace_chaser:  { early: 0.985, mid: 1.0,  lateAndLast: 0.996 },
  late_surger:  { early: 0.975, mid: 1.0,  lateAndLast: 1.0   },
  end_closer:   { early: 0.945, mid: 1.0,  lateAndLast: 0.997 },
  oonige:       { early: 1.17,  mid: 0.94, lateAndLast: 0.956 },
};

// バ場適性補正（加速度用）
const GROUND_TYPE_PROFICIENCY_MODIFIER = {
  S: 1.05, A: 1.0, B: 0.9, C: 0.8, D: 0.7, E: 0.5, F: 0.3, G: 0.1,
};

// 距離適性補正（加速度用）※速度用とは異なる
const DISTANCE_PROFICIENCY_MODIFIER_ACCEL = {
  S: 1.0, A: 1.0, B: 1.0, C: 1.0, D: 1.0, E: 0.6, F: 0.5, G: 0.4,
};

// 減速度（固定値）
const DECELERATION = {
  early:      -1.2,
  mid:        -0.8,
  late:       -1.0,
  paceDown:   -0.5,
  outOfHP:    -1.2,
};

/**
 * 加速度（通常時）
 * @param {'early'|'mid'|'lateAndLast'} phase
 */
function calcAccel(phase, adjPower, strategyKey, groundTypeProfKey, distanceProfKey) {
  const stratCoef  = STRATEGY_PHASE_COEF_ACCEL[strategyKey]?.[phase]   ?? 1.0;
  const groundProf = GROUND_TYPE_PROFICIENCY_MODIFIER[groundTypeProfKey] ?? 1.0;
  const distProf   = DISTANCE_PROFICIENCY_MODIFIER_ACCEL[distanceProfKey] ?? 1.0;
  return 0.0006 * Math.sqrt(500.0 * adjPower) * stratCoef * groundProf * distProf;
}

/** 加速度計算まとめ */
function calcAllAccels(params) {
  const { adjPower, strategyKey, groundTypeProfKey, distanceProfKey, baseRaceSpeed } = params;

  const early      = calcAccel('early',      adjPower, strategyKey, groundTypeProfKey, distanceProfKey);
  const mid        = calcAccel('mid',        adjPower, strategyKey, groundTypeProfKey, distanceProfKey);
  const lateAndLast = calcAccel('lateAndLast', adjPower, strategyKey, groundTypeProfKey, distanceProfKey);

  return {
    accel: { early, mid, lateAndLast, startDash: early + 24.0 },
    startDashEndSpeed: 0.85 * baseRaceSpeed,
    decel: DECELERATION,
  };
}

// ============================================================
// 特殊システム計算モジュール
// ============================================================

/** 掛かり確率（BaseWiz使用） */
function calcKakariChance(baseWiz) {
  return Math.pow(6.5 / Math.log10(0.1 * baseWiz + 1), 2);
}

/** スタミナ勝負 距離係数 */
function calcStaminaLBDistanceFactor(courseDistance) {
  if (courseDistance < 2101) return 0.0;
  if (courseDistance < 2201) return 0.5;
  if (courseDistance < 2401) return 1.0;
  if (courseDistance < 2601) return 1.5;
  return 1.8;
}

/** スタミナ勝負（BaseStamina > 1200 かつ距離 ≥ 2101m で発動） */
function calcStaminaLimitBreak(baseStamina, courseDistance) {
  const distFactor = calcStaminaLBDistanceFactor(courseDistance);
  if (baseStamina <= 1200 || distFactor === 0.0) {
    return { active: false, min: 0, max: 0, base: 0, distFactor };
  }
  const base = Math.sqrt(baseStamina - 1200) * 0.0085 * distFactor;
  return { active: true, min: base * 0.95, max: base * 1.02, base, distFactor };
}

/** 全開スパート加速度（基礎スピード ≥ 2000 で発動、近似値）
 *  条件はプレイヤーが見る基礎ステータス（rawSpeed）で判定
 */
function calcZenkaiSpurt(rawSpeed, adjPower, courseDistance) {
  if (rawSpeed < 2000) return { active: false, accel: 0 };
  const accel = 0.068 * Math.sqrt(500 * adjPower) / Math.pow(courseDistance / 1000, 1.5);
  return { active: true, accel };
}

// 賢さ上限突破バフ Wiz倍率テーブル
const WIZ_LB_TABLE = [
  [1,0],[21,0.02],[41,0.04],[61,0.06],[81,0.08],
  [101,0.1],[121,0.12],[141,0.14],[161,0.16],[181,0.18],
  [201,0.2],[221,0.26],[241,0.32],[261,0.38],[281,0.44],
  [301,0.5],[321,0.56],[341,0.62],[361,0.68],[381,0.74],
  [401,0.8],[421,0.81],[441,0.82],[461,0.83],[481,0.84],
  [501,0.85],[521,0.86],[541,0.87],[561,0.88],[581,0.89],
  [601,0.9],[621,0.91],[641,0.92],[661,0.93],[681,0.94],
  [701,0.95],[721,0.96],[741,0.97],[761,0.98],[781,0.99],
  [801,1.0],[901,1.01],[1001,1.02],[1101,1.03],[1201,1.04],
  [1301,1.05],[1401,1.06],[1501,1.07],[1601,1.08],[1701,1.09],
  [1801,1.1],[1901,1.11],[9999,1.12],
];

/** 賢さ上限突破バフ Wiz倍率（BaseWiz使用、脚質適性補正前）
 *  超過量は「その値以上で最小の閾値」の倍率に丸め上げる。
 *  （MD原典の例: 超過125 → 141の行 → 0.14。閾値Tの帯は (前のT, T] を意味する）
 */
function calcWizLBMultiplier(baseWiz) {
  const excess = baseWiz - 1200;
  if (excess < 1) return 0;
  for (const [threshold, m] of WIZ_LB_TABLE) {
    if (excess <= threshold) return m;
  }
  return WIZ_LB_TABLE[WIZ_LB_TABLE.length - 1][1];
}

// フェーズ脚質係数
const WIZ_LB_PHASE_COEF = {
  front_runner: { early: 0.26, mid: 0.23, late: 0.19, lastSpurt: 0.16 },
  pace_chaser:  { early: 0.21, mid: 0.21, late: 0.21, lastSpurt: 0.21 },
  late_surger:  { early: 0.19, mid: 0.18, late: 0.23, lastSpurt: 0.24 },
  end_closer:   { early: 0.15, mid: 0.17, late: 0.25, lastSpurt: 0.27 },
  oonige:       { early: 0.26, mid: 0.23, late: 0.19, lastSpurt: 0.16 },
};

/** 特殊システム計算まとめ */
function calcAllSpecialSystems(params) {
  const { baseWiz, baseStamina, rawSpeed, adjPower, courseDistance, strategyKey } = params;
  return {
    kakariChance:  calcKakariChance(baseWiz),
    staminaLB:     calcStaminaLimitBreak(baseStamina, courseDistance),
    zenkaiSpurt:   calcZenkaiSpurt(rawSpeed, adjPower, courseDistance),
    wizLBMult:     calcWizLBMultiplier(baseWiz),
    wizLBPhase:    WIZ_LB_PHASE_COEF[strategyKey] ?? WIZ_LB_PHASE_COEF.pace_chaser,
    wizLBActive:   baseWiz > 1200,
  };
}

// ============================================================
// 競走システム（追い比べ・足を貯める・位置取り調整・リード確保）
// ============================================================

/** 追い比べ 効果量（根性ベース） */
function calcDueling(adjGuts) {
  return {
    speedBoost: Math.pow(200 * adjGuts, 0.708) * 0.0001,
    accelBoost: Math.pow(160 * adjGuts, 0.59)  * 0.0001,
  };
}

// 足を貯める 脚質-距離係数（大逃げは逃げと同じ値を使用）
const CHARGE_UP_STRAT_DIST_COEF = {
  front_runner: { sprint: 1.0,  mile: 1.0,  middle: 1.0,   long: 1.0 },
  pace_chaser:  { sprint: 0.7,  mile: 0.8,  middle: 0.9,   long: 0.9 },
  late_surger:  { sprint: 0.75, mile: 0.7,  middle: 0.875, long: 1.0 },
  end_closer:   { sprint: 0.7,  mile: 0.75, middle: 0.86,  long: 0.9 },
  oonige:       { sprint: 1.0,  mile: 1.0,  middle: 1.0,   long: 1.0 },
};

function getDistanceType(courseDistance) {
  if (courseDistance <= 1400) return 'sprint';
  if (courseDistance <= 1800) return 'mile';
  if (courseDistance <= 2400) return 'middle';
  return 'long';
}

/**
 * 足を貯める（ラストスパート開始時の追加加速度）
 * PowerStat = rawPower × motivationCoef（1200超えでも半減しない）
 */
function calcChargeUp(rawPower, motivationKey, strategyKey, courseDistance) {
  const powerStat = rawPower * (MOTIVATION_COEF[motivationKey] ?? 1.0);
  if (powerStat <= 1200) return { active: false };

  const distType      = getDistanceType(courseDistance);
  const stratDistCoef = CHARGE_UP_STRAT_DIST_COEF[strategyKey]?.[distType] ?? 1.0;
  const base          = Math.sqrt((powerStat - 1200) * 130) * 0.001;

  return {
    active:            true,
    powerStat,
    accelNormal:       base * stratDistCoef,
    accelSpotStruggle: base * stratDistCoef * 0.98,
    accelRushed:       base * stratDistCoef * 0.8,
  };
}

/** 位置取り調整・リード確保 共通スタミナ消費の距離係数 */
function calcPositionDistCoef(courseDistance) {
  if (courseDistance < 1401) return 0.3;
  if (courseDistance < 1801) return 0.3;
  if (courseDistance < 2101) return 0.5;
  if (courseDistance < 2201) return 0.8;
  if (courseDistance < 2401) return 1.0;
  if (courseDistance < 2601) return 1.1;
  return 1.2;
}

// 位置取り調整 脚質係数
const CBSPURT_SPEED_COEF = {
  front_runner: 0.8, pace_chaser: 1.0, late_surger: 1.0, end_closer: 1.0, oonige: 0.2,
};
const CBSPURT_STAM_COEF = {
  front_runner: 1.2, pace_chaser: 1.0, late_surger: 1.0, end_closer: 1.0, oonige: 1.5,
};

/** 位置取り調整 効果量 */
function calcCompeteBeforeSpurt(adjPower, adjGuts, strategyKey, courseDistance) {
  const speedCoef  = CBSPURT_SPEED_COEF[strategyKey] ?? 1.0;
  const stamCoef   = CBSPURT_STAM_COEF[strategyKey]  ?? 1.0;
  const distCoef   = calcPositionDistCoef(courseDistance);
  const speedIncrease     = (Math.pow(adjPower / 1500, 0.5) * 2.0 + Math.pow(adjGuts / 3000, 0.2)) * 0.1 * speedCoef;
  const stamNoNear        = 20 * (stamCoef * distCoef);
  const stamWithNear      = 20 * (stamCoef * distCoef + 0.5);
  // 逃げ単独ボーナス（同脚質が10m以内にいない場合）
  const soloFrontBonus = (strategyKey === 'front_runner') ? speedIncrease * 1.1
                       : (strategyKey === 'oonige')        ? speedIncrease * 2.0
                       : null;
  return { speedIncrease, stamNoNear, stamWithNear, soloFrontBonus };
}

// リード確保 脚質係数（追込は適用なし）
const SECURE_LEAD_SPEED_COEF = {
  front_runner: 1.0, pace_chaser: 1.0, late_surger: 0.8, oonige: 0.2,
};
const SECURE_LEAD_STAM_COEF = {
  front_runner: 1.0, pace_chaser: 0.8, late_surger: 0.8, oonige: 1.2,
};

/** リード確保 効果量（追込は適用なし） */
function calcSecureLead(adjGuts, strategyKey, courseDistance) {
  if (strategyKey === 'end_closer') return { applicable: false };
  const speedCoef = SECURE_LEAD_SPEED_COEF[strategyKey] ?? 1.0;
  const stamCoef  = SECURE_LEAD_STAM_COEF[strategyKey]  ?? 1.0;
  const distCoef  = calcPositionDistCoef(courseDistance);
  const speedIncrease   = Math.pow(adjGuts / 2000, 0.5) * 0.3 * speedCoef;
  const stamConsumption = 20 * stamCoef * distCoef;
  // 逃げ単独ボーナス（同脚質が10m以内にいない場合）
  const soloFrontBonus = (strategyKey === 'front_runner') ? speedIncrease * 4.0
                       : (strategyKey === 'oonige')        ? speedIncrease * 7.0
                       : null;
  return { applicable: true, speedIncrease, stamConsumption, soloFrontBonus };
}

/** 競走システム計算まとめ */
function calcAllCompeteSystems(params) {
  const { adjGuts, adjPower, rawPower, motivationKey, strategyKey, courseDistance } = params;
  return {
    dueling:            calcDueling(adjGuts),
    chargeUp:           calcChargeUp(rawPower, motivationKey, strategyKey, courseDistance),
    competeBeforeSpurt: calcCompeteBeforeSpurt(adjPower, adjGuts, strategyKey, courseDistance),
    secureLead:         calcSecureLead(adjGuts, strategyKey, courseDistance),
  };
}

// ============================================================

function calcAllStats(params) {
  const {
    rawSpeed, rawStamina, rawPower, rawGuts, rawWiz,
    motivation,
    groundType, groundCondition,
    strategyProficiency,
    raceCourseThresholdStats = [],
    aoharuBonus = 0,
  } = params;

  // ベースステータス
  const baseSpeed   = calcBaseStat(rawSpeed,   motivation, aoharuBonus);
  const baseStamina = calcBaseStat(rawStamina, motivation, aoharuBonus);
  const basePower   = calcBaseStat(rawPower,   motivation, aoharuBonus);
  const baseGuts    = calcBaseStat(rawGuts,    motivation, aoharuBonus);
  const baseWiz     = calcBaseStat(rawWiz,     motivation, aoharuBonus);

  // コース補正
  const raceCourseModifier = calcRaceCourseModifier(raceCourseThresholdStats);

  // 調整後ステータス
  const adjSpeed   = calcAdjustedSpeed(baseSpeed, raceCourseModifier, groundType, groundCondition);
  const adjStamina = calcAdjustedStamina(baseStamina);
  const adjPower   = calcAdjustedPower(basePower, groundType, groundCondition);
  const adjGuts    = calcAdjustedGuts(baseGuts);
  const adjWiz     = calcAdjustedWiz(baseWiz, strategyProficiency);

  return {
    base:     { speed: baseSpeed, stamina: baseStamina, power: basePower, guts: baseGuts, wiz: baseWiz },
    adjusted: { speed: adjSpeed,  stamina: adjStamina,  power: adjPower,  guts: adjGuts,  wiz: adjWiz  },
    raceCourseModifier,
  };
}

// ============================================================
// Node.js（テスト）向けエクスポート — ブラウザでは無視される
// ============================================================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    clamp,
    calcBaseStat,
    calcAdjustedSpeed,
    calcAdjustedPower,
    calcAdjustedWiz,
    calcRaceCourseModifier,
    calcMaxHP,
    calcGutsModifier,
    calcHPConsPerSecond,
    calcSkillActivationChance,
    calcStaminaKeepChance,
    calcAllHP,
    calcBaseRaceSpeed,
    calcBaseTargetSpeedEarlyMid,
    calcBaseTargetSpeedLate,
    calcLastSpurtSpeedMax,
    calcMinSpeed,
    calcSectionRandomness,
    calcAllSpeeds,
    calcAccel,
    calcAllAccels,
    calcKakariChance,
    calcStaminaLimitBreak,
    calcZenkaiSpurt,
    calcWizLBMultiplier,
    calcAllSpecialSystems,
    calcDueling,
    calcChargeUp,
    calcCompeteBeforeSpurt,
    calcSecureLead,
    calcAllCompeteSystems,
    calcAllStats,
    MOTIVATION_COEF,
    STAT_CAP,
  };
}
