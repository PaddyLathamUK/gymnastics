/* ── Competitions / Results View ── */

let compOrgFilter = 'all';   // org id or 'all'
let compDetailId  = null;

// ── Helpers ──────────────────────────────────────────────
const TIER_LABEL = { club:'Club', local:'Local', regional:'Regional', national:'National', international:'International', worlds:'Worlds 🌍' };
const TIER_COLOR = { club:'var(--text-soft)', local:'var(--purple-mid)', regional:'var(--purple)', national:'var(--gold-dark)', international:'#e07b00', worlds:'var(--gold-dark)' };

function tierBadge(tier) {
  const label = TIER_LABEL[tier] || tier || 'Local';
  const color = TIER_COLOR[tier] || 'var(--text-soft)';
  return `<span class="tier-badge" style="color:${color};border-color:${color};">${label}</span>`;
}

function fieldContext(position, fieldSize) {
  if (!position) return '';
  if (fieldSize) return `${posLabel(position)} of ${fieldSize}`;
  return posLabel(position);
}

function podiumGap(overallPosition, fieldSize, aaScore, sameCompAllScores) {
  // Returns something like "0.10 from 🥉" or null
  if (!overallPosition || overallPosition <= 3) return null;
  if (!sameCompAllScores?.length) return null;
  const sorted = [...sameCompAllScores].sort((a, b) => b - a);
  const bronzeScore = sorted[2];
  if (bronzeScore === undefined) return null;
  const gap = (bronzeScore - aaScore).toFixed(2);
  return gap > 0 ? `${gap} off 🥉` : null;
}

// ── Main list ────────────────────────────────────────────
async function renderCompetitions() {
  const view = document.getElementById('view-comps');
  view.innerHTML = '';

  if (compDetailId) { await renderCompDetail(view); return; }

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `<div class="nav-title">Results</div>`;
  if (Auth.canWrite) {
    const addBtn = el('button', 'nav-action');
    addBtn.textContent = '+';
    addBtn.onclick = () => openAddComp();
    nav.appendChild(addBtn);
  }
  view.appendChild(nav);

  const [allComps, orgs, pbs] = await Promise.all([
    Data.getCompetitions(),
    Data.getOrganisations(),
    Data.getPersonalBests(),
  ]);

  // ── Org filter chips ─────────────────────
  const filterRow = el('div', 'filter-row');
  const allChip = el('div', `filter-chip${compOrgFilter === 'all' ? ' active' : ''}`);
  allChip.textContent = 'All';
  allChip.onclick = () => { compOrgFilter = 'all'; renderCompetitions(); };
  filterRow.appendChild(allChip);
  for (const org of orgs) {
    const chip = el('div', `filter-chip${compOrgFilter === org.id ? ' active' : ''}`);
    chip.textContent = org.name;
    chip.onclick = () => { compOrgFilter = org.id; renderCompetitions(); };
    filterRow.appendChild(chip);
  }
  view.appendChild(filterRow);

  const filtered = allComps.filter(c =>
    compOrgFilter === 'all' || c.orgId === compOrgFilter
  );

  // ── Progress chart (org+level aware) ─────
  if (filtered.length >= 2) {
    const chartWrap = el('div');
    chartWrap.style.padding = '4px 16px 0';
    // Group by org+level, show chart for the most-competed band
    const grouped = groupByOrgLevel(filtered);
    const topGroup = Object.values(grouped).sort((a, b) => b.length - a.length)[0] || filtered;
    chartWrap.appendChild(buildProgressChart(topGroup, 'Vault'));
    view.appendChild(chartWrap);
  }

  const scroll = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  if (filtered.length === 0) {
    content.appendChild(emptyState('📋', 'No competitions yet', Auth.canWrite ? 'Tap + to add your first result' : 'No results to show yet'));
  } else {
    for (const comp of filtered) {
      content.appendChild(buildCompCard(comp, pbs, orgs));
    }
  }
}

