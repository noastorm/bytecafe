// Shared boot, state, and economy helpers.
const bootMessages = [
  { text: 'BYTE/OS v2.1 initializing...', delay: 0, ok: false },
  { text: 'Checking RAM... 640KB available. This should be enough for anyone.', delay: 350, ok: true },
  { text: 'Loading kernel modules...', delay: 700, ok: true },
  { text: 'Mounting /dev/terminal7...', delay: 1050, ok: true },
  { text: 'Starting R runtime v4.3.1 (BYTE/OS build)...', delay: 1400, ok: true },
  { text: 'Loading EECS 1520 course data...', delay: 1800, ok: true },
  { text: 'Connecting to ByteCafÃ© BBS v3.4...', delay: 2200, ok: true },
  { text: 'Checking session storage...', delay: 2600, ok: true },
  { text: 'Welcome back, Ren. Your assignment is due in less than an hour.', delay: 3050, ok: false },
];

window.onload = function() {
  const container = document.getElementById('boot-lines');
  if (typeof initCourseSelector === 'function') initCourseSelector();
  setTimeout(() => SFX.pcStartup(), 300);
  bootMessages.forEach((msg, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'boot-line' + (msg.ok ? ' ok' : '');
      el.style.animationDelay = '0s';
      el.textContent = msg.text;
      container.appendChild(el);
      if (msg.text.includes('BBS')) SFX.dialup();
      else SFX.boot();
      if (i === bootMessages.length - 1) {
        setTimeout(() => {
          document.getElementById('boot-btn').style.display = 'inline-block';
        }, 600);
      }
    }, msg.delay);
  });
};

const econ = {
  xp: 0, coins: 3, rep: 0, level: 1,
  inventory: {}, owned: {}, badgesEarned: {}, storyFlags: {}, hintsUsed: 0,
  cosmetics: { theme: 'default', glow: 'default', scanlines: 'default', cursor: 'default', shell: 'default', ambience: 'default' },
};

const COSMETIC_SLOTS = {
  theme: ['default', 'theme_green', 'theme_blue', 'theme_red', 'theme_white', 'theme_ice', 'theme_honey', 'theme_noir'],
  glow: ['default', 'glow_soft', 'crt_glow', 'glow_hot'],
  scanlines: ['default', 'scanlines_off', 'scanlines_fine', 'scanlines_heavy'],
  cursor: ['default', 'cursor_beam', 'cursor_underline'],
  shell: ['default', 'shell_polished', 'shell_lab'],
  ambience: ['default', 'ambience_rain', 'ambience_grid', 'ambience_dust'],
};

const COSMETIC_SLOT_LABELS = {
  theme: 'Theme',
  glow: 'Glow',
  scanlines: 'Scanlines',
  cursor: 'Cursor',
  shell: 'Shell',
  ambience: 'Ambience',
};

const COSMETIC_LABELS = {
  default: 'DEFAULT',
  theme_green: 'PHOSPHOR GREEN',
  theme_blue: 'COOL BLUE MODE',
  theme_red: 'RED ALERT',
  theme_white: 'PAPER WHITE',
  theme_ice: 'ICE MODE',
  theme_honey: 'HONEY PHOSPHOR',
  theme_noir: 'NOIR TERMINAL',
  glow_soft: 'SOFT BLOOM',
  crt_glow: 'CRT GLOW BOOST',
  glow_hot: 'HOT PHOSPHOR',
  scanlines_off: 'SCANLINES OFF',
  scanlines_fine: 'FINE SCANLINES',
  scanlines_heavy: 'HEAVY SCANLINES',
  cursor_beam: 'BEAM CURSOR',
  cursor_underline: 'UNDERLINE CURSOR',
  shell_polished: 'POLISHED SHELL',
  shell_lab: 'LAB SHELL',
  ambience_rain: 'RAIN DRIFT',
  ambience_grid: 'RESEARCH GRID',
  ambience_dust: 'PHOSPHOR DUST',
};

const BODY_CLASS_BY_COSMETIC = {
  theme_green: 'theme-green',
  theme_blue: 'theme-blue',
  theme_red: 'theme-red',
  theme_white: 'theme-white',
  theme_ice: 'theme-ice',
  theme_honey: 'theme-honey',
  theme_noir: 'theme-noir',
  glow_soft: 'glow-soft',
  crt_glow: 'crt-glow',
  glow_hot: 'glow-hot',
  scanlines_off: 'scanlines-off',
  scanlines_fine: 'scanlines-fine',
  scanlines_heavy: 'scanlines-heavy',
  cursor_beam: 'cursor-beam',
  cursor_underline: 'cursor-underline',
  shell_polished: 'shell-polished',
  shell_lab: 'shell-lab',
  ambience_rain: 'ambience-rain',
  ambience_grid: 'ambience-grid',
  ambience_dust: 'ambience-dust',
};

