// ============================================================
//  SOUTHERN TUNISIA EXPLORER — Shared App Logic
// ============================================================

// ── SOUND FX ────────────────────────────────────────────────
const SoundFX = {
    ctx: null,
    init() { if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    playClick() {
        this.init(); if (!this.ctx) return;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.type = 'sine';
        o.frequency.setValueAtTime(400, this.ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
        g.gain.setValueAtTime(0.15, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        o.start(); o.stop(this.ctx.currentTime + 0.1);
    },
    playSuccess() {
        this.init(); if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            o.type = 'triangle';
            o.frequency.setValueAtTime(freq, now + i * 0.08);
            g.gain.setValueAtTime(0.2, now + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
            o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.2);
        });
    },
    playWrong() {
        this.init(); if (!this.ctx) return;
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.connect(g); g.connect(this.ctx.destination);
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(220, this.ctx.currentTime);
        o.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.3);
        g.gain.setValueAtTime(0.15, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        o.start(); o.stop(this.ctx.currentTime + 0.3);
    },
    playBadge() {
        this.init(); if (!this.ctx) return;
        const now = this.ctx.currentTime;
        [587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50].forEach((freq, i) => {
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            o.type = 'sine';
            o.frequency.setValueAtTime(freq, now + i * 0.06);
            g.gain.setValueAtTime(0.15, now + i * 0.06);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.25);
            o.start(now + i * 0.06); o.stop(now + i * 0.06 + 0.25);
        });
    }
};

// ── APP STATE (localStorage-backed) ─────────────────────────
const AppState = {
    get avatar()          { return localStorage.getItem('te_avatar') || ''; },
    get avatarName()      { return localStorage.getItem('te_name')   || 'Little Hero'; },
    get points()          { return parseInt(localStorage.getItem('te_points')) || 0; },
    get badges()          { return JSON.parse(localStorage.getItem('te_badges')  || '[]'); },
    get solvedClues()     { return JSON.parse(localStorage.getItem('te_clues')   || '[]'); },
    get exploredRegions() { return JSON.parse(localStorage.getItem('te_regions') || '[]'); },
    get readStories()     { return JSON.parse(localStorage.getItem('te_stories') || '[]'); },
};

// ── STATE WRITERS ────────────────────────────────────────────
const _save = (k, v) => localStorage.setItem(k, typeof v === 'object' ? JSON.stringify(v) : v);

function addPoints(amt) {
    _save('te_points', AppState.points + amt);
    updateUIElements();
}

function awardBadge(key) {
    const b = AppState.badges;
    if (b.includes(key)) return;
    b.push(key);
    _save('te_badges', b);
    SoundFX.playBadge();
    createConfetti();
    updateUIElements();
    showCustomMessage(`🏆 New Badge Unlocked: ${getBadgeName(key)}!`);
}

function markStoryRead(id) {
    const s = AppState.readStories;
    if (!s.includes(id)) { s.push(id); _save('te_stories', s); }
}

function markRegionExplored(id) {
    const r = AppState.exploredRegions;
    if (!r.includes(id)) { r.push(id); _save('te_regions', r); }
}

function addSolvedClue(id) {
    const c = AppState.solvedClues;
    if (!c.includes(id)) { c.push(id); _save('te_clues', c); }
}

// ── LEVEL SYSTEM ────────────────────────────────────────────
function getLevel(pts = AppState.points) {
    if (pts >= 200) return { label: 'Southern Tunisia Champion', emoji: '🏆', cls: 'border-yellow-500 bg-yellow-50 text-yellow-800',  pct: 100 };
    if (pts >= 120) return { label: 'Expert Explorer',           emoji: '🏅', cls: 'border-blue-400   bg-blue-50   text-blue-800',    pct: Math.round(((pts-120)/80)*100) };
    if (pts >= 60)  return { label: 'Active Explorer',           emoji: '⭐', cls: 'border-green-400  bg-green-50  text-green-800',   pct: Math.round(((pts-60)/60)*100) };
    return                  { label: 'Beginner Explorer',        emoji: '🌱', cls: 'border-teal-400   bg-teal-50   text-teal-700',    pct: Math.round((pts/60)*100) };
}

function getBadgeName(key) {
    return {
        carthage:    'Ksar Discoverer 🏰',
        desert:      'Sahara Explorer 🐫',
        explorer:    'Southern Traveler 🗺️',
        artist:      'Digital Artist 🎨',
        storyteller: 'Story Master 📖',
        chef:        'Little Chef 🍲',
    }[key] || key;
}

