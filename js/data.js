/* ═══════════════════════════════════════════
   DATA LAYER — localStorage persistence
   All reads/writes go through this module.
═══════════════════════════════════════════ */

const KEYS = {
  competitions: 'thea_competitions',
  sessions:     'thea_sessions',
  achievements: 'thea_achievements',
  worlds:       'thea_worlds',
  profile:      'thea_profile',
  dates:        'thea_dates',
};

// ── Seed data ──────────────────────────────
const SEED_COMPETITIONS = [
  {
    id: 'comp-1',
    name: 'Competition 1',
    venue: 'TBC',
    date: '2026-02-15',
    organisation: 'USAIGC',
    level: 'Copper 1',
    notes: 'AA 36.60 — 2nd overall. 1st on Vault and Beam.',
    results: [
      { apparatus: 'Floor', score: 9.00, position: 4 },
      { apparatus: 'Vault', score: 9.60, position: 1 },
      { apparatus: 'Bars',  score: 8.60, position: 7 },
      { apparatus: 'Beam',  score: 9.40, position: 1 },
    ],
  },
  {
    id: 'comp-2',
    name: 'Competition 2',
    venue: 'TBC',
    date: '2026-03-22',
    organisation: 'USAIGC',
    level: 'Copper 1',
    notes: 'AA 36.35 — 2nd overall.',
    results: [
      { apparatus: 'Floor', score: 8.90, position: 2 },
      { apparatus: 'Vault', score: 9.60, position: 2 },
      { apparatus: 'Bars',  score: 8.80, position: 3 },
      { apparatus: 'Beam',  score: 9.10, position: 2 },
    ],
  },
];

const SEED_SESSIONS = [
  { id: 's-1', date: '2026-05-27', durationMins: 180, focus: ['Vault','Beam'], flagged: true,  notes: 'Upgrade focus — vault run-ups improving' },
  { id: 's-2', date: '2026-05-24', durationMins: 180, focus: ['Floor','Bars'], flagged: false, notes: 'Choreo work on floor routine' },
  { id: 's-3', date: '2026-05-21', durationMins: 180, focus: ['Vault'],       flagged: true,  notes: '' },
  { id: 's-4', date: '2026-05-19', durationMins: 180, focus: ['Bars','Beam'], flagged: false, notes: '' },
];

const SEED_ACHIEVEMENTS = [
  { id: 'a-1', kind: 'pb',     title: 'New Vault PB!',       detail: '9.60', apparatus: 'Vault', date: '2026-02-15', isNew: false },
  { id: 'a-2', kind: 'pb',     title: 'New Beam PB!',        detail: '9.40', apparatus: 'Beam',  date: '2026-02-15', isNew: false },
  { id: 'a-3', kind: 'medal',  title: 'Vault — 1st Place',   detail: '🥇 Gold',  apparatus: 'Vault', date: '2026-02-15', isNew: false },
  { id: 'a-4', kind: 'medal',  title: 'Beam — 1st Place',    detail: '🥇 Gold',  apparatus: 'Beam',  date: '2026-02-15', isNew: false },
  { id: 'a-5', kind: 'podium', title: 'All-Around — 2nd',    detail: '🥈 Silver', apparatus: null,   date: '2026-02-15', isNew: false },
  { id: 'a-6', kind: 'pb',     title: 'New Bars PB!',        detail: '8.80', apparatus: 'Bars',  date: '2026-03-22', isNew: false },
];

const SEED_WORLDS = { vault: false, beam: false };

const SEED_PROFILE = {
  name:        'Thea Latham',
  club:        'Star-Tastic Gymnastics',
  usaigcLevel: 'Copper 1',
  igaLevel:    'Level 8',
};

const SEED_DATES = {
  worldsDate:   '2026-06-27',
  nextCompName: '',
  nextCompDate: '',
};

// ── Init ───────────────────────────────────
function init() {
  if (!localStorage.getItem(KEYS.competitions)) {
    localStorage.setItem(KEYS.competitions, JSON.stringify(SEED_COMPETITIONS));
  }
  if (!localStorage.getItem(KEYS.sessions)) {
    localStorage.setItem(KEYS.sessions, JSON.stringify(SEED_SESSIONS));
  }
  if (!localStorage.getItem(KEYS.achievements)) {
    localStorage.setItem(KEYS.achievements, JSON.stringify(SEED_ACHIEVEMENTS));
  }
  if (!localStorage.getItem(KEYS.worlds)) {
    localStorage.setItem(KEYS.worlds, JSON.stringify(SEED_WORLDS));
  }
  if (!localStorage.getItem(KEYS.profile)) {
    localStorage.setItem(KEYS.profile, JSON.stringify(SEED_PROFILE));
  }
  if (!localStorage.getItem(KEYS.dates)) {
    localStorage.setItem(KEYS.dates, JSON.stringify(SEED_DATES));
  }
  // Sync WORLDS_DATE from stored dates
  const storedDates = JSON.parse(localStorage.getItem(KEYS.dates) || '{}');
  if (storedDates.worldsDate) {
    Data.WORLDS_DATE = new Date(storedDates.worldsDate + 'T09:00:00');
  }
}

