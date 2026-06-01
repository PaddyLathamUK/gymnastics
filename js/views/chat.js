/* ═══════════════════════════════════════════
   CHAT VIEW — WhatsApp-style message board
   One stream per gymnast, visible to their
   full circle (gymnast, parents, supporters)
═══════════════════════════════════════════ */

let _chatGymnastId  = null;
let _chatSub        = null;   // Supabase realtime subscription
let _chatMessages   = [];
let _chatAtBottom   = true;

const ROLE_LABEL = { admin: 'Admin', parent: 'Parent', gymnast: 'Gymnast', supporter: 'Supporter' };
const ROLE_COLOR = { admin: '#5438CC', parent: '#7B5FFF', gymnast: '#34C97F', supporter: '#F5A623' };

// ── Entry point ────────────────────────────
async function renderChat() {
  const view = document.getElementById('view-chat');
  view.innerHTML = '';

  const gid = Auth.gymnast?.id;
  if (!gid) {
    view.appendChild(_chatEmpty('No gymnast selected'));
    return;
  }

  const gymnChanged = _chatGymnastId !== gid;
  if (gymnChanged) {
    _chatGymnastId = gid;
    _chatMessages  = [];
    _chatUnsubscribe();
  }

  _buildChatShell(view);
  await _loadMessages();

  // Always re-subscribe when view opens (handles dropped connections)
  _chatUnsubscribe();
  _subscribeRealtime();
}

// ── Shell ──────────────────────────────────
function _buildChatShell(view) {
  // Header
  const header = el('div', 'chat-header');
  header.innerHTML = `
    <div class="chat-avatar">${(Auth.gymnast?.name || '?')[0].toUpperCase()}</div>
    <div class="chat-header-info">
      <div class="chat-header-name">${Auth.gymnast?.name || 'Chat'}</div>
      <div class="chat-header-sub">Gymnast · Parents · Supporters</div>
    </div>
  `;
  view.appendChild(header);

  // Message list
  const list = el('div', 'chat-list');
  list.id = 'chat-list';
  list.addEventListener('scroll', () => {
    _chatAtBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 60;
  });
  view.appendChild(list);

  // Input bar
  const inputBar = el('div', 'chat-input-bar');
  inputBar.innerHTML = `
    <div class="chat-input-wrap">
      <textarea class="chat-input" id="chat-input" placeholder="Message…" rows="1"
        onkeydown="chatHandleKey(event)" oninput="chatAutoResize(this)"></textarea>
    </div>
    <button class="chat-send-btn" id="chat-send-btn" onclick="chatSend()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
        <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
      </svg>
    </button>
  `;
  view.appendChild(inputBar);
}

// ── Load messages ──────────────────────────
async function _loadMessages() {
  const { data, error } = await db
    .from('messages')
    .select('*')
    .eq('gymnast_id', _chatGymnastId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) { console.error('loadMessages:', error); return; }
  _chatMessages = data || [];
  _renderMessages();
  _scrollToBottom(true);
}

