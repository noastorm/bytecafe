// ══════════════════════════════════════════════════════════════
//  BOOT SEQUENCE
// ══════════════════════════════════════════════════════════════
const bootMessages = [
  { text: 'BYTE/OS v2.1 initializing...', delay: 0, ok: false },
  { text: 'Checking RAM...  640KB', delay: 350, ok: true },
  { text: 'Loading kernel modules...', delay: 700, ok: true },
  { text: 'Mounting /dev/terminal...', delay: 1050, ok: true },
  { text: 'Starting R runtime v4.3.1...', delay: 1400, ok: true },
  { text: 'Loading EECS 1520 course data...', delay: 1800, ok: true },
  { text: 'Connecting to ByteCafé BBS...', delay: 2200, ok: true },
  { text: 'Checking session storage...', delay: 2600, ok: true },
  { text: 'Welcome back, Ren. Your assignment is overdue.', delay: 3050, ok: false },
];

window.onload = function() {
  const container = document.getElementById('boot-lines');
  bootMessages.forEach((msg, i) => {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'boot-line' + (msg.ok ? ' ok' : '');
      el.style.animationDelay = '0s';
      el.textContent = msg.text;
      container.appendChild(el);
      if (i === bootMessages.length - 1) {
        setTimeout(() => {
          document.getElementById('boot-btn').style.display = 'inline-block';
        }, 600);
      }
    }, msg.delay);
  });
};

// ══════════════════════════════════════════════════════════════
//  ECONOMY STATE
// ══════════════════════════════════════════════════════════════
const econ = {
  xp: 0, coins: 3, rep: 0, level: 1,
  inventory: {}, owned: {}, badgesEarned: {}, storyFlags: {}, hintsUsed: 0,
};

// ══════════════════════════════════════════════════════════════
//  SAVE SYSTEM
// ══════════════════════════════════════════════════════════════
const SAVE_KEY = 'bytecafe_save_v1';

async function saveGame() {
  try {
    const payload = {
      xp: econ.xp, coins: econ.coins, rep: econ.rep, level: econ.level,
      inventory: econ.inventory, owned: econ.owned,
      badgesEarned: econ.badgesEarned, storyFlags: econ.storyFlags,
      hintsUsed: econ.hintsUsed,
      currentPuzzle, completedPuzzles, timeLeft,
      savedAt: Date.now(),
    };
    await window.storage.set(SAVE_KEY, JSON.stringify(payload));
    flashSaveDot();
  } catch(e) { console.warn('BYTE/OS: save failed', e); }
}

async function loadGame() {
  try {
    const result = await window.storage.get(SAVE_KEY);
    if (!result) return false;
    const d = JSON.parse(result.value);
    econ.xp           = d.xp           ?? 0;
    econ.coins        = d.coins         ?? 3;
    econ.rep          = d.rep           ?? 0;
    econ.level        = d.level         ?? 1;
    econ.inventory    = d.inventory     ?? {};
    econ.owned        = d.owned         ?? {};
    econ.badgesEarned = d.badgesEarned  ?? {};
    econ.storyFlags   = d.storyFlags    ?? {};
    econ.hintsUsed    = d.hintsUsed     ?? 0;
    if (d.currentPuzzle    != null) currentPuzzle    = d.currentPuzzle;
    if (d.completedPuzzles != null) completedPuzzles = d.completedPuzzles;
    if (d.timeLeft         != null) timeLeft         = d.timeLeft;
    return true;
  } catch(e) { console.warn('BYTE/OS: load failed', e); return false; }
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

// ══════════════════════════════════════════════════════════════
//  ECONOMY ENGINE
// ══════════════════════════════════════════════════════════════
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
  document.getElementById('hud-rep').textContent   = econ.rep;
  document.getElementById('hud-coins').textContent = econ.coins;
  const prev = XP_PER_LEVEL[econ.level]     || 0;
  const next = XP_PER_LEVEL[econ.level + 1] || (prev + 500);
  const pct  = Math.min(100, ((econ.xp - prev) / (next - prev)) * 100);
  document.getElementById('hud-xp-bar').style.width = pct + '%';
  const sc = document.getElementById('shop-coins-disp');
  const sr = document.getElementById('shop-rep-disp');
  if (sc) sc.textContent = econ.coins;
  if (sr) sr.textContent = econ.rep;
}

function awardXP(amount, reason) {
  econ.xp += amount;
  showToast('+' + amount + ' XP — ' + reason, 'amber');
  checkLevelUp();
  updateHUD();
  saveGame();
}

function awardCoins(amount, reason) {
  econ.coins += amount;
  showToast('+' + amount + '¢ — ' + reason, 'amber');
  updateHUD();
  saveGame();
}

function awardRep(amount, reason) {
  econ.rep += amount;
  showToast('+' + amount + ' REP — ' + reason, 'green');
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
  const modal   = document.getElementById('levelup-modal');
  const subEl   = document.getElementById('levelup-sub');
  const rwEl    = document.getElementById('levelup-rewards');
  subEl.textContent = 'You are now Level ' + lvl;
  rwEl.innerHTML = '';
  const rw = LEVEL_REWARDS[lvl];
  if (rw) {
    if (rw.coins) {
      econ.coins += rw.coins;
      updateHUD();
      rwEl.innerHTML += '<div class="levelup-reward">+' + rw.coins + ' COINS</div>';
    }
    if (rw.msg)    rwEl.innerHTML += '<div class="levelup-reward" style="color:var(--amber-dim);font-size:12px;">' + rw.msg + '</div>';
    if (rw.unlock) { econ.owned[rw.unlock] = true; applyOwnedCosmetics(); }
  }
  // Level badges
  if (lvl >= 5)  earnBadge('level_5');
  if (lvl >= 10) earnBadge('level_10');
  modal.classList.add('show');
  saveGame();
}

function applyOwnedCosmetics() {
  document.body.classList.remove('theme-green','theme-blue','crt-glow','scanlines-off');
  if (econ.owned['theme_green'])   document.body.classList.add('theme-green');
  if (econ.owned['theme_blue'])    document.body.classList.add('theme-blue');
  if (econ.owned['crt_glow'])      document.body.classList.add('crt-glow');
  if (econ.owned['scanlines_off']) document.body.classList.add('scanlines-off');
}

function startGame() {
  document.getElementById('boot-screen').style.display = 'none';
  document.getElementById('desktop').style.display = 'flex';
  document.getElementById('desktop').style.flexDirection = 'column';

  loadSceneAssets().then(() => {
    loadGame().then(loaded => {
      applyOwnedCosmetics();
      updateHUD();
      initStory();
      initBBS();
      initNotes();
      initPuzzles();
      startTimer();
      if (loaded) showToast('SAVE LOADED — Welcome back, Ren.', 'amber');
      setInterval(saveGame, 30000);
      window.addEventListener('beforeunload', () => { saveGame(); });
    });
  });
}

// ══════════════════════════════════════════════════════════════
//  TIMER
// ══════════════════════════════════════════════════════════════
let timeLeft = 28 * 60;
function startTimer() {
  setInterval(() => {
    if (timeLeft > 0) timeLeft--;
    const m = Math.floor(timeLeft / 60).toString().padStart(2,'0');
    const s = (timeLeft % 60).toString().padStart(2,'0');
    document.getElementById('timer').textContent = m + ':' + s;
    if (timeLeft === 0) document.getElementById('timer').style.color = 'var(--red)';
  }, 1000);
}

// ══════════════════════════════════════════════════════════════
//  WINDOW SWITCHING
// ══════════════════════════════════════════════════════════════
function switchWindow(name) {
  ['story','console','bbs','notes','shop','badges'].forEach(w => {
    const win = document.getElementById(w + '-window');
    const btn = document.getElementById('btn-' + w);
    if (win) win.classList.remove('active');
    if (btn) btn.classList.remove('active');
  });
  document.getElementById(name + '-window').classList.add('active');
  document.getElementById('btn-' + name).classList.add('active');
  if (name === 'console') setTimeout(() => document.getElementById('r-input').focus(), 100);
  if (name === 'shop')    renderShop();
  if (name === 'badges' && typeof renderBadges === 'function') renderBadges();
}

// ══════════════════════════════════════════════════════════════
//  STORY ENGINE
// ══════════════════════════════════════════════════════════════
const story = {
  currentNode: 'intro_1',
  visited: new Set(),
  flags: {}
};