// ── Competitions ───────────────────────────
function getCompetitions() {
  return JSON.parse(localStorage.getItem(KEYS.competitions) || '[]')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function saveCompetition(comp) {
  const all = getCompetitions();
  const idx = all.findIndex(c => c.id === comp.id);
  if (idx >= 0) all[idx] = comp;
  else all.push(comp);
  localStorage.setItem(KEYS.competitions, JSON.stringify(all));
  checkForNewPBs(comp);
}

function deleteCompetition(id) {
  const all = getCompetitions().filter(c => c.id !== id);
  localStorage.setItem(KEYS.competitions, JSON.stringify(all));
}

// ── Personal bests ─────────────────────────
function getPersonalBests() {
  const bests = {};
  for (const comp of getCompetitions()) {
    for (const r of comp.results) {
      if (!bests[r.apparatus] || r.score > bests[r.apparatus]) {
        bests[r.apparatus] = r.score;
      }
    }
  }
  return bests;
}

function checkForNewPBs(comp) {
  const bests = getPersonalBests();
  const achievements = getAchievements();
  let changed = false;

  for (const r of comp.results) {
    const existingPB = achievements
      .filter(a => a.kind === 'pb' && a.apparatus === r.apparatus)
      .reduce((max, a) => Math.max(max, parseFloat(a.detail)), 0);

    if (r.score > existingPB && r.score >= bests[r.apparatus]) {
      achievements.unshift({
        id: 'a-' + Date.now() + '-' + r.apparatus,
        kind: 'pb',
        title: `New ${r.apparatus} PB!`,
        detail: r.score.toFixed(2),
        apparatus: r.apparatus,
        date: comp.date,
        isNew: true,
      });
      changed = true;
    }
    if (r.position === 1) {
      achievements.unshift({
        id: 'a-gold-' + Date.now() + '-' + r.apparatus,
        kind: 'medal',
        title: `${r.apparatus} — 1st Place`,
        detail: '🥇 Gold',
        apparatus: r.apparatus,
        date: comp.date,
        isNew: true,
      });
      changed = true;
    }
  }

  if (changed) localStorage.setItem(KEYS.achievements, JSON.stringify(achievements));
}

// ── Sessions ───────────────────────────────
function getSessions() {
  return JSON.parse(localStorage.getItem(KEYS.sessions) || '[]')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function saveSession(session) {
  const all = getSessions();
  const idx = all.findIndex(s => s.id === session.id);
  if (idx >= 0) all[idx] = session;
  else all.push(session);
  localStorage.setItem(KEYS.sessions, JSON.stringify(all));
}

function deleteSession(id) {
  const all = getSessions().filter(s => s.id !== id);
  localStorage.setItem(KEYS.sessions, JSON.stringify(all));
}

// ── Achievements ───────────────────────────
function getAchievements() {
  return JSON.parse(localStorage.getItem(KEYS.achievements) || '[]')
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function markAchievementSeen(id) {
  const all = getAchievements().map(a => a.id === id ? { ...a, isNew: false } : a);
  localStorage.setItem(KEYS.achievements, JSON.stringify(all));
}

// ── Worlds state ───────────────────────────
function getWorldsState() {
  return JSON.parse(localStorage.getItem(KEYS.worlds) || '{"vault":false,"beam":false}');
}

function saveWorldsState(state) {
  localStorage.setItem(KEYS.worlds, JSON.stringify(state));
}

// ── Helpers ────────────────────────────────
function uid() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function allAroundScore(comp) {
  return comp.results.filter(r => !r.dna).reduce((s, r) => s + r.score, 0);
}

const APPARATUS = ['Floor', 'Vault', 'Bars', 'Beam'];
const UPGRADE_TARGETS = ['Vault', 'Beam'];
const WORLDS_DATE = new Date('2026-06-27T09:00:00');

// ── Profile ────────────────────────────────
function getProfile() {
  return JSON.parse(localStorage.getItem(KEYS.profile) || JSON.stringify(SEED_PROFILE));
}
function saveProfile(profile) {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile));
}

// ── Dates ──────────────────────────────────
function getDates() {
  return JSON.parse(localStorage.getItem(KEYS.dates) || JSON.stringify(SEED_DATES));
}
function saveDates(dates) {
  localStorage.setItem(KEYS.dates, JSON.stringify(dates));
  if (dates.worldsDate) {
    Data.WORLDS_DATE = new Date(dates.worldsDate + 'T09:00:00');
  }
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
  uid, formatDate, formatDateShort, allAroundScore,
  APPARATUS, UPGRADE_TARGETS, WORLDS_DATE,
};
