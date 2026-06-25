/* ═══════════════════════════════════════════
   AI COACH — Official deduction-based scoring
   Starts at 10.0, deductions per WAG E-score rules
   MediaPipe Pose loaded on demand
═══════════════════════════════════════════ */

// ── State ──────────────────────────────────
let _coachStream      = null;
let _coachPoseInst    = null;
let _coachLoopActive  = false;
let _coachFacing      = 'environment';
let _coachMove        = 'handstand';
let _coachMode        = 'camera';   // 'camera' | 'upload'
let _mpLoaded         = false;

// Phase: ready → recording → complete
let _coachPhase        = 'ready';
let _phaseAll          = [];   // all frames during recording
let _holdStartTime     = null;
let _holdElapsed       = 0;
let _holdSteps         = 0;
let _prevWristPos      = null;
let _holdTimerInterval = null;

const COACH_MOVES = [{ value: 'handstand', label: 'Handstand' }];

// ── Entry point ────────────────────────────
async function renderCoach() {
  _stopCoach();
  _resetPhase();

  const view = document.getElementById('view-coach');
  view.innerHTML = '';

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `<div class="nav-title">AI Coach</div>`;
  view.appendChild(nav);

  const scroll  = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.style.cssText = 'flex:1;overflow-y:auto;padding-bottom:80px;';
  scroll.appendChild(content);
  view.appendChild(scroll);

  // Mode toggle
  const modeWrap = el('div', 'coach-mode-toggle');
  modeWrap.innerHTML = `
    <button id="coach-mode-camera" class="coach-mode-btn ${_coachMode === 'camera' ? 'active' : ''}" onclick="coachSetMode('camera')">Live Camera</button>
    <button id="coach-mode-upload" class="coach-mode-btn ${_coachMode === 'upload' ? 'active' : ''}" onclick="coachSetMode('upload')">Upload Video</button>
  `;
  content.appendChild(modeWrap);

  // Move selector
  const selWrap = el('div', 'coach-selector');
  selWrap.innerHTML = `
    <select class="form-select" id="coach-move-select">
      ${COACH_MOVES.map(m => `<option value="${m.value}">${m.label}</option>`).join('')}
    </select>
  `;
  selWrap.querySelector('select').onchange = e => { _coachMove = e.target.value; };
  content.appendChild(selWrap);

  // Upload picker (hidden in camera mode)
  const uploadWrap = el('div', 'coach-upload-wrap');
  uploadWrap.id = 'coach-upload-wrap';
  uploadWrap.style.display = _coachMode === 'upload' ? 'block' : 'none';
  uploadWrap.innerHTML = `
    <label class="coach-upload-btn">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
      </svg>
      Choose video from camera roll
      <input type="file" accept="video/*" style="display:none" onchange="coachLoadVideo(this)">
    </label>
  `;
  content.appendChild(uploadWrap);

  // Camera wrap
  const camWrap = el('div', 'coach-cam-wrap');
  camWrap.innerHTML = `
    <video id="coach-video" autoplay playsinline muted></video>
    <canvas id="coach-canvas"></canvas>
    <div id="coach-score-overlay">
      <div id="coach-score-num">10.0</div>
      <div id="coach-score-lbl">Get into position</div>
    </div>
    <button class="coach-flip-btn" id="coach-flip-btn" onclick="coachFlip()" title="Flip camera" style="${_coachMode === 'upload' ? 'display:none' : ''}">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 4v6h6"/><path d="M23 20v-6h-6"/>
        <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10"/>
        <path d="M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"/>
      </svg>
    </button>
    <div id="coach-phase-badge" class="coach-phase-badge" style="display:none;"></div>
    <div id="coach-hold-timer" class="coach-hold-timer" style="display:none;">0.0s</div>
  `;
  content.appendChild(camWrap);

  // Phase control button
  const ctrlWrap = el('div', 'coach-ctrl-wrap');
  ctrlWrap.innerHTML = `
    <button class="coach-phase-btn" id="coach-phase-btn" onclick="coachPhaseAction()">▶  Start Attempt</button>
  `;
  content.appendChild(ctrlWrap);

  // Live deduction matrix
  const matrix = el('div', 'coach-matrix');
  matrix.id = 'coach-matrix';
  content.appendChild(matrix);

  // Final score panel
  const finalEl = el('div', 'coach-final');
  finalEl.id = 'coach-final';
  finalEl.style.display = 'none';
  content.appendChild(finalEl);

  try {
    await _coachLoadMP();
    await _coachStart();
  } catch(e) {
    console.error('Coach error:', e);
    const errEl = el('div', 'empty-note');
    errEl.style.cssText = 'color:var(--red);margin:16px;';
    errEl.textContent = 'Camera error: ' + e.message;
    content.appendChild(errEl);
  }
}

