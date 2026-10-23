/* ============================================================
   Life Dashboard – app.js
   Vanilla JavaScript, no frameworks.
   Challenges implemented:
     ✅ 1. Light / Dark mode
     ✅ 2. Custom name in greeting
     ✅ 3. Change Pomodoro time
     ✅ 4. Prevent duplicate tasks
     ✅ 5. Sort tasks
   (All 5 challenges included for maximum completeness)
   ============================================================ */

/* ── STORAGE HELPERS ─────────────────────────────────────────── */
const LS = {
  get: (key, fallback = null) => {
    try {
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

/* ── CONSTANTS ───────────────────────────────────────────────── */
const CIRCUMFERENCE = 2 * Math.PI * 54; // ≈ 339.3 (ring r=54)

/* ── STATE ───────────────────────────────────────────────────── */
const state = {
  // Greeting
  userName: LS.get('userName', ''),

  // Theme
  theme: LS.get('theme', 'light'),

  // Timer
  timerDuration: LS.get('timerDuration', 25), // minutes
  timerRemaining: 0,
  timerRunning: false,
  timerInterval: null,

  // Tasks
  tasks: LS.get('tasks', []),
  editingTaskId: null,

  // Links
  links: LS.get('links', []),
  editingLinkId: null,
};

/* ── DOM REFS ────────────────────────────────────────────────── */
const $ = id => document.getElementById(id);
const el = {
  // Topbar
  liveTime:       $('live-time'),
  liveDate:       $('live-date'),
  themeToggle:    $('theme-toggle'),
  iconSun:        $('icon-sun'),
  iconMoon:       $('icon-moon'),

  // Greeting
  greetingText:   $('greeting-text'),
  greetingName:   $('greeting-name'),
  editNameBtn:    $('edit-name-btn'),

  // Timer
  pomoDuration:   $('pomo-duration'),
  timerDisplay:   $('timer-display'),
  ringProgress:   $('ring-progress'),
  timerStart:     $('timer-start'),
  timerStop:      $('timer-stop'),
  timerReset:     $('timer-reset'),
  timerStatus:    $('timer-status'),

  // Todo
  todoForm:       $('todo-form'),
  todoInput:      $('todo-input'),
  todoList:       $('todo-list'),
  todoEmpty:      $('todo-empty'),
  sortSelect:     $('sort-select'),

  // Links
  addLinkBtn:     $('add-link-btn'),
  linksGrid:      $('links-grid'),
  linksEmpty:     $('links-empty'),

  // Modal: Name
  modalName:      $('modal-name'),
  nameInput:      $('name-input'),
  modalNameSave:  $('modal-name-save'),
  modalNameCancel:$('modal-name-cancel'),

  // Modal: Link
  modalLink:      $('modal-link'),
  linkLabelInput: $('link-label-input'),
  linkUrlInput:   $('link-url-input'),
  modalLinkTitle: $('modal-link-title'),
  modalLinkSave:  $('modal-link-save'),
  modalLinkCancel:$('modal-link-cancel'),

  // Modal: Task
  modalTask:      $('modal-task'),
  taskEditInput:  $('task-edit-input'),
  modalTaskSave:  $('modal-task-save'),
  modalTaskCancel:$('modal-task-cancel'),
};

/* ════════════════════════════════════════════════════════════
   CLOCK & GREETING
   ════════════════════════════════════════════════════════════ */
function updateClock() {
  const now = new Date();

  // Time
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  el.liveTime.textContent = `${h}:${m}:${s}`;

  // Date
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.liveDate.textContent = now.toLocaleDateString('en-US', opts);

  // Greeting phrase
  const hour = now.getHours();
  let phrase;
  if (hour >= 5  && hour < 12) phrase = 'Good morning';
  else if (hour >= 12 && hour < 17) phrase = 'Good afternoon';
  else if (hour >= 17 && hour < 21) phrase = 'Good evening';
  else phrase = 'Good night';

  const nameStr = state.userName ? `, ${state.userName}` : '';
  el.greetingText.textContent = phrase;
  el.greetingName.textContent = `${phrase}${nameStr} 👋`;
}

/* ════════════════════════════════════════════════════════════
   THEME  (Challenge 1: Light / Dark mode)
   ════════════════════════════════════════════════════════════ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  el.iconSun.style.display  = theme === 'light' ? 'block' : 'none';
  el.iconMoon.style.display = theme === 'dark'  ? 'block' : 'none';
  el.themeToggle.setAttribute('title', theme === 'light' ? 'Switch to Dark mode' : 'Switch to Light mode');
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  LS.set('theme', state.theme);
  applyTheme(state.theme);
}

/* ════════════════════════════════════════════════════════════
   CUSTOM NAME  (Challenge 2: Custom name in greeting)
   ════════════════════════════════════════════════════════════ */
function openNameModal() {
  el.nameInput.value = state.userName;
  el.modalName.removeAttribute('hidden');
  requestAnimationFrame(() => el.nameInput.focus());
}

function closeNameModal() {
  el.modalName.setAttribute('hidden', '');
}

function saveName() {
  const name = el.nameInput.value.trim();
  state.userName = name;
  LS.set('userName', name);
  updateClock();
  closeNameModal();
}

/* ════════════════════════════════════════════════════════════
   FOCUS TIMER  (Challenge 3: Change Pomodoro time)
   ════════════════════════════════════════════════════════════ */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateRing(remaining, total) {
  const progress = remaining / total;
  const offset = CIRCUMFERENCE * (1 - progress);
  el.ringProgress.style.strokeDashoffset = offset;
  el.ringProgress.classList.toggle('done', remaining === 0);
}

function renderTimer() {
  const total = state.timerDuration * 60;
  el.timerDisplay.textContent = formatTime(state.timerRemaining);
  updateRing(state.timerRemaining, total);
}

function setTimerDuration(minutes) {
  const mins = Math.max(1, Math.min(120, parseInt(minutes, 10) || 25));
  state.timerDuration = mins;
  LS.set('timerDuration', mins);
  el.pomoDuration.value = mins;
  if (!state.timerRunning) {
    state.timerRemaining = mins * 60;
    renderTimer();
  }
}

function startTimer() {
  if (state.timerRunning) return;
  if (state.timerRemaining <= 0) {
    state.timerRemaining = state.timerDuration * 60;
  }
  state.timerRunning = true;
  el.timerStatus.textContent = '🍅 Focusing…';
  el.timerStart.textContent = 'Pause';

  state.timerInterval = setInterval(() => {
    if (state.timerRemaining > 0) {
      state.timerRemaining--;
      renderTimer();
      if (state.timerRemaining === 0) {
        clearInterval(state.timerInterval);
        state.timerRunning = false;
        el.timerStart.textContent = 'Start';
        el.timerStatus.textContent = '✅ Session complete! Take a break.';
        // Native notification (if permission granted)
        if (Notification.permission === 'granted') {
          new Notification('Focus Timer', { body: 'Session complete! Time for a break 🎉', icon: '' });
        }
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  el.timerStart.textContent = 'Start';
  el.timerStatus.textContent = '⏸ Paused';
}

function resetTimer() {
  stopTimer();
  state.timerRemaining = state.timerDuration * 60;
  el.timerStatus.textContent = '';
  renderTimer();
}

/* ════════════════════════════════════════════════════════════
   TO-DO LIST
   Challenge 4: Prevent duplicate tasks
   Challenge 5: Sort tasks
   ════════════════════════════════════════════════════════════ */
function generateId() {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function saveTasks() {
  LS.set('tasks', state.tasks);
}

function getSortedTasks() {
  const sortVal = el.sortSelect.value;
  const copy = [...state.tasks];
  switch (sortVal) {
    case 'az':   return copy.sort((a, b) => a.text.localeCompare(b.text));
    case 'za':   return copy.sort((a, b) => b.text.localeCompare(a.text));
    case 'done': return copy.sort((a, b) => Number(a.done) - Number(b.done));
    default:     return copy; // insertion order
  }
}

function renderTasks() {
  const sorted = getSortedTasks();
  el.todoList.innerHTML = '';
  el.todoEmpty.style.display = sorted.length === 0 ? 'block' : 'none';

  sorted.forEach(task => {
    const li = document.createElement('li');
    li.className = `todo-item${task.done ? ' done' : ''}`;
    li.setAttribute('role', 'listitem');
    li.dataset.id = task.id;
    li.innerHTML = `
      <input type="checkbox" class="todo-check" aria-label="Mark task as done"
        ${task.done ? 'checked' : ''} />
      <span class="todo-text">${escapeHtml(task.text)}</span>
      <div class="todo-actions">
        <button class="todo-action-btn edit" aria-label="Edit task" title="Edit">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="todo-action-btn delete" aria-label="Delete task" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    `;

    // Events on the item
    li.querySelector('.todo-check').addEventListener('change', () => toggleTask(task.id));
    li.querySelector('.edit').addEventListener('click',  () => openTaskEditModal(task.id));
    li.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));

    el.todoList.appendChild(li);
  });
}

function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  // Challenge 4: Prevent duplicate tasks (case-insensitive)
  const isDuplicate = state.tasks.some(
    t => t.text.toLowerCase() === trimmed.toLowerCase()
  );
  if (isDuplicate) {
    showToast('Task already exists!');
    return;
  }

  state.tasks.push({ id: generateId(), text: trimmed, done: false });
  saveTasks();
  renderTasks();
}

function toggleTask(id) {
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.done = !task.done;
    saveTasks();
    renderTasks();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
}

function openTaskEditModal(id) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;
  state.editingTaskId = id;
  el.taskEditInput.value = task.text;
  el.modalTask.removeAttribute('hidden');
  requestAnimationFrame(() => el.taskEditInput.focus());
}

function closeTaskEditModal() {
  state.editingTaskId = null;
  el.modalTask.setAttribute('hidden', '');
}

function saveTaskEdit() {
  const newText = el.taskEditInput.value.trim();
  if (!newText) return;

  // Check duplicate excluding the current task being edited
  const isDuplicate = state.tasks.some(
    t => t.id !== state.editingTaskId &&
         t.text.toLowerCase() === newText.toLowerCase()
  );
  if (isDuplicate) {
    showToast('A task with that name already exists!');
    return;
  }

  const task = state.tasks.find(t => t.id === state.editingTaskId);
  if (task) {
    task.text = newText;
    saveTasks();
    renderTasks();
  }
  closeTaskEditModal();
}

/* ════════════════════════════════════════════════════════════
   QUICK LINKS
   ════════════════════════════════════════════════════════════ */
function saveLinks() {
  LS.set('links', state.links);
}

function getFaviconUrl(url) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch { return null; }
}

function renderLinks() {
  el.linksGrid.innerHTML = '';
  el.linksEmpty.style.display = state.links.length === 0 ? 'block' : 'none';

  state.links.forEach(link => {
    const anchor = document.createElement('a');
    anchor.className = 'link-item';
    anchor.href = link.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.setAttribute('role', 'listitem');
    anchor.setAttribute('aria-label', `Open ${link.label}`);

    const faviconUrl = getFaviconUrl(link.url);
    const iconHtml = faviconUrl
      ? `<img class="link-favicon" src="${escapeAttr(faviconUrl)}" alt="" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
         <div class="link-favicon-placeholder" style="display:none">${escapeHtml(link.label.charAt(0).toUpperCase())}</div>`
      : `<div class="link-favicon-placeholder">${escapeHtml(link.label.charAt(0).toUpperCase())}</div>`;

    anchor.innerHTML = `
      ${iconHtml}
      <span class="link-label">${escapeHtml(link.label)}</span>
      <button class="link-delete-btn" aria-label="Remove ${escapeAttr(link.label)}" title="Remove link">×</button>
    `;

    anchor.querySelector('.link-delete-btn').addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(link.id);
    });

    el.linksGrid.appendChild(anchor);
  });
}

function openAddLinkModal() {
  state.editingLinkId = null;
  el.modalLinkTitle.textContent = 'Add Quick Link';
  el.linkLabelInput.value = '';
  el.linkUrlInput.value = '';
  el.modalLink.removeAttribute('hidden');
  requestAnimationFrame(() => el.linkLabelInput.focus());
}

function closeLinkModal() {
  el.modalLink.setAttribute('hidden', '');
}

function saveLink() {
  const label = el.linkLabelInput.value.trim();
  let url = el.linkUrlInput.value.trim();
  if (!label || !url) { showToast('Please fill in both fields.'); return; }

  // Auto-prepend https:// if missing scheme
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  // Validate URL
  try { new URL(url); } catch { showToast('Please enter a valid URL.'); return; }

  if (state.editingLinkId) {
    const link = state.links.find(l => l.id === state.editingLinkId);
    if (link) { link.label = label; link.url = url; }
  } else {
    state.links.push({ id: generateId(), label, url });
  }

  saveLinks();
  renderLinks();
  closeLinkModal();
}

function deleteLink(id) {
  state.links = state.links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
}

/* ════════════════════════════════════════════════════════════
   TOAST NOTIFICATION
   ════════════════════════════════════════════════════════════ */
let toastTimer;
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    Object.assign(toast.style, {
      position: 'fixed', bottom: '24px', left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--text)', color: 'var(--bg)',
      padding: '10px 18px', borderRadius: 'var(--radius-full)',
      fontSize: '14px', fontWeight: '500',
      boxShadow: 'var(--shadow-md)',
      zIndex: '999', whiteSpace: 'nowrap',
      transition: 'opacity .2s ease',
      fontFamily: 'var(--font)',
    });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