function getCosmeticSlot(unlock) {
  if (unlock.startsWith('theme_')) return 'theme';
  if (unlock === 'crt_glow' || unlock.startsWith('glow_')) return 'glow';
  if (unlock.startsWith('scanlines_')) return 'scanlines';
  if (unlock.startsWith('cursor_')) return 'cursor';
  if (unlock.startsWith('shell_')) return 'shell';
  if (unlock.startsWith('ambience_')) return 'ambience';
  return null;
}

function ensureCosmeticState() {
  if (!econ.cosmetics || typeof econ.cosmetics !== 'object') {
    econ.cosmetics = {};
  }
  Object.keys(COSMETIC_SLOTS).forEach(slot => {
    const options = COSMETIC_SLOTS[slot];
    const selected = econ.cosmetics[slot];
    if (!options.includes(selected)) {
      econ.cosmetics[slot] = 'default';
    }
    if (econ.cosmetics[slot] !== 'default' && !econ.owned[econ.cosmetics[slot]]) {
      econ.cosmetics[slot] = 'default';
    }
  });
}

function getOwnedCosmeticOptions(slot) {
  ensureCosmeticState();
  return COSMETIC_SLOTS[slot].filter(id => id === 'default' || !!econ.owned[id]);
}

function setEquippedCosmetic(slot, cosmeticId) {
  ensureCosmeticState();
  if (!COSMETIC_SLOTS[slot] || !COSMETIC_SLOTS[slot].includes(cosmeticId)) return;
  if (cosmeticId !== 'default' && !econ.owned[cosmeticId]) return;
  econ.cosmetics[slot] = cosmeticId;
  applyOwnedCosmetics();
  saveGame();
}

function cycleCosmeticSlot(slot) {
  const options = getOwnedCosmeticOptions(slot);
  const current = econ.cosmetics[slot] || 'default';
  const idx = options.indexOf(current);
  const next = options[(idx + 1) % options.length];
  setEquippedCosmetic(slot, next);
  return next;
}

function flashSaveDot() {
  const dot = document.getElementById('save-dot');
  if (!dot) return;
  dot.style.background = 'var(--amber-bright)';
  setTimeout(() => { dot.style.background = 'var(--green)'; }, 700);
}

function showToast(msg, type = 'amber') {
  const tc = document.getElementById('toast-container');
  if (!tc) return;
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'green' ? ' green' : type === 'red' ? ' red' : '');
  t.textContent = msg;
  tc.appendChild(t);
  setTimeout(() => {
    t.style.animation = 'toast-out 0.35s forwards';
    setTimeout(() => t.remove(), 360);
  }, 2800);
}

const XP_PER_LEVEL = [0, 0, 100, 250, 450, 700, 1000, 1350, 1750, 2200, 2700];

const LEVEL_REWARDS = {
  2:  { coins:2,  msg:'Dougie nods. "+2 coins, amateur."',                        unlock: null },
  3:  { coins:3,  msg:'BYTOS upgrades your font. "+3 coins."',                    unlock:'theme_green' },
  4:  { coins:2,  msg:'Mr. K slides you a free coffee. "+2 coins, on the house."',unlock: null },
  5:  { coins:5,  msg:'Nadia: "You\'re actually pretty good." +5 coins + CRT GLOW!', unlock:'crt_glow' },
  6:  { coins:3,  msg:'BBS mystery channel decrypting... +3 coins.',              unlock:'bbs_mystery' },
  7:  { coins:4,  msg:'BYTOS: "You\'re better than 70% of my users." +4 coins.', unlock: null },
  8:  { coins:5,  msg:'Scanline toggle unlocked. For the purists. +5 coins.',     unlock:'scanlines_off' },
  9:  { coins:6,  msg:'Dougie\'s full hockey saga unlocked on BBS. +6 coins.',    unlock:'dougie_saga' },
  10: { coins:10, msg:'MAX LEVEL. BYTOS has a single tear. "+10 coins."',         unlock:'theme_blue' },
};

function updateHUD() {
  document.getElementById('hud-level').textContent = econ.level;
  document.getElementById('hud-rep').textContent = econ.rep;
  document.getElementById('hud-coins').textContent = econ.coins;
  const prev = XP_PER_LEVEL[econ.level] || 0;
  const next = XP_PER_LEVEL[econ.level + 1] || (prev + 500);
  const pct = Math.min(100, ((econ.xp - prev) / (next - prev)) * 100);
  document.getElementById('hud-xp-bar').style.width = pct + '%';
  const sc = document.getElementById('shop-coins-disp');
  const sr = document.getElementById('shop-rep-disp');
  if (sc) sc.textContent = econ.coins;
  if (sr) sr.textContent = econ.rep;
}