// ── Load MediaPipe scripts on demand ───────
async function _coachLoadMP() {
  if (_mpLoaded) return;
  const load = src => new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.crossOrigin = 'anonymous';
    s.onload = res;
    s.onerror = () => rej(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
  await load('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
  await load('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
  _mpLoaded = true;
}

// ── Mode switch ────────────────────────────
async function coachSetMode(mode) {
  if (_coachMode === mode) return;
  _coachMode = mode;
  _coachLoopActive = false;
  if (_coachStream) { _coachStream.getTracks().forEach(t => t.stop()); _coachStream = null; }
  _resetPhase();

  const uploadWrap = document.getElementById('coach-upload-wrap');
  const flipBtn    = document.getElementById('coach-flip-btn');
  const video      = document.getElementById('coach-video');
  document.querySelectorAll('.coach-mode-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`coach-mode-${mode}`).classList.add('active');
  if (uploadWrap) uploadWrap.style.display = mode === 'upload' ? 'block' : 'none';
  if (flipBtn)    flipBtn.style.display    = mode === 'upload' ? 'none'  : '';

  _updatePhaseUI();
  const finalEl = document.getElementById('coach-final');
  if (finalEl) finalEl.style.display = 'none';

  if (mode === 'camera') {
    if (video) { video.removeAttribute('controls'); video.muted = true; }
    await _coachStart();
  } else {
    if (video) { video.srcObject = null; video.src = ''; video.setAttribute('controls', ''); video.muted = false; }
    _coachLoopActive = true;
    _runPoseLoop(video);
  }
}

// ── Load video from camera roll ─────────────
async function coachLoadVideo(input) {
  const file = input.files[0];
  if (!file) return;
  const video = document.getElementById('coach-video');
  if (!video) return;
  _resetPhase();
  const finalEl = document.getElementById('coach-final');
  if (finalEl) finalEl.style.display = 'none';
  _updatePhaseUI();

  video.srcObject = null;
  video.src = URL.createObjectURL(file);
  video.load();
  await new Promise(res => { video.onloadedmetadata = res; });

  const canvas = document.getElementById('coach-canvas');
  _initPose(video, canvas);
  _coachLoopActive = true;
  _runPoseLoop(video);
}

// ── Start camera ───────────────────────────
async function _coachStart() {
  if (_coachMode === 'upload') return;
  const video  = document.getElementById('coach-video');
  const canvas = document.getElementById('coach-canvas');
  if (!video || !canvas) return;

  if (_coachStream) _coachStream.getTracks().forEach(t => t.stop());

  _coachStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: _coachFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false,
  });
  video.srcObject = _coachStream;
  await new Promise(res => { video.onloadedmetadata = res; });
  video.play();

  _initPose(video, canvas);
  _coachLoopActive = true;
  _runPoseLoop(video);
}

function _initPose(video, canvas) {
  if (_coachPoseInst) return;
  _coachPoseInst = new Pose({
    locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}`,
  });
  _coachPoseInst.setOptions({
    modelComplexity:        1,
    smoothLandmarks:        true,
    enableSegmentation:     false,
    minDetectionConfidence: 0.5,
    minTrackingConfidence:  0.5,
  });
  _coachPoseInst.onResults(res => _coachOnResults(res, video, canvas));
}

async function _runPoseLoop(video) {
  if (!_coachLoopActive || !document.getElementById('coach-video')) return;
  if (!_coachPoseInst) {
    if (_coachLoopActive) requestAnimationFrame(() => _runPoseLoop(video));
    return;
  }
  // In upload mode only process while video is playing
  if (_coachMode === 'upload' && (video.paused || video.ended)) {
    if (_coachLoopActive) requestAnimationFrame(() => _runPoseLoop(video));
    return;
  }
  try { await _coachPoseInst.send({ image: video }); } catch(_) {}
  if (_coachLoopActive) requestAnimationFrame(() => _runPoseLoop(video));
}

// ── Flip camera ────────────────────────────
async function coachFlip() {
  _coachFacing = _coachFacing === 'environment' ? 'user' : 'environment';
  _coachLoopActive = false;
  await _coachStart();
}

// ── Stop everything ────────────────────────
function _stopCoach() {
  _coachLoopActive = false;
  clearInterval(_holdTimerInterval);
  _holdTimerInterval = null;
  if (_coachStream) {
    _coachStream.getTracks().forEach(t => t.stop());
    _coachStream = null;
  }
  _coachPoseInst = null;
}

// ── Reset phase state ──────────────────────
function _resetPhase() {
  _coachPhase    = 'ready';
  _phaseAll      = [];
  _holdStartTime = null;
  _holdElapsed   = 0;
  _holdSteps     = 0;
  _prevWristPos  = null;
  clearInterval(_holdTimerInterval);
  _holdTimerInterval = null;
}

// ── Phase button action ────────────────────
function coachPhaseAction() {
  if (_coachPhase === 'ready') {
    _coachPhase = 'recording';
    _startHoldTimer();
    _updatePhaseUI();
  } else if (_coachPhase === 'recording') {
    _stopHoldTimer();
    _coachPhase = 'complete';
    _showFinalScore();
    _updatePhaseUI();
  } else if (_coachPhase === 'complete') {
    _resetPhase();
    const finalEl = document.getElementById('coach-final');
    if (finalEl) finalEl.style.display = 'none';
    _updatePhaseUI();
  }
}

function _updatePhaseUI() {
  const btn   = document.getElementById('coach-phase-btn');
  const badge = document.getElementById('coach-phase-badge');
  const timer = document.getElementById('coach-hold-timer');

  const cfg = {
    ready:     { label: '▶  Start Attempt', badgeText: '',          cls: '' },
    recording: { label: '■  Stop',          badgeText: 'Recording', cls: 'hold' },
    complete:  { label: '↺  Try Again',     badgeText: 'Done',      cls: '' },
  }[_coachPhase];

  if (btn)   { btn.textContent = cfg.label; btn.className = `coach-phase-btn ${cfg.cls}`; }
  if (badge) { badge.textContent = cfg.badgeText; badge.style.display = cfg.badgeText ? 'block' : 'none'; }
  if (timer) { timer.style.display = _coachPhase === 'recording' ? 'block' : 'none'; }
}

function _startHoldTimer() {
  _holdStartTime = Date.now();
  _holdElapsed   = 0;
  _holdTimerInterval = setInterval(() => {
    _holdElapsed = (Date.now() - _holdStartTime) / 1000;
    const t = document.getElementById('coach-hold-timer');
    if (t) {
      t.textContent = _holdElapsed.toFixed(1) + 's';
      t.style.color = _holdElapsed >= 2 ? '#34C97F' : 'white';
    }
  }, 100);
}

function _stopHoldTimer() {
  clearInterval(_holdTimerInterval);
  _holdTimerInterval = null;
}

// ── Pose results ───────────────────────────
function _coachOnResults(results, video, canvas) {
  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results.poseLandmarks) {
    _updateScoreOverlay(null, 'No person detected…');
    return;
  }

  const lm = results.poseLandmarks;

  drawConnectors(ctx, lm, POSE_CONNECTIONS, { color: 'rgba(123,95,255,0.8)', lineWidth: 3 });
  drawLandmarks(ctx, lm, { color: '#7B5FFF', fillColor: 'rgba(255,255,255,0.9)', lineWidth: 1.5, radius: 5 });

  const scored = _scoreHandstand(lm);

  // Accumulate samples while recording
  if (_coachPhase === 'recording') {
    _phaseAll.push(scored);
    if (scored.inverted) _detectHandWalk(lm);
  }

  const phaseLabel = { ready: 'Get into position', recording: 'Recording…', complete: 'Done' }[_coachPhase];

  if (!scored.inverted) {
    _updateScoreOverlay('–', _coachPhase === 'ready' ? 'Get inverted…' : 'Not inverted');
  } else if (scored.voided) {
    _updateScoreOverlay('!', '45°+ off — incomplete');
  } else {
    _updateScoreOverlay(scored.score, phaseLabel);
  }

  _updateMatrix(scored.deductions, scored.inverted);
}

function _detectHandWalk(lm) {
  const wx = (lm[15].x + lm[16].x) / 2;
  const wy = (lm[15].y + lm[16].y) / 2;
  if (_prevWristPos) {
    const dist = Math.hypot(wx - _prevWristPos.x, wy - _prevWristPos.y);
    if (dist > 0.04) _holdSteps++;
  }
  _prevWristPos = { x: wx, y: wy };
}

function _updateScoreOverlay(score, label) {
  const numEl = document.getElementById('coach-score-num');
  const lblEl = document.getElementById('coach-score-lbl');
  if (numEl) {
    numEl.textContent = score === null ? '–'
      : typeof score === 'number' ? score.toFixed(1) : score;
    numEl.style.color = typeof score === 'number'
      ? score >= 9 ? '#34C97F' : score >= 7 ? '#F5A623' : '#FF4757'
      : 'rgba(255,255,255,0.6)';
  }
  if (lblEl) lblEl.textContent = label || '';
}

function _updateMatrix(deductions, inverted) {
  const matrix = document.getElementById('coach-matrix');
  if (!matrix) return;
  if (!inverted || !deductions.length) {
    matrix.innerHTML = '';
    return;
  }
  matrix.innerHTML = `
    <div class="coach-matrix-title">Live Deductions</div>
    ${deductions.map(d => `
      <div class="coach-matrix-row ${d.amount === 0 ? 'ded-ok' : d.amount <= 0.10 ? 'ded-warn' : 'ded-bad'}">
        <div class="coach-matrix-label">${d.label}</div>
        <div class="coach-matrix-detail">${d.detail}</div>
        <div class="coach-matrix-amount">${d.amount === 0 ? '✓' : '−' + d.amount.toFixed(2)}</div>
      </div>
    `).join('')}
  `;
}

// ── Final score ────────────────────────────
function _showFinalScore() {
  // Auto-split frames: first 25% = entry, middle 50% = hold, last 25% = exit
  const n = _phaseAll.length;
  const e1 = Math.floor(n * 0.25);
  const e2 = Math.floor(n * 0.75);
  const entryFrames = _phaseAll.slice(0, e1);
  const holdFrames  = _phaseAll.slice(e1, e2);
  const exitFrames  = _phaseAll.slice(e2);

  const entryScore = _avgPhaseScore(entryFrames);
  const holdRaw    = _avgPhaseScore(holdFrames);
  const exitScore  = _avgPhaseScore(exitFrames);

  // Hold duration deduction
  const holdDed = _holdElapsed < 1 ? 0.30 : _holdElapsed < 2 ? 0.10 : 0;

  // Hand walking deduction
  const walkSteps = Math.floor(_holdSteps / 3);
  const walkDed   = Math.min(1.0, walkSteps * 0.10);

  const adjustedHold = Math.max(0, (holdRaw ?? 10.0) - holdDed - walkDed);
  const finalScore   = parseFloat((
    (entryScore ?? 10.0) * 0.25 +
    adjustedHold         * 0.50 +
    (exitScore   ?? 10.0) * 0.25
  ).toFixed(2));

  const scoreColor = finalScore >= 9 ? '#34C97F' : finalScore >= 7 ? '#F5A623' : '#FF4757';

  const finalEl = document.getElementById('coach-final');
  if (!finalEl) return;
  finalEl.style.display = 'block';
  finalEl.innerHTML = `
    <div class="coach-final-score" style="color:${scoreColor};">${finalScore.toFixed(2)}</div>
    <div class="coach-final-label">Final Score</div>
    <div class="coach-final-breakdown">
      <div class="coach-final-phase">
        <div class="coach-final-phase-name">Entry</div>
        <div class="coach-final-phase-score">${(entryScore ?? 10).toFixed(2)}</div>
        <div class="coach-final-phase-weight">×25%</div>
      </div>
      <div class="coach-final-phase">
        <div class="coach-final-phase-name">Hold</div>
        <div class="coach-final-phase-score">${adjustedHold.toFixed(2)}</div>
        <div class="coach-final-phase-weight">×50%</div>
      </div>
      <div class="coach-final-phase">
        <div class="coach-final-phase-name">Exit</div>
        <div class="coach-final-phase-score">${(exitScore ?? 10).toFixed(2)}</div>
        <div class="coach-final-phase-weight">×25%</div>
      </div>
    </div>
    <div class="coach-final-notes">
      <div class="coach-final-note ${holdDed === 0 ? 'note-ok' : ''}">
        Duration: ${_holdElapsed.toFixed(1)}s ${holdDed === 0 ? '✓' : `(−${holdDed.toFixed(2)})`}
      </div>
      ${walkSteps > 0 ? `<div class="coach-final-note">Hand walking: ${walkSteps} step${walkSteps > 1 ? 's' : ''} (−${walkDed.toFixed(2)})</div>` : ''}
    </div>
  `;

  // Scroll to final score
  setTimeout(() => finalEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function _avgPhaseScore(samples) {
  const valid = (samples || []).filter(s => s.inverted && !s.voided);
  if (!valid.length) return null;
  return parseFloat((valid.reduce((s, v) => s + v.score, 0) / valid.length).toFixed(2));
}

// ── Handstand scorer — WAG E-score rules ───
// Landmarks: 0=nose, 11/12=shoulders, 13/14=elbows, 15/16=wrists
// 23/24=hips, 25/26=knees, 27/28=ankles, 29/30=heels, 31/32=foot_index

function _scoreHandstand(lm) {
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const mWrist    = mid(lm[15], lm[16]);
  const mShoulder = mid(lm[11], lm[12]);
  const mHip      = mid(lm[23], lm[24]);
  const mKnee     = mid(lm[25], lm[26]);
  const mAnkle    = mid(lm[27], lm[28]);

  // Inversion gate — wrists must be lower in frame than hips (y increases downward)
  if (mWrist.y <= mHip.y) {
    return { score: null, deductions: [], voided: false, inverted: false };
  }

  const deductions = [];
  let voided = false;

  // ① Vertical body line (WAG angular precision rules)
  const bodyVec = { x: mAnkle.x - mWrist.x, y: mAnkle.y - mWrist.y };
  const bodyLen = Math.hypot(bodyVec.x, bodyVec.y);
  const vertDeg = bodyLen > 0
    ? Math.acos(Math.min(1, Math.abs(bodyVec.y) / bodyLen)) * 180 / Math.PI
    : 0;

  if (vertDeg > 45) {
    voided = true;
    deductions.push({ label: 'Body line', detail: `${vertDeg.toFixed(0)}° — skill incomplete`, amount: 10 });
  } else {
    const vertDed = vertDeg > 30 ? 0.30 : vertDeg > 10 ? 0.10 : 0;
    deductions.push({ label: 'Body line', detail: `${vertDeg.toFixed(0)}° off vertical`, amount: vertDed });
  }

  if (!voided) {
    // ② Arm straightness (wrist→elbow→shoulder angle, ideal 180°)
    const lArmDev = 180 - _angle3(lm[15], lm[13], lm[11]);
    const rArmDev = 180 - _angle3(lm[16], lm[14], lm[12]);
    const armDev  = (lArmDev + rArmDev) / 2;
    const armDed  = armDev > 25 ? 0.50 : armDev > 15 ? 0.30 : armDev > 5 ? 0.10 : 0;
    deductions.push({
      label: 'Arm straightness',
      detail: armDev <= 5 ? 'Straight ✓' : `${armDev.toFixed(0)}° bent`,
      amount: armDed,
    });

    // ③ Leg/knee straightness (hip→knee→ankle angle, ideal 180°)
    const lKneeDev = 180 - _angle3(lm[23], lm[25], lm[27]);
    const rKneeDev = 180 - _angle3(lm[24], lm[26], lm[28]);
    const kneeDev  = (lKneeDev + rKneeDev) / 2;
    const kneeDed  = kneeDev > 25 ? 0.50 : kneeDev > 15 ? 0.30 : kneeDev > 5 ? 0.10 : 0;
    deductions.push({
      label: 'Leg straightness',
      detail: kneeDev <= 5 ? 'Straight ✓' : `${kneeDev.toFixed(0)}° bent`,
      amount: kneeDed,
    });

    // ④ Leg separation (ankle gap normalised to shoulder width)
    const ankleGap  = Math.abs(lm[27].x - lm[28].x);
    const shoulderW = Math.max(0.01, Math.abs(lm[11].x - lm[12].x));
    const legRatio  = ankleGap / shoulderW;
    const legDed    = legRatio > 0.8 ? 0.50 : legRatio > 0.4 ? 0.30 : legRatio > 0.15 ? 0.10 : 0;
    deductions.push({
      label: 'Leg separation',
      detail: legRatio <= 0.15 ? 'Together ✓' : legRatio <= 0.4 ? 'Slightly apart' : legRatio <= 0.8 ? 'Wide apart' : 'Straddle',
      amount: legDed,
    });

    // ⑤ Body shape — perpendicular distance of hip from shoulder→ankle axis
    const axisVec = { x: mAnkle.x - mShoulder.x, y: mAnkle.y - mShoulder.y };
    const axisLen = Math.hypot(axisVec.x, axisVec.y);
    const hipVec  = { x: mHip.x - mShoulder.x,   y: mHip.y - mShoulder.y };
    const bodyDev = axisLen > 0
      ? Math.abs(hipVec.x * axisVec.y - hipVec.y * axisVec.x) / axisLen
      : 0;
    const bodyDed = bodyDev > 0.12 ? 0.50 : bodyDev > 0.07 ? 0.30 : bodyDev > 0.03 ? 0.10 : 0;
    deductions.push({
      label: 'Body shape',
      detail: bodyDev <= 0.03 ? 'Straight ✓' : bodyDev <= 0.07 ? 'Slight arch/hollow' : bodyDev <= 0.12 ? 'Pronounced arch' : 'Severe arch',
      amount: bodyDed,
    });

    // ⑥ Flexed feet (knee→ankle→foot_index angle, ideal 180° = pointed)
    const lFootDev = 180 - _angle3(lm[25], lm[27], lm[31]);
    const rFootDev = 180 - _angle3(lm[26], lm[28], lm[32]);
    const footDev  = (lFootDev + rFootDev) / 2;
    deductions.push({
      label: 'Foot form',
      detail: footDev <= 20 ? 'Pointed ✓' : 'Flexed/flat',
      amount: footDev > 20 ? 0.10 : 0,
    });

    // ⑦ Sickled ankles — lateral deviation of foot from the knee→ankle axis
    const sickle = (knee, ankle, foot) => {
      const v = { x: ankle.x - knee.x, y: ankle.y - knee.y };
      const f = { x: foot.x  - ankle.x, y: foot.y  - ankle.y };
      const l = Math.hypot(v.x, v.y);
      return l > 0 ? Math.abs(f.x * v.y - f.y * v.x) / l : 0;
    };
    const sickleDev = (sickle(lm[25], lm[27], lm[31]) + sickle(lm[26], lm[28], lm[32])) / 2;
    deductions.push({
      label: 'Ankle alignment',
      detail: sickleDev <= 0.04 ? 'Straight ✓' : 'Sickled',
      amount: sickleDev > 0.04 ? 0.10 : 0,
    });
  }

  const totalDed = deductions.reduce((s, d) => s + d.amount, 0);
  const score    = voided ? 0 : parseFloat(Math.max(0, 10.0 - totalDed).toFixed(2));

  return { score, deductions, voided, inverted: true };
}

// Angle at b formed by a→b→c, in degrees
function _angle3(a, b, c) {
  const ab  = { x: a.x - b.x, y: a.y - b.y };
  const cb  = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  return mag === 0 ? 180 : Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180 / Math.PI;
}