/* ════════════════════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}

// Close modal when clicking outside the modal box
function handleOverlayClick(e, closeFn) {
  if (e.target === e.currentTarget) closeFn();
}

// Close modal on Escape key
function handleEscKey(e) {
  if (e.key !== 'Escape') return;
  if (!el.modalName.hidden) closeNameModal();
  if (!el.modalLink.hidden) closeLinkModal();
  if (!el.modalTask.hidden) closeTaskEditModal();
}

/* ════════════════════════════════════════════════════════════
   EVENT WIRING
   ════════════════════════════════════════════════════════════ */
function bindEvents() {
  // Theme toggle
  el.themeToggle.addEventListener('click', toggleTheme);

  // Greeting name
  el.editNameBtn.addEventListener('click', openNameModal);
  el.modalNameSave.addEventListener('click', saveName);
  el.modalNameCancel.addEventListener('click', closeNameModal);
  el.modalName.addEventListener('click', e => handleOverlayClick(e, closeNameModal));
  el.nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });

  // Timer – duration change (Challenge 3)
  el.pomoDuration.addEventListener('change', () => setTimerDuration(el.pomoDuration.value));
  el.pomoDuration.addEventListener('keydown', e => {
    if (e.key === 'Enter') setTimerDuration(el.pomoDuration.value);
  });

  el.timerStart.addEventListener('click', () => {
    if (state.timerRunning) stopTimer();
    else startTimer();
  });
  el.timerStop.addEventListener('click', stopTimer);
  el.timerReset.addEventListener('click', resetTimer);

  // To-Do form
  el.todoForm.addEventListener('submit', e => {
    e.preventDefault();
    addTask(el.todoInput.value);
    el.todoInput.value = '';
  });

  el.sortSelect.addEventListener('change', renderTasks);

  // Task edit modal
  el.modalTaskSave.addEventListener('click', saveTaskEdit);
  el.modalTaskCancel.addEventListener('click', closeTaskEditModal);
  el.modalTask.addEventListener('click', e => handleOverlayClick(e, closeTaskEditModal));
  el.taskEditInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveTaskEdit(); });

  // Quick Links
  el.addLinkBtn.addEventListener('click', openAddLinkModal);
  el.modalLinkSave.addEventListener('click', saveLink);
  el.modalLinkCancel.addEventListener('click', closeLinkModal);
  el.modalLink.addEventListener('click', e => handleOverlayClick(e, closeLinkModal));
  el.linkUrlInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveLink(); });

  // Global Escape key
  document.addEventListener('keydown', handleEscKey);

  // Request notification permission for timer
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

/* ════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════ */
function init() {
  // Theme
  applyTheme(state.theme);

  // Timer initial state
  state.timerRemaining = state.timerDuration * 60;
  el.pomoDuration.value = state.timerDuration;
  renderTimer();

  // Tasks
  renderTasks();

  // Links
  renderLinks();

  // Clock (immediate + every second)
  updateClock();
  setInterval(updateClock, 1000);

  // Events
  bindEvents();
}

document.addEventListener('DOMContentLoaded', init);