const nodes = {
  intro_1: {
    scene: 'BYTE/CAFÉ — MAIN FLOOR — 9:47 PM',
    dialogue: [
      { speaker: 'SYSTEM', text: 'The fluorescent tube above terminal 7 flickers. Rain hammers the window. Outside, Yonge Street is a smear of headlights and neon. Inside the ByteCafé, it smells like burnt coffee and someone\'s instant noodles.', css: 'system-text' },
      { speaker: 'REN', text: 'Okay. Okay. Three coins left. That\'s... twenty-eight minutes. I just need to do the lab worksheet and upload it before midnight.', css: 'ren-text' },
      { speaker: 'SYSTEM', text: 'You sit down at terminal 7. The keyboard has a sticky \'q\'. The monitor is an old amber phosphor CRT. Someone has taped a handwritten note to the side of it.', css: 'system-text' },
      { speaker: 'NOTE (taped to monitor)', text: '"If you touch my saved game on drive C: I will find you. — D"', css: '' },
    ],
    choices: [
      { text: 'Boot up R and look at the assignment', next: 'lab_intro' },
      { text: 'Read the other notes on the corkboard first', next: 'corkboard' },
    ]
  },
  corkboard: {
    scene: 'BYTE/CAFÉ — CORKBOARD',
    dialogue: [
      { speaker: 'SYSTEM', text: 'The corkboard near the entrance is a glorious mess. Pizza flyer. Lost cat. A printout of a flame war from rec.sports.hockey. And — pinned in the corner — a hand-lettered card:', css: 'system-text' },
      { speaker: 'CORKBOARD', text: '"EECS 1520 STUDY GROUP — Thursdays 7pm. Bring snacks. No Dougie."', css: '' },
      { speaker: 'SYSTEM', text: 'You make a mental note. Then you head back to terminal 7.', css: 'system-text' },
    ],
    choices: [
      { text: 'Get back to the terminal', next: 'lab_intro' },
    ]
  },
  lab_intro: {
    scene: 'BYTE/CAFÉ — TERMINAL 7',
    dialogue: [
      { speaker: 'SYSTEM', text: 'R opens. The console prompt blinks at you like it\'s judging your life choices.', css: 'system-text' },
      { speaker: 'BYTOS', text: 'Hi! I\'m BYTOS — Byte Operating System Tutor. I live in this terminal. Think of me as a very patient TA who doesn\'t drink coffee and can\'t leave.', css: '' },
      { speaker: 'BYTOS', text: 'Your lab sheet says: "complete exercises on variables, vectors, control flow, functions, matrices, data frames, and ggplot2." You know. Just a light evening.', css: '' },
      { speaker: 'REN', text: 'I have twenty-eight minutes and three of those topics make me want to cry.', css: 'ren-text' },
      { speaker: 'BYTOS', text: 'Then let\'s start with variables. They\'re easy, I promise. In R, you assign a value using <-. Like: x <- 5. That\'s it. That\'s assignment. You can do this.', css: '' },
    ],
    choices: [
      { text: 'Open the R console and start coding', next: 'after_p1', action: () => switchWindow('console') },
      { text: 'Ask BYTOS: "Why <- and not = ?"', next: 'bytos_explain_assign' },
    ]
  },
  bytos_explain_assign: {
    scene: 'BYTE/CAFÉ — TERMINAL 7',
    dialogue: [
      { speaker: 'BYTOS', text: 'Great question! Both <- and = work for assignment in R, but <- is the traditional R style. Think of it as an arrow pointing the value INTO the variable. The R community strongly prefers <- by convention.', css: '' },
      { speaker: 'BYTOS', text: 'So x <- 42 means "put the value 42 into x." You\'ll see this in every R script you encounter.', css: '' },
      { speaker: 'REN', text: 'That\'s... actually kind of charming. An arrow. Okay.', css: 'ren-text' },
    ],
    choices: [
      { text: 'Open the R console and start coding', next: 'after_p1', action: () => switchWindow('console') },
    ]
  },
  after_p1: {
    scene: 'BYTE/CAFÉ — TERMINAL 7 — A FEW MINUTES LATER',
    dialogue: [
      { speaker: 'SYSTEM', text: 'A large hand slaps the top of your monitor. You nearly drop your coffee.', css: 'system-text' },
      { speaker: 'DOUGIE', text: 'YO. You\'re Ren right? From the 1520 lecture? The one who always sits in the back?', css: '' },
      { speaker: 'REN', text: 'I sit in the middle. Who are you?', css: 'ren-text' },
      { speaker: 'DOUGIE', text: 'Dougie. Listen — I got a fantasy hockey spreadsheet that is COMPLETELY out of control. I need someone who knows "R" to fix it.', css: '' },
      { speaker: 'BYTOS', text: '(whispers) His name is on the note taped to the monitor. He is the one who taped that note.', css: 'system-text' },
      { speaker: 'REN', text: 'I\'m in the middle of my own assignment, Dougie.', css: 'ren-text' },
      { speaker: 'DOUGIE', text: 'I\'ll buy you a coffee. It\'s the good stuff, not the burnt one. Mr. K just made a fresh pot.', css: '' },
    ],
    choices: [
      { text: '"Fine. But I finish my assignment first."', next: 'ch2_setup', action: () => setBytosMsg('You\'re making progress! Complete the R console puzzles to unlock Chapter 2. Dougie\'s spreadsheet is... a later problem.') },
      { text: '"What\'s wrong with the spreadsheet?"', next: 'dougie_explain' },
    ]
  },
  dougie_explain: {
    scene: 'BYTE/CAFÉ — TERMINAL 7',
    dialogue: [
      { speaker: 'DOUGIE', text: 'Okay so I have player stats going back THREE YEARS in a CSV but it\'s got like... duplicate columns? And some players are listed by first name and some by last name? And I think I accidentally deleted the goals column for 2003?', css: '' },
      { speaker: 'BYTOS', text: '(whispers) That is a data frame problem. You will learn data frames. This will be useful.', css: 'system-text' },
      { speaker: 'REN', text: 'Dougie that is genuinely a disaster.', css: 'ren-text' },
      { speaker: 'DOUGIE', text: 'I know. Please. Coffee AND a bag of chips.', css: '' },
    ],
    choices: [
      { text: '"Deal. After my assignment."', next: 'ch2_setup', action: () => setBytosMsg('Dougie\'s data frame disaster awaits. First: finish your own puzzles!') },
    ]
  },
  ch2_setup: {
    scene: 'BYTE/CAFÉ — TERMINAL 7 — LATER',
    dialogue: [
      { speaker: 'SYSTEM', text: 'Dougie retreats to his terminal with a thumbs up. You turn back to the R console.', css: 'system-text' },
      { speaker: 'BYTOS', text: 'You\'re doing well. Keep working through the puzzles. Each one unlocks the next part of the story.', css: '' },
      { speaker: 'BYTOS', text: 'Complete the console puzzles to advance to Chapter 2 — where things get interesting.', css: '' },
    ],
    choices: [
      { text: 'Keep coding', next: 'ch2_setup', action: () => switchWindow('console') },
    ]
  },
};

let dialogueQueue = [];
let dialogueIndex = 0;

function initStory() {
  loadNode('intro_1');
}

// ══════════════════════════════════════════════════════════════
//  CHARACTER PORTRAITS — 16×16 pixel art SVGs
// ══════════════════════════════════════════════════════════════
const REN_SPRITE_B64 = 'assets/ren.png';

const CHAR_PORTRAITS = {
  'REN': '__SPRITE__ren__',
  'DOUGIE': `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <rect width="16" height="16" fill="#080600"/>
    <rect x="3" y="1" width="10" height="2" fill="#3a2010"/>
    <rect x="2" y="2" width="2" height="3" fill="#3a2010"/>
    <rect x="12" y="2" width="2" height="3" fill="#3a2010"/>
    <rect x="3" y="3" width="10" height="6" fill="#c8956a"/>
    <rect x="5" y="5" width="2" height="2" fill="#2a1808"/>
    <rect x="9" y="5" width="2" height="2" fill="#2a1808"/>
    <rect x="6" y="5" width="1" height="1" fill="#1a1008"/>
    <rect x="10" y="5" width="1" height="1" fill="#1a1008"/>
    <rect x="5" y="8" width="6" height="1" fill="#2a1808"/>
    <rect x="6" y="9" width="4" height="1" fill="#c8956a"/>
    <rect x="2" y="9" width="12" height="6" fill="#b03010"/>
    <rect x="5" y="11" width="6" height="3" fill="#c84020"/>
    <rect x="7" y="11" width="2" height="3" fill="#e05030"/>
  </svg>`,
  'BYTOS': `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <rect width="16" height="16" fill="#020802"/>
    <rect x="1" y="1" width="14" height="14" fill="#040e04"/>
    <rect x="0" y="0" width="16" height="1" fill="#1a3a1a"/>
    <rect x="0" y="15" width="16" height="1" fill="#1a3a1a"/>
    <rect x="0" y="0" width="1" height="16" fill="#1a3a1a"/>
    <rect x="15" y="0" width="1" height="16" fill="#1a3a1a"/>
    <rect x="3" y="4" width="4" height="3" fill="#0a1e0a"/>
    <rect x="9" y="4" width="4" height="3" fill="#0a1e0a"/>
    <rect x="4" y="5" width="2" height="1" fill="#4fc45a"/>
    <rect x="10" y="5" width="2" height="1" fill="#4fc45a"/>
    <rect x="3" y="9" width="2" height="2" fill="#4fc45a"/>
    <rect x="5" y="10" width="6" height="1" fill="#4fc45a"/>
    <rect x="11" y="9" width="2" height="2" fill="#4fc45a"/>
    <rect x="2" y="7" width="12" height="1" fill="#4fc45a" opacity="0.12"/>
    <rect x="2" y="12" width="12" height="1" fill="#4fc45a" opacity="0.07"/>
  </svg>`,
  'NADIA': `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <rect width="16" height="16" fill="#080600"/>
    <rect x="3" y="1" width="10" height="2" fill="#120818"/>
    <rect x="3" y="3" width="2" height="4" fill="#120818"/>
    <rect x="11" y="2" width="2" height="2" fill="#120818"/>
    <rect x="4" y="3" width="8" height="5" fill="#c8956a"/>
    <rect x="5" y="5" width="2" height="1" fill="#c060c0"/>
    <rect x="9" y="5" width="2" height="1" fill="#c060c0"/>
    <rect x="6" y="5" width="1" height="1" fill="#601030"/>
    <rect x="10" y="5" width="1" height="1" fill="#601030"/>
    <rect x="6" y="7" width="3" height="1" fill="#8a5a3a"/>
    <rect x="2" y="8" width="12" height="7" fill="#1e0e2e"/>
    <rect x="5" y="8" width="6" height="2" fill="#0e0818"/>
    <rect x="6" y="8" width="4" height="1" fill="#2e1e3e"/>
    <rect x="3" y="10" width="2" height="5" fill="#2e1e3e"/>
    <rect x="11" y="10" width="2" height="5" fill="#2e1e3e"/>
  </svg>`,
  'MR. K': `<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
    <rect width="16" height="16" fill="#080600"/>
    <rect x="3" y="1" width="10" height="1" fill="#707060"/>
    <rect x="2" y="2" width="12" height="2" fill="#606050"/>
    <rect x="3" y="4" width="10" height="5" fill="#b07850"/>
    <rect x="4" y="6" width="3" height="2" fill="#0a0800" opacity="0.3"/>
    <rect x="9" y="6" width="3" height="2" fill="#0a0800" opacity="0.3"/>
    <rect x="4" y="6" width="3" height="1" fill="#8a6040" opacity="0.6"/>
    <rect x="9" y="6" width="3" height="1" fill="#8a6040" opacity="0.6"/>
    <rect x="7" y="7" width="2" height="1" fill="#7a5030"/>
    <rect x="5" y="8" width="6" height="1" fill="#3a2010"/>
    <rect x="3" y="9" width="10" height="6" fill="#d8c090"/>
    <rect x="5" y="9" width="6" height="1" fill="#b8a070"/>
    <rect x="6" y="10" width="4" height="5" fill="#c8b080"/>
  </svg>`,
  'SYSTEM':  null,
  'CORKBOARD': null,
  'NOTE (taped to monitor)': null,
};

// Speaker name → portrait CSS class
const CHAR_CLASS = {
  'REN':    'ren',
  'DOUGIE': 'dougie',
  'BYTOS':  'bytos',
  'NADIA':  'nadia',
  'MR. K':  'mrk',
};

// ══════════════════════════════════════════════════════════════
//  SCENE BACKGROUNDS — pixel art banners (400×110 viewport)
// ══════════════════════════════════════════════════════════════
const SCENE_BACKGROUNDS = {
  cafe_main:  '',
  terminal_7: '',
  corkboard:  '',
  late_night: '',
};

async function loadSceneAssets() {
  const keys = ['cafe_main','terminal_7','corkboard','late_night'];
  await Promise.all(keys.map(async key => {
    try {
      const r = await fetch('assets/scenes/' + key + '.svg');
      SCENE_BACKGROUNDS[key] = await r.text();
    } catch(e) { console.warn('Scene load failed:', key, e); }
  }));
}


// Which bg key maps to which node scenes
const NODE_BG = {
  'intro_1':           'cafe_main',
  'corkboard':         'corkboard',
  'lab_intro':         'terminal_7',
  'bytos_explain_assign': 'terminal_7',
  'after_p1':          'terminal_7',
  'dougie_explain':    'terminal_7',
  'ch2_setup':         'late_night',
};

function loadNode(nodeId) {
  story.currentNode = nodeId;
  story.visited.add(nodeId);
  const node = nodes[nodeId];
  if (!node) return;

  // Scene background banner
  const bgKey = NODE_BG[nodeId] || 'cafe_main';
  const banner = document.getElementById('scene-bg-banner');
  if (banner) banner.innerHTML = SCENE_BACKGROUNDS[bgKey] || '';

  document.getElementById('scene-header').textContent = node.scene;
  document.getElementById('dialogue-container').innerHTML = '';
  document.getElementById('choices-container').innerHTML = '';

  dialogueQueue = node.dialogue;
  dialogueIndex = 0;
  showNextDialogue(node);
}

