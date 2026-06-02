/* ═══════════════════════════════════════════
   GALLERY VIEW — Browse photos by category / apparatus
═══════════════════════════════════════════ */

let _galleryFilter = { category: null, apparatus: null };

async function renderGallery() {
  const view = document.getElementById('view-gallery');
  view.innerHTML = '';

  const nav = el('div', 'nav-bar');
  nav.innerHTML = `<div class="nav-title">Photos 📷</div>`;
  view.appendChild(nav);

  // Filter bar
  const filterBar = el('div', 'gallery-filter-bar');
  filterBar.innerHTML = `
    <button class="gal-filter-btn ${!_galleryFilter.category ? 'active' : ''}" onclick="setGalleryFilter(null,null)">All</button>
    <button class="gal-filter-btn ${_galleryFilter.category === 'apparatus' ? 'active' : ''}" onclick="setGalleryFilter('apparatus',null)">Apparatus</button>
    <button class="gal-filter-btn ${_galleryFilter.category === 'medal' ? 'active' : ''}" onclick="setGalleryFilter('medal',null)">Medals</button>
    <button class="gal-filter-btn ${_galleryFilter.category === 'general' ? 'active' : ''}" onclick="setGalleryFilter('general',null)">General</button>
  `;
  view.appendChild(filterBar);

  // Apparatus sub-filter (only when apparatus selected)
  if (_galleryFilter.category === 'apparatus') {
    const appBar = el('div', 'gallery-filter-bar gallery-app-bar');
    appBar.innerHTML = `
      <button class="gal-filter-btn ${!_galleryFilter.apparatus ? 'active' : ''}" onclick="setGalleryFilter('apparatus',null)">All</button>
      ${Data.APPARATUS.map(a => `
        <button class="gal-filter-btn ${_galleryFilter.apparatus === a ? 'active' : ''}" onclick="setGalleryFilter('apparatus','${a}')">${a}</button>
      `).join('')}
    `;
    view.appendChild(appBar);
  }

  const scroll  = el('div', 'scroll-area');
  const content = el('div', 'scroll-content');
  scroll.appendChild(content);
  view.appendChild(scroll);

  const photos = await Data.getPhotos({
    gymnastId: Auth.gymnast?.id,
    category:  _galleryFilter.category  || undefined,
    apparatus: _galleryFilter.apparatus || undefined,
  });

  if (!photos.length) {
    const empty = el('div', 'chat-empty');
    empty.textContent = 'No photos yet — upload some from Training or Results!';
    content.appendChild(empty);
    return;
  }

  // Group by month
  const groups = {};
  photos.forEach(p => {
    const d     = new Date(p.taken_at || p.created_at);
    const key   = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  Object.entries(groups).forEach(([month, items]) => {
    const heading = el('div', 'gallery-month-heading');
    heading.textContent = month;
    content.appendChild(heading);

    const grid = el('div', 'gallery-grid');
    items.forEach(p => {
      const wrap = el('div', 'gallery-item');
      wrap.innerHTML = `
        <img src="${p.url}" class="gallery-img" loading="lazy">
        <div class="gallery-label">${_photoLabel(p)}</div>
      `;
      wrap.querySelector('img').addEventListener('click', () => openGalleryPhoto(p, photos));
      grid.appendChild(wrap);
    });
    content.appendChild(grid);
  });
}

function _photoLabel(p) {
  const parts = [];
  if (p.apparatus) parts.push(p.apparatus);
  else if (p.category === 'medal') parts.push('Medal');
  if (p.comp_id) parts.push('Competition');
  else if (p.session_id) parts.push('Training');
  if (p.taken_at) parts.push(new Date(p.taken_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }));
  return parts.join(' · ') || 'Photo';
}

function setGalleryFilter(category, apparatus) {
  _galleryFilter = { category, apparatus };
  renderGallery();
}

function openGalleryPhoto(photo, all) {
  const overlay = el('div', '');
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:999;
    display:flex;flex-direction:column;align-items:center;justify-content:center;`;

  const label = _photoLabel(photo);
  overlay.innerHTML = `
    <img src="${photo.url}" style="max-width:100%;max-height:85vh;object-fit:contain;border-radius:8px;">
    <div style="color:white;font-size:13px;font-weight:600;margin-top:12px;opacity:0.8;">${label}</div>
    <button style="position:absolute;top:20px;right:20px;background:rgba(255,255,255,0.15);border:none;
      color:white;font-size:22px;width:40px;height:40px;border-radius:50%;cursor:pointer;">✕</button>
  `;
  overlay.querySelector('button').addEventListener('click', () => document.body.removeChild(overlay));
  overlay.addEventListener('click', e => { if (e.target === overlay) document.body.removeChild(overlay); });
  document.body.appendChild(overlay);
}
