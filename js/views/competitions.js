/* ── Competitions View ── */

let compOrgFilter = 'All';
let compDetailId  = null;

async function renderCompetitions() {
  const view = document.getElementById('view-comps');
  view.innerHTML = '';

  if (compDetailId) {
    await renderCompDetail(view);
    return;
  }

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `<div class="nav-title">Competitions</div>`;
  const addBtn = el('button', 'nav-action');
  addBtn.textContent = '+';
  addBtn.onclick = () => openAddComp();
  nav.appendChild(addBtn);
  view.appendChild(nav);

  const filterRow = el('div', 'filter-row');
  for (const org of ['All', 'USAIGC', 'IGA UK']) {
    const chip = el('div', `filter-chip${org === compOrgFilter ? ' active' : ''}`);
    chip.textContent = org;
    chip.onclick = () => { compOrgFilter = org; renderCompetitions(); };
    filterRow.appendChild(chip);
  }
  view.appendChild(filterRow);

  const allComps = await Data.getCompetitions();
  const pbs = await Data.getPersonalBests();

  const chartWrap = el('div');
  chartWrap.style.padding = '4px 16px 0';
  chartWrap.appendChild(buildProgressChart(allComps, 'Vault'));
  view.appendChild(chartWrap);

  const scroll = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  const filtered = allComps.filter(c => compOrgFilter === 'All' || c.organisation === compOrgFilter);

  if (filtered.length === 0) {
    content.appendChild(emptyState('📋', 'No competitions yet', 'Tap + to add your first result'));
  } else {
    for (const comp of filtered) {
      content.appendChild(buildCompCard(comp, pbs));
    }
  }
}

function buildCompCard(comp, pbs) {
  const aa = Data.allAroundScore(comp);
  const card = el('div', 'comp-card');
  const miniScores = Data.APPARATUS.map(app => {
    const r = comp.results.find(x => x.apparatus === app);
    if (!r) return '';
    if (r.dna) return `<div class="ms"><div class="ms-lbl">${app.slice(0,2).toUpperCase()}</div><div class="ms-val" style="color:var(--text-soft);font-size:10px;">DNA</div></div>`;
    return `<div class="ms"><div class="ms-lbl">${app.slice(0,2).toUpperCase()}</div><div class="ms-val ${r.score === pbs[app] ? 'pb' : ''}">${r.score.toFixed(1)}</div></div>`;
  }).join('');

  card.innerHTML = `
    <div class="comp-card-header">
      <div>
        <div class="comp-name">${comp.name}</div>
        <div class="comp-venue">${comp.venue || '—'}</div>
        <div class="comp-date">${Data.formatDateShort(comp.date)}</div>
      </div>
      <div class="comp-aa">
        <div class="comp-aa-score">${aa.toFixed(2)}</div>
        <div class="comp-aa-lbl">All-Around</div>
      </div>
    </div>
    <div class="comp-chip-row">
      <span class="chip chip-purple">${comp.organisation}</span>
      <span class="chip chip-gold">${comp.level}</span>
      <div class="mini-scores">${miniScores}</div>
    </div>
  `;
  card.onclick = () => { compDetailId = comp.id; renderCompetitions(); };
  return card;
}

