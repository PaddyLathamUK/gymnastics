/* ═══════════════════════════════════════════
   DATA LAYER — Supabase
   All reads/writes go through this module.
   Same exported API as the old localStorage
   version — nothing else in the app changes.
═══════════════════════════════════════════ */

// ── Constants ──────────────────────────────
const APPARATUS       = ['Floor', 'Vault', 'Bars', 'Beam'];
const UPGRADE_TARGETS = ['Vault', 'Beam'];
let   WORLDS_DATE     = new Date('2026-06-27T09:00:00');

// ── Helpers ────────────────────────────────
function uid() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function allAroundScore(comp) {
  return (comp.results || []).filter(r => !r.dna).reduce((s, r) => s + r.score, 0);
}

// ── Init ───────────────────────────────────
async function init() {
  const dates = await getDates();
  if (dates.worldsDate) {
    Data.WORLDS_DATE = new Date(dates.worldsDate + 'T09:00:00');
  }
  const comps = await getCompetitions();
  if (comps.length === 0) await seedData();
}

async function seedData() {
  const comp1 = {
    id: 'comp-seed-1', name: 'Competition 1', venue: 'TBC',
    date: '2026-02-15', organisation: 'USAIGC', level: 'Copper 1',
    notes: 'AA 36.60 — 2nd overall. 1st on Vault and Beam.',
    results: [
      { apparatus: 'Floor', score: 9.00, position: 4, dna: false },
      { apparatus: 'Vault', score: 9.60, position: 1, dna: false },
      { apparatus: 'Bars',  score: 8.60, position: 7, dna: false },
      { apparatus: 'Beam',  score: 9.40, position: 1, dna: false },
    ],
  };
  const comp2 = {
    id: 'comp-seed-2', name: 'Competition 2', venue: 'TBC',
    date: '2026-03-22', organisation: 'USAIGC', level: 'Copper 1',
    notes: 'AA 36.35 — 2nd overall.',
    results: [
      { apparatus: 'Floor', score: 8.90, position: 2, dna: false },
      { apparatus: 'Vault', score: 9.60, position: 2, dna: false },
      { apparatus: 'Bars',  score: 8.80, position: 3, dna: false },
      { apparatus: 'Beam',  score: 9.10, position: 2, dna: false },
    ],
  };
  await saveCompetition(comp1);
  await saveCompetition(comp2);

  const seedSessions = [
    { id: 's-seed-1', date: '2026-05-27', durationMins: 180, focus: ['Vault','Beam'], flagged: true,  notes: 'Upgrade focus — vault run-ups improving' },
    { id: 's-seed-2', date: '2026-05-24', durationMins: 180, focus: ['Floor','Bars'], flagged: false, notes: 'Choreo work on floor routine' },
    { id: 's-seed-3', date: '2026-05-21', durationMins: 180, focus: ['Vault'],        flagged: true,  notes: '' },
    { id: 's-seed-4', date: '2026-05-19', durationMins: 180, focus: ['Bars','Beam'],  flagged: false, notes: '' },
  ];
  for (const s of seedSessions) await saveSession(s);

  const seedAchievements = [
    { id: 'a-seed-1', kind: 'pb',     title: 'New Vault PB!',     detail: '9.60',      apparatus: 'Vault', date: '2026-02-15', isNew: false },
    { id: 'a-seed-2', kind: 'pb',     title: 'New Beam PB!',      detail: '9.40',      apparatus: 'Beam',  date: '2026-02-15', isNew: false },
    { id: 'a-seed-3', kind: 'medal',  title: 'Vault — 1st Place', detail: '🥇 Gold',   apparatus: 'Vault', date: '2026-02-15', isNew: false },
    { id: 'a-seed-4', kind: 'medal',  title: 'Beam — 1st Place',  detail: '🥇 Gold',   apparatus: 'Beam',  date: '2026-02-15', isNew: false },
    { id: 'a-seed-5', kind: 'podium', title: 'All-Around — 2nd',  detail: '🥈 Silver', apparatus: null,    date: '2026-02-15', isNew: false },
    { id: 'a-seed-6', kind: 'pb',     title: 'New Bars PB!',      detail: '8.80',      apparatus: 'Bars',  date: '2026-03-22', isNew: false },
  ];
  for (const a of seedAchievements) await _saveAchievement(a);
}