// ── UI UPDATE ────────────────────────────────────────────────
function updateUIElements() {
    const pts   = AppState.points;
    const level = getLevel(pts);

    const el = id => document.getElementById(id);
    if (el('header-points')) el('header-points').innerText = pts;

    const lb = el('level-badge');
    if (lb) {
        lb.innerText   = `${level.emoji} ${level.label}`;
        lb.className   = `border-2 ${level.cls} px-3 py-1 rounded-full text-xs font-black shadow`;
    }

    const avatarEmoji = { hannibal:'🛡️', jasmine:'🌸', fennec:'🦊', sailor:'⛵' }[AppState.avatar] || '👤';
    const avSt = el('avatar-status');
    if (avSt) avSt.innerHTML = `<span class="text-xl">${avatarEmoji}</span><span class="text-xs font-black text-slate-800 ml-1">${AppState.avatarName}</span>`;

    document.querySelectorAll('.badge-item').forEach(el => {
        const key = el.id.replace('badge-', '');
        const gs  = el.querySelector('.grayscale-element');
        if (AppState.badges.includes(key)) {
            el.classList.remove('opacity-40','bg-slate-50','border-dashed');
            el.classList.add('bg-amber-100','border-amber-400','border-2','scale-105');
            gs?.classList.remove('grayscale');
        } else {
            el.classList.add('opacity-40','bg-slate-50','border-dashed');
            el.classList.remove('bg-amber-100','border-amber-400','border-2','scale-105');
            gs?.classList.add('grayscale');
        }
    });
}

// ── TOAST MESSAGE ────────────────────────────────────────────
function showCustomMessage(msg) {
    document.querySelectorAll('.custom-toast').forEach(e => e.remove());
    const t = document.createElement('div');
    t.className = 'custom-toast fixed bottom-4 left-4 right-4 md:right-auto md:max-w-md bg-slate-900 text-white rounded-2xl p-4 border-2 border-yellow-400 shadow-2xl z-[9999] flex items-center justify-between gap-3';
    t.innerHTML = `<div class="flex items-center gap-2"><span class="text-2xl">🏜️</span><span class="text-sm font-bold">${msg}</span></div>
                   <button onclick="this.parentElement.remove()" class="text-white hover:text-yellow-400 font-black text-xl px-2">&times;</button>`;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 6000);
}

// ── CONFETTI ─────────────────────────────────────────────────
function createConfetti() {
    const colors = ['#E10600','#38BDF8','#FBBF24','#34D399','#F43F5E','#8B5CF6'];
    for (let i = 0; i < 45; i++) {
        const c = document.createElement('div');
        c.className = 'confetti';
        c.style.cssText = `left:${Math.random()*100}vw;top:-20px;position:fixed;z-index:9998;width:10px;height:10px;border-radius:50%;background:${colors[i%colors.length]};animation:confettiFall 2.5s ${Math.random()*1.5}s linear forwards;`;
        document.body.appendChild(c);
        setTimeout(() => c.remove(), 4000);
    }
}

// ── NAVIGATION ACTIVE STATE ──────────────────────────────────
function setActiveNav() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const map  = {
        'index.html':      'nav-home',
        '':                'nav-home',
        'decouvrir.html':  'nav-discover',
        'histoires.html':  'nav-stories',
        'jeux.html':       'nav-play',
        'cuisine.html':    'nav-cuisine',
        'parents.html':    'nav-parents',
    };
    const activeId = map[page];
    if (activeId) {
        const btn = document.getElementById(activeId);
        if (btn) btn.classList.add('bg-yellow-300','text-slate-900','border-2','border-amber-400','shadow-md');
    }
}

// ── AVATAR SYSTEM ────────────────────────────────────────────
let _tempAvatar = '';

function openAvatarSelector() {
    SoundFX.playClick();
    document.getElementById('avatar-modal')?.classList.remove('hidden');
}

function selectAvatarOption(key) {
    SoundFX.playClick();
    document.querySelectorAll('.avatar-option').forEach(e => e.classList.remove('border-sky-400','bg-sky-50'));
    document.getElementById(`opt-${key}`)?.classList.add('border-sky-400','bg-sky-50');
    _tempAvatar = key;
}

function confirmAvatarSelection() {
    const name = document.getElementById('avatar-input-name')?.value.trim();
    if (!name)        { showCustomMessage('⚠️ Please write your name first!'); return; }
    if (!_tempAvatar) { showCustomMessage('⚠️ Please choose your adventure companion!'); return; }
    _save('te_avatar', _tempAvatar);
    _save('te_name',   name);
    document.getElementById('avatar-modal')?.classList.add('hidden');
    updateUIElements();
    SoundFX.playSuccess();
    createConfetti();
    showCustomMessage(`🚀 Welcome, brave ${name}! Your desert adventure begins now!`);
}

function resetAdventure() {
    SoundFX.playClick();
    if (confirm('Are you sure you want to reset your adventure and clear all points and badges?')) {
        ['te_avatar','te_name','te_points','te_badges','te_clues','te_regions','te_stories'].forEach(k => localStorage.removeItem(k));
        window.location.href = 'index.html';
    }
}

// ── INIT ON LOAD ─────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    const modal = document.getElementById('avatar-modal');
    if (modal) modal.classList.toggle('hidden', !!AppState.avatar);
    const ni = document.getElementById('avatar-input-name');
    if (ni && AppState.avatarName !== 'Little Hero') ni.value = AppState.avatarName;
    updateUIElements();
});