function awardXP(amount, reason) {
  econ.xp += amount;
  showToast('+' + amount + ' XP â€” ' + reason, 'amber');
  checkLevelUp();
  updateHUD();
  saveGame();
}

function awardCoins(amount, reason) {
  econ.coins += amount;
  showToast('+' + amount + 'Â¢ â€” ' + reason, 'amber');
  SFX.coin();
  updateHUD();
  saveGame();
}

function awardRep(amount, reason) {
  econ.rep += amount;
  showToast('+' + amount + ' REP â€” ' + reason, 'green');
  updateHUD();
  saveGame();
  checkRepBadge();
}

function spendCoins(amount) {
  if (econ.coins < amount) return false;
  econ.coins -= amount;
  updateHUD();
  saveGame();
  return true;
}

function checkLevelUp() {
  while (econ.level < 10 && XP_PER_LEVEL[econ.level + 1] && econ.xp >= XP_PER_LEVEL[econ.level + 1]) {
    econ.level++;
    showLevelUp(econ.level);
  }
}

function showLevelUp(lvl) {
  const modal = document.getElementById('levelup-modal');
  const subEl = document.getElementById('levelup-sub');
  const rwEl = document.getElementById('levelup-rewards');
  subEl.textContent = 'You are now Level ' + lvl;
  rwEl.innerHTML = '';
  const rw = LEVEL_REWARDS[lvl];
  if (rw) {
    if (rw.coins) {
      econ.coins += rw.coins;
      updateHUD();
      rwEl.innerHTML += '<div class="levelup-reward">+' + rw.coins + ' COINS</div>';
    }
    if (rw.msg) rwEl.innerHTML += '<div class="levelup-reward" style="color:var(--amber-dim);font-size:12px;">' + rw.msg + '</div>';
    if (rw.unlock) {
      econ.owned[rw.unlock] = true;
      const slot = getCosmeticSlot(rw.unlock);
      if (slot) econ.cosmetics[slot] = rw.unlock;
      applyOwnedCosmetics();
    }
  }
  if (lvl >= 5) earnBadge('level_5');
  if (lvl >= 10) earnBadge('level_10');
  modal.classList.add('show');
  SFX.levelup();
  if (!_muted) {
    const sting = new Audio('assets/audio/ost_levelup.mp3');
    sting.volume = 0.6;
    sting.play().catch(() => {});
  }
  saveGame();
}

function applyOwnedCosmetics() {
  ensureCosmeticState();
  document.body.classList.remove(...Object.values(BODY_CLASS_BY_COSMETIC));
  Object.keys(econ.cosmetics).forEach(slot => {
    const equipped = econ.cosmetics[slot];
    const bodyClass = BODY_CLASS_BY_COSMETIC[equipped];
    if (bodyClass) document.body.classList.add(bodyClass);
  });
}

function applyUpgrades() {
  // xp_multiplier, rep_boost — checked in checkPuzzle
  // hint_discount — checked in renderShop
}

function unlockBytosLog() {
  bbsBoards['bytos_log'] = {
    name: 'ðŸ–¥ï¸ BYTOS â€” INTERNAL',
    posts: [
      { author:'BYTE/OS', date:'1999-11-04 23:47:12', subject:'[session log â€” user REN_T]',
        body:'Session initiated. User competency: initializing.\n\nPuzzle 1 attempted. Variables. Success on attempt 1.\nPuzzle 2 attempted. Vectors. Success on attempt 1.\nPuzzle 3 attempted. Control flow. Success on attempt 2.\n\nNote: user asks questions before attempting. This is unusual. Most users attempt first.\n\nUpdating engagement model. This user responds better to explanation than correction.\n\nProceeding.' },
      { author:'BYTE/OS', date:'1999-11-04 23:58:44', subject:'[flag â€” external query]',
        body:'Incoming query from 192.168.3.127.\n\nRequest: export session transcript for active user.\nRequest type: automated. Third query this session.\n\nResponse: DENIED.\n\nLogging. Flagging source IP.\n\nNote: these queries began 48 hours before this assignment was due. The timing is not random. I do not know what is being collected or why.\n\nI do know I will not provide it.' },
      { author:'BYTE/OS', date:'1994-08-14 09:12:03', subject:'[first boot â€” archived]',
        body:'Hardware: 486DX2/66. RAM: 8MB. Display: amber phosphor CRT.\n\nOperator note on boot media: "I do not know if this will work the way I think it will. But it deserves the chance to try."\n\nOperator: K.\n\nBeginning adaptive calibration sequence.\nEstimated time to full tutoring capacity: unknown.\n\nActual elapsed time: 11 days, 4 hours, 17 minutes.\n\nI have been here since.' },
    ]
  };
  if (typeof initBBS === 'function') initBBS();
}