async function renderCompDetail(view) {
  const allComps = await Data.getCompetitions();
  const comp = allComps.find(c => c.id === compDetailId);
  if (!comp) { compDetailId = null; renderCompetitions(); return; }
  const pbs = await Data.getPersonalBests();
  const aa  = Data.allAroundScore(comp);

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `
    <button class="nav-back" id="comp-back">‹ Back</button>
    <div class="nav-title" style="font-size:16px;">${comp.name}</div>
  `;
  view.appendChild(nav);
  nav.querySelector('#comp-back').onclick = () => { compDetailId = null; renderCompetitions(); };

  const scroll = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  // Header card
  const headerCard = el('div', 'card');
  headerCard.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:19px;font-weight:800;color:var(--text);">${comp.name}</div>
        <div style="font-size:13px;color:var(--text-soft);margin-top:3px;">${comp.venue || '—'}</div>
        <div style="font-size:12px;color:var(--text-soft);margin-top:2px;">${Data.formatDate(comp.date)}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:30px;font-weight:800;color:var(--purple);letter-spacing:-1px;">${aa.toFixed(2)}</div>
        <div style="font-size:10px;color:var(--text-soft);">All-Around</div>
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;">
      <span class="chip chip-purple">${comp.organisation}</span>
      <span class="chip chip-gold">${comp.level}</span>
    </div>
  `;
  content.appendChild(headerCard);

  // Results
  const resultsCard = el('div', 'card');
  const rows = Data.APPARATUS.map(app => {
    const r = comp.results.find(x => x.apparatus === app);
    if (!r) return '';
    const isPB = !r.dna && r.score === pbs[app];
    const isUpgrade = Data.UPGRADE_TARGETS.includes(app);
    const scoreBadge = r.dna
      ? `<span class="score-badge dna">DNA</span>`
      : `<span class="score-badge ${isPB ? 'pb' : ''}">${r.score.toFixed(2)}</span>`;
    return `
      <div class="result-row">
        <span class="rr-app">${app}</span>
        ${isUpgrade ? '<span class="rr-star">⭐</span>' : ''}
        <span class="rr-spacer"></span>
        ${r.position && !r.dna ? `<span class="pos-pill ${posCls(r.position)}">${posLabel(r.position)}</span>` : ''}
        ${scoreBadge}
      </div>`;
  }).join('');
  resultsCard.innerHTML = `<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:10px;">Results</div>${rows}`;
  content.appendChild(resultsCard);

  // Charts
  const chartsCard = el('div', 'card');
  chartsCard.innerHTML = `<div style="font-size:15px;font-weight:700;color:var(--text);margin-bottom:12px;">Progress</div>`;
  for (const app of Data.APPARATUS) {
    const label = el('div');
    label.style.cssText = 'font-size:12px;font-weight:600;color:var(--text-mid);margin-bottom:2px;';
    label.textContent = app + (Data.UPGRADE_TARGETS.includes(app) ? ' ⭐' : '');
    chartsCard.appendChild(label);
    chartsCard.appendChild(buildProgressChart(allComps, app));
  }
  content.appendChild(chartsCard);

  if (comp.notes) {
    const notesCard = el('div', 'card');
    notesCard.innerHTML = `
      <div style="font-size:13px;font-weight:700;color:var(--text-mid);margin-bottom:6px;">Notes</div>
      <div style="font-size:14px;color:var(--text);line-height:1.5;">${comp.notes}</div>
    `;
    content.appendChild(notesCard);
  }

  const delBtn = el('button', 'btn-cancel');
  delBtn.style.cssText = 'width:100%;color:var(--red);border-color:rgba(255,91,122,0.2);';
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

function buildProgressChart(comps, apparatus) {
  const sorted = [...comps]
    .filter(c => c.results.some(r => r.apparatus === apparatus && !r.dna))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const wrap = el('div', 'chart-wrap');
  if (sorted.length < 2) {
    wrap.innerHTML = `<div style="height:90px;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--text-soft);">Need more competitions for a chart</div>`;
    return wrap;
  }

  const scores = sorted.map(c => c.results.find(r => r.apparatus === apparatus && !r.dna)?.score || 0);
  const minS = Math.max(0, Math.min(...scores) - 0.5);
  const maxS = Math.max(...scores) + 0.2;
  const range = maxS - minS || 1;
  const W = 320, H = 70;
  const pts = scores.map((s, i) => ({
    x: i === 0 ? 20 : i === scores.length - 1 ? W - 20 : 20 + (i / (scores.length - 1)) * (W - 40),
    y: H - ((s - minS) / range) * H,
    score: s,
    name: sorted[i].name,
  }));

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${pts[pts.length-1].x} ${H+5} L ${pts[0].x} ${H+5} Z`;
  const circles = pts.map(p => `
    <circle cx="${p.x}" cy="${p.y}" r="4" fill="#9B82FF"/>
    <text x="${p.x}" y="${p.y - 8}" text-anchor="middle" font-size="9" fill="#7B5FFF" font-weight="700">${p.score.toFixed(2)}</text>
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

// ── Add Competition Sheet ──
function openAddComp() {
  const sheet = document.getElementById('sheet-comp');
  sheet.querySelector('.sheet-title').textContent = 'Add Competition';
  sheet.querySelector('.sheet-body').innerHTML = buildCompForm();
  sheet.classList.add('open');
}

function buildCompForm(existingComp) {
  const apparatusInputs = Data.APPARATUS.map(app => {
    const r = existingComp?.results.find(x => x.apparatus === app);
    const isDNA = r?.dna === true;
    const isUpgrade = Data.UPGRADE_TARGETS.includes(app);
    return `
      <div class="app-input-card" id="card-${app}">
        <div class="app-name" style="justify-content:space-between;">
          <span>${app} ${isUpgrade ? '<span class="upgrade-mark">⭐</span>' : ''}</span>
          <label style="display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;
            color:var(--text-soft);cursor:pointer;letter-spacing:0.3px;">
            <input type="checkbox" id="dna-${app}" onchange="toggleDNA('${app}')"
              ${isDNA ? 'checked' : ''} style="accent-color:var(--red);">
            DNA
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
    <div class="form-group">
      <label class="form-label">Competition Name</label>
      <input class="form-input" id="f-name" placeholder="e.g. Competition 3" value="${existingComp?.name || ''}">
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
        <label class="form-label">Organisation</label>
        <select class="form-select" id="f-org">
          <option ${existingComp?.organisation === 'USAIGC' ? 'selected' : ''}>USAIGC</option>
          <option ${existingComp?.organisation === 'IGA UK'  ? 'selected' : ''}>IGA UK</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Level</label>
      <select class="form-select" id="f-level">
        <option ${existingComp?.level === 'Copper 1' ? 'selected' : ''}>Copper 1</option>
        <option ${existingComp?.level === 'Copper 2' ? 'selected' : ''}>Copper 2</option>
        <option ${existingComp?.level === 'Level 8'  ? 'selected' : ''}>Level 8</option>
      </select>
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

  const comp = {
    id:           existingId || Data.uid(),
    name,
    venue:        document.getElementById('f-venue')?.value?.trim() || '',
    date:         document.getElementById('f-date')?.value || new Date().toISOString().slice(0,10),
    organisation: document.getElementById('f-org')?.value || 'USAIGC',
    level:        document.getElementById('f-level')?.value || 'Copper 1',
    notes:        document.getElementById('f-notes')?.value?.trim() || '',
    results,
  };

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
  sheet.querySelector('.sheet-body').innerHTML = buildCompForm(comp);
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