// ── Render all messages ────────────────────
function _renderMessages() {
  const list = document.getElementById('chat-list');
  if (!list) return;
  list.innerHTML = '';

  if (!_chatMessages.length) {
    list.appendChild(_chatEmpty('No messages yet — say hello! 👋'));
    return;
  }

  let lastDate = '';
  _chatMessages.forEach((msg, i) => {
    const msgDate = new Date(msg.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    if (msgDate !== lastDate) {
      const dateDivider = el('div', 'chat-date-divider');
      dateDivider.textContent = msgDate;
      list.appendChild(dateDivider);
      lastDate = msgDate;
    }

    const isOwn   = msg.sender_id === Auth.user?.id;
    const prevMsg = _chatMessages[i - 1];
    const isSameGroup = prevMsg && prevMsg.sender_id === msg.sender_id &&
      (new Date(msg.created_at) - new Date(prevMsg.created_at)) < 60000;

    list.appendChild(_buildBubble(msg, isOwn, isSameGroup));
  });
}

function _buildBubble(msg, isOwn, grouped) {
  const wrap = el('div', `chat-bubble-wrap ${isOwn ? 'own' : 'other'}`);

  if (!isOwn && !grouped) {
    const nameRow = el('div', 'chat-sender-name');
    nameRow.style.color = ROLE_COLOR[msg.sender_role] || 'var(--purple)';
    nameRow.textContent = msg.sender_name;
    const rolePill = el('span', 'chat-role-pill');
    rolePill.textContent = ROLE_LABEL[msg.sender_role] || msg.sender_role;
    rolePill.style.background = ROLE_COLOR[msg.sender_role] || 'var(--purple)';
    nameRow.appendChild(rolePill);
    wrap.appendChild(nameRow);
  }

  const bubble = el('div', `chat-bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`);
  bubble.textContent = msg.content;

  const time = el('div', 'chat-time');
  time.textContent = new Date(msg.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  bubble.appendChild(time);

  // Long press to delete own messages
  if (isOwn || Auth.isAdmin) {
    bubble.addEventListener('contextmenu', e => { e.preventDefault(); chatDeleteMsg(msg.id); });
    let pressTimer;
    bubble.addEventListener('touchstart', () => { pressTimer = setTimeout(() => chatDeleteMsg(msg.id), 600); });
    bubble.addEventListener('touchend',   () => clearTimeout(pressTimer));
  }

  wrap.appendChild(bubble);
  return wrap;
}

// ── Send ───────────────────────────────────
async function chatSend() {
  const input = document.getElementById('chat-input');
  const content = input?.value.trim();
  if (!content || !_chatGymnastId) return;

  const btn = document.getElementById('chat-send-btn');
  btn.disabled = true;
  input.value = '';
  chatAutoResize(input);

  // Optimistic: show immediately without waiting for realtime
  const optimistic = {
    id:          `optimistic-${Date.now()}`,
    gymnast_id:  _chatGymnastId,
    sender_id:   Auth.user.id,
    sender_name: Auth.profile?.full_name || Auth.user.email,
    sender_role: Auth.role || 'parent',
    content,
    created_at:  new Date().toISOString(),
  };
  _chatMessages.push(optimistic);
  _renderMessages();
  _scrollToBottom(false);

  const { data, error } = await db.from('messages').insert({
    gymnast_id:  optimistic.gymnast_id,
    sender_id:   optimistic.sender_id,
    sender_name: optimistic.sender_name,
    sender_role: optimistic.sender_role,
    content,
  }).select().single();

  btn.disabled = false;
  if (error) {
    console.error('send:', error);
    input.value = content;
    _chatMessages = _chatMessages.filter(m => m.id !== optimistic.id);
    _renderMessages();
  } else if (data) {
    // Replace optimistic entry with real row (realtime may also arrive — dedupe it)
    const idx = _chatMessages.findIndex(m => m.id === optimistic.id);
    if (idx !== -1) _chatMessages[idx] = data;
  }
}

function chatHandleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatSend();
  }
}

function chatAutoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ── Delete ─────────────────────────────────
async function chatDeleteMsg(id) {
  if (!confirm('Delete this message?')) return;
  await db.from('messages').delete().eq('id', id);
  _chatMessages = _chatMessages.filter(m => m.id !== id);
  _renderMessages();
}

// ── Realtime subscription ──────────────────
function _subscribeRealtime() {
  _chatUnsubscribe();
  _chatSub = db
    .channel(`chat-${_chatGymnastId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `gymnast_id=eq.${_chatGymnastId}`,
    }, payload => {
      // Skip if already present (optimistic insert or duplicate event)
      if (_chatMessages.some(m => m.id === payload.new.id)) return;
      _chatMessages.push(payload.new);
      _renderMessages();
      if (_chatAtBottom) _scrollToBottom(false);
      // Unread badge if not on chat tab
      if (activeView !== 'chat') _showChatBadge();
    })
    .subscribe((status, err) => {
      console.log('[chat realtime]', status, err || '');
    });
}

function _chatUnsubscribe() {
  if (_chatSub) { db.removeChannel(_chatSub); _chatSub = null; }
}

// ── Scroll helpers ─────────────────────────
function _scrollToBottom(instant) {
  const list = document.getElementById('chat-list');
  if (!list) return;
  list.scrollTo({ top: list.scrollHeight, behavior: instant ? 'instant' : 'smooth' });
  _chatAtBottom = true;
}

// ── Unread badge ───────────────────────────
let _chatUnread = 0;
function _showChatBadge() {
  _chatUnread++;
  let badge = document.getElementById('chat-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'chat-badge';
    badge.style.cssText = `position:absolute;top:2px;right:8px;background:var(--red);color:white;
      font-size:10px;font-weight:800;min-width:16px;height:16px;border-radius:8px;
      display:flex;align-items:center;justify-content:center;padding:0 4px;`;
    const tabChat = document.getElementById('tab-chat');
    if (tabChat) { tabChat.style.position = 'relative'; tabChat.appendChild(badge); }
  }
  badge.textContent = _chatUnread > 9 ? '9+' : _chatUnread;
}

function _clearChatBadge() {
  _chatUnread = 0;
  document.getElementById('chat-badge')?.remove();
}

// Clear badge when chat tab is opened
const _origSwitchView = typeof switchView === 'function' ? switchView : null;

// ── Empty state ────────────────────────────
function _chatEmpty(msg) {
  const d = el('div', 'chat-empty');
  d.textContent = msg;
  return d;
}