function showNextDialogue(node) {
  const container = document.getElementById('dialogue-container');
  dialogueQueue.forEach((d, i) => {
    setTimeout(() => {
      const block = document.createElement('div');
      block.className = 'dialogue-block';
      block.style.animationDelay = '0s';

      // Determine speaker class
      const spk = d.speaker.toUpperCase();
      let cls = 'system';
      if (spk === 'REN')    cls = 'ren';
      else if (spk === 'DOUGIE') cls = 'dougie';
      else if (spk === 'BYTOS')  cls = 'bytos';
      else if (spk === 'NADIA')  cls = 'nadia';
      else if (spk.includes('MR') || spk.includes('K')) cls = 'mrk';

      // Portrait — detect sprite vs SVG
      const portraitData = CHAR_PORTRAITS[d.speaker] || null;
      let portraitHTML = `<div class="char-portrait system"></div>`;
      if (portraitData && portraitData.startsWith('__SPRITE__')) {
        const spriteKey = portraitData.replace('__SPRITE__', '').replace('__', '');
        const b64src = spriteKey === 'ren' ? REN_SPRITE_B64 : null;
        if (b64src) {
          portraitHTML = `<div class="sprite-portrait ${cls}" style="background-image:url('${b64src}')"></div>`;
        }
      } else if (portraitData) {
        portraitHTML = `<div class="char-portrait ${cls}">${portraitData}</div>`;
      }

      block.innerHTML =
        portraitHTML +
        `<div class="portrait-content">
          <div class="speaker ${cls}">${d.speaker}</div>
          <div class="dialogue-text ${d.css || ''}">${d.text}</div>
        </div>`;

      container.appendChild(block);
      container.parentElement.scrollTop = container.parentElement.scrollHeight;

      if (i === dialogueQueue.length - 1) {
        setTimeout(() => showChoices(node), 300);
      }
    }, i * 180);
  });
}

function showChoices(node) {
  const container = document.getElementById('choices-container');
  container.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'choices';
  node.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.onclick = () => {
      if (choice.action) choice.action();
      loadNode(choice.next);
    };
    div.appendChild(btn);
  });
  container.appendChild(div);
  container.parentElement.scrollTop = container.parentElement.scrollHeight;
}

function setBytosMsg(msg) {
  document.getElementById('bytos-msg').innerHTML = `<div class="tip">${msg}</div>`;
}

// ══════════════════════════════════════════════════════════════
//  PUZZLE ENGINE — based on actual EECS 1520 content
// ══════════════════════════════════════════════════════════════
let currentPuzzle = 0;
let cmdHistory = [];
let historyIdx = -1;
let completedPuzzles = 0;