function groupByOrgLevel(comps) {
  const groups = {};
  for (const c of comps) {
    const key = `${c.orgId || 'none'}-${c.levelId || 'none'}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  }
  return groups;
}

function buildCompCard(comp, pbs, orgs) {
  const aa = Data.allAroundScore(comp);
  const card = el('div', 'comp-card');

  const orgName   = comp.organisation || orgs?.find(o => o.id === comp.orgId)?.name || '';
  const levelName = comp.level || '';

  const miniScores = Data.APPARATUS.map(app => {
    const r = comp.results.find(x => x.apparatus === app);
    if (!r) return '';
    if (r.dna) return `<div class="ms"><div class="ms-lbl">${app.slice(0,2).toUpperCase()}</div><div class="ms-val dna-val">DNA</div></div>`;
    return `<div class="ms"><div class="ms-lbl">${app.slice(0,2).toUpperCase()}</div><div class="ms-val ${r.score === pbs[app] ? 'pb' : ''}">${r.score.toFixed(1)}</div></div>`;
  }).join('');

  const posText = fieldContext(comp.overall_position || comp.overallPosition, comp.fieldSize);
  const mediaCount = comp.mediaUrls?.length || 0;

  card.innerHTML = `
    <div class="comp-card-header">
      <div style="flex:1;min-width:0;">
        <div class="comp-name">${comp.name}</div>
        <div class="comp-venue">${comp.venue || '—'} · ${Data.formatDateShort(comp.date)}</div>
        <div class="comp-chip-row" style="margin-top:5px;">
          ${tierBadge(comp.tier)}
          ${orgName ? `<span class="chip chip-purple">${orgName}</span>` : ''}
          ${levelName ? `<span class="chip chip-gold">${levelName}</span>` : ''}
          ${mediaCount ? `<span class="chip" style="background:var(--purple-bg);color:var(--purple);">📷 ${mediaCount}</span>` : ''}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;padding-left:8px;">
        <div class="comp-aa-score">${aa.toFixed(2)}</div>
        <div class="comp-aa-lbl">AA</div>
        ${posText ? `<div class="comp-pos-text">${posText}</div>` : ''}
      </div>
    </div>
    <div class="mini-scores" style="margin-top:8px;">${miniScores}</div>
  `;
  card.onclick = () => { compDetailId = comp.id; renderCompetitions(); };
  return card;
}

// ── Detail view ──────────────────────────────────────────
async function renderCompDetail(view) {
  const [allComps, pbs, orgs] = await Promise.all([
    Data.getCompetitions(),
    Data.getPersonalBests(),
    Data.getOrganisations(),
  ]);
  const comp = allComps.find(c => c.id === compDetailId);
  if (!comp) { compDetailId = null; renderCompetitions(); return; }

  const aa = Data.allAroundScore(comp);
  const overallPos = comp.overall_position || comp.overallPosition;

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `
    <button class="nav-back" id="comp-back">‹ Results</button>
    <div class="nav-title" style="font-size:15px;">${comp.name}</div>
    ${Auth.canWrite ? `<button class="nav-action" onclick="openEditComp('${comp.id}')">✎</button>` : ''}
  `;
  view.appendChild(nav);
  nav.querySelector('#comp-back').onclick = () => { compDetailId = null; renderCompetitions(); };

  const scroll = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  const orgName   = comp.organisation || orgs?.find(o => o.id === comp.orgId)?.name || '';
  const levelName = comp.level || '';

  // Field context — "5th of 24 · 0.10 off 🥉"
  let fieldInfo = '';
  if (overallPos && comp.fieldSize) {
    fieldInfo = `${overallPos}${ordinal(overallPos)} of ${comp.fieldSize}`;
    const gap = podiumGap(overallPos, comp.fieldSize, aa, []);
    if (gap) fieldInfo += ` · ${gap}`;
  } else if (overallPos) {
    fieldInfo = `Overall: ${posLabel(overallPos)}`;
  }

  // ── Header card ───────────────────────────
  const headerCard = el('div', 'card');
  headerCard.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">
      <div style="flex:1;">
        <div style="font-size:18px;font-weight:800;color:var(--text);letter-spacing:-0.3px;">${comp.name}</div>
        <div style="font-size:13px;color:var(--text-soft);margin-top:3px;">${comp.venue || '—'}</div>
        <div style="font-size:12px;color:var(--text-soft);margin-top:2px;">${Data.formatDate(comp.date)}</div>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
          ${tierBadge(comp.tier)}
          ${orgName ? `<span class="chip chip-purple">${orgName}</span>` : ''}
          ${levelName ? `<span class="chip chip-gold">${levelName}</span>` : ''}
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:32px;font-weight:800;color:var(--purple);letter-spacing:-1px;">${aa.toFixed(2)}</div>
        <div style="font-size:10px;color:var(--text-soft);font-weight:600;letter-spacing:0.5px;">ALL-AROUND</div>
        ${fieldInfo ? `<div class="field-context">${fieldInfo}</div>` : ''}
      </div>
    </div>
  `;
  content.appendChild(headerCard);

  // ── Apparatus results ─────────────────────
  const resultsCard = el('div', 'card');
  const rows = Data.APPARATUS.map(app => {
    const r = comp.results.find(x => x.apparatus === app);
    if (!r) return '';
    const isPB = !r.dna && r.score === pbs[app];
    const isUpgrade = Data.UPGRADE_TARGETS.includes(app);
    const scoreBadge = r.dna
      ? `<span class="score-badge dna">DNA</span>`
      : `<span class="score-badge ${isPB ? 'pb' : ''}">${r.score.toFixed(2)}${isPB ? ' PB' : ''}</span>`;
    const posDisplay = r.position && !r.dna
      ? `<span class="pos-pill ${posCls(r.position)}">${posLabel(r.position)}</span>` : '';
    return `
      <div class="result-row">
        <span class="rr-app">${app}${isUpgrade ? ' ⭐' : ''}</span>
        <span class="rr-spacer"></span>
        ${posDisplay}
        ${scoreBadge}
      </div>`;
  }).join('');
  resultsCard.innerHTML = `<div class="card-section-title">Scores</div>${rows}`;
  content.appendChild(resultsCard);

  // ── Progress charts (org+level filtered) ──
  const sameOrg   = allComps.filter(c => c.orgId === comp.orgId && c.levelId === comp.levelId);
  const mixedNote = allComps.length > sameOrg.length
    ? `<div style="font-size:11px;color:var(--text-soft);margin-bottom:8px;">Showing ${orgName} ${levelName} only — comparing like-for-like</div>` : '';

  if (sameOrg.length >= 2) {
    const chartsCard = el('div', 'card');
    chartsCard.innerHTML = `<div class="card-section-title">Progress</div>${mixedNote}`;
    for (const app of Data.APPARATUS) {
      const lbl = el('div');
      lbl.style.cssText = 'font-size:12px;font-weight:600;color:var(--text-mid);margin:8px 0 2px;';
      lbl.textContent = app + (Data.UPGRADE_TARGETS.includes(app) ? ' ⭐' : '');
      chartsCard.appendChild(lbl);
      chartsCard.appendChild(buildProgressChart(sameOrg, app, comp.id));
    }
    content.appendChild(chartsCard);
  }

  // ── Media ─────────────────────────────────
  const mediaCard = buildMediaCard(comp);
  content.appendChild(mediaCard);

  // ── Notes ─────────────────────────────────
  if (comp.notes) {
    const notesCard = el('div', 'card');
    notesCard.innerHTML = `
      <div class="card-section-title">Notes</div>
      <div style="font-size:14px;color:var(--text);line-height:1.6;">${comp.notes}</div>
    `;
    content.appendChild(notesCard);
  }

  if (Auth.canWrite) {
    const delBtn = el('button', 'btn-cancel');
    delBtn.style.cssText = 'width:100%;color:var(--red);border-color:rgba(255,91,122,0.2);margin-top:4px;';
    delBtn.textContent = 'Delete Competition';
    delBtn.onclick = async () => {
      if (confirm(`Delete "${comp.name}"?`)) {
        await Data.deleteCompetition(comp.id);
        compDetailId = null;
        renderCompetitions();
      }
    };
    content.appendChild(delBtn);
  }
}

// ── Media card ────────────────────────────────────────────
function buildMediaCard(comp) {
  const card = el('div', 'card');
  const urls = comp.mediaUrls || [];
  card.innerHTML = `<div class="card-section-title">Photos &amp; Videos</div>`;

  if (urls.length) {
    const grid = el('div', 'media-grid');
    urls.forEach((url, i) => {
      const isStoredVideo = url.match(/\.(mp4|mov|webm)$/i);
      const isExternalVideo = url.includes('youtube') || url.includes('youtu.be') || url.includes('vimeo');
      const isVideo = isStoredVideo || isExternalVideo;
      const thumb = el('div', 'media-thumb');
      if (isStoredVideo) {
        // Inline playable video thumbnail
        thumb.innerHTML = `
          <video src="${url}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;"
            playsinline preload="metadata" onclick="this.paused?this.play():this.pause()"></video>
          <div class="media-play-overlay">▶</div>`;
        thumb.querySelector('video').addEventListener('play', function() {
          thumb.querySelector('.media-play-overlay').style.display = 'none';
        });
        thumb.querySelector('video').addEventListener('pause', function() {
          thumb.querySelector('.media-play-overlay').style.display = 'flex';
        });
        thumb.onclick = null;
      } else if (isExternalVideo) {
        thumb.innerHTML = `<div class="media-play">▶</div><div class="media-label">Video</div>`;
        thumb.onclick = () => window.open(url, '_blank');
      } else {
        thumb.style.backgroundImage = `url(${url})`;
        thumb.style.backgroundSize = 'cover';
        thumb.style.backgroundPosition = 'center';
        thumb.onclick = () => window.open(url, '_blank');
      }
      if (Auth.canWrite) {
        const del = el('button', 'media-del');
        del.textContent = '✕';
        del.onclick = async (e) => {
          e.stopPropagation();
          await removeCompMedia(comp.id, url);
        };
        thumb.appendChild(del);
      }
      grid.appendChild(thumb);
    });
    card.appendChild(grid);
  } else {
    const empty = el('div', '');
    empty.style.cssText = 'font-size:13px;color:var(--text-soft);margin:8px 0;';
    empty.textContent = 'No photos or videos yet.';
    card.appendChild(empty);
  }

  if (Auth.canWrite) {
    // Progress bar (hidden until uploading)
    const progressWrap = el('div', 'upload-progress-wrap');
    progressWrap.id = `upload-progress-${comp.id}`;
    progressWrap.style.display = 'none';
    progressWrap.innerHTML = `
      <div class="upload-progress-label" id="upload-label-${comp.id}">Preparing…</div>
      <div class="upload-progress-bar-bg">
        <div class="upload-progress-bar" id="upload-bar-${comp.id}" style="width:0%"></div>
      </div>`;
    card.appendChild(progressWrap);

    const row = el('div', '');
    row.style.cssText = 'display:flex;gap:8px;margin-top:10px;';

    const photoBtn = el('button', 'btn-primary');
    photoBtn.style.cssText = 'flex:1;padding:10px;font-size:13px;';
    photoBtn.textContent = '📷 Photo';
    photoBtn.onclick = () => document.getElementById(`comp-photo-input-${comp.id}`)?.click();

    const videoBtn = el('button', 'btn-primary');
    videoBtn.style.cssText = 'flex:1;padding:10px;font-size:13px;background:linear-gradient(135deg,#5438CC 0%,#3d2899 100%);';
    videoBtn.textContent = '🎬 Video';
    videoBtn.onclick = () => document.getElementById(`comp-video-input-${comp.id}`)?.click();

    row.appendChild(photoBtn);
    row.appendChild(videoBtn);
    card.appendChild(row);

    // Photo file input
    const photoInput = el('input', '');
    photoInput.type = 'file'; photoInput.accept = 'image/*';
    photoInput.style.display = 'none';
    photoInput.id = `comp-photo-input-${comp.id}`;
    photoInput.onchange = (e) => uploadCompPhoto(comp.id, e.target.files[0]);
    card.appendChild(photoInput);

    // Video file input
    const videoInput = el('input', '');
    videoInput.type = 'file'; videoInput.accept = 'video/*';
    videoInput.style.display = 'none';
    videoInput.id = `comp-video-input-${comp.id}`;
    videoInput.onchange = (e) => uploadCompVideo(comp.id, e.target.files[0]);
    card.appendChild(videoInput);
  }

  return card;
}

async function uploadCompVideo(compId, file) {
  if (!file) return;
  const sizeMB = (file.size / 1024 / 1024).toFixed(1);

  setUploadProgress(compId, `Compressing video (${sizeMB}MB)…`, 0);

  try {
    let blob;
    if (typeof FFmpegLib !== 'undefined' && typeof FFmpegUtil !== 'undefined') {
      blob = await compressVideo(file, (pct, stage) => {
        setUploadProgress(compId, stage, pct);
      });
    } else {
      // FFmpeg not available — upload as-is with size warning
      if (file.size > 200 * 1024 * 1024) {
        hideUploadProgress(compId);
        showToast('Video too large (max 200MB). Please trim it first.');
        return;
      }
      blob = file;
    }

    const compressedMB = (blob.size / 1024 / 1024).toFixed(1);
    setUploadProgress(compId, `Uploading ${compressedMB}MB…`, 99);

    const path = `${compId}/${Data.uid()}.mp4`;
    const { error } = await db.storage.from('comp-media').upload(path, blob, {
      upsert: true, contentType: 'video/mp4',
    });
    if (error) { hideUploadProgress(compId); showToast('Upload failed'); console.error(error); return; }
    const { data } = db.storage.from('comp-media').getPublicUrl(path);
    await saveCompMediaUrl(compId, data.publicUrl);
    hideUploadProgress(compId);
  } catch(e) {
    hideUploadProgress(compId);
    showToast('Upload failed: ' + e.message);
    console.error(e);
  }
}

async function uploadCompPhoto(compId, file) {
  if (!file) return;

  // Show tag picker first
  const tag = await showPhotoTagPicker();
  if (!tag) return; // cancelled

  showToast('Compressing…');
  try {
    const compressed = await compressImage(file, 1080, 0.82);
    showToast('Uploading…');
    const path = `${compId}/${Data.uid()}.jpg`;
    const { error } = await db.storage.from('comp-media').upload(path, compressed, {
      upsert: true, contentType: 'image/jpeg',
    });
    if (error) { showToast('Upload failed'); console.error(error); return; }
    const { data } = db.storage.from('comp-media').getPublicUrl(path);
    await saveCompMediaUrl(compId, data.publicUrl);

    // Find comp date for takenAt
    const comps = await Data.getCompetitions();
    const comp  = comps.find(c => c.id === compId);
    await Data.savePhoto({
      gymnastId: Auth.gymnast?.id,
      compId,
      url:       data.publicUrl,
      category:  tag.category,
      apparatus: tag.apparatus,
      takenAt:   comp?.date || null,
    });
    showToast('Photo saved');
  } catch(e) {
    showToast('Upload failed');
    console.error(e);
  }
}

// ── Video compression via FFmpeg.wasm ────────────────────
let _ffmpeg = null;

async function compressVideo(file, onProgress) {
  const { FFmpeg }    = FFmpegLib;
  const { fetchFile } = FFmpegUtil;

  if (!_ffmpeg) {
    _ffmpeg = new FFmpeg();
    onProgress?.(5, 'Loading compressor…');
    await _ffmpeg.load({
      coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
    });
  }

  _ffmpeg.on('progress', ({ progress }) => {
    onProgress?.(Math.min(95, Math.round(10 + progress * 85)), 'Compressing…');
  });

  const inputName = 'input.' + (file.name.split('.').pop() || 'mp4');
  onProgress?.(8, 'Reading video…');
  await _ffmpeg.writeFile(inputName, await fetchFile(file));

  // Target 720p, H.264, ~2Mbps — ~15MB per minute of video
  await _ffmpeg.exec([
    '-i', inputName,
    '-vf', 'scale=-2:720',
    '-c:v', 'libx264',
    '-crf', '26',
    '-preset', 'fast',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    'output.mp4',
  ]);

  onProgress?.(97, 'Finalising…');
  const data = await _ffmpeg.readFile('output.mp4');
  await _ffmpeg.deleteFile(inputName);
  await _ffmpeg.deleteFile('output.mp4');
  return new Blob([data.buffer], { type: 'video/mp4' });
}

function setUploadProgress(compId, label, pct) {
  const wrap = document.getElementById(`upload-progress-${compId}`);
  const lbl  = document.getElementById(`upload-label-${compId}`);
  const bar  = document.getElementById(`upload-bar-${compId}`);
  if (!wrap) return;
  wrap.style.display = 'block';
  if (lbl) lbl.textContent = label;
  if (bar) bar.style.width = `${pct}%`;
}

function hideUploadProgress(compId) {
  const wrap = document.getElementById(`upload-progress-${compId}`);
  if (wrap) wrap.style.display = 'none';
}

// Compress image to max dimension and JPEG quality using Canvas
function compressImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Scale down to maxDim on longest side
      if (width > maxDim || height > maxDim) {
        if (width >= height) { height = Math.round(height * maxDim / width); width = maxDim; }
        else                 { width  = Math.round(width  * maxDim / height); height = maxDim; }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else      reject(new Error('Compression failed'));
      }, 'image/jpeg', quality);
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function saveCompMediaUrl(compId, url) {
  const comps = await Data.getCompetitions();
  const comp  = comps.find(c => c.id === compId);
  if (!comp) return;
  const urls = [...(comp.mediaUrls || []), url];
  await db.from('competitions').update({ media_urls: urls }).eq('id', compId);
  showToast('Added ✓');
  renderCompetitions();
}

