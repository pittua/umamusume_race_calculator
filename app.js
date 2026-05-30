const STAT_LABELS = {
  speed:   'スピード',
  stamina: 'スタミナ',
  power:   'パワー',
  guts:    '根性',
  wiz:     '賢さ',
};

const THRESHOLD_STAT_LABELS = {
  speed: 'スピード', stamina: 'スタミナ', power: 'パワー', guts: '根性', wiz: '賢さ',
};

// ===== コース選択UI =====
function initCourseSelect() {
  const venueSelect    = document.getElementById('venueSelect');
  const courseSelect   = document.getElementById('courseSelect');
  const coursesByVenue = getCoursesByVenue();

  for (const venue of VENUE_ORDER) {
    if (!coursesByVenue[venue]) continue;
    const opt = document.createElement('option');
    opt.value = venue;
    opt.textContent = venue;
    venueSelect.appendChild(opt);
  }

  venueSelect.value = '東京';
  venueSelect.addEventListener('change', updateCourseOptions);
  courseSelect.addEventListener('change', updateCourseNote);
  updateCourseOptions();
  courseSelect.value = '10606'; // 東京 2400m 芝 左
  updateCourseNote();
}

function updateCourseOptions() {
  const venueSelect    = document.getElementById('venueSelect');
  const courseSelect   = document.getElementById('courseSelect');
  const coursesByVenue = getCoursesByVenue();

  courseSelect.innerHTML = '';
  for (const id of (coursesByVenue[venueSelect.value] ?? [])) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = getCourseLabel(id);
    courseSelect.appendChild(opt);
  }
  updateCourseNote();
}

function updateCourseNote() {
  const courseSelect = document.getElementById('courseSelect');
  const note = document.getElementById('courseThresholdNote');
  const course = COURSE_DB[Number(courseSelect.value)];
  if (!course) { note.textContent = ''; return; }

  note.textContent = course.thresholdStats.length === 0
    ? 'コース補正: なし'
    : `コース補正対象: ${course.thresholdStats.map(s => THRESHOLD_STAT_LABELS[s]).join('・')}`;
}

// ===== 入力値の取得 =====
function getInputs() {
  const courseId = Number(document.getElementById('courseSelect').value);
  const course   = COURSE_DB[courseId];
  return {
    rawSpeed:            parseInt(document.getElementById('rawSpeed').value),
    rawStamina:          parseInt(document.getElementById('rawStamina').value),
    rawPower:            parseInt(document.getElementById('rawPower').value),
    rawGuts:             parseInt(document.getElementById('rawGuts').value),
    rawWiz:              parseInt(document.getElementById('rawWiz').value),
    motivation:          document.getElementById('motivation').value,
    groundType:          course?.surface ?? 'turf',
    groundCondition:     document.getElementById('groundCondition').value,
    strategyProficiency:  document.getElementById('strategyProficiency').value,
    strategyType:         document.getElementById('strategyType').value,
    distanceProficiency:  document.getElementById('distanceProficiency').value,
    groundTypeProficiency: document.getElementById('groundTypeProficiency').value,
    courseId,
    course,
  };
}