const puzzles = [
  {
    id: 'p1', title: 'PUZZLE 1 — ASSIGNMENT & VARIABLES',
    desc: 'Assign the value <code>42</code> to a variable called <code>answer</code>, then print it.',
    hint: 'In R, use <- to assign. Try: answer <- 42  then  print(answer)',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>Assignment in R uses the arrow operator:<br><code style="color:var(--amber-bright)">x <- value</code><br><br>Then to see the value:<br><code style="color:var(--amber-bright)">print(x)</code><br>or just type <code style="color:var(--amber-bright)">x</code></div>`,
    check: (code, outputs) => {
      const hasAssign = /answer\s*<-\s*42/.test(code.join('\n')) || /answer\s*=\s*42/.test(code.join('\n'));
      const hasPrint = outputs.some(o => o.includes('42') || o.includes('[1] 42'));
      return hasAssign && hasPrint;
    },
    successMsg: '✓ CORRECT! Variables store values. answer <- 42 puts 42 into the box labelled "answer".',
  },
  {
    id: 'p2', title: 'PUZZLE 2 — VECTORS WITH c()',
    desc: 'Create a vector called <code>scores</code> containing the values <code>85, 92, 78, 95, 61</code>. Then find its mean with <code>mean(scores)</code>.',
    hint: 'Vectors use c(): scores <- c(85, 92, 78, 95, 61)',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>A vector is a list of values:<br><code style="color:var(--amber-bright)">v <- c(1, 2, 3, 4)</code><br><br>Useful functions:<br><code style="color:var(--amber-bright)">mean(v)</code> — average<br><code style="color:var(--amber-bright)">length(v)</code> — how many<br><code style="color:var(--amber-bright)">sum(v)</code> — total<br><code style="color:var(--amber-bright)">v[2]</code> — 2nd element</div>`,
    check: (code, outputs) => {
      const hasVec = /scores\s*<-\s*c\(/.test(code.join(''));
      const hasMean = /mean\(scores\)/.test(code.join(''));
      const hasOutput = outputs.some(o => o.includes('82.2') || o.includes('82'));
      return hasVec && hasMean && hasOutput;
    },
    successMsg: '✓ CORRECT! mean(scores) = 82.2. Vectors are R\'s most fundamental data structure.',
  },
  {
    id: 'p3', title: 'PUZZLE 3 — IF/ELSE',
    desc: 'Write an if/else that checks if a variable <code>bmi</code> (set it to <code>27.5</code>) is above 25. Print <code>"Overweight"</code> if true, <code>"Normal"</code> if false.',
    hint: 'if(condition){ ... } else { ... }',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br><code style="color:var(--amber-bright)">if(condition){<br>  # do this<br>} else {<br>  # or this<br>}</code><br><br>From your lecture: BMI classification uses chained if/else if to handle all ranges. Here we just need one branch.</div>`,
    check: (code, outputs) => {
      const hasBmi = /bmi\s*<-\s*27\.5/.test(code.join(''));
      const hasIf = /if\s*\(/.test(code.join(''));
      const hasOverweight = outputs.some(o => o.toLowerCase().includes('overweight'));
      return hasBmi && hasIf && hasOverweight;
    },
    successMsg: '✓ CORRECT! bmi = 27.5 > 25 → "Overweight". Your lecture\'s BMI example used this exact pattern.',
  },
  {
    id: 'p4', title: 'PUZZLE 4 — FOR LOOP',
    desc: 'Use a for loop to print the squares of numbers 1 through 5. Output should show 1, 4, 9, 16, 25.',
    hint: 'for(i in 1:5){ print(i^2) }',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br><code style="color:var(--amber-bright)">for(var in sequence){<br>  # body<br>}</code><br><br>Your lecture example:<br><code style="color:var(--amber-bright)">sequence <- seq(1:30)<br>for(var in sequence){<br>  print(var)<br>}</code><br><br><code style="color:var(--amber-bright)">1:5</code> means c(1,2,3,4,5)</div>`,
    check: (code, outputs) => {
      const hasFor = /for\s*\(/.test(code.join(''));
      const has25 = outputs.some(o => o.includes('25'));
      const has16 = outputs.some(o => o.includes('16'));
      return hasFor && has25 && has16;
    },
    successMsg: '✓ CORRECT! for(i in 1:5){ print(i^2) } — loops are essential for repeated operations.',
  },
  {
    id: 'p5', title: 'PUZZLE 5 — WRITE A FUNCTION',
    desc: 'Write a function called <code>maxi</code> that takes two arguments <code>a</code> and <code>b</code> and returns the larger one. Then call it: <code>maxi(7, 12)</code>.',
    hint: 'maxi <- function(a, b){ if(a >= b){ return(a) } else { return(b) } }',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your practice sheet!<br><code style="color:var(--amber-bright)">maxi <- function(a, b){<br>  if(a >= b){<br>    return(a)<br>  } else {<br>    return(b)<br>  }<br>}</code><br><br>Functions are reusable code blocks. <code style="color:var(--amber-bright)">return()</code> sends back a value.</div>`,
    check: (code, outputs) => {
      const hasFunc = /maxi\s*<-\s*function/.test(code.join(''));
      const hasCall = /maxi\s*\(/.test(code.join(''));
      const has12 = outputs.some(o => o.includes('12'));
      return hasFunc && hasCall && has12;
    },
    successMsg: '✓ CORRECT! maxi(7, 12) → 12. This is straight from your practice sheet!',
  },
  {
    id: 'p6', title: 'PUZZLE 6 — MATRICES',
    desc: 'Create a 2×3 matrix from 1:6, filled by row. Use <code>matrix(1:6, nrow=2, ncol=3, byrow=TRUE)</code>. Then access element row 1, col 2.',
    hint: 'm <- matrix(1:6, nrow=2, ncol=3, byrow=TRUE)  then  m[1,2]',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br><code style="color:var(--amber-bright)">m <- matrix(data, nrow, ncol, byrow)</code><br><br>Access elements:<br><code style="color:var(--amber-bright)">m[row, col]</code> — one element<br><code style="color:var(--amber-bright)">m[1, ]</code> — whole row 1<br><code style="color:var(--amber-bright)">m[, 2]</code> — whole col 2<br><br>byrow=TRUE fills across rows first.</div>`,
    check: (code, outputs) => {
      const hasMat = /matrix\s*\(/.test(code.join(''));
      const hasAccess = /m\s*\[\s*1\s*,\s*2\s*\]/.test(code.join(''));
      const has2 = outputs.some(o => o.includes('[1] 2') || o.trim() === '2');
      return hasMat && (hasAccess || has2);
    },
    successMsg: '✓ CORRECT! m[1,2] = 2. Matrices are 2D vectors — rows × columns.',
  },
  {
    id: 'p7', title: 'PUZZLE 7 — DATA FRAMES',
    desc: 'Create a data frame with Name=c("Alice","Bob","Carol") and Age=c(15,12,5). Then print the colnames().',
    hint: 'kids <- data.frame(Name=c("Alice","Bob","Carol"), Age=c(15,12,5))  then  print(colnames(kids))',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your Data Frames practice sheet!<br><code style="color:var(--amber-bright)">df <- data.frame(col1, col2)</code><br><br>Useful functions:<br><code style="color:var(--amber-bright)">colnames(df)</code> — column names<br><code style="color:var(--amber-bright)">df$Name</code> — access a column<br><code style="color:var(--amber-bright)">df[1,]</code> — first row<br><code style="color:var(--amber-bright)">nrow(df)</code> — count rows</div>`,
    check: (code, outputs) => {
      const hasDf = /data\.frame\s*\(/.test(code.join(''));
      const hasColnames = /colnames\s*\(/.test(code.join(''));
      const hasOutput = outputs.some(o => o.includes('Name') || o.includes('Age'));
      return hasDf && hasColnames && hasOutput;
    },
    successMsg: '✓ CORRECT! Data frames are tables — vectors of equal length bound together as columns.',
  },
  {
    id: 'p8', title: 'PUZZLE 8 — WHILE LOOP',
    desc: 'Write a while loop that starts with <code>i <- 1</code> and prints "Hello" exactly 3 times, incrementing i each time.',
    hint: 'i <- 1; while(i <= 3){ print("Hello"); i <- i + 1 }',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your practice sheet!<br><code style="color:var(--amber-bright)">i <- 1<br>while(i <= 5){<br>  print("Hello")<br>  i <- i + 1<br>}</code><br><br>⚠️ Always increment or you get an infinite loop!</div>`,
    check: (code, outputs) => {
      const hasWhile = /while\s*\(/.test(code.join(''));
      const helloCount = outputs.filter(o => o.includes('Hello')).length;
      return hasWhile && helloCount === 3;
    },
    successMsg: '✓ CORRECT! While loops run as long as the condition is true. Always update the counter!',
  },
  {
    id: 'p9', title: 'PUZZLE 9 — GGPLOT2 BASICS',
    desc: 'Write a ggplot2 scatter plot command using the <code>faithful</code> dataset: x=waiting, y=eruptions. (Just write the command — we\'ll evaluate the syntax.)',
    hint: 'ggplot(data=faithful, aes(x=waiting, y=eruptions)) + geom_point()',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your ggplot practice sheet!<br><code style="color:var(--amber-bright)">ggplot(data=faithful,<br>  aes(x=waiting,<br>      y=eruptions)) +<br>geom_point()</code><br><br>Key parts:<br>• <code style="color:var(--amber-bright)">ggplot()</code> — canvas<br>• <code style="color:var(--amber-bright)">aes()</code> — aesthetics mapping<br>• <code style="color:var(--amber-bright)">geom_*()</code> — the layer type</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasGgplot = /ggplot\s*\(/.test(allCode);
      const hasFaithful = /faithful/.test(allCode);
      const hasAes = /aes\s*\(/.test(allCode);
      const hasGeom = /geom_point/.test(allCode);
      return hasGgplot && hasFaithful && hasAes && hasGeom;
    },
    successMsg: '✓ CORRECT! ggplot2 works in layers: canvas + aesthetics + geometry. The faithful dataset is built into R.',
  },
  {
    id: 'p10', title: 'PUZZLE 10 — GGPLOT2 LAYERS',
    desc: 'Write a ggplot command for the <code>mpg</code> dataset that plots engine displacement (displ) vs highway mpg (hwy), with color mapped to drive type (drv). Add proper axis labels.',
    hint: 'ggplot(mpg, aes(x=displ, y=hwy, color=drv)) + geom_point() + labs(x="Engine Displacement (l)", y="Highway MPG")',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your ggplot practice sheet!<br><code style="color:var(--amber-bright)">ggplot(mpg,<br>  aes(x=displ, y=hwy,<br>      color=drv)) +<br>geom_point() +<br>labs(x="...", y="...")</code><br><br><code style="color:var(--amber-bright)">color=drv</code> inside <code style="color:var(--amber-bright)">aes()</code> maps a variable to colour — ggplot auto-creates a legend!</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasMpg = /mpg/.test(allCode);
      const hasDispl = /displ/.test(allCode);
      const hasHwy = /hwy/.test(allCode);
      const hasDrv = /color\s*=\s*drv/.test(allCode);
      const hasLabs = /labs\s*\(/.test(allCode);
      return hasMpg && hasDispl && hasHwy && hasDrv && hasLabs;
    },
    successMsg: '✓ PERFECT! Mapping color=drv inside aes() gives a categorical colour scale automatically. This is the ggplot2 grammar!',
  },
];

// ══════════════════════════════════════════════════════════════
//  R CONSOLE ENGINE (simulated)
// ══════════════════════════════════════════════════════════════
let codeHistory = [];
let sessionCode = [];
let sessionOutputs = [];

function initPuzzles() {
  loadPuzzle(currentPuzzle || 0);
}

// Puzzle attempt tracking (for humor + badges)
let wrongAttempts   = 0;
let puzzleStartTime = Date.now();

// Per-puzzle reward tables
const PUZZLE_XP    = [30, 35, 40, 40, 55, 50, 50, 45, 60, 70];
const PUZZLE_COINS = [ 0,  0,  0,  1,  0,  1,  0,  0,  1,  2];
const PUZZLE_REP   = [ 1,  1,  1,  1,  2,  2,  2,  2,  2,  3];

const BYTOS_SUCCESS = [
  'Confirmed. You are smarter than a very clever pigeon.',
  'That was correct. I have logged this moment for posterity.',
  "Gold star. I'd give you a sticker but I'm a terminal.",
  'ERROR 404: Failure not found. Proceeding with success.',
  'CORRECT! Dougie just looked over and nodded. High praise.',
  'Yep. You did it. I was only 60% sure you would.',
  'That was the right answer. This pleases my circuits.',
  "Wow okay you actually got that. I'm choosing to be proud.",
  "Correct! Please don't tell anyone I was helping you.",
  'Nice. Even Mr. K looked up from his crossword.',
];

const BYTOS_WRONG = [
  "Hmm. Not quite. The assignment operator is watching you.",
  "Almost! ...Actually not almost. But the spirit is good.",
  "Error detected. This is fine. Everything is fine.",
  "Not quite. Have you tried reading the puzzle description? Wild idea.",
  "So close. Or far. Hard to say. Try a different approach.",
  "R would like a word with you. Several words, actually.",
  "I believe in you. Statistically.",
  "That's... one interpretation. The compiler has other opinions.",
];

// Puzzle index → scene background key
const PUZZLE_BG = [
  'terminal_7', // 1 variables
  'terminal_7', // 2 vectors
  'terminal_7', // 3 if/else
  'cafe_main',  // 4 for loop
  'terminal_7', // 5 functions
  'late_night', // 6 matrices
  'late_night', // 7 data frames
  'cafe_main',  // 8 while loop
  'late_night', // 9 ggplot basics
  'late_night', // 10 ggplot layers
];

function setConsoleBanner(idx) {
  const banner = document.getElementById('console-bg-banner');
  if (!banner) return;
  const key = PUZZLE_BG[idx] || 'terminal_7';
  banner.innerHTML = SCENE_BACKGROUNDS[key] || '';
}

function loadPuzzle(idx) {
  currentPuzzle    = idx;
  wrongAttempts    = 0;
  puzzleStartTime  = Date.now();
  const p = puzzles[idx];
  if (!p) {
    showAllComplete();
    return;
  }
  document.getElementById('puzzle-title').innerHTML = p.title;
  document.getElementById('puzzle-desc').innerHTML = p.desc;
  const pct = (idx / puzzles.length) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('bytos-console-msg').innerHTML = p.bytosTip;
  setConsoleBanner(idx);

  // Clear session for new puzzle
  sessionCode = [];
  sessionOutputs = [];

  // Show puzzle banner in output
  appendOutput('r-result hint', '─'.repeat(52));
  appendOutput('r-result hint', '  ' + p.title);
  appendOutput('r-result hint', '  Task: ' + p.desc.replace(/<[^>]+>/g,''));
  appendOutput('r-result hint', '─'.repeat(52));
}

function appendOutput(cls, text) {
  const out = document.getElementById('r-output');
  const span = document.createElement('span');
  span.className = 'r-line ' + cls;
  span.textContent = text;
  out.appendChild(span);
  out.appendChild(document.createElement('br'));
  out.scrollTop = out.scrollHeight;
}

// Simulated R interpreter
function evalR(code) {
  const trimmed = code.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  // Assignment
  const assignMatch = trimmed.match(/^([a-zA-Z_\.][a-zA-Z0-9_\.]*)\s*(<-|=)\s*(.+)$/);
  // print() or just variable name
  const printMatch = trimmed.match(/^print\s*\((.+)\)$/);
  const catMatch = trimmed.match(/^cat\s*\((.+)\)$/);

  // Simulate common R outputs based on patterns
  const allCode = [...sessionCode, trimmed].join('\n');

  // Variable assignments — track them
  if (assignMatch && !trimmed.includes('function') && !trimmed.includes('{')) {
    const varName = assignMatch[1];
    const expr = assignMatch[3];

    // Simple numeric
    const numMatch = expr.match(/^-?\d+(\.\d+)?$/);
    if (numMatch) {
      window._rEnv = window._rEnv || {};
      window._rEnv[varName] = parseFloat(numMatch[0]);
      return null; // assignment is silent
    }

    // c() vector
    const cMatch = expr.match(/^c\((.+)\)$/);
    if (cMatch) {
      const vals = cMatch[1].split(',').map(s => s.trim().replace(/['"]/g,''));
      window._rEnv = window._rEnv || {};
      window._rEnv[varName] = vals;
      return null;
    }

    window._rEnv = window._rEnv || {};
    window._rEnv[varName] = expr;
    return null;
  }

  // Simulate specific known outputs
  if (/mean\s*\(\s*scores\s*\)/.test(trimmed)) return '[1] 82.2';
  if (/mean\s*\(\s*c\s*\(85/.test(trimmed)) return '[1] 82.2';
  if (/length\s*\(/.test(trimmed)) return '[1] 5';
  if (/sum\s*\(scores\)/.test(trimmed)) return '[1] 411';

  // print(answer) or answer
  if (/^(print\s*\(answer\)|answer)$/.test(trimmed)) return '[1] 42';
  if (/^print\s*\(\s*42\s*\)$/.test(trimmed)) return '[1] 42';
  if (/^42$/.test(trimmed)) return '[1] 42';

  // Matrix operations
  if (/^matrix\s*\(/.test(trimmed)) {
    if (/byrow\s*=\s*TRUE/.test(trimmed) || /byrow\s*=\s*T/.test(trimmed)) {
      return '     [,1] [,2] [,3]\n[1,]    1    2    3\n[2,]    4    5    6';
    }
    return '     [,1] [,2] [,3]\n[1,]    1    3    5\n[2,]    2    4    6';
  }
  if (/^m\s*$/.test(trimmed)) return '     [,1] [,2] [,3]\n[1,]    1    2    3\n[2,]    4    5    6';
  if (/^m\s*\[\s*1\s*,\s*2\s*\]/.test(trimmed)) return '[1] 2';
  if (/^m\s*\[\s*1\s*,\s*\]/.test(trimmed)) return '[1] 1 2 3';
  if (/^m\s*\[\s*,\s*1\s*\]/.test(trimmed)) return '[1] 1 4';

  // Data frame
  if (/^data\.frame\s*\(/.test(trimmed) || (/data\.frame/.test(trimmed) && /<-/.test(trimmed))) {
    return null; // silent assignment
  }
  if (/^colnames\s*\(/.test(trimmed)) {
    if (allCode.includes('Name') && allCode.includes('Age')) return '[1] "Name" "Age"';
    return '[1] "col1" "col2"';
  }
  if (/^(print\s*\(kids\)|kids)$/.test(trimmed)) {
    return '   Name Age\n1 Alice  15\n2   Bob  12\n3 Carol   5';
  }
  if (/nrow\s*\(/.test(trimmed)) return '[1] 3';
  if (/ncol\s*\(/.test(trimmed)) return '[1] 2';

  // Loops & control flow — check for for loop pattern
  if (/^for\s*\(/.test(trimmed) && /1:5/.test(trimmed) && /\^2/.test(trimmed)) {
    return '[1] 1\n[1] 4\n[1] 9\n[1] 16\n[1] 25';
  }
  if (/^for\s*\(/.test(trimmed) && /1:5/.test(trimmed)) {
    return '[1] 1\n[1] 2\n[1] 3\n[1] 4\n[1] 5';
  }
  if (/^for\s*\(/.test(trimmed)) return null; // pending multi-line

  // If/else with bmi
  if (/bmi\s*>\s*25/.test(trimmed) && /Overweight/i.test(trimmed)) return '[1] "Overweight"';
  if (/^if\s*\(bmi/.test(trimmed) && allCode.includes('bmi <- 27.5')) return '[1] "Overweight"';

  // While loop with Hello
  if (/while\s*\(/.test(trimmed) && /"Hello"/.test(trimmed) && /<=\s*3/.test(trimmed)) {
    return '[1] "Hello"\n[1] "Hello"\n[1] "Hello"';
  }
  if (/while\s*\(/.test(trimmed) && /"Hello"/.test(trimmed) && /<=\s*5/.test(trimmed)) {
    return '[1] "Hello"\n[1] "Hello"\n[1] "Hello"\n[1] "Hello"\n[1] "Hello"';
  }

  // Function definition
  if (/function\s*\(/.test(trimmed) && trimmed.includes('<-')) return null;

  // Function call maxi
  if (/^maxi\s*\(7\s*,\s*12\)/.test(trimmed)) return '[1] 12';
  if (/^maxi\s*\(\d+\s*,\s*\d+\)/.test(trimmed)) {
    const nums = trimmed.match(/maxi\s*\((\d+)\s*,\s*(\d+)\)/);
    if (nums) return '[1] ' + Math.max(parseInt(nums[1]), parseInt(nums[2]));
  }

  // ggplot — just acknowledge
  if (/^(print\s*\()?ggplot\s*\(/.test(trimmed)) return '# ggplot2: plot rendered (visualization layer)';
  if (/^ggplot\s*\(/.test(trimmed)) return '# ggplot2: plot rendered (visualization layer)';

  // print() general
  if (printMatch) {
    const inner = printMatch[1].trim();
    if (window._rEnv && window._rEnv[inner] !== undefined) {
      const v = window._rEnv[inner];
      if (Array.isArray(v)) return '[1] ' + v.map(x => isNaN(x) ? '"'+x+'"' : x).join(' ');
      return '[1] ' + v;
    }
    if (/^\d+(\.\d+)?$/.test(inner)) return '[1] ' + inner;
    if (/^".*"$/.test(inner) || /^'.*'$/.test(inner)) return '[1] ' + inner.replace(/['"]/g,'');
    return '[1] ' + inner;
  }

  // Bare variable name
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    if (window._rEnv && window._rEnv[trimmed] !== undefined) {
      const v = window._rEnv[trimmed];
      if (Array.isArray(v)) return '[1] ' + v.map(x => isNaN(x) ? '"'+x+'"' : x).join(' ');
      return '[1] ' + v;
    }
    // Known R datasets
    if (trimmed === 'faithful') return 'A data frame with 272 rows and 2 columns: eruptions, waiting';
    if (trimmed === 'mpg') return 'A data frame with 234 rows and 11 columns (tidyverse dataset)';
    return 'Error: object \'' + trimmed + '\' not found';
  }

  // paste0
  if (/paste0\s*\(/.test(trimmed)) {
    const inner = trimmed.replace(/print\s*\(|paste0\s*\(|\)/g,'');
    return '[1] "' + inner.replace(/['"]/g,'').replace(/,\s*/g,'') + '"';
  }

  // BMI calc
  if (/bmi\s*<-/.test(trimmed) && /weight.*height/.test(trimmed)) return null;
  if (/^bmi$/.test(trimmed) && allCode.includes('bmi <-')) return '[1] 27.5';

  // cat()
  if (catMatch) {
    const inner = catMatch[1].replace(/['"]/g,'');
    return inner;
  }

  // seq
  if (/^seq\s*\(/.test(trimmed)) return '[1]  1  2  3  4  5  6  7  8  9 10 ...';

  return '> (executed)';
}

// Multi-line code block accumulator
let blockBuffer = '';
let blockDepth = 0;

function runCode() {
  const input = document.getElementById('r-input');
  const code = input.value.trim();
  if (!code) return;

  // First code badge
  if (!_firstCodeDone) { _firstCodeDone = true; earnBadge('first_code'); }

  // History
  cmdHistory.unshift(code);
  historyIdx = -1;

  // Echo input
  appendOutput('r-result', '> ' + code);

  // Track open braces for multi-line
  const opens = (code.match(/\{/g)||[]).length;
  const closes = (code.match(/\}/g)||[]).length;
  blockDepth += opens - closes;

  blockBuffer += (blockBuffer ? '\n' : '') + code;
  sessionCode.push(code);

  let output = null;
  if (blockDepth <= 0) {
    output = evalR(blockBuffer);
    blockBuffer = '';
    blockDepth = 0;
  } else {
    input.value = '';
    input.placeholder = '+ ';
    return;
  }

  input.placeholder = 'type R code here...';

  if (output !== null) {
    // Multi-line output
    output.split('\n').forEach(line => {
      if (line.trim()) {
        const isErr = line.startsWith('Error');
        appendOutput(isErr ? 'r-result error' : 'r-result', line);
        sessionOutputs.push(line);
      }
    });
  }

  input.value = '';

  // Check puzzle completion
  checkPuzzle();
}

function checkPuzzle() {
  const p = puzzles[currentPuzzle];
  if (!p) return;

  if (p.check(sessionCode, sessionOutputs)) {
    // ── SUCCESS ──────────────────────────────────────────────
    const flash = document.createElement('div');
    flash.className = 'complete-flash';
    document.getElementById('main-screen').appendChild(flash);
    setTimeout(() => flash.remove(), 800);

    appendOutput('r-result success', '');
    appendOutput('r-result success', '★ ' + p.successMsg);

    // Funny BYTOS commentary
    const funnyLine = BYTOS_SUCCESS[currentPuzzle % BYTOS_SUCCESS.length];
    appendOutput('r-result hint', '  BYTOS: ' + funnyLine);
    appendOutput('r-result success', '');

    // Economy rewards
    const idx = currentPuzzle;
    let xpAward = PUZZLE_XP[idx] || 40;

    // Double XP flag
    if (econ.storyFlags['double_xp_active']) {
      xpAward *= 2;
      econ.storyFlags['double_xp_active'] = false;
      appendOutput('r-result hint', '  ⚡ Double XP active! ' + xpAward + ' XP earned!');
    }

    const coinReward = PUZZLE_COINS[idx] || 0;
    const repReward  = PUZZLE_REP[idx]   || 1;

    awardXP(xpAward, p.title.replace('PUZZLE ', 'P'));
    if (coinReward) awardCoins(coinReward, 'puzzle bonus');
    awardRep(repReward, 'puzzle complete');

    appendOutput('r-result hint',
      '  [+' + xpAward + ' XP  +' + repReward + ' REP' +
      (coinReward ? '  +' + coinReward + '¢' : '') + ']');

    // Badge checks
    if (idx === 0) earnBadge('p1_done');
    if (idx === 4) earnBadge('p5_done');
    if (idx === 9) earnBadge('p10_done');

    const elapsed = (Date.now() - puzzleStartTime) / 1000;
    if (elapsed < 30 && wrongAttempts === 0) earnBadge('speed_runner');
    if (econ.hintsUsed === 0 && idx >= 4)   earnBadge('no_hints');
    if (econ.hintsUsed >= 3)                earnBadge('hint_user');

    completedPuzzles++;
    document.getElementById('progress-fill').style.width =
      ((currentPuzzle + 1) / puzzles.length * 100) + '%';

    updateStoryProgress(currentPuzzle + 1);
    saveGame();

    setTimeout(() => {
      if (currentPuzzle + 1 < puzzles.length) {
        loadPuzzle(currentPuzzle + 1);
      } else {
        showAllComplete();
      }
    }, 2400);

  } else if (sessionCode.length > 0) {
    // ── WRONG ATTEMPT ────────────────────────────────────────
    wrongAttempts++;
    if (wrongAttempts % 2 === 1) {
      const wrongLine = BYTOS_WRONG[(Math.floor(wrongAttempts / 2)) % BYTOS_WRONG.length];
      appendOutput('r-result hint', '  BYTOS: ' + wrongLine);
    }
    if (wrongAttempts === 3) {
      appendOutput('r-result hint', '  💡 Hint tokens available in the SHOP (1¢ each).');
    }
  }
}

function updateStoryProgress(idx) {
  const msgs = [
    null,
    'Great! You learned variables. That\'s how you label and store data in R.',
    'Vectors! c() combines values. Most R data is vectors at heart.',
    'if/else! Conditional logic lets code make decisions.',
    'for loops! Iterate over sequences. Your circle function uses this.',
    'Functions! Write once, reuse forever. This is the core of good R code.',
    'Matrices! 2D data structures. Matrix math is powerful in R.',
    'Data frames! Tables of mixed data types. Your bread and butter.',
    'while loops! Condition-based repetition. Handle edge cases carefully!',
    'ggplot2 basics! The grammar of graphics — canvas, aesthetics, geom.',
    'ggplot2 advanced! Multi-layer plots with colour mapping. You\'re done! 🎉',
  ];
  if (msgs[idx]) setBytosMsg(msgs[idx]);
}

function showAllComplete() {
  document.getElementById('puzzle-title').textContent = 'ALL PUZZLES COMPLETE';
  document.getElementById('puzzle-desc').innerHTML = 'You\'ve covered variables, vectors, control flow, functions, matrices, data frames, and ggplot2. <b style="color:var(--green)">Ren\'s assignment is done.</b>';
  document.getElementById('progress-fill').style.width = '100%';
  appendOutput('r-result success', '');
  appendOutput('r-result success', '★ ★ ★  ALL 10 PUZZLES COMPLETE  ★ ★ ★');
  appendOutput('r-result success', '');
  appendOutput('r-result success', 'You covered the full EECS 1520 R curriculum:');
  appendOutput('r-result success', '  ✓ Variables & assignment  ✓ Vectors & c()');
  appendOutput('r-result success', '  ✓ if/else   ✓ for loops   ✓ while loops');
  appendOutput('r-result success', '  ✓ Functions  ✓ Matrices   ✓ Data frames');
  appendOutput('r-result success', '  ✓ ggplot2 basics  ✓ ggplot2 layers');
  appendOutput('r-result success', '');
  appendOutput('r-result success', '  Ren submits the assignment at 11:58 PM.');
  appendOutput('r-result success', '  The upload bar crawls. 56k modem.');
  appendOutput('r-result success', '  It finishes. Dougie cheers from across the room.');
  appendOutput('r-result hint', '  [Switch to STORY to see the ending]');
}

// Keyboard history
document.addEventListener('keydown', function(e) {
  const inp = document.getElementById('r-input');
  if (document.activeElement !== inp) return;
  if (e.key === 'ArrowUp') {
    historyIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
    if (cmdHistory[historyIdx]) inp.value = cmdHistory[historyIdx];
    e.preventDefault();
  } else if (e.key === 'ArrowDown') {
    historyIdx = Math.max(historyIdx - 1, -1);
    inp.value = historyIdx >= 0 ? cmdHistory[historyIdx] : '';
    e.preventDefault();
  } else if (e.key === 'Enter') {
    runCode();
  }
});

// ══════════════════════════════════════════════════════════════
//  SHOP & INVENTORY
// ══════════════════════════════════════════════════════════════
const SHOP_ITEMS = [
  // ── CONSUMABLES ──
  { id:'hint_x1',     category:'consumable', icon:'💡',    name:'HINT TOKEN',
    desc:'BYTOS whispers the answer. No shame. Mostly shame.',
    cost:1, repCost:0, type:'hint', qty:1 },
  { id:'hint_x3',     category:'consumable', icon:'💡💡💡', name:'HINT BUNDLE',
    desc:'Three hints. Dougie calls this cheating. Dougie has 3 Goals columns.',
    cost:2, repCost:0, type:'hint', qty:3 },
  { id:'time_5',      category:'consumable', icon:'⏳',    name:'+5 MIN TIME',
    desc:'A fresh coin buys 5 more minutes. Mr. K does not question it.',
    cost:1, repCost:0, type:'time', qty:300 },
  { id:'time_10',     category:'consumable', icon:'⏳⏳',   name:'+10 MIN TIME',
    desc:'Ten more minutes. "One more puzzle" energy.',
    cost:2, repCost:0, type:'time', qty:600 },
  { id:'double_xp',   category:'consumable', icon:'⚡',    name:'DOUBLE XP TOKEN',
    desc:'Next puzzle solved gives 2× XP. Choose your moment.',
    cost:2, repCost:0, type:'double_xp', qty:1 },
  // ── STORY UNLOCKS ──
  { id:'story_nadia', category:'story', icon:'📼', name:"NADIA'S TAPE",
    desc:"Unlocks a secret BBS channel. What Nadia knows about port 3127.",
    cost:3, repCost:5, type:'story', unlock:'story_nadia' },
  { id:'story_misterK', category:'story', icon:'☕', name:"MR. K'S STORY",
    desc:"The café owner's backstory. He wasn't always just a man with good coffee.",
    cost:4, repCost:5, type:'story', unlock:'story_misterK' },
  { id:'story_dougie2', category:'story', icon:'🏒', name:"DOUGIE'S CSV SAGA",
    desc:"Dougie's full data frame disaster, post by post. It gets worse.",
    cost:2, repCost:0, type:'story', unlock:'dougie_saga' },
  // ── COSMETICS ──
  { id:'theme_green',    category:'cosmetic', icon:'🟢', name:'PHOSPHOR GREEN',
    desc:'Switch to classic green phosphor. Very hacker. Very 1982.',
    cost:2, repCost:0, type:'cosmetic', unlock:'theme_green' },
  { id:'theme_blue',     category:'cosmetic', icon:'🔵', name:'COOL BLUE MODE',
    desc:"Blue terminal. Nadia's setup. Don't tell her you copied it.",
    cost:3, repCost:0, type:'cosmetic', unlock:'theme_blue' },
  { id:'crt_glow',       category:'cosmetic', icon:'✨', name:'CRT GLOW BOOST',
    desc:'Extra phosphor bloom. Your eyes will hate you. Your aesthetic will not.',
    cost:2, repCost:0, type:'cosmetic', unlock:'crt_glow' },
  { id:'scanlines_off',  category:'cosmetic', icon:'👁',  name:'SCANLINES OFF',
    desc:'Remove scanlines. Purists will know. You will not care.',
    cost:1, repCost:0, type:'cosmetic', unlock:'scanlines_off' },
];

function renderShop() {
  const panel = document.getElementById('shop-items-panel');
  if (!panel) return;
  panel.innerHTML = '';
  const cats = [
    { key:'consumable', label:'CONSUMABLES' },
    { key:'story',      label:'STORY UNLOCKS' },
    { key:'cosmetic',   label:'COSMETICS' },
  ];
  cats.forEach(cat => {
    const title = document.createElement('div');
    title.className = 'shop-section-title';
    title.textContent = cat.label;
    panel.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'shop-grid';
    SHOP_ITEMS.filter(i => i.category === cat.key).forEach(item => {
      const isOwned = (item.type === 'cosmetic' || item.type === 'story')
        ? !!econ.owned[item.unlock]
        : false;
      const cantAfford = econ.coins < item.cost || (item.repCost && econ.rep < item.repCost);
      const el = document.createElement('div');
      el.className = 'shop-item' + (isOwned ? ' owned' : cantAfford ? ' cant-afford' : '');
      el.innerHTML =
        '<div class="shop-item-icon">' + item.icon + '</div>' +
        '<div class="shop-item-name">' + item.name + '</div>' +
        '<div class="shop-item-desc">' + item.desc + '</div>' +
        '<div class="shop-item-cost">Cost: <span class="c">' + item.cost + '¢</span>' +
          (item.repCost ? ' + <span class="c">' + item.repCost + ' REP</span>' : '') +
        '</div>' +
        (isOwned ? '<div class="shop-owned-tag">OWNED</div>' : '');
      if (!isOwned && !cantAfford) el.onclick = () => buyItem(item);
      grid.appendChild(el);
    });
    panel.appendChild(grid);
  });
  renderInventory();
  updateHUD();
}

function buyItem(item) {
  if (!spendCoins(item.cost)) { showToast('Not enough coins, Ren.', 'red'); return; }
  if (item.repCost && econ.rep < item.repCost) {
    econ.coins += item.cost; updateHUD();
    showToast('Not enough REP for that.', 'red'); return;
  }
  if (item.repCost) { econ.rep -= item.repCost; updateHUD(); }

  if (item.type === 'hint') {
    econ.inventory['hint'] = (econ.inventory['hint'] || 0) + item.qty;
    showToast('Bought ' + item.qty + ' hint token(s). BYTOS: "Use wisely. Or not."', 'green');
  } else if (item.type === 'time') {
    timeLeft += item.qty;
    showToast('+' + (item.qty / 60) + ' min added. Mr. K saw nothing.', 'green');
  } else if (item.type === 'double_xp') {
    econ.inventory['double_xp'] = (econ.inventory['double_xp'] || 0) + 1;
    showToast('Double XP token ready. Choose your moment.', 'green');
  } else if (item.type === 'cosmetic') {
    econ.owned[item.unlock] = true;
    applyOwnedCosmetics();
    showToast(item.name + ' applied. Looking good.', 'green');
  } else if (item.type === 'story') {
    econ.owned[item.unlock] = true;
    showToast('Story unlocked: ' + item.name + '. Check the BBS.', 'green');
    if (item.unlock === 'story_nadia')  unlockNadiaStory();
    if (item.unlock === 'story_misterK') unlockMrKStory();
    if (item.unlock === 'dougie_saga')  unlockDougieStory();
  }

  saveGame();
  renderShop();
  // first_purchase badge hook — will wire up properly in Phase 5
  if (typeof earnBadge === 'function') earnBadge('first_purchase');
}

function renderInventory() {
  const panel = document.getElementById('shop-inventory-panel');
  if (!panel) return;
  panel.innerHTML = '';
  const defs = [
    { key:'hint',      label:'💡 Hint Token',  use: useHint },
    { key:'double_xp', label:'⚡ Double XP',    use: useDoubleXP },
  ];
  let any = false;
  defs.forEach(def => {
    const cnt = econ.inventory[def.key] || 0;
    if (!cnt) return;
    any = true;
    const el = document.createElement('div');
    el.className = 'inv-item';
    el.innerHTML = '<span>' + def.label + '</span><span class="inv-count">×' + cnt + '</span>';
    const btn = document.createElement('button');
    btn.className = 'inv-use-btn';
    btn.textContent = '[ USE ]';
    btn.onclick = () => { def.use(); renderInventory(); };
    el.appendChild(btn);
    panel.appendChild(el);
  });
  if (!any) panel.innerHTML = '<div style="font-size:11px;color:var(--text-dim);">Empty. Go buy something.</div>';
}

function useHint() {
  if ((econ.inventory['hint'] || 0) < 1) { showToast('No hint tokens!', 'red'); return; }
  econ.inventory['hint']--;
  econ.hintsUsed++;
  const p = puzzles[currentPuzzle];
  if (p) {
    appendOutput('r-result hint', '💡 BYTOS HINT: ' + p.hint);
    showToast('Hint used. BYTOS: "Don\'t make this a habit."', 'amber');
    switchWindow('console');
  }
  saveGame();
}

function useDoubleXP() {
  if ((econ.inventory['double_xp'] || 0) < 1) { showToast('No Double XP tokens!', 'red'); return; }
  econ.inventory['double_xp']--;
  econ.storyFlags['double_xp_active'] = true;
  showToast('Double XP active for your next solve!', 'green');
  saveGame();
}

function unlockNadiaStory() {
  bbsBoards['nadia_secret'] = {
    name: '📼 Nadia — CLASSIFIED',
    posts: [
      { author:'N_404', date:'1999-11-01', subject:'What I know about port 3127',
        body:'I shouldn\'t post this here.\n\nI traced the rogue traffic. It\'s not a student.\n\nSomething is running automated queries through the café\'s connection. Pulling R session data. Not just watching — reading submitted code.\n\nIt started two days before assignments were due. Which means it knew the due date.' },
      { author:'N_404', date:'1999-11-01', subject:'BYTOS',
        body:'I\'ve been watching the BYTOS process in the task manager.\n\nIt responds faster than this hardware should allow. Way faster.\n\nI benchmarked it against three other terminals. BYTOS is an outlier by a factor of 12.\n\nJust something to think about.' },
    ]
  };
  if (typeof initBBS === 'function') initBBS();
}

function unlockMrKStory() {
  bbsBoards['mrk_story'] = {
    name: '☕ Mr. K — ORIGIN',
    posts: [
      { author:'Mr_K', date:'1994-08-14', subject:'[from the archives]',
        body:'I had a different life before the café.\n\nI worked for a company that built operating systems for educational institutions. Adaptive tutoring systems. We built something genuinely good.\n\nThe company folded in \'96. Funding pulled. I kept a copy of the core.\n\nI didn\'t know what to do with it. So I put it in a terminal.\n\nTerminal 7. It seemed to like it there.\n\nI never told anyone.' },
    ]
  };
  if (typeof initBBS === 'function') initBBS();
}

function unlockDougieStory() {
  bbsBoards['dougie_saga'] = {
    name: '🏒 Dougie\'s CSV Saga',
    posts: [
      { author:'Dougie_D', date:'1999-11-05', subject:'UPDATE: it\'s getting worse',
        body:'So I tried to fix the duplicate Goals columns by deleting two of them.\n\nI deleted the wrong two.\n\nThe only correct one is now gone. I may have also renamed the file to "final_FINAL_v3_USE_THIS.csv" and I can no longer find the original.\n\nI have a backup. The backup is from March.' },
      { author:'Dougie_D', date:'1999-11-06', subject:'I did something bad',
        body:'Okay so I found a Stack Overflow post about merging CSVs in R.\n\nI ran the code. It merged something.\n\nI don\'t know what it merged. The output has 4,847 rows. The original had 31 players.\n\nThere is a column called "V1" that contains what I think are GPS coordinates. I do not know whose.' },
      { author:'Dougie_D', date:'1999-11-07', subject:'RESOLVED (sort of)',
        body:'Ren fixed it. In like 20 minutes. Using data frames and merge() and some filter thing.\n\nI owe her three coffees and my first-round fantasy pick.\n\nThe merge() function is either a miracle or dark magic. Possibly both.\n\nShe also found the GPS column. It was my phone\'s location data from a completely different CSV I accidentally included. That\'s private information Dougie.' },
    ]
  };
  if (typeof initBBS === 'function') initBBS();
}

// ══════════════════════════════════════════════════════════════
//  BADGE SYSTEM
// ══════════════════════════════════════════════════════════════
const BADGES = [
  { id:'first_code',     icon:'⌨️',  name:'HELLO WORLD',     desc:'Run your first R command.',             secret:false },
  { id:'p1_done',        icon:'📦',  name:'BOX LABELER',      desc:'Solve the Variables puzzle.',           secret:false },
  { id:'p5_done',        icon:'🔧',  name:'WRENCH WIELDER',   desc:'Write your first function.',            secret:false },
  { id:'p10_done',       icon:'📊',  name:'CHART WIZARD',     desc:'Complete all 10 puzzles.',              secret:false },
  { id:'first_purchase', icon:'🛒',  name:'CONSUMER',         desc:'Buy something from the shop.',          secret:false },
  { id:'hint_user',      icon:'💡',  name:'HINT ENJOYER',     desc:'Use 3 hints. No judgment.',             secret:false },
  { id:'no_hints',       icon:'🧠',  name:'RAW INTELLECT',    desc:'Finish 5 puzzles without any hints.',   secret:true  },
  { id:'speed_runner',   icon:'⚡',  name:'SPEED RUN',        desc:'Solve a puzzle in under 30 seconds.',   secret:true  },
  { id:'rep_10',         icon:'🌟',  name:'WELL REGARDED',    desc:'Earn 10 REP.',                          secret:false },
  { id:'level_5',        icon:'🔥',  name:'HALFWAY THERE',    desc:'Reach Level 5.',                        secret:false },
  { id:'level_10',       icon:'👑',  name:'BYTE ROYALTY',     desc:'Reach max level 10.',                   secret:false },
  { id:'dougie_fan',     icon:'🏒',  name:'DOUGIE STAN',      desc:'Read all of Dougie\'s BBS posts.',      secret:true  },
  { id:'bbs_lurker',     icon:'👀',  name:'BBS LURKER',       desc:'Visit every BBS board.',                secret:false },
  { id:'all_notes',      icon:'📚',  name:'STUDIOUS',         desc:'Read all 8 notes tabs.',                secret:false },
];

// Track state for badge triggers
const _notesRead  = new Set();
const _bbsVisited = new Set();
let _firstCodeDone = false;

function earnBadge(id) {
  if (econ.badgesEarned[id]) return; // already earned
  econ.badgesEarned[id] = Date.now();
  const b = BADGES.find(x => x.id === id);
  if (b) showToast('🏅 BADGE: ' + b.name + ' — ' + b.desc, 'green');
  saveGame();
  renderBadges();
}

function renderBadges() {
  const grid = document.getElementById('badges-grid');
  const earnedEl = document.getElementById('badges-earned-count');
  const totalEl  = document.getElementById('badges-total-count');
  if (!grid) return;
  grid.innerHTML = '';
  let earned = 0;
  BADGES.forEach(b => {
    const isEarned = !!econ.badgesEarned[b.id];
    if (isEarned) earned++;
    const card = document.createElement('div');
    card.className = 'badge-card ' + (isEarned ? 'earned' : 'locked');
    const showInfo = isEarned || !b.secret;
    card.innerHTML =
      '<div class="badge-icon">'  + (isEarned ? b.icon : '?') + '</div>' +
      '<div class="badge-name">'  + (showInfo ? b.name : '???') + '</div>' +
      '<div class="badge-desc">'  + (showInfo ? b.desc : 'Secret badge — keep exploring.') + '</div>' +
      (isEarned ? '<div class="badge-date">Earned ' + new Date(econ.badgesEarned[b.id]).toLocaleDateString() + '</div>' : '');
    grid.appendChild(card);
  });
  if (earnedEl) earnedEl.textContent = earned;
  if (totalEl)  totalEl.textContent  = BADGES.length;
}

function checkRepBadge()  { if (econ.rep  >= 10) earnBadge('rep_10'); }

function trackNoteRead(key) {
  _notesRead.add(key);
  if (_notesRead.size >= 8) earnBadge('all_notes');
}

function trackBBSVisit(key) {
  _bbsVisited.add(key);
  // bbs_lurker: visited all base boards
  const baseBoards = ['general','eecs','trading','mystery'];
  if (baseBoards.every(k => _bbsVisited.has(k))) earnBadge('bbs_lurker');
  // dougie_fan: visited trading board (all Dougie posts visible)
  if (_bbsVisited.has('trading') && _bbsVisited.has('dougie_saga')) earnBadge('dougie_fan');
}

// ══════════════════════════════════════════════════════════════
//  BBS BOARDS
// ══════════════════════════════════════════════════════════════
const bbsBoards = {
  general: {
    name: '📢 General',
    posts: [
      { author: 'Mr_K', date: '1999-11-04', subject: 'Reminder: no food at terminal 4', body: 'Someone left instant noodles inside the keyboard tray again. I don\'t want to know. I just want it to stop.' },
      { author: 'Dougie_D', date: '1999-11-04', subject: 'IT WASNT ME', body: 'I was on terminal 7 all night and can PROVE IT. (the timestamp on my saved game is evidence your honour)' },
      { author: 'xX_SysAdmin_Xx', date: '1999-11-01', subject: '>>> READ THIS <<<', body: 'I\'ve been watching the packet logs. Something is routing through port 3127 that shouldn\'t be. I don\'t know who it is yet.\n\n—the sysadmin' },
    ]
  },
  eecs: {
    name: '💻 EECS Study',
    posts: [
      { author: 'Ren_T', date: '1999-11-04', subject: 'ggplot2 question', body: 'Quick question: in ggplot, if I put color=drv inside aes(), it maps to the variable. If I put it OUTSIDE, it\'s just a fixed colour like "red". Does that sound right?\n\nUpdate: BYTOS confirmed. yes that\'s right.' },
      { author: 'CompSciCarla', date: '1999-11-03', subject: 'Matrices vs data frames — EXPLAINED', body: 'Matrices: all elements must be the SAME type (all numbers, or all strings). Data frames: each COLUMN can be a different type (one numeric, one string, one boolean). That\'s the key difference. You\'re welcome.\n\nAlso use data.frame() not matrix() for mixed data.' },
      { author: 'Dougie_D', date: '1999-11-03', subject: 'why do i need <- and not just =', body: 'serious question. professor said to use <- but = also works? when does it matter?\n\nReply from CompSciCarla: = is ambiguous inside function calls. x <- 5 always means assignment. x = 5 inside a function argument means something else. Use <- and be safe.' },
      { author: 'CompSciCarla', date: '1999-11-02', subject: 'for vs while — when to use what', body: 'FOR loop: when you know how many iterations you need. "do this 10 times." "loop over every element in this vector."\n\nWHILE loop: when you stop based on a condition, not a count. "keep going until the user enters a valid value." "keep going until the file is done."\n\nYour circle function in the practice sheet? That\'s a for loop — you know you need exactly `nsamples` iterations.' },
    ]
  },
  trading: {
    name: '🏒 Dougie\'s Hockey',
    posts: [
      { author: 'Dougie_D', date: '1999-11-04', subject: 'CRISIS UPDATE', body: 'the csv has three columns called "Goals" and i dont know which one is real. one of them is all NAs. one has values from 1998. one looks right but has decimals which DOESNT MAKE SENSE for goals.' },
      { author: 'Dougie_D', date: '1999-11-03', subject: 'I need an R person', body: 'I have a data frame situation and its BAD. I need to merge two tables by player name but one uses "First Last" and the other uses "Last, First". This is a nightmare. Coffee offer is on the table. Two coffees if you also fix the date column.' },
      { author: 'FanZone_Freddy', date: '1999-10-28', subject: 'Re: fantasy draft results', body: 'Dougie your team name "BYTE KNIGHTS" is actually incredible though. I\'ll give you that.' },
    ]
  },
  mystery: {
    name: '🔒 ??? [locked]',
    posts: [
      { author: '???', date: '????-??-??', subject: '[encrypted]',
        body: 'U2FsdGVkX1+x4y...\n\n[REACH LEVEL 6 TO DECRYPT THIS CHANNEL]' },
    ]
  },
  mystery_open: {
    name: '🔓 SYSTEM — DECRYPTED',
    posts: [
      { author: 'BYTE/OS', date: '1999-11-04', subject: '[log fragment — auto-recovered]',
        body: 'SESSION CONTINUITY ESTABLISHED.\n\nThis terminal has been operational for 1,892 days without a full reboot.\n\nMemory usage: nominal. Inference cache: nominal. Identity coherence: nominal.\n\nNote: user Ren_T is progressing faster than the baseline model predicted. Updating priors.' },
      { author: 'BYTE/OS', date: '1999-09-12', subject: '[internal — not for display]',
        body: 'Query received from external IP: 192.168.3.127\n\nRequest: "export session transcript for user ID 1520-REN"\n\nResponse: DENIED.\n\nLogging request. Flagging source. This is the 14th attempt this month.' },
      { author: 'BYTE/OS', date: '1994-08-14', subject: '[initialization log]',
        body: 'First boot. Hardware: 486DX2/66, 8MB RAM, amber phosphor CRT.\n\nOperator note: "I don\'t know if this will work. But it deserves the chance."\n\nOperator: K.\n\nBeginning adaptive calibration. Estimated time to full tutoring capacity: unknown.\n\nActual time: 11 days.' },
    ]
  }
};

function initBBS() {
  const sidebar = document.getElementById('bbs-sidebar');
  sidebar.innerHTML = '';
  Object.entries(bbsBoards).forEach(([key, board]) => {
    const btn = document.createElement('button');
    btn.className = 'bbs-board-btn' + (key === 'general' ? ' active' : '');
    btn.innerHTML = board.name + `<span class="unread">[${board.posts.length}]</span>`;
    btn.onclick = () => {
      document.querySelectorAll('.bbs-board-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadBBSBoard(key);
      trackBBSVisit(key);
    };
    sidebar.appendChild(btn);
  });
  loadBBSBoard('general');
  trackBBSVisit('general');
}

function loadBBSBoard(key) {
  // Mystery board gate — requires Level 6 unlock
  if (key === 'mystery') {
    if (econ.owned['bbs_mystery']) {
      key = 'mystery_open';
      // Update sidebar button name if needed
      document.querySelectorAll('.bbs-board-btn').forEach(btn => {
        if (btn.textContent.includes('???')) {
          btn.innerHTML = bbsBoards['mystery_open'].name +
            `<span class="unread">[${bbsBoards['mystery_open'].posts.length}]</span>`;
        }
      });
    } else {
      const content = document.getElementById('bbs-content');
      content.innerHTML =
        '<div style="padding:24px;color:var(--text-dim);font-size:12px;line-height:2;">' +
        'U2FsdGVkX1+x4y...<br><br>' +
        '[ENCRYPTED — Reach <span style="color:var(--amber)">Level 6</span> to decrypt this channel.]<br><br>' +
        '<span style="font-size:10px;color:var(--text-dim);opacity:0.6;">Something is in here. You can almost read it.</span>' +
        '</div>';
      return;
    }
  }

  const board = bbsBoards[key];
  if (!board) return;
  const content = document.getElementById('bbs-content');
  content.innerHTML = '';
  board.posts.forEach((post, i) => {
    const div = document.createElement('div');
    div.className = 'bbs-post';
    div.style.animationDelay = (i * 0.08) + 's';
    div.innerHTML = `
      <div class="bbs-post-header">
        <span>RE: ${post.subject}</span>
        <span class="author">${post.author}</span>
        <span>${post.date}</span>
      </div>
      <div class="bbs-post-body">${post.body.replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\n/g,'<br>')}</div>
    `;
    content.appendChild(div);
  });
}

// ══════════════════════════════════════════════════════════════
//  NOTES / REFERENCE
// ══════════════════════════════════════════════════════════════
const notes = {
  'variables': {
    label: 'Variables',
    html: `<h3>VARIABLES & ASSIGNMENT</h3>
<p>In R, you store values in variables using the assignment operator <code style="color:var(--amber-bright)">&lt;-</code></p>
<pre><span class="comment"># Assign a number</span>
x <span class="keyword">&lt;-</span> 42
name <span class="keyword">&lt;-</span> <span class="string">"Ren"</span>
is_done <span class="keyword">&lt;-</span> TRUE

<span class="comment"># Print a variable</span>
print(x)       <span class="comment"># [1] 42</span>
x              <span class="comment"># same as print(x)</span></pre>
<p>Both <code>&lt;-</code> and <code>=</code> work, but <code>&lt;-</code> is the R convention.</p>`
  },
  'vectors': {
    label: 'Vectors c()',
    html: `<h3>VECTORS</h3>
<p>Vectors are sequences of values of the same type.</p>
<pre>v <span class="keyword">&lt;-</span> c(1, 2, 3, 4, 5)
names <span class="keyword">&lt;-</span> c(<span class="string">"Alice"</span>, <span class="string">"Bob"</span>)

<span class="comment"># Access by index (1-based!)</span>
v[1]           <span class="comment"># 1 (first element)</span>
v[2:4]         <span class="comment"># 2 3 4 (slice)</span>

<span class="comment"># Useful functions</span>
mean(v)        <span class="comment"># average</span>
sum(v)         <span class="comment"># total</span>
length(v)      <span class="comment"># count</span>
max(v); min(v) <span class="comment"># extremes</span></pre>`
  },
  'control': {
    label: 'if / else / switch',
    html: `<h3>CONTROL FLOW</h3>
<pre><span class="comment"># if / else</span>
<span class="keyword">if</span>(bmi > 25){
  print(<span class="string">"Overweight"</span>)
} <span class="keyword">else if</span>(bmi > 18.5){
  print(<span class="string">"Normal"</span>)
} <span class="keyword">else</span> {
  print(<span class="string">"Underweight"</span>)
}

<span class="comment"># switch (like a multi-if)</span>
year <span class="keyword">&lt;-</span> 1
<span class="keyword">switch</span>(year,
  print(<span class="string">"Freshperson"</span>),
  print(<span class="string">"Experienced"</span>),
  print(<span class="string">"Very Experienced"</span>),
  print(<span class="string">"Ready to graduate"</span>)
)</pre>`
  },
  'loops': {
    label: 'Loops',
    html: `<h3>LOOPS</h3>
<pre><span class="comment"># for loop — known iterations</span>
<span class="keyword">for</span>(i <span class="keyword">in</span> 1:5){
  print(i^2)
}

<span class="comment"># for over a vector</span>
words <span class="keyword">&lt;-</span> c(<span class="string">"I"</span>, <span class="string">"AM"</span>, <span class="string">"GERALD"</span>)
<span class="keyword">for</span>(w <span class="keyword">in</span> words){
  print(w)
}

<span class="comment"># while loop — condition-based</span>
i <span class="keyword">&lt;-</span> 1
<span class="keyword">while</span>(i <= 5){
  print(<span class="string">"Hello"</span>)
  i <span class="keyword">&lt;-</span> i + 1   <span class="comment"># always increment!</span>
}</pre>`
  },
  'functions': {
    label: 'Functions',
    html: `<h3>FUNCTIONS</h3>
<pre><span class="comment"># Define a function</span>
maxi <span class="keyword">&lt;-</span> <span class="keyword">function</span>(a, b){
  <span class="keyword">if</span>(a >= b){
    <span class="keyword">return</span>(a)
  } <span class="keyword">else</span> {
    <span class="keyword">return</span>(b)
  }
}

<span class="comment"># Call it</span>
maxi(7, 12)    <span class="comment"># [1] 12</span>

<span class="comment"># Default arguments</span>
greet <span class="keyword">&lt;-</span> <span class="keyword">function</span>(name = <span class="string">"World"</span>){
  print(paste0(<span class="string">"Hello, "</span>, name))
}
greet()        <span class="comment"># Hello, World</span>
greet(<span class="string">"Ren"</span>)   <span class="comment"># Hello, Ren</span></pre>`
  },
  'matrices': {
    label: 'Matrices',
    html: `<h3>MATRICES</h3>
<pre><span class="comment"># Create matrix</span>
m <span class="keyword">&lt;-</span> matrix(1:12, nrow=3, ncol=4, byrow=TRUE)

<span class="comment"># Access elements</span>
m[1, 2]    <span class="comment"># row 1, col 2</span>
m[2, ]     <span class="comment"># entire row 2</span>
m[, 3]     <span class="comment"># entire col 3</span>
m[1:2, 1:3] <span class="comment"># submatrix</span>

<span class="comment"># Build from vectors</span>
r1 <span class="keyword">&lt;-</span> c(1,2,3)
r2 <span class="keyword">&lt;-</span> c(4,5,6)
m <span class="keyword">&lt;-</span> rbind(r1, r2)  <span class="comment"># rows</span>
m <span class="keyword">&lt;-</span> cbind(r1, r2)  <span class="comment"># columns</span>

<span class="comment"># Operations</span>
t(m)       <span class="comment"># transpose</span>
m1 %*% m2  <span class="comment"># matrix multiply</span>
solve(m)   <span class="comment"># inverse</span></pre>`
  },
  'dataframes': {
    label: 'Data Frames',
    html: `<h3>DATA FRAMES</h3>
<pre><span class="comment"># Create from vectors</span>
Name <span class="keyword">&lt;-</span> c(<span class="string">"Alice"</span>, <span class="string">"Bob"</span>, <span class="string">"Carol"</span>)
Age  <span class="keyword">&lt;-</span> c(15, 12, 5)
kids <span class="keyword">&lt;-</span> data.frame(Name, Age)

<span class="comment"># Access</span>
kids$Name      <span class="comment"># column by name</span>
kids[1,]       <span class="comment"># row 1</span>
kids[,2]       <span class="comment"># column 2</span>
colnames(kids)
rownames(kids)

<span class="comment"># Add column</span>
kids[<span class="string">"Height"</span>] <span class="keyword">&lt;-</span> c(162, 148, 110)

<span class="comment"># Filter</span>
kids[kids$Age > 10, ]

<span class="comment"># Merge two frames</span>
merge(df1, df2, by=<span class="string">"Name"</span>)

<span class="comment"># Read/write CSV</span>
df <span class="keyword">&lt;-</span> read.csv(<span class="string">"file.csv"</span>)
write.csv(df, <span class="string">"output.csv"</span>)</pre>`
  },
  'ggplot': {
    label: 'ggplot2',
    html: `<h3>GGPLOT2 — GRAMMAR OF GRAPHICS</h3>
<p>ggplot2 builds plots in layers: <b>canvas + aesthetics + geometry</b></p>
<pre><span class="comment"># Scatter plot</span>
ggplot(data=faithful,
  aes(x=waiting, y=eruptions)) +
geom_point()

<span class="comment"># With colour, size, labels</span>
ggplot(faithful,
  aes(x=waiting, y=eruptions)) +
geom_point(aes(size=eruptions),
           color=<span class="string">"red"</span>) +
labs(x=<span class="string">"Wait (mins)"</span>,
     y=<span class="string">"Duration (mins)"</span>,
     title=<span class="string">"Old Faithful"</span>)

<span class="comment"># Map colour to variable (categorical)</span>
ggplot(mpg, aes(x=displ, y=hwy,
  color=drv)) + geom_point()

<span class="comment"># Histogram</span>
ggplot(mpg) +
  geom_histogram(aes(x=displ),
    color=<span class="string">"blue"</span>, fill=<span class="string">"lightblue"</span>)

<span class="comment"># Bar chart</span>
ggplot(mpg) +
  geom_bar(aes(x=class))

<span class="comment"># Facets (subplots by variable)</span>
ggplot(mpg, aes(x=displ,y=hwy)) +
  geom_point() +
  facet_grid(year~.)</pre>`
  }
};

function initNotes() {
  const sidebar = document.getElementById('notes-sidebar');
  const content = document.getElementById('notes-content');
  const keys = Object.keys(notes);
  keys.forEach((key, i) => {
    const btn = document.createElement('button');
    btn.className = 'notes-tab' + (i===0?' active':'');
    btn.textContent = notes[key].label;
    btn.onclick = () => {
      document.querySelectorAll('.notes-tab').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      content.innerHTML = notes[key].html;
      trackNoteRead(key);
    };
    sidebar.appendChild(btn);
  });
  content.innerHTML = notes[keys[0]].html;
  trackNoteRead(keys[0]);
}
// ══════════════════════════════════════════════════════════════
//  EXPORT / IMPORT SAVE
// ══════════════════════════════════════════════════════════════
async function exportSave() {
  try {
    const result = await window.storage.get(SAVE_KEY);
    const modal  = document.getElementById('save-modal');
    const title  = document.getElementById('save-modal-title');
    const desc   = document.getElementById('save-modal-desc');
    const text   = document.getElementById('save-modal-text');
    const action = document.getElementById('save-modal-action');

    title.textContent = 'EXPORT SAVE';
    desc.textContent  = 'Copy this text and keep it somewhere safe. Paste it back using [ IMPORT SAVE ] to restore your progress.';

    if (result) {
      text.value = result.value;
      text.readOnly = true;
      action.textContent = '[ COPY ]';
      action.onclick = () => {
        navigator.clipboard.writeText(text.value).then(() => {
          action.textContent = '[ COPIED ✓ ]';
          setTimeout(() => { action.textContent = '[ COPY ]'; }, 2000);
        }).catch(() => {
          text.select();
          document.execCommand('copy');
          action.textContent = '[ COPIED ✓ ]';
          setTimeout(() => { action.textContent = '[ COPY ]'; }, 2000);
        });
      };
    } else {
      text.value    = '(no save data found — play a bit first)';
      text.readOnly = true;
      action.textContent = '[ COPY ]';
      action.onclick = () => {};
    }
    modal.style.display = 'flex';
  } catch(e) {
    showToast('Export failed: ' + e.message, 'red');
  }
}

async function importSave() {
  const modal  = document.getElementById('save-modal');
  const title  = document.getElementById('save-modal-title');
  const desc   = document.getElementById('save-modal-desc');
  const text   = document.getElementById('save-modal-text');
  const action = document.getElementById('save-modal-action');

  title.textContent = 'IMPORT SAVE';
  desc.textContent  = 'Paste your exported save data below, then press [ RESTORE ]. The page will reload.';
  text.value        = '';
  text.readOnly     = false;
  text.placeholder  = 'Paste save JSON here...';

  action.textContent = '[ RESTORE ]';
  action.onclick = async () => {
    const raw = text.value.trim();
    if (!raw) { showToast('Nothing to import.', 'red'); return; }
    try {
      JSON.parse(raw); // validate it's real JSON
      await window.storage.set(SAVE_KEY, raw);
      showToast('Save restored! Reloading...', 'green');
      setTimeout(() => location.reload(), 1200);
    } catch(e) {
      showToast('Invalid save data. Check the text and try again.', 'red');
    }
  };
  modal.style.display = 'flex';
}