async function removeCompMedia(compId, url) {
  const comps = await Data.getCompetitions();
  const comp  = comps.find(c => c.id === compId);
  if (!comp) return;
  const urls = (comp.mediaUrls || []).filter(u => u !== url);
  await db.from('competitions').update({ media_urls: urls }).eq('id', compId);
  renderCompetitions();
}

// ── Progress chart (org+level aware, highlights current comp) ─
function buildProgressChart(comps, apparatus, highlightId) {
  const sorted = [...comps]
    .filter(c => c.results.some(r => r.apparatus === apparatus && !r.dna))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const wrap = el('div', 'chart-wrap');
  if (sorted.length < 2) {
    wrap.innerHTML = `<div style="height:90px;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-soft);">Need more competitions for chart</div>`;
    return wrap;
  }

  const scores = sorted.map(c => c.results.find(r => r.apparatus === apparatus && !r.dna)?.score || 0);
  const minS = Math.max(0, Math.min(...scores) - 0.3);
  const maxS = Math.max(...scores) + 0.2;
  const range = maxS - minS || 1;
  const W = 320, H = 70;
  const pts = scores.map((s, i) => ({
    x: sorted.length === 1 ? W/2 : 20 + (i / (sorted.length - 1)) * (W - 40),
    y: H - ((s - minS) / range) * H,
    score: s,
    name: sorted[i].name,
    isHighlight: sorted[i].id === highlightId,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${H+5} L ${pts[0].x} ${H+5} Z`;
  const circles = pts.map(p => `
    <circle cx="${p.x}" cy="${p.y}" r="${p.isHighlight ? 6 : 4}"
      fill="${p.isHighlight ? '#F5C842' : '#9B82FF'}"
      stroke="${p.isHighlight ? '#C89A00' : 'none'}" stroke-width="1.5"/>
    <text x="${p.x}" y="${p.y - 9}" text-anchor="middle" font-size="9"
      fill="${p.isHighlight ? '#C89A00' : '#7B5FFF'}" font-weight="700">${p.score.toFixed(2)}</text>
    <text x="${p.x}" y="${H + 16}" text-anchor="middle" font-size="8" fill="#A494CE">${p.name.replace('Competition ','C')}</text>
  `).join('');

  wrap.innerHTML = `
    <svg viewBox="0 0 ${W} ${H + 22}" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad-${apparatus.replace(/\s/g,'')}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7B5FFF" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="#7B5FFF" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <path d="${areaD}" fill="url(#grad-${apparatus.replace(/\s/g,'')})"/>
      <path d="${pathD}" fill="none" stroke="#7B5FFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${circles}
    </svg>
  `;
  return wrap;
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return s[(v-20)%10] || s[v] || s[0];
}

// ── Add / Edit Competition ────────────────────────────────
async function openAddComp() {
  const sheet = document.getElementById('sheet-comp');
  sheet.querySelector('.sheet-title').textContent = 'Add Competition';
  sheet.querySelector('.sheet-body').innerHTML = await buildCompForm();
  sheet.classList.add('open');
}

async function buildCompForm(existingComp) {
  const orgs = await Data.getOrganisations();
  const selectedOrgId = existingComp?.orgId || orgs[0]?.id || '';
  const selectedOrg   = orgs.find(o => o.id === selectedOrgId) || orgs[0];

  const orgOptions = orgs.map(o =>
    `<option value="${o.id}" ${o.id === selectedOrgId ? 'selected' : ''}>${o.name}</option>`
  ).join('');

  const levelOptions = (selectedOrg?.levels || []).map(l =>
    `<option value="${l.id}" ${l.id === existingComp?.levelId ? 'selected' : ''}>${l.name}</option>`
  ).join('');

  const TIERS = ['club','local','regional','national','international','worlds'];
  const tierOptions = TIERS.map(t =>
    `<option value="${t}" ${(existingComp?.tier || 'local') === t ? 'selected' : ''}>${TIER_LABEL[t]}</option>`
  ).join('');

  const apparatusInputs = Data.APPARATUS.map(app => {
    const r = existingComp?.results.find(x => x.apparatus === app);
    const isDNA = r?.dna === true;
    const isUpgrade = Data.UPGRADE_TARGETS.includes(app);
    return `
      <div class="app-input-card" id="card-${app}">
        <div class="app-name" style="justify-content:space-between;">
          <span>${app}${isUpgrade ? ' <span class="upgrade-mark">⭐</span>' : ''}</span>
          <label style="display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;color:var(--text-soft);cursor:pointer;letter-spacing:0.3px;">
            <input type="checkbox" id="dna-${app}" onchange="toggleDNA('${app}')"
              ${isDNA ? 'checked' : ''} style="accent-color:var(--red);">DNA
          </label>
        </div>
        <div class="app-input-row" id="inputs-${app}" style="${isDNA ? 'opacity:0.3;pointer-events:none;' : ''}">
          <input type="number" step="0.01" min="0" max="10" placeholder="Score"
            id="score-${app}" value="${r && !isDNA ? r.score : ''}" class="score-field" ${isDNA ? 'disabled' : ''}>
          <input type="number" min="1" max="30" placeholder="Pos"
            id="pos-${app}" value="${r?.position && !isDNA ? r.position : ''}" class="pos-input pos-field" ${isDNA ? 'disabled' : ''}>
        </div>
      </div>`;
  }).join('');

  return `
    ${buildGymnastSelectorField(existingComp?.gymnast_id)}
    <div class="form-group">
      <label class="form-label">Competition Name</label>
      <input class="form-input" id="f-name" placeholder="e.g. Regional Championships" value="${existingComp?.name || ''}">
    </div>
    <div class="form-group">
      <label class="form-label">Venue</label>
      <input class="form-input" id="f-venue" placeholder="e.g. Crystal Palace NSC" value="${existingComp?.venue || ''}">
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Date</label>
        <input class="form-input" id="f-date" type="date" value="${existingComp?.date || new Date().toISOString().slice(0,10)}">
      </div>
      <div class="form-group">
        <label class="form-label">Tier</label>
        <select class="form-select" id="f-tier">${tierOptions}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Organisation</label>
        <select class="form-select" id="f-org-id" onchange="updateLevelDropdown(this.value)">${orgOptions}</select>
      </div>
      <div class="form-group">
        <label class="form-label">Level</label>
        <select class="form-select" id="f-level-id">${levelOptions}</select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Overall Position</label>
        <input class="form-input" id="f-overall-pos" type="number" min="1" placeholder="e.g. 5"
               value="${existingComp?.overall_position || existingComp?.overallPosition || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">Field Size</label>
        <input class="form-input" id="f-field-size" type="number" min="1" placeholder="e.g. 24"
               value="${existingComp?.fieldSize || ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Scores &amp; Positions</label>
      <div class="apparatus-grid">${apparatusInputs}</div>
    </div>
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea class="form-textarea" id="f-notes" placeholder="Any notes...">${existingComp?.notes || ''}</textarea>
    </div>
    <div class="form-actions">
      <button class="btn-cancel" onclick="closeSheet('sheet-comp')">Cancel</button>
      <button class="btn-primary" style="flex:2;" onclick="saveComp('${existingComp?.id || ''}')">Save Competition</button>
    </div>
  `;
}

async function updateLevelDropdown(orgId) {
  const orgs = await Data.getOrganisations();
  const org  = orgs.find(o => o.id === orgId);
  const sel  = document.getElementById('f-level-id');
  if (!sel || !org) return;
  sel.innerHTML = org.levels.map(l =>
    `<option value="${l.id}">${l.name}</option>`
  ).join('');
}

function toggleDNA(app) {
  const isDNA = document.getElementById(`dna-${app}`)?.checked;
  const inputs = document.getElementById(`inputs-${app}`);
  if (!inputs) return;
  inputs.style.opacity = isDNA ? '0.3' : '1';
  inputs.style.pointerEvents = isDNA ? 'none' : '';
  const scoreEl = document.getElementById(`score-${app}`);
  const posEl   = document.getElementById(`pos-${app}`);
  if (isDNA) { scoreEl.value = ''; posEl.value = ''; scoreEl.disabled = true; posEl.disabled = true; }
  else { scoreEl.disabled = false; posEl.disabled = false; }
}

async function saveComp(existingId) {
  const name = document.getElementById('f-name')?.value?.trim();
  if (!name) { alert('Please enter a competition name.'); return; }

  const results = Data.APPARATUS.map(app => {
    const isDNA = document.getElementById(`dna-${app}`)?.checked;
    if (isDNA) return { apparatus: app, score: 0, position: undefined, dna: true };
    const score = parseFloat(document.getElementById(`score-${app}`)?.value);
    const position = parseInt(document.getElementById(`pos-${app}`)?.value) || undefined;
    if (!isNaN(score) && score > 0) return { apparatus: app, score, position, dna: false };
    return null;
  }).filter(Boolean);

  const orgId   = document.getElementById('f-org-id')?.value || null;
  const levelId = document.getElementById('f-level-id')?.value || null;
  const orgs    = await Data.getOrganisations();
  const orgName   = orgs.find(o => o.id === orgId)?.name || '';
  const levelName = orgs.flatMap(o => o.levels).find(l => l.id === levelId)?.name || '';

  const comp = {
    id:              existingId || Data.uid(),
    name,
    venue:           document.getElementById('f-venue')?.value?.trim() || '',
    date:            document.getElementById('f-date')?.value || new Date().toISOString().slice(0,10),
    organisation:    orgName,
    level:           levelName,
    notes:           document.getElementById('f-notes')?.value?.trim() || '',
    orgId, levelId,
    tier:            document.getElementById('f-tier')?.value || 'local',
    fieldSize:       parseInt(document.getElementById('f-field-size')?.value) || null,
    overallPosition: parseInt(document.getElementById('f-overall-pos')?.value) || null,
    results,
  };

  const formGid = document.getElementById('f-gymnast-id')?.value;
  if (formGid && formGid !== Auth.gymnast?.id) {
    Auth.selectGymnast(formGid);
    buildGymnastSwitcher();
  }

  await Data.saveCompetition(comp);
  closeSheet('sheet-comp');
  renderDashboard();
  renderAchievements();
  renderCompetitions();
}

async function openEditComp(id) {
  const comps = await Data.getCompetitions();
  const comp = comps.find(c => c.id === id);
  if (!comp) return;
  closeAdmin();
  const sheet = document.getElementById('sheet-comp');
  sheet.querySelector('.sheet-title').textContent = 'Edit Competition';
  sheet.querySelector('.sheet-body').innerHTML = await buildCompForm(comp);
  sheet.classList.add('open');
}

async function confirmDeleteComp(id, name) {
  if (confirm(`Delete "${name}"? This cannot be undone.`)) {
    await Data.deleteCompetition(id);
    renderAdmin();
    renderDashboard();
    renderCompetitions();
  }
}