// ── Competitions ───────────────────────────
async function getCompetitions() {
  const { data: comps, error } = await db
    .from('competitions')
    .select('*, competition_results(*)')
    .order('date', { ascending: false });
  if (error) { console.error('getCompetitions:', error); return []; }
  return comps.map(c => ({
    id: c.id, name: c.name, venue: c.venue,
    date: c.date, organisation: c.organisation,
    level: c.level, notes: c.notes,
    results: (c.competition_results || []).map(r => ({
      apparatus: r.apparatus,
      score: parseFloat(r.score),
      position: r.position,
      dna: r.dna,
    })),
  }));
}

async function saveCompetition(comp) {
  const { error: compErr } = await db.from('competitions').upsert({
    id: comp.id, name: comp.name, venue: comp.venue || '',
    date: comp.date, organisation: comp.organisation,
    level: comp.level, notes: comp.notes || '',
  });
  if (compErr) { console.error('saveCompetition:', compErr); return; }

  await db.from('competition_results').delete().eq('competition_id', comp.id);
  if (comp.results?.length) {
    const rows = comp.results.map(r => ({
      competition_id: comp.id,
      apparatus: r.apparatus, score: r.score,
      position: r.position || null, dna: r.dna || false,
    }));
    const { error } = await db.from('competition_results').insert(rows);
    if (error) console.error('saveCompetition results:', error);
  }

  const allComps = await getCompetitions();
  await checkForNewPBs(comp, allComps);
}

async function deleteCompetition(id) {
  await db.from('competitions').delete().eq('id', id);
}

// ── Personal bests ─────────────────────────
async function getPersonalBests() {
  const comps = await getCompetitions();
  const bests = {};
  for (const comp of comps) {
    for (const r of comp.results) {
      if (!r.dna && (!bests[r.apparatus] || r.score > bests[r.apparatus])) {
        bests[r.apparatus] = r.score;
      }
    }
  }
  return bests;
}

async function checkForNewPBs(comp, allComps) {
  const existing = await getAchievements();
  const rows = [];
  for (const r of (comp.results || [])) {
    if (r.dna) continue;
    const existingPB = existing
      .filter(a => a.kind === 'pb' && a.apparatus === r.apparatus)
      .reduce((max, a) => Math.max(max, parseFloat(a.detail)), 0);
    const currentBest = allComps.flatMap(c => c.results)
      .filter(x => x.apparatus === r.apparatus && !x.dna)
      .reduce((max, x) => Math.max(max, x.score), 0);
    if (r.score > existingPB && r.score >= currentBest) {
      rows.push({ id: uid(), kind: 'pb', title: `New ${r.apparatus} PB!`,
        detail: r.score.toFixed(2), apparatus: r.apparatus, date: comp.date, is_new: true });
    }
    if (r.position === 1) {
      rows.push({ id: uid(), kind: 'medal', title: `${r.apparatus} — 1st Place`,
        detail: '🥇 Gold', apparatus: r.apparatus, date: comp.date, is_new: true });
    }
  }
  if (rows.length) await db.from('achievements').insert(rows);
}

// ── Sessions ───────────────────────────────
async function getSessions() {
  const { data, error } = await db.from('training_sessions').select('*').order('date', { ascending: false });
  if (error) { console.error('getSessions:', error); return []; }
  return data.map(s => ({
    id: s.id, date: s.date, durationMins: s.duration_mins,
    focus: s.focus || [], flagged: s.flagged, notes: s.notes,
  }));
}

async function saveSession(session) {
  const { error } = await db.from('training_sessions').upsert({
    id: session.id, date: session.date, duration_mins: session.durationMins,
    focus: session.focus || [], flagged: session.flagged || false, notes: session.notes || '',
  });
  if (error) console.error('saveSession:', error);
}

async function deleteSession(id) {
  await db.from('training_sessions').delete().eq('id', id);
}