// ===== テーブル描画ユーティリティ =====
function renderTable(tbodyId, rows) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = '';
  for (const [label, value] of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${label}</td><td>${value}</td>`;
    tbody.appendChild(tr);
  }
}

function fmt(n, digits = 3) {
  return n.toFixed(digits);
}

// ===== 計算ボタン =====
document.getElementById('calcBtn').addEventListener('click', () => {
  const inputs = getInputs();

  // ---- ステータス計算 ----
  const tempBase = {
    speed:   calcBaseStat(inputs.rawSpeed,   inputs.motivation),
    stamina: calcBaseStat(inputs.rawStamina, inputs.motivation),
    power:   calcBaseStat(inputs.rawPower,   inputs.motivation),
    guts:    calcBaseStat(inputs.rawGuts,    inputs.motivation),
    wiz:     calcBaseStat(inputs.rawWiz,     inputs.motivation),
  };

  const thresholdBaseValues = (inputs.course?.thresholdStats ?? []).map(key => tempBase[key]);

  const statResult = calcAllStats({
    rawSpeed:   inputs.rawSpeed,
    rawStamina: inputs.rawStamina,
    rawPower:   inputs.rawPower,
    rawGuts:    inputs.rawGuts,
    rawWiz:     inputs.rawWiz,
    motivation:           inputs.motivation,
    groundType:           inputs.groundType,
    groundCondition:      inputs.groundCondition,
    strategyProficiency:  inputs.strategyProficiency,
    raceCourseThresholdStats: thresholdBaseValues,
  });

  // ベース/調整後ステータス表示
  renderTable('baseStatTable',
    Object.entries(STAT_LABELS).map(([k, l]) => [l, Math.round(statResult.base[k])])
  );
  renderTable('adjStatTable',
    Object.entries(STAT_LABELS).map(([k, l]) => [l, Math.round(statResult.adjusted[k])])
  );

  const mod = statResult.raceCourseModifier;
  document.getElementById('courseModDisplay').textContent =
    mod === 1.0 ? '×1.000（補正なし）' : `×${mod.toFixed(3)}`;

  // ---- 速度計算 ----
  const courseDistance = inputs.course?.distance ?? 2000;

  const speedResult = calcAllSpeeds({
    courseDistance,
    strategyKey:      inputs.strategyType,
    distanceProfKey:  inputs.distanceProficiency,
    adjSpeed:         statResult.adjusted.speed,
    adjGuts:          statResult.adjusted.guts,
    adjWiz:           statResult.adjusted.wiz,
    baseWiz:          statResult.base.wiz,
  });

  // フェーズ別目標速度
  renderTable('targetSpeedTable', [
    ['序盤',          fmt(speedResult.targetSpeed.early)],
    ['中盤',          fmt(speedResult.targetSpeed.mid)],
    ['終盤・最終盤',  fmt(speedResult.targetSpeed.late)],
  ]);

  // その他速度指標
  const { maxPct, minPct } = speedResult.randomness;
  const sign = v => (v >= 0 ? '+' : '') + fmt(v, 3);
  renderTable('speedSummaryTable', [
    ['基準速度',               fmt(speedResult.baseRaceSpeed) + ' m/s'],
    ['ラストスパート最大速度', fmt(speedResult.lastSpurtSpeedMax) + ' m/s'],
    ['最低速度（HP切れ時）',   fmt(speedResult.minSpeed) + ' m/s'],
    ['セクション乱数範囲',     `${sign(minPct)}% 〜 ${sign(maxPct)}%`],
  ]);

  // ---- HP・スタミナ計算 ----
  const hpResult = calcAllHP({
    adjStamina:       statResult.adjusted.stamina,
    adjGuts:          statResult.adjusted.guts,
    adjWiz:           statResult.adjusted.wiz,
    baseWiz:          statResult.base.wiz,
    strategyKey:      inputs.strategyType,
    courseDistance,
    groundType:       inputs.groundType,
    groundCondition:  inputs.groundCondition,
    baseRaceSpeed:    speedResult.baseRaceSpeed,
    targetSpeeds:     speedResult.targetSpeed,
    lastSpurtSpeedMax: speedResult.lastSpurtSpeedMax,
  });

  // HP消費/秒テーブル
  renderTable('hpConsTable', [
    ['序盤',                           fmt(hpResult.hpCons.early)],
    ['中盤',                           fmt(hpResult.hpCons.mid)],
    ['終盤（根性補正込み）',           fmt(hpResult.hpCons.late)],
    ['ラストスパート（根性補正込み）', fmt(hpResult.hpCons.lastSpurt)],
  ]);

  // HP概要・賢さ関連テーブル
  renderTable('hpSummaryTable', [
    ['MaxHP',                       Math.round(hpResult.maxHP)],
    ['根性補正（終盤/最終盤）',      '×' + fmt(hpResult.gutsMod)],
    ['スキル発動率',                 fmt(hpResult.skillActivationChance, 1) + '%'],
    ['持久力温存確率 ⚠️',            fmt(hpResult.staminaKeepChance, 1) + '%'],
  ]);

  // ---- 加速度計算 ----
  const accelResult = calcAllAccels({
    adjPower:          statResult.adjusted.power,
    strategyKey:       inputs.strategyType,
    groundTypeProfKey: inputs.groundTypeProficiency,
    distanceProfKey:   inputs.distanceProficiency,
    baseRaceSpeed:     speedResult.baseRaceSpeed,
  });

  renderTable('accelTable', [
    ['序盤',                        fmt(accelResult.accel.early,      4)],
    ['中盤',                        fmt(accelResult.accel.mid,        4)],
    ['終盤・最終盤',                fmt(accelResult.accel.lateAndLast, 4)],
    ['スタートダッシュ時（序盤）',  fmt(accelResult.accel.startDash,  4)],
  ]);

  const d = accelResult.decel;
  renderTable('decelTable', [
    ['スタートダッシュ終了速度', fmt(accelResult.startDashEndSpeed) + ' m/s'],
    ['減速度（序盤）',           d.early     + ' m/s²'],
    ['減速度（中盤）',           d.mid       + ' m/s²'],
    ['減速度（終盤）',           d.late      + ' m/s²'],
    ['減速度（ペースダウン）',   d.paceDown  + ' m/s²'],
    ['減速度（体力切れ）',       d.outOfHP   + ' m/s²'],
  ]);

  // ---- 特殊システム計算 ----
  const special = calcAllSpecialSystems({
    baseWiz:       statResult.base.wiz,
    baseStamina:   statResult.base.stamina,
    rawSpeed:      inputs.rawSpeed,
    adjPower:      statResult.adjusted.power,
    courseDistance,
    strategyKey:   inputs.strategyType,
  });

  // 掛かり確率
  renderTable('kakariTable', [
    ['掛かり確率', fmt(special.kakariChance, 2) + '%'],
  ]);

  // スタミナ勝負
  if (!special.staminaLB.active) {
    const reason = statResult.base.stamina <= 1200
      ? '適用なし（BaseStamina ≤ 1200）'
      : '適用なし（距離 < 2101m）';
    renderTable('staminaLBTable', [['状態', reason]]);
  } else {
    renderTable('staminaLBTable', [
      ['距離係数',           '×' + special.staminaLB.distFactor.toFixed(1)],
      ['速度バフ（基準値）', fmt(special.staminaLB.base) + ' m/s'],
      ['速度バフ（最小）',   fmt(special.staminaLB.min)  + ' m/s（×0.95）'],
      ['速度バフ（最大）',   fmt(special.staminaLB.max)  + ' m/s（×1.02）'],
    ]);
  }

  // 全開スパート
  if (!special.zenkaiSpurt.active) {
    renderTable('zenkaiTable', [['状態', '適用なし（基礎スピード < 2000）']]);
  } else {
    renderTable('zenkaiTable', [
      ['状態',             '発動可能'],
      ['加速度（近似値）', fmt(special.zenkaiSpurt.accel, 4) + ' m/s²'],
    ]);
  }

  // 賢さ上限突破バフ
  if (!special.wizLBActive) {
    renderTable('wizLBTable', [['状態', '適用なし（BaseWiz ≤ 1200）']]);
  } else {
    const p = special.wizLBPhase;
    const m = special.wizLBMult;
    renderTable('wizLBTable', [
      ['Wiz超過量',              Math.floor(statResult.base.wiz - 1200)],
      ['Wiz倍率',                fmt(m, 2)],
      ['序盤　係数 × Wiz倍率',  fmt(p.early,    2) + ' × ' + fmt(m, 2) + ' = ' + fmt(p.early    * m, 3)],
      ['中盤　係数 × Wiz倍率',  fmt(p.mid,      2) + ' × ' + fmt(m, 2) + ' = ' + fmt(p.mid      * m, 3)],
      ['終盤　係数 × Wiz倍率',  fmt(p.late,     2) + ' × ' + fmt(m, 2) + ' = ' + fmt(p.late     * m, 3)],
      ['最終盤　係数 × Wiz倍率',fmt(p.lastSpurt,2) + ' × ' + fmt(m, 2) + ' = ' + fmt(p.lastSpurt* m, 3)],
    ]);
  }

  // ---- 競走システム計算 ----
  const compete = calcAllCompeteSystems({
    adjGuts:      statResult.adjusted.guts,
    adjPower:     statResult.adjusted.power,
    rawPower:     inputs.rawPower,
    motivationKey: inputs.motivation,
    strategyKey:  inputs.strategyType,
    courseDistance,
  });

  // 追い比べ
  renderTable('duelingTable', [
    ['速度ボーナス', fmt(compete.dueling.speedBoost) + ' m/s'],
    ['加速度ボーナス', fmt(compete.dueling.accelBoost, 4) + ' m/s²'],
  ]);

  // 足を貯める
  if (!compete.chargeUp.active) {
    renderTable('chargeUpTable', [['状態', '適用なし（パワー × やる気係数 ≤ 1200）']]);
  } else {
    renderTable('chargeUpTable', [
      ['パワーステータス（半減なし）', Math.round(compete.chargeUp.powerStat)],
      ['加速度（通常）',         fmt(compete.chargeUp.accelNormal,       4) + ' m/s²'],
      ['加速度（位置取り争い）', fmt(compete.chargeUp.accelSpotStruggle, 4) + ' m/s² （×0.98）'],
      ['加速度（掛かり）',       fmt(compete.chargeUp.accelRushed,       4) + ' m/s² （×0.80）'],
    ]);
  }

  // 位置取り調整
  const cbs = compete.competeBeforeSpurt;
  const cbsRows = [
    ['速度増加',                       fmt(cbs.speedIncrease) + ' m/s'],
    ['スタミナ消費（リード距離トリガー）', fmt(cbs.stamNoNear,   1)],
    ['スタミナ消費（近隣のみトリガー）', fmt(cbs.stamWithNear,  1)],
  ];
  if (cbs.soloFrontBonus !== null) {
    cbsRows.push(['速度増加（同脚質単独）', fmt(cbs.soloFrontBonus) + ' m/s']);
  }
  renderTable('cbSpurtTable', cbsRows);

  // リード確保
  const sl = compete.secureLead;
  if (!sl.applicable) {
    renderTable('secureLeadTable', [['状態', '適用なし（追込は非対象）']]);
  } else {
    const slRows = [
      ['速度増加',       fmt(sl.speedIncrease) + ' m/s'],
      ['スタミナ消費', fmt(sl.stamConsumption, 1)],
    ];
    if (sl.soloFrontBonus !== null) {
      slRows.push(['速度増加（同脚質単独）', fmt(sl.soloFrontBonus) + ' m/s']);
    }
    renderTable('secureLeadTable', slRows);
  }

  document.getElementById('result-section').hidden = false;
  document.getElementById('result-section').scrollIntoView({ behavior: 'smooth' });
});

// ===== 起動 =====
initCourseSelect();
