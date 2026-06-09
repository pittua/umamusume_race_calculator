// calculator.js のユニットテスト
// 依存ゼロ: Node 標準の assert と test ランナーのみ（`node test/calculator.test.js` で実行）
const assert = require('node:assert/strict');
const { test } = require('node:test');

const C = require('../calculator.js');

// 浮動小数比較ヘルパー
function near(actual, expected, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= eps,
    `expected ${actual} ≈ ${expected} (差 ${Math.abs(actual - expected)})`);
}

// ---- clamp ----
test('clamp: 範囲内・上下限', () => {
  assert.equal(C.clamp(5, 1, 10), 5);
  assert.equal(C.clamp(-3, 1, 10), 1);
  assert.equal(C.clamp(99, 1, 10), 10);
});

// ---- calcBaseStat ----
test('calcBaseStat: 1200以下はやる気係数のみ', () => {
  near(C.calcBaseStat(1000, 'normal'), 1000);
  near(C.calcBaseStat(1000, 'excellent'), 1040);  // ×1.04
  near(C.calcBaseStat(1000, 'terrible'), 960);     // ×0.96
});

test('calcBaseStat: 1200超は超過分を半減してから係数', () => {
  // 1400 → 1200 + (200/2) = 1300、普通なら 1300
  near(C.calcBaseStat(1400, 'normal'), 1300);
  // 絶好調なら 1300 × 1.04 = 1352
  near(C.calcBaseStat(1400, 'excellent'), 1352);
});

test('calcBaseStat: 上限2500でクランプ', () => {
  assert.ok(C.calcBaseStat(2500, 'excellent') <= C.STAT_CAP);
});

// ---- calcRaceCourseModifier ----
test('calcRaceCourseModifier: 閾値なしは1.0', () => {
  near(C.calcRaceCourseModifier([]), 1.0);
  near(C.calcRaceCourseModifier(null), 1.0);
});

test('calcRaceCourseModifier: 閾値段階', () => {
  near(C.calcRaceCourseModifier([300]), 1.05);   // ≤300 → +0.05
  near(C.calcRaceCourseModifier([1000]), 1.20);  // >900 → +0.20
  // 2項目の平均: (0.05 + 0.20)/2 = 0.125 → 1.125
  near(C.calcRaceCourseModifier([300, 1000]), 1.125);
});

// ---- calcAdjustedWiz ----
test('calcAdjustedWiz: 脚質適性補正', () => {
  near(C.calcAdjustedWiz(1000, 'A'), 1000);  // ×1.0
  near(C.calcAdjustedWiz(1000, 'S'), 1100);  // ×1.1
  near(C.calcAdjustedWiz(1000, 'G'), 100);   // ×0.1
});

// ---- calcBaseRaceSpeed ----
test('calcBaseRaceSpeed: 距離依存', () => {
  near(C.calcBaseRaceSpeed(2000), 20.0);
  near(C.calcBaseRaceSpeed(3000), 19.0);
  near(C.calcBaseRaceSpeed(1000), 21.0);
});

// ---- calcMaxHP ----
test('calcMaxHP: 0.8 × 脚質係数 × スタミナ + 距離', () => {
  // late_surger 係数1.0、スタミナ1000、距離2000 → 0.8*1000 + 2000 = 2800
  near(C.calcMaxHP(1000, 'late_surger', 2000), 2800);
});

// ---- calcSkillActivationChance ----
test('calcSkillActivationChance: 下限20%', () => {
  assert.equal(C.calcSkillActivationChance(100), 20);          // 100-90=10 → 下限20
  near(C.calcSkillActivationChance(900), 100 - 9000 / 900);    // =90
});

// ---- calcStaminaLimitBreak ----
test('calcStaminaLimitBreak: 条件未達は非発動', () => {
  assert.equal(C.calcStaminaLimitBreak(1200, 2400).active, false); // スタミナ ≤1200
  assert.equal(C.calcStaminaLimitBreak(1500, 2000).active, false); // 距離 <2101
});

test('calcStaminaLimitBreak: 発動時の範囲', () => {
  const r = C.calcStaminaLimitBreak(1300, 2400);
  assert.equal(r.active, true);
  assert.ok(r.min < r.base && r.base < r.max);
});

// ---- calcZenkaiSpurt ----
test('calcZenkaiSpurt: 基礎スピード2000未満は非発動', () => {
  assert.equal(C.calcZenkaiSpurt(1999, 1000, 2000).active, false);
  assert.equal(C.calcZenkaiSpurt(2000, 1000, 2000).active, true);
});

// ---- calcWizLBMultiplier ----
test('calcWizLBMultiplier: 1200以下は0', () => {
  assert.equal(C.calcWizLBMultiplier(1200), 0);
  assert.equal(C.calcWizLBMultiplier(1100), 0);
});

test('calcWizLBMultiplier: 超過量に応じた倍率', () => {
  assert.equal(C.calcWizLBMultiplier(1221), 0.02); // 超過21 → [21,0.02]
  assert.equal(C.calcWizLBMultiplier(1400), 0.18); // 超過200 → [181,0.18]（[201]未満）
  assert.equal(C.calcWizLBMultiplier(1401), 0.2);  // 超過201 → [201,0.2]
});

// ---- calcChargeUp ----
test('calcChargeUp: PowerStatが1200以下なら非発動', () => {
  // rawPower=1000, normal → powerStat=1000 ≤1200
  assert.equal(C.calcChargeUp(1000, 'normal', 'pace_chaser', 2000).active, false);
});

test('calcChargeUp: 1200超で発動、半減なし', () => {
  // rawPower=1300, normal → powerStat=1300（半減しない）
  const r = C.calcChargeUp(1300, 'normal', 'front_runner', 2000);
  assert.equal(r.active, true);
  near(r.powerStat, 1300);
  // 掛かり倍率0.8 < 通常
  assert.ok(r.accelRushed < r.accelNormal);
});

// ---- calcSecureLead ----
test('calcSecureLead: 追込は非適用', () => {
  assert.equal(C.calcSecureLead(1000, 'end_closer', 2000).applicable, false);
  assert.equal(C.calcSecureLead(1000, 'front_runner', 2000).applicable, true);
});

// ---- 統合: calcAllStats ----
test('calcAllStats: ベース/調整後/コース補正を返す', () => {
  const r = C.calcAllStats({
    rawSpeed: 1200, rawStamina: 1200, rawPower: 1200, rawGuts: 1200, rawWiz: 1200,
    motivation: 'normal', groundType: 'turf', groundCondition: 'good',
    strategyProficiency: 'A', raceCourseThresholdStats: [],
  });
  near(r.base.speed, 1200);
  near(r.raceCourseModifier, 1.0);
  // 良バ場・補正なしなら調整後スピード = ベース
  near(r.adjusted.speed, 1200);
});

test('calcAllStats: 不良芝でスピード-50・パワー-50', () => {
  const r = C.calcAllStats({
    rawSpeed: 1000, rawStamina: 1000, rawPower: 1000, rawGuts: 1000, rawWiz: 1000,
    motivation: 'normal', groundType: 'turf', groundCondition: 'bad',
    strategyProficiency: 'A', raceCourseThresholdStats: [],
  });
  near(r.adjusted.speed, 950);  // 1000 - 50
  near(r.adjusted.power, 950);  // 1000 - 50
});