// ── Achievements ───────────────────────────
async function getAchievements() {
  const { data, error } = await db.from('achievements').select('*').order('date', { ascending: false });
  if (error) { console.error('getAchievements:', error); return []; }
  return data.map(a => ({
    id: a.id, kind: a.kind, title: a.title, detail: a.detail,
    apparatus: a.apparatus, date: a.date, isNew: a.is_new,
  }));
}

async function _saveAchievement(a) {
  await db.from('achievements').upsert({
    id: a.id, kind: a.kind, title: a.title, detail: a.detail,
    apparatus: a.apparatus || null, date: a.date, is_new: a.isNew ?? false,
  });
}

async function markAchievementSeen(id) {
  await db.from('achievements').update({ is_new: false }).eq('id', id);
}

// ── Worlds state ───────────────────────────
async function getWorldsState() {
  const { data } = await db.from('worlds_state').select('*').eq('id', 1).single();
  return { vault: data?.vault || false, beam: data?.beam || false };
}

async function saveWorldsState(state) {
  await db.from('worlds_state').update({ vault: state.vault, beam: state.beam }).eq('id', 1);
}

// ── Profile ────────────────────────────────
async function getProfile() {
  const { data } = await db.from('profile').select('*').eq('id', 1).single();
  return {
    name: data?.name || 'Thea Latham',
    club: data?.club || 'Star-Tastic Gymnastics',
    usaigcLevel: data?.usaigc_level || 'Copper 1',
    igaLevel: data?.iga_level || 'Level 8',
  };
}

async function saveProfile(profile) {
  await db.from('profile').update({
    name: profile.name, club: profile.club,
    usaigc_level: profile.usaigcLevel, iga_level: profile.igaLevel,
  }).eq('id', 1);
}

// ── Dates ──────────────────────────────────
async function getDates() {
  const { data } = await db.from('app_dates').select('*').eq('id', 1).single();
  return {
    worldsDate:   data?.worlds_date    || '2026-06-27',
    nextCompName: data?.next_comp_name || '',
    nextCompDate: data?.next_comp_date || '',
  };
}

async function saveDates(dates) {
  await db.from('app_dates').update({
    worlds_date:    dates.worldsDate   || null,
    next_comp_name: dates.nextCompName || '',
    next_comp_date: dates.nextCompDate || null,
  }).eq('id', 1);
  if (dates.worldsDate) Data.WORLDS_DATE = new Date(dates.worldsDate + 'T09:00:00');
}

// ── Migrate from localStorage ──────────────
async function migrateFromLocalStorage() {
  const lsComps        = JSON.parse(localStorage.getItem('thea_competitions') || '[]');
  const lsSessions     = JSON.parse(localStorage.getItem('thea_sessions')     || '[]');
  const lsAchievements = JSON.parse(localStorage.getItem('thea_achievements') || '[]');
  const lsWorlds   = JSON.parse(localStorage.getItem('thea_worlds')   || '{"vault":false,"beam":false}');
  const lsProfile  = JSON.parse(localStorage.getItem('thea_profile')  || '{}');
  const lsDates    = JSON.parse(localStorage.getItem('thea_dates')    || '{}');
  let count = 0;
  for (const c of lsComps)    { await saveCompetition(c); count++; }
  for (const s of lsSessions) { await saveSession(s);     count++; }
  for (const a of lsAchievements) { await _saveAchievement(a); count++; }
  await saveWorldsState(lsWorlds);
  if (lsProfile.name)     await saveProfile(lsProfile);
  if (lsDates.worldsDate) await saveDates(lsDates);
  return count;
}

const Data = {
  init,
  getCompetitions, saveCompetition, deleteCompetition,
  getPersonalBests,
  getSessions, saveSession, deleteSession,
  getAchievements, markAchievementSeen,
  getWorldsState, saveWorldsState,
  getProfile, saveProfile,
  getDates, saveDates,
  migrateFromLocalStorage,
  uid, formatDate, formatDateShort, allAroundScore,
  APPARATUS, UPGRADE_TARGETS, WORLDS_DATE,
};
