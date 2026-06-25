/* ═══════════════════════════════════════════
   AI COACH VIEW — Live pose analysis
   MediaPipe Pose loaded on demand
═══════════════════════════════════════════ */

let _coachCamera   = null;
let _coachPoseInst = null;
let _coachMove     = 'handstand';
let _mpLoaded      = false;

const COACH_MOVES = [
  { value: 'handstand', label: 'Handstand' },
];

// ── Entry point ────────────────────────────
async function renderCoach() {
  _stopCoach();

  const view = document.getElementById('view-coach');
  view.innerHTML = '';

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `<div class="nav-title">AI Coach</div>`;
  view.appendChild(nav);

  const scroll  = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.style.overflow = 'hidden';
  scroll.appendChild(content);
  view.appendChild(scroll);

  // Move selector
  const selWrap = el('div', 'coach-selector');
  selWrap.innerHTML = `
    <label class="form-label" style="margin-bottom:6px;">Select Move</label>
    <select class="form-select" id="coach-move-select">
      ${COACH_MOVES.map(m => `<option value="${m.value}">${m.label}</option>`).join('')}
    </select>
  `;
  selWrap.querySelector('select').onchange = e => { _coachMove = e.target.value; };
  content.appendChild(selWrap);

  // Camera + canvas
  const camWrap = el('div', 'coach-cam-wrap');
  camWrap.innerHTML = `
    <video id="coach-video" autoplay playsinline muted></video>
    <canvas id="coach-canvas"></canvas>
    <div id="coach-score-overlay">
      <div id="coach-score-num">–</div>
      <div id="coach-score-lbl">Loading…</div>
    </div>
  `;
  content.appendChild(camWrap);

  // Feedback rows
  const fb = el('div', 'coach-feedback-wrap');
  fb.id = 'coach-feedback-wrap';
  content.appendChild(fb);

  // Load MediaPipe then start
  try {
    await _coachLoadMP();
    await _coachStart();
    document.getElementById('coach-score-lbl').textContent = 'Get into position…';
  } catch(e) {
    console.error('Coach error:', e);
    const errEl = el('div', 'empty-note');
    errEl.style.color = 'var(--red)';
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
    s.onload = res; s.onerror = () => rej(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
  await load('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
  await load('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
  await load('https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js');
  _mpLoaded = true;
}

// ── Start camera + pose ────────────────────
async function _coachStart() {
  const video  = document.getElementById('coach-video');
  const canvas = document.getElementById('coach-canvas');
  if (!video || !canvas) return;

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
  _coachPoseInst.onResults(res => _coachOnResults(res, canvas));

  _coachCamera = new Camera(video, {
    onFrame: async () => {
      if (!document.getElementById('coach-video')) { _coachCamera?.stop(); return; }
      await _coachPoseInst.send({ image: video });
    },
    width: 640, height: 480,
  });
  await _coachCamera.start();
}

// ── Stop camera ────────────────────────────
function _stopCoach() {
  try { _coachCamera?.stop(); } catch(_) {}
  _coachCamera   = null;
  _coachPoseInst = null;
}

// ── Process pose results ───────────────────
function _coachOnResults(results, canvas) {
  const ctx = canvas.getContext('2d');
  canvas.width  = results.image.width;
  canvas.height = results.image.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!results.poseLandmarks) {
    document.getElementById('coach-score-lbl').textContent = 'No person detected…';
    return;
  }

  // Draw skeleton overlay
  drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS,
    { color: 'rgba(123,95,255,0.75)', lineWidth: 3 });
  drawLandmarks(ctx, results.poseLandmarks,
    { color: '#7B5FFF', fillColor: 'rgba(255,255,255,0.9)', lineWidth: 1.5, radius: 5 });

  // Score
  const scored = _coachMove === 'handstand'
    ? _scoreHandstand(results.poseLandmarks)
    : { score: '–', status: 'Unknown move', feedback: [] };

  const numEl = document.getElementById('coach-score-num');
  const lblEl = document.getElementById('coach-score-lbl');
  const fbEl  = document.getElementById('coach-feedback-wrap');

  if (numEl) {
    numEl.textContent = scored.score;
    numEl.style.color = typeof scored.score === 'number'
      ? scored.score >= 7 ? '#34C97F' : scored.score >= 4 ? '#F5A623' : '#FF4757'
      : 'var(--text-soft)';
  }
  if (lblEl) lblEl.textContent = scored.status;
  if (fbEl) {
    fbEl.innerHTML = scored.feedback.map(f => `
      <div class="coach-fb-row ${f.ok ? 'coach-fb-ok' : 'coach-fb-warn'}">
        <div class="coach-fb-icon">${f.ok ? '✓' : '!'}</div>
        <div class="coach-fb-text">${f.label}</div>
      </div>
    `).join('');
  }
}

// ── Handstand scorer ───────────────────────
// MediaPipe landmark indices:
//  0=nose  11=L shoulder  12=R shoulder
// 13=L elbow  14=R elbow  15=L wrist  16=R wrist
// 23=L hip  24=R hip  25=L knee  26=R knee  27=L ankle  28=R ankle

function _scoreHandstand(lm) {
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  const mWrist    = mid(lm[15], lm[16]);
  const mShoulder = mid(lm[11], lm[12]);
  const mHip      = mid(lm[23], lm[24]);
  const mKnee     = mid(lm[25], lm[26]);
  const mAnkle    = mid(lm[27], lm[28]);

  // ① Inversion — wrists must be below hips in image (y increases downward)
  const inverted = mWrist.y > mHip.y;
  if (!inverted) {
    return {
      score:    '–',
      status:   'Get upside down! 🙃',
      feedback: [{ ok: false, label: 'Invert into a handstand to start scoring' }],
    };
  }

  // ② Vertical alignment — x coords of all joints should be similar
  const xPts   = [mWrist.x, mShoulder.x, mHip.x, mKnee.x, mAnkle.x];
  const xMean  = xPts.reduce((a, b) => a + b, 0) / xPts.length;
  const xDev   = Math.sqrt(xPts.reduce((a, b) => a + (b - xMean) ** 2, 0) / xPts.length);
  const alignS = Math.max(0, 1 - xDev * 10);

  // ③ Arm straightness — wrist-elbow-shoulder angle, ideally 180°
  const lArmAng = _angle3(lm[15], lm[13], lm[11]);
  const rArmAng = _angle3(lm[16], lm[14], lm[12]);
  const armS    = Math.max(0, Math.min(1, ((lArmAng + rArmAng) / 2 - 130) / 50));

  // ④ Body straight — shoulder-hip-knee angle, ideally 180°
  const bodyAng = _angle3(mShoulder, mHip, mKnee);
  const bodyS   = Math.max(0, Math.min(1, (bodyAng - 130) / 50));

  // ⑤ Legs together — ankle x proximity
  const legsS = Math.max(0, 1 - Math.abs(lm[27].x - lm[28].x) * 10);

  // Weighted total → 1-10
  const raw   = alignS * 3 + armS * 2.5 + bodyS * 2.5 + legsS * 2;
  const score = Math.max(1, Math.min(10, Math.round(raw)));

  const status = score >= 9 ? 'Perfect! 🌟'
               : score >= 7 ? 'Looking great!'
               : score >= 5 ? 'Good — keep working on it'
               : score >= 3 ? 'Getting there!'
               :              'Keep practising!';

  const feedback = [
    { ok: alignS > 0.6, label: alignS > 0.6 ? 'Body aligned vertically'   : 'Work on vertical alignment — stack joints' },
    { ok: armS   > 0.6, label: armS   > 0.6 ? 'Arms are straight'          : 'Straighten your arms fully' },
    { ok: bodyS  > 0.6, label: bodyS  > 0.6 ? 'No pike — body is straight' : 'Open your hips to remove the pike' },
    { ok: legsS  > 0.6, label: legsS  > 0.6 ? 'Legs together'              : 'Squeeze legs together' },
  ];

  return { score, status, feedback };
}

// Angle at point b in degrees (a–b–c)
function _angle3(a, b, c) {
  const ab  = { x: a.x - b.x, y: a.y - b.y };
  const cb  = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y);
  return mag === 0 ? 180 : Math.acos(Math.max(-1, Math.min(1, dot / mag))) * (180 / Math.PI);
}
