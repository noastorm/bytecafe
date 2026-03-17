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

function saveGame() {
  try {
    const payload = {
      xp: econ.xp, coins: econ.coins, rep: econ.rep, level: econ.level,
      inventory: econ.inventory, owned: econ.owned,
      badgesEarned: econ.badgesEarned, storyFlags: econ.storyFlags,
      hintsUsed: econ.hintsUsed,
      currentPuzzle, completedPuzzles, timeLeft,
      savedAt: Date.now(),
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    flashSaveDot();
  } catch(e) { console.warn('BYTE/OS: save failed', e); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const d = JSON.parse(raw);
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
    const loaded = loadGame();
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
const REN_SPRITE_B64    = 'assets/ren.png';
const DOUGIE_SPRITE_B64 = 'assets/dougie.png';
const NADIA_SPRITE_B64  = 'assets/nadia.png';
const MRK_SPRITE_B64    = 'assets/mrk.png';
const BYTOS_SPRITE_B64  = 'assets/bytos.png';

const CHAR_PORTRAITS = {
  'REN': '__SPRITE__ren__',
  'DOUGIE': '__SPRITE__dougie__',
  'BYTOS': '__SPRITE__bytos__',
  'NADIA': '__SPRITE__nadia__',
  'MR. K': '__SPRITE__mrk__',
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
// Scene background images (base64 JPEG, 800x220)
const SCENE_IMAGES = {
  cafe_main:  'data:image/jpeg;base64,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',
  terminal_7: 'data:image/jpeg;base64,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',
  corkboard:  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCADcAyADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5Aht5ZScAgjj8fep/7OkPQ/y5qzZeX9lk5IxngnqcVjl2JzuOfrWerZ2yUYJN63LbWUinLMqjGeW5H4Ugs8gss0Z9Ru5qKKGSSRVGfmxz1q3caTMgXym80nrxjFF7dRRi3qoi29jbSoWa8ZCDggpgfqaf/Z9sFBa8Kk9AEBz79aZHpUzglpFGDggEHHuckYqaXSDHCZXvk2DjI5/Dg1Dkr7m0acrfB+JDHZ2jDH2l2cEghVHb8akg0yKcAxzyY7kxgD6dahis4X+5ePjsfJbFW5NDuI1BjuHbf90KpG79aG0uoRpuSvyX9GDaNGMAXD9eflFB0Zen2h/++P8A69INFvNp3zsrhc7M8/zqODTboxOWuHicHAUnhvxz+lSpX+0W6dt6f4kv9ip3uH/74pyaLblctdSg+gjB/rUQ0qZogwv49xHCgk1KdEuQm/7U2Pof8aTl/eKVJ9Kf4j10S2IXN5ICc5xF/wDXqGTSrRJvLN24JXdynQUf2VdtIAbpznksASB9eahFhMLpoTPJuH8SjI9u9NP+8KUbf8u/xJhpVsT8l6W7nCc/lmibSvKb57hlBHylgM/zpV0lyqt9tJDHjAyfr1qQaI74A1BTk4GeOfTrSc0vtFKi3tT/ABI20qJU3/aht/An8qkXR7RoDJ9ubPOMhcfzqzB4V1CQ/LcL0znPb86gutAmtv8Aj5mYANxtjLfj1rNV4N2U9TX6rOKu6WnqMOkWaEiW+ZXxwAo69fWkTSrKRA0d87HuNgyPwzT10pGPOpMueQChyfwzmpx4em8sOmpKFxxlSOPzolVS3l+H/ACOHk9qafz/AOCQxaFHMN0d0+wdzHjJ/OnL4eAb5rs474j/APr1Kmh3ceI4tT35/wCebEj9DQ2mXCjLajKcddu7I/Wl7Rvaf4GioJb0vx/4I5vD1qxwl3Kp/wBpByakHhu1HIuJfxUVXTR76bLC+KKCMGSTH49ani0S8LlJNWKHPHzHB+nzc/Ws3Ut/y8NY0Yv/AJc/iIfDlv8A895P++abLoMEa7vtTA9sii80yazYCTW5C5OAqq7H9DT7HRZrvcINXnZ1O4qY3HP40KpZcznp6B7KLfKqWvqiL+wLdiCbmVcjkbQeacvh+1G4tcTY7EKMUo0fVGdhFd3DRjgyElQD6dadd6TqlsqEXlxKGPVXxx6jnmj2l3b2gKgrXdEE0C22bXnmLf7MdC+HrLac3U4bOBlBilOkXbXAxq8gQ9GZiD9CAeKlXQbuWXEerSSAY5BY1Dq23qFRop7Uvx/4JG/h61UhkuXBA+YMo605NBtApY3j59kHNOl0XUkkdf7SmBx/Ezc0ybStRjsmlkv5sDqPm3YHoKSqN2/eF+yiv+XX4/8ABGroFuxwl5Jn0KKMVPDotm6+XNeyAk4DDaM1DY6Re3IRl1CZS3AVnOTVweFdZRlH2ycMeVxk8e/NTUqqLs6tiqdFtXjRv8xjaBp6Abbu4Lk9SF2kfXtUiaFp0bss1zdnPTYUIqtc6HdxzGOXULoEkYG1jzSyaTeYZIbq9kWMfMQSP5mp5m1/ELUbP+D+JMfD+nsh2XF4D2JRMfzpo0DTXkEaXN6rjknylYH9ajstF1C5lURz6isjcBSDkge4rTbwRrwzvvJggIJJkBx7461M6yg7SrWLjSlNXVC5WHhrToR5txcagyE8gRKM/TmnxeGNPwGaW/Vc54hTOPxanL4evbgmGbV75XjPfJXj0JNT/wDCNa2BtOrXYB/2ic1jLEW/5ffh/wAA2hh10ofiv8xF8M6IzsI72+TaPuvGm7P59KD4d0SGP97fTSMQQGEagqfpu5pieCNRkbIurmRl+YbQSR71b0zwhezSP/xOZ4pOhTq5/wCA9cVnLERSv7f8P+AbQoyk7fV9fUgj8MaWqLKbq+RH+4whTGfT71PPhjS/NCT3ly8JHJwgYH6Z5q5/wgeoPbNcR6/cBc4DSBkXPp1pIfB2qPN5Fzr92CDhgGbb+DFsZ+tZ/W4u7Vf8P+AarDTWjofiv8xLbwb4Vld/9I1P5eikIpP4E06fwt4SBUQXepg52viBD+HWrMPw8v5blYpNXuFBG6MmUHp64Jqrq/gfU9OXausykH5nAnOfyBzWUcVCU7LEMt4dwjf6siey8IeGQoM2oapBEwJTMcWT+GaF8J+FYnIbVtRKN9zZAgOfzrNttB2yiS58QXKlhhH+dM/iQavDwVqjHzU1a7dW5BLPj65x1pyqOL96u18v+AVBXXu4dff/AME0U8G+FmQMt9rRz/0ziFVpPBXhV5jH9q1kAHljHEM+3FQXfhjWbULv128Ve7GVlA+uSMVPaeGrp12z+IdSWZjgCOU4HucnJrH2s0uZYh/d/wAA25ISfK8Ovv8A+CSP4L8JLHtjvNdUjkEtH1/75ptr4G8OPKUfUdVZSeNzIg/HIqJvDdzubZr+pyKo5/fc59MAmptO8FazcQrLJ4ikh3H7puHOPTkUOvKMbvEP7v8AgEKjFtJYdfeWIfBXhcShfO1hvTDxYH4beavy+DPCEkKbr/Wd4PIaGLkfUVX0jwFqNyJDP4mukwSU/fMAU9R83NUtS8L32m3CxyeJtQYOMoyl33D14Nc7rOc+VYl3Xk/8jfk5I3dCy9Uacfg7wYHCtfa2E6H5IcVJceDPBIZBDq+ucdUEERJ/UY5rJi0ma5fyofEmoM/9xvlP/oNN/wCEJ1cp/wAhi9V925SGdsH1yQM0c0k/fxLXy/4AOzXu0fxRoz+D/CG0+TqWvAg4bFrE5PHsab/whPhXYTNc+IQ56KbSOMn3HzGsyXwzfxHym1++STPJEjZY+mC1Wh4augkUkfinU1eMhmfzTgfQZ4NVzyS/3h/d/wAAVrv+D+KLtv8ADvwlOHzq+ry5OVGyNCvtznNSReCfCcO6M6trbgcbSUwPbisWXw7qhiMn9v6hJk5j2S/Kw9ye9NHgjXJ5EmfxBcRFiCWeXaoI98jOPpQ5T+1itPT/AIA04R+HD6+q/wAzWm8GeFI3Jim1ZgBliTGB+RBqO58HeDId7C/1WZuq+WiYx6Hr+dV08G6vKvlSeKbgENt2lsEn2GckVSvfDUtrMIG8UXryn+GISOfrwacKjbt9Ybfo/wDIJ2Sv7BL5r/MsXXhnwmpQC91WJGUAho4ySf8ACopPCXhvyysV9qIcdpLdCP0NS2vg2/u4neDxHfSbPvDEgI+oNVH8H6ywLpqt8IcgLK0pCse4HOf8a1jWV7fWHp5f8AykpWv9XT+f/BA+FNETj7bfBx1zbr/jSzeG/D7x7YtXvw4HQRID79zVa48K61b3KxyX+oyRtwXSXleeu3OSMUweGLlroq2vSpHziQzEkj1wP5ZrdTvr7f8AD/gGOq932FvmPl8M+HigDanqi8cEwLyfXrUI8L6MOE1PVDzgEWiEE/8AfVWE8GX87EW2tXMqjo4ZsEewpkvg3U0yDrdxgdRvYEn86pYiK09v+H/AM3Sk9fq/4/8ABIIfDeiOds13qCOuckwpz9DmkXw74ecEx6leyYPOIojj/wAeovfCd5a2jTSarctt+YJuIOe/eqWnaLPeNvGq3kTsxC7yQSB+NbxnzJyVbT0/4BjJcslF0Ff1/wCCOn8P2CYKXd0VbkEog/xqH+wbEZZr27VfURofwrWHgjW7qI+Rql3cAsAcOWA+vNMfwdqlmWW71W7hCcBkJwT/ACoWLht7bX0/4Anhaj19hp6/8EzW0LS2Dol7fE5GBsQHH9KiPh6xRGVbvUOe2FxVuLw0cSSf2xejZ1+Rhu+nPNMk0O6ZY3S91YB+AqruP/oVbKt2q/h/wDB4fq6P4/8ABKU3h23WNzDd3rkdiFxRbaDZvEGlutQjY9R5SHH61pjwhqbwmVL3UQg+Z/MOwgY64zVSbSJAwkOs3bbcAOImdfzHBq44hTVlU/D/AIBlLCuDu6Nvn/wSCTQtOyFS9vpCBk7YVJH15qBdAtHl2x3t3vHUeWuR+tWR4eZuRq8ufoc4/Orb+HGjyzawwXb13Z7d8Vft1HT2n4f8Az+rc+ror7/+CZdx4dtIl3Nc3jlugWIMT+VVJdJtop9nmXzDGf8Aj35A96100q1nO4a9dZY4x5bY/Opk8MyNCZP7ZlUNwu/jPt1qliVH4p/h/wAAiWD5/gpL7/8AgmLHo0LAA3M0bdwyAfj16UPo1oSBHcyY7sQuM1otoE2GJ1SRgONwG4fnnAqGbRXEio15cgd2Kgge/WtFXT+2ZPCtf8uvx/4JWj0GFm2i7bPfCgn+dK2iWp+UT3AYDJPlZBHtVlPD/wAxzrAVifvA9RU8Xh7UJC4g1Odkz13dR+dS66X/AC8/ApYZ/wDPn8f+CVF8OQ4DG6mAPfyhj+dIfD1oAAbyUN/ENg/x6U+XRdTQ4a9nIU/KASTj1AqDUNOvbQITfXEhYdFJJFVGbk7KoKVKEVd0fx/4I6XQLCMb2vJ9g6/IM/zqrHpumv8AJ9suFfsPLH8s1Yt9MuLpmX+0p1UDcCyk5+vpUM+myw7yLqd1U481B8n41cW9nPX+vIxnBfEqWnr/AMEcNFsduftlwTkf8sh0/OlvNEtIQHiuZmTuWRR/WqaJI2P393nOD8w6VO1uywvKbjUAi8FgBjPpnNX7yfxGS9m0/wB3+P8AwRG0iEciaTGM8qBSHRosDNz168dKitEFyqr9suvMH8OCcfpUstreDISS5C54LyAVXvLTmJSg1dQAaLEWI+0njvt61HdaZbwIHaeUDufL/wDr1ah095FbOoTJj1bg/jUT6XeEBDesSeiljz70lPXWQ3S93Sn+P/BIY7GzkQeVeOzHoNoH6ZqKWxigA+0XIUkHGFPJqyml3bOqregNnGWYgVYl8O6yH++8isMqy5IP+FN1YxesiFh6k1dU/wCvvM77DCV3LdblH3iEIwaalgpG7zRt7kA9fStB9Fuoxtlv2QkYKlGH/wCunNpAhCK+ozAsP4YWwPr6U/ax6MPq0+sLfP8A4JnGwBZgtwrADI7HFI9gAilZVZu4HNW10oShngvzKAe0bZqO80+WNFEZCFOHLSnk+uD0FUppu1yHRaV3H8SxbRqoniGVG0DIAHUHkVgEANjtXVadABb+Y+7fg8txwa5aT75+tVTd2yMVG0Ys29GtkVBP5Z3EcZIP4j0rRHzZVRlh2FUdOVVt0aNsFlBYDnke3bNMW9SO8CzW6Rcg7mPIHrWck5NnRTlGEFfQsykw75J45BGeWUQZH4k8VFbajZi5JgiKqDlslVU+9aGjqL1BLc3x8oucqqhmGPUE/pT7ux06GRrg3UcqRLvO6NVOc9AB1PtWLqRT5ZbnYsNVlBVIPTzt/n+hlW+pp9qk3i3SIH5c9R9MZrUS3OpbI7OTbKQWUBtpK/XPSkaOwkt/3KOpPIIQLz+IpvhqGO08TQRxbsSI5bcc9qcmnFtaNGcVKMlGTumXYtJ1PcfNghcgAEmcEn6019GvWf5YIVwcrmVT9eO1beurJHZTyw5jyAcj1/oK5qK6u1fHny7v945rnpTnOPMrHXUpwg+V3Lr6VqLv5jwIXxxiRQBUkGn60sW1oo24OAsqr+FMtl1i6J+ym4lC/eKtmpxZeIQfuXg+h/8Ar1M6ltJSiaww7esVIW20zXGhZI7OIj+ItdKM596Z/Z+q25Am02JW9fNXkevNOkttcjTLx3hU9sE4/Kq11fX7DEt1clk6BpCD9OazjKUno015X/zNXQ5Vre/y/wAie60q/jljZbWP5vuoZ1LZPbp1p0fhvXFJ/wBH3DOUBkQbT+FNtrfX5Ql0Vv5Gf5l5JAz6f41IbrV0uPs73N2kwONhYg59KTqT2jKIlhlLWV/6+RPaeHtZK/6RahSBlfLnVfm/PpVfUra60yaD7fZxwK5C+Y0vmD6mp2PiJSMHUCT6Zp09vr9zF5U638if3XjJFYqrLmvOUbeVzpWFko+4nfzK0tzo6pC4aPz0JyRjbn1//XU9tYXGp2ztY6b9ojUlPPjkRcn2zis6XQ3tiJZrOSLnhniwM/lWnazeI4Y1itjfrEOVCIduPyq5uPLelLXzf+QKnUbtUjZeX/BI4vDutQDbDp80ak/N/pC8g9f4qmbw7rgwYtKk56jzkOf/AB6phN4oyDuv2x/sH/Cpk1DxLHmSSW/jRRyWTAX8xXPKvX6OL+//ADLjg6e3vfh/kVz4d16Vlj/sVsA5xvTr7fNjiqx029JYy6ROWj6kqmV5+tXG1/W1XK6jKfc4/wAKa154ovds6Nevg8SJDn9cUo1MR9rlS+ZU8NBbNv7hsul600Aji0iY45DOqH8sGrFtouvMgH9h3Knb1SNeR/31Ubaj4ptoszPdog/ikhx+pFLbeJddCsF1GUHqcKP8KiUsQ17vK/vKhQhf3m19xXuPDfiCBGcaTqTIeDGQNo/DdRPY3YtFnn0W+iRTt8zyeAQOmQTjrVqfXfETKq/2i0hz0ZVA/l1ruptOu3tFDXatby7ZAoXPz7cEk1nUxlSk4+15de1w+qLXkv8AOx5nYxhona3cmNucrGM/lUkbPC6rBMkRDEncVNN0iaC2e9jkdF8mQg5OOhOaz3vNLmuS3mkRFyG5+Y+hBxxz7V6cKEq1RxS0PMrYunh6UZyepsi/DyqXuBtHIZg3lkj0xUf9qvc6gsclusxwdzDO0D3H8qpaTq5iukhmvF2eZtADZPPtXWadY/x20EjB3zkvjqe56D6VzYqmsK7Tj6anXg6/1yPNTl66FRxazWrBo5EbjZ5ce36nnk0tjZzTQSRrd3CqMbVZ88e5BGD+FdL/AMIzqlyFeFIJEjJ6yAsT+AOOPeo20fV9OKYsGMj8IIlaQE98nb8v415P1uDVoS1PWVBp3mtDKhstQSWOY/LCF2qzjOWH8+KlvbOScIQrTybgSeFAH8uKvxWGpsJhc2l7b4bEbfZnYkY68dKLTRL1kSQz6hJGjFgZbYx89OvBx9azdezvJrT+t/8AgmnslayW/mSw3YtYUFyoXaQA8ciqT7YK4FTXVre6lNbyJBBDAq/63z03P1IyQM456ZqjqOkyw20pvi88G4AtGi/u/qef5Vd0azku7MTWMjQCPbsaQEnA9hjHTrXNLljH2kX89bG8XKT5JfoQQyL57W8ckKvuZMtEecdSDg8Vora3F5GrLd26xhfL3FTkcenGfrVWcCzuLe3F3bXDO2Xwrgxj16HNTxTSLqKwxQmSBlw0xUqN3YDPb36VnU5nrD+vvNIWWkiDSIJreYQ3d2ZpIm2BhAF8xT2wWJOemcD8aLnSFW/ZnUW90DuCFgdq9AeOg/lWlqKWaypulhumYDfBGwLkZ5Bx+XWteCTQLy3EL6PEEYAl7qEhwQMY3DPHbk1jUxU4+/Z672X/AAxp7DTlsYUVnCLBUnmXaPmGBgL/APX9TV3R7R5w7XFiXgBLR7nQh2HIbHfFSWtzDp99MtlatFbRqFAlQOpB9DnH86rXUF3FqUbyRxMr/MYzHuJ+pFZylKV1e19V/SLSSsyWbw8Jiq3diz7zuZkmAVu+QAMAVKNKm01Dcw2kQjBHmAgEuOgyeTU+nQ3nn3E1tLeReZgvaxmQK+Ohx0x+FbV0iyxR/btPunjxtKMjneT3OB/QYrlqV6iaje67f8C5cVHd6M5GW0ujqruYbEDbuhJAUqevB7VtqdRuNJkN2ZQBtk3wLtHHbp+RrWWyLov9madK7FCpYPINg9ORVGKy1WyuJLabTr+aOThVQFlwB1PHA9qmVf2qtZJrvuJcsdmY2tamt5a+VEpdkI3wySbmb0H3euaZdR27aYWltb/7WW3ERQgup6YDRrjFdLa2L3tuLVfLtWjk6shTcfQA/wA6luNFu1up4YEljsigVybkEA9cnoRj1pfWqdO0Nra7kvV6s56x0dXunjs0jijePdI88qgfTB/PirNzZwx2UsLNZqEADPHL5gPPJHOOnX0p+oyyaTst42WZJeN2Ec+wySMdevvVqOK0msfLe4tflO6VXEWFbHQnr+FE6s9Jt6FxS2RUutMiuijf2NFKEUCIxowxgcE5zmppbO+t7drdbJXDjEYdAwX8qrrez6cpnszFqJ8z5WE+VYdccjAxjtmrMOq+ekjRROLknJcwuPL3fwgKOcVMlW9V/X3DTitijotnqCO8Kw28F0ykPJjY2O3Ucj6dK0HsL21mM93LPKjxqhZbkqoOOeD0FWL1MwLPNq8MLQEMJPsxXZ26E559ap29y6xtcvJc3g/hfLsre6qelJ1J1PeX5P8APQFZaEb+HZdYy9hZy3XlMNz29yjsnfndgY9u9S3XhTVFt4sadMQMh4otibsj+L5gDW18Nrq1Pim70ssI2v7EyCEjDAof8Ca9Msoke1jZlBOwZyO4pVMRWpNR6bnm18XyTasjxZPCGukIINNYxLglJGjOP1zS3XhTWLgo/wDZMbBTwu9CcjoclsenpXs0tq7Y8tQzZ6AY4riV+J/hqLxIfDkltqUF6tx9mIltgqK+cdc9PfFXSrYmo24RvYyWMlLZI49vBuqTRrt0iTzyOfmi+X6EMTmryeFdQj0/yrjwzf3l6MhZkvo41b/AV63dNBaWUt9eP5EEMbSSOUJCqBknj2rhtL+JujaxeS2ug6Pr2qvEu5zb2o4XOM/MwNKnPEVo3Ubpev53EsbOWyOLtvCHi1llWXSI4hnaqpKGDL6E7hn64qm3gHxPb7YlsJLiNv8Alm9yoVfQAbsV6boXj/w7qOtf2ROt7p2oF/L8i8g2Ev025BIzVG7+KPht9Ul0iysdVvLqORo28mFVG5Tgj52FdMamNu1GH4P/ADB16jdnE4ebwdqsrKj6SIJh8rn7RHuPqT8xqJPh5rEFrIBBAsKEuWVo1OMV6zp3iRrq1nKeFfEEZgi34a3j/e8gbUIcgtznFc14s8f6FZodP1rRddsvOQnZJEqkr0yMNShWxjfKl+v6lQryqS+E4Kx8O6o+n/b9PurGKGMncZbhN5xxwCf1pun+G9c14Jd2U0cnltj5rlQy89So5+lamlfDqbxFqbz2y+INMtJ4zMk93GgRgcEAEEnJBzXZWmgaX8NtJudWv9TnaIlQ5iUvIxzhR6k5PsK2rYhw0g7zeyt+buaTxNO3LF6/12/4Bw7fD7xcbhZr5LCWPlVEtyzHB9gKnm+H2sXNuUhhsknjIwol2Lj/AL5yTXaaH8QLjxEk0vh/wfrN7FCwUymWJOcZxgmul0q5upbOTUNV0y40gpu3xzyITtAzuJUkYrnrYjFU2rpJrp/wLmHt5xTUtzyW5+GGtPH/AKPdQ29wAoOJyEz3ONppsPwv8SAqZdWtDhTu+d3y3qAVrpD8UovsWoahaeEtTuLGwcCecyoowxO04xn39s810uleKV1/w5bax4X0b+0zIxWa2a4SF4SBkht3H+IOauVTMKcfeSt8v6+8JVZp3asea2/w+8SW8bJPqNph2+ZxbuWYdh7VVf4Rao10ZzqduuBlcQPkfqK6iT4rEeLB4WfwmItVM4t/KfUFADnoC23GPeu/0qPULi1d9Y0yPTp9xCJFdCYFcdcgD8qVXEZhhvelZX9BSqppKXTzv+p4tdfC24kjIuNWkiXJybeDbn6ksazbrwT/AGDpN7c2+tXV0LVVZreSMKApPJBHtXvF3YSGLaoyc9hnPtWFq+gPewXVo0BC3Vo8L4HfGB/M1jRzXFcyjVl7vov8jVKk/eW54HpMFvf+KNNS8WJ4p2MY/i2MVO3Prk130PgnS4IhILAkHC7o4Qc8+g7V5P4Mcab4ntba6Rt9reRggKTtKuBz+tfV2oWVx5MoR02E8fIflHccHJr0s+rVcJOEYSdmv6/M5sLUhUXNJanmMfhTw40RMmjwP7iyYEfXio7rwPoYVNuhRFXGSEtz+oXvXoLWcCybpA3nAjE2xuAO+3GKI9NthK9y8fmBm5LRbW3HuF29a8COY1k7qb+87JKk1rFfccJZfD7QZIGhGkRxxH5tskJXcfQZNWo/h/4YIPmaRbyyA7TE4QMfwJruYLVWbJhaSXr5ssGCPyUVYXT5fOMoW4OTnGQOeOT06c0pZhiW/wCI/vZk/ZL7KOM0zwl4dZBBBotjCo/uxo35nFeXfHaeLTdcstN0dIoDbQE3GyJR8zEEA474H61658RfGcPhe1azguY7nUnBIGARAp7sPX0GRXgtzdRavq0s1xYvdSSEvLdSLkMSPXvX0WQYSvOp9ZrXcel9b/ecuLxCcOSGjZlx3t1bWv2jdG8zcbXD5XPbn/Cqhk1S9lE32SA5bnccEMOuR/hXreh6P4Z1XRLf7TpdrJcQAxkLGcqN2Qxx2PrWX4x0PwlodnHfT6NC8TyhJNt08ZGe45wfxxXt08wp+1dNQfNtsv8ANGEqE3FPm09f+Azz9rme1JlkVonm42qoK/kOKSHUIpEMU7eVHjPKg9PbAFaun694HfWTYzaDPbWS/KkqXryMWzxwD0/Wu+h8G+FLx457c3U1vJH8qJcEoT/eJ6+2K1r4iFC3toNX66f5smmpTb5JJ26f1Y8k1tNIaBfIQPK5/wBZGcc9yff8KwpXhsbbAkZw5OUL5OPxr3V/h14amd/PtpmjzmNRM3y8c5z1qIfD/wALws6nTnIcjCrIyjH1zmnSzrDwjy+8zGtgak3zJJHi0D6fZxF4GufMK8iNRk/maIQ16dv2qdGU52uOCPUV7fb+BvDMRYf2SgBOSyyvuP4k8VFr/hPTEsd2j6LbSXJfBM9xJtVcHnAPJzjirjnVCUrJO76uxn/Z80tWrdlc8mtII4Yli2K+0/eZRmp5YWeZYwxjlGWyMDjoece9ei+FtGtotQ+w67pWmojxs6PFNJG+ccfKzfNk+npXnPnaXcyTC8SNJkfY20ffI6HHrW1PE+1k7Lb57mjpxhFJu1++hXiltDLJbt5ZlDFBt6n1OcDildpCrWySXwDfdZATx79BTnljh3u8iwwcbNz8/j6VC0sReFrdZLhydyLGC+fqPSuta6owbsrNjY5bgHzg+Fj+VlLqxbA68E9+1RT3txcrtjaLLHH71doOPTFdXp/h7W7mB7y6FqloF3Ky3KnPHIIXoR6HFVhDAqPCu045OFyP++gP61isVScnaza7GrwdXkV20n36mCQ6QDyDKfm4CNtU/n2pDELmKQ3ELoFUtuZiyH1A6c1cMFjG4idWk3nIMchf68Hp+FVXWyScR2yvFtBy0gbArojNS2T9TllTcd7en9IpbWGmv5OdwXA3DocVyDcmu0sAfsjBxuYKxNccoUsN3TPNelSerPExsdIGrpyNJaB2kMQ6AqTyB/Kp7Wa2QOpeGaQHO9hlj+NM+yCBklgYNFImxgZOgPfsD+FTQ2lqFKRRrubpn5sfkamUkyqcJxsV5rKOWXzkuhEJAWHbB75FWbHSonSSQEXTrwVduFPrWmYbpBCscShVBD7myD6EDHH0qsryecrs8iur8qIwAPcDJrL2jktGdSw0Iu7RPGPNgaQMixoPu4PX2qLw0ySeLLJYowvLqORgnb6iq84vZCyLZh4yeFdhtH4A9a0fCdk8fi3TEMKxZZt3l5wDtOOTUVGo05Pyf5DV51IJLqvzOs8S22zTXWSIAkc8gjFcgERCAueDxmu88XWa2ujS7fvn1bJxXD2glaYKFZpScKB715uX1eak3c9zE0rTSsdP4FAaC7OBkOuPyNaevRhoYs6mNP8AmPzc/Nx04rEsLfxDZNIkFo0e/li6BgSPxqtrUuszxouo25VYzkMIto/OuOVB1cRzqSt6ndCpyUeVpm1p93YWCN9p1wXuemVzj6YGaxvF+r2moCCK1td4QkvIy4Lew9u/NR2ul3N3Yebb2c0hzgMqjB9ajfQ9WjRnk0+ZVUZJIGAPzrelRoQq87l73ql+CMqsqsoKMVo/V/md1okajRbIs6rugQ4Y47fqfauK8Rll8RXLxuwZXG0g4wcCtbStV8TfYYvsNpE9vCu1X8ndgD15rFOpXP8Aav8AaeLd52O4jb8oPToawwuHnTqzlo7+Z0VailCK1XyNnRbDxDdlJp9Rntoeo3H5z9B2/Gtq/wBatNLjEBka6uOmwNlif9o9qypNW8SQ2Md9JZotswDea1vhcHoc5qW51PxDaW32qbS7cQHGJGtuDnp3rmqUp1Z3mo27J2/Q3g1Tj7rfz1MDVtavdUfbM3lRA/LGnQfX1rU0O18TaiFFvdSw2y4HmvgLgenGTTTearrjLDDYRytEfMIgh5/H2rWGteLDcvaxWEfnRqC0awcoD0yM8VtWlKMOSEYp+b2M4QUnzyk2as93beH7Jf7Q1Np5COPMILN/uqOgrj9c8T3moiS3hC29seCoOWYe5/oK3vtni9j5knh6GU/3jZk5/Ws6+v8AWtVaaw/sS381V2yLBbYdee/oa5sLSjCXPNJvvdafKxrVlKasm0vR/mVfCehy6xdGR1ZLSLAmf1/2R/niu9v01G2sXi0i1jnfbthRRjy/c5PNc9pd74q0zT0t7bw8UijH/Ps5z7nnk1g6hc69qutMs0N2k7L8sEQZcAei5zSq06mKrXlKPKvn9/8Aw5cGqMEkndnpthFLeaKkOrWKrMybJkbkMfUYNeaeKfDsmkXpSVmNrISYpO/0PuKm0++1jQL5JpRcpJtOYrjdhlPsTWlq+r69q2ksLvRozan5lnETgL7gk4qMPQrYWreLThL5fcXNwqwtJao59EUtGpO0blA59xXtKWqjTLeSLnbGAw34GO55rxu1jZpI8kFS4GAenIr3CxUGyiBYkCMZA+lcmdzs6du7ClG1zwzTmhurrU41jTD3Dkbo8gDJ71BF4e0W8fMiylQMlYWKjPsCOBWr4MvLOCC/MtneS5uWHyYxjPcEitXVtXtWthFZ2d3uJwJAFJH8+PevaqYirCq4U0/W549LDUqlFSqWfyOfttH0fT1jki0+Z3LgBmcuOfQY6+9dGtyLKxMbJsVVJVnIVi3cYNVzJp7pFK9rqTSFgHjiYpg+uemPfNZWsi4NhdNDapsbCAvl5U9w3AxwecVk74iSVS+/X/hzoilh4t00vkv+AejfClLjXPDby3F0yR/bC7JHJtYhcYGV7cCuzvNThtNQg09ba6mluEZ0WIDaQuMgkkAVzHwmha3+HNsoVS8zyEuF54cgc/QV0t7JqMaQJaajbQBkw0csQcs2eCOR9D19ua+exnK8TNdE3b+kaUXJ003uW7DxDaXFxCsV1eRpuEeGs5FBZiVX5yOBkEela0uv2VrdSWl1O+5U3EGJyMYz6HNZVtHrz23mvrtj8ygRqsCsm7Pzc7s4xgDv65qQPrNsXMmt6cnlru8vyBkZbjf8wONueRjmvPnSpN/1/wDImyvY1G8RaYS4Ek2I0Zmb7O5ChcZ7c9R0zT/7R01Lhbe4u2jnYbgk0RRtv97BHC+p6Cqdhd60dQVb+axNqRhdhKsTu6jHYDtnrVl7C7uLw3FprFuLdnQNC0KtlADuBbBPJx+VZSpUlK36/wDADbcnvr6w0+9iSeZ13xl1Kxbl9Mkge9cv46RdU0x/sOu3EDqhOyG3JPDBfmAGRz644rr107WknRodYtfsfmZIuYMvj+6GBAx6f1rQWxv11FGGowy2SjMkUiZk/wC+h+HanScKclJbr+uxi6sV/X/APFLb4c6paXEF5rHiZbQynMbIjM8hHQA46+g616f4ek0TTtMjsftJZtxLPLGxJYtgknHAz64rdhS4k1L7Q99pn2CF2BXZl0OBj584U+tWJdO1hXuJbbVLf96w8mOSIFEXHPTljnvW2IxU8Q/ff3afoRLE3XLJ/i/8mUYLuwSJWMkz28rhY2a33K5yeFwM9qYk9pc3jDT41uJIW+dXLJs5x3Xkj0rQSy12W3YnUdPMzR4V4oTgPjrgk55qwlprB06Fft0EVypHmyeWGVwDyPbNcbpwMnWjF3v+P/AKEWu6eQMXR3Ftu3y3Bz+XsakXW9ODHzJ2ADbS3lvjPpwKtLY62kTAanZXDNuI82Dpzx93rgcc022t9ZSdJbnUrGVChVoo4ygZs8HPJ6dqfLFEOVN3/wA/+ASvquihNpu9zbN+NrE4xnpj0qrBr+n7BulnjRohMJJI2VQpOBknp+NaqRSecHeC3Hbcud2Pbj1p8iwSp5bpG6HjawBBx7UcqZgpwWjT+/8A4BkNcrLZtdWym5+Qugzgv9N3r614tFqdpqyq9teo4LHzY9j/ACE9hk8478V7wqWV20hgnjZo22P5bA7T6EDofavGNB+H066zfb3tFVpXeFkkYbSWO0Ebe31rejGnGEnN2fQ9LA17SfbqcZrfieTw1rYe8trnWLInMiJIkWMjouBnHTg1HF440nWtShtdP8HfZbXGJY2VXkJJHzhtvGB9c16dB8MZmtWF9PYXMoycqDl89sN0qHTfh5GsaXItXtt3BhkARlHocBsD8a9SOPwkaXK6V5bX2+elglFzr+0VdqPb/hzMubO3+zxNBE0PksATvMoI9CFAFapure8jAgSZ5YwVY2e1yp6ZbJ6V0enaHqcMCQNe28aqm1erlT2P3RmsbXPC2m2csl3rHiKEXUpymRtDqO21VJ/L868FJ1JWl026/wBfeek8XBtJPX5swIoLbW5mEkLy+RLtmllwCGxwMAn2q3eWNzbyMbdSE4bbDbKyj2GcHP8AOmWXhiwuxdatofiG3kurZQ8i26SRuR0GQ3B9MkVXl1S4ijuI764VAuQEFsCxbv8AjXTOnPmSg9OzX9foXCp7S77f12H+E7dP+E20zV5jLb3UFx5JDMi742BXmMcjrXuC6fkH59p3deuRXgdgo1AxX8MSSG2YMktw2xhtwRjGcdq+iLCVLmzhnRuJEVhzkcjNFb3mk3qtLdjxc3TpyjOPUriGGNtpJZgO9eO+P/hddan48fxNZ6xpVmjSRzJHdMw+dMZOMcjI9a9nYKsr+fJGM/dHUivPvjVFbN4SW+KvMLOcMyhRkqeOKvC1Z0p/u3vocWDm/aJX3+ZJ53iG9VrLV9f8IGxnQx3At2ZZCjAghSzYB+tcl4W8FP4O1me98O+NdBKSoYmTUCG+XOQPlbk+/FeZR6np140vkWc9xL0HmqrFB6DoMf404aYkrrJuWHbghB2r040Z004t2T3VkenGi0nyPR+SPT7Pwlp934tHiLXfHGiGQXIuCllIqhnXGBlm4HHua0vFGkaXq9/cTrf+BJomfchuLcGUDtlkcZ781440cdjAgbT0lycZjHTnJzkYA/zmsGx1rQ7vxXcWl5HqMaxxEoPPKRsR1ICjPTnOe1bQwtapeUJO0V0S/K4VLwlFznrsu35HtPw+8H6T4U13+2H8d6cV+YfZIJhHG2R91tzHgdQMZ461o/EnQPCfjG5tZU8Z6ZYPAjKStwp35IOODz36+teDapqmmNGTpGvTW0iY2w3kfmI//A/vDtWXbeK4/wC0PI1CCJXIKrLC++MkfxeoPH61vHLMTVn7dSfMvKz/AOD+JzSr0qdRSdSz76Nf162PrfQdb8L6VollpU3irTJntoFhMomADbRjOM1B4o1DwNr+jz6RqHifTvs864bZcBXBHIIP1Ar5Zm8WacgQobqSdQSd8R4Hr1x/jQfGemzoLe4Z4Y8HA8nlvYYJrBZFW5udXuZ82FUr+11+R7T4U0nT/ChuV8O/FrSra3uGDPHcWaTYI6HO7GcccVu6s9jq/h+60fV/ijZyNcOpMsFose1AOUwDyCcE59K+cbjxTpMEQeCa8uZH+YxqNgBx3z/TNTWWr6hdsjXmow2Nu3Kxwp50hHux4HHsa6p5XXk/aSfzaV/yuP29Fy+O78uX8/8AgnuGkaF8LNM06Sx1HxXLqTyOxmZLma3RgeMGOM7eP1qPwNB4F8H6893pnj6eS0lyJbRrcshXPy5IGcjOAeteG+IkisriwmstU1S5kmlz5TvuEijB4xgAdR3rppFiOnNOvCjG5SQpD+nXJ/LFRVwk1BOVRtS9P1RtTvUlKLb080/0PRPENv8AC/WPGQ8USeJ7mC+WeOZVghO3KY5OUzztHFelaL4v8OeIb82uj3v2qRV3lU3IcdzgivmiS8il00kqscq4C4TBkHsAe1b/AMFtUFl8Q7Dc7YuCYWUnjkcVy4jAudFtyb5Vpe3+QpwjdK/TQ+lo7aR5CNhVB0JPJqcW0anLKWI6U6SdIzjknvioxPEw2yIW5yOK+esjivUZ8p/EzRr7Q/iJq1rp8H+suGuY8qo+VjvGCfTNSr4s8TXmnG6t/Em+837Xt43Xeoxwf55zXXftOxW1nqWna59gM6TQmAsGK8qcgehOD+leUeDZ9H1O8mTVLT+yrWJfNF3CwWXcONm/acDDZP0r7CjFYrCxrThe3kn+v5HXh6kIzUG9+l7fpZfM3F8TeMo2k+2+LL+zCLnc+HDew2g805vEfjuSASQeLL2bcuVB+TjH0qpr2l+CWgN1Z+I7i9ukcKYLibeCp9CqjBzWzpeg3trDbSta281mGy0McjozL6g87fxFTOWHjFT5Em+jgl+Z0RwsZzaV2l/eu/w0DwXL401XxTb2up+MNVMEscj7FuSRwue3H9a7C68IecySXOu69MkgZizzFo0IPAP17fSsj4WwWs3xRP2V7uO2ispZDazyJKYyQF5KcdTwOtelSrDDfyL9lvXWb92zKMoABnPt1xn1FcGNxVSnWShZadEkRToU1dWe/U4S9+HtrEihp7+7807f3MSN/wB9biPzqgngZoQsNtaalGo7PFEij6fNzXfXtvDYrGs19rNw8p2gwyEsx6gAD7v19OpqhALa1tZ0Sx15t4PMoZnz0wjE/KfyrOGY4lx+K/y/4Yt0ad9rFa002XTfDy28NmTLgfunwjMw9SMjNVNQ0u8uYXt5tGF5GQMqsq7enIy1blrZrBoMyLaamfOViIbicPLyvTOTtNZTWIjitlfR9aBAzstrshY/r8w9ORWNOo3Jyb1v/X2kXLZL+vyOcf4f6dGTKnhlEc5wsV4qHv6jHp371s6NpEun6dthsxbyqpAjaXd79frVx9PVJLQDQ78hSwMhny0IIGc9zn156dasPp8ekIkel2ks6yufNVpySvHDfNnPNb1MXUqRUJSv6vT8ZMiFGMHdK39ehmQXOqs6I+n22SmWAuRuB74Hp2pZZNTDtmys441PzSPdcKPfjqKjWxQI7TeF4lkkBztu05ZuuPQnHb8Kr3GjhC4/4Rq2aHH7zdeEhx36jn8ar9230/D/AOTFaX9f8MPtJ9Sk812t7BwpOY4ZtzKMDHPTJOau2mZLcG6gWGQnJjBzt9Oe5qaO2hisDJY2otJdnyxyHjgYGdpIrLY6vKztFHYyuAv7sTlSuVzz14z+lS5Kd7WX9eth8rjuX7ixt7kIPJDqpzymce/NfOVxH9n8YXKSQiURzyIRyCOTg19IeH5L7j7bBCof5WAO7j2avBfiDYwWfxC1NZrhkg+1MyoB1zhhzxxzXtZDUtUqUm+h52ZRfLCa7/1uRR3OmW4CXICySNtAk+fH9BRcIzrmB4IgTnGzb09weaGsodyTW6sQT+7ICkDI9ulWYT9li/eae87HkOXBK+xAwD9a9ZuK1i7v+u5MVN+7JWXkZUOnQxhoJfPbeMmOG5cBx1wahLPuNrDI0EcSnfH8x2j1H8s1Z1qcyxp5C3sQByxDYyfTA7VYtvsjRl5Vm3EAMOSSfwro52oqUle5y+zi5OMdLfIzQLy1jWGIxMzYJYlcH+fNWJ55A4jWFNjDDMSM5/pVbUvJ87yYGjMZALGcjg+g7g/WoY0M0sizESqAEZBgbgehrZRjJczMXKUW4oNNUGGXjYSu0gjB+tccR83XvXZ2AQmcyMS/lYwfpmuLB+biu6juzx8b8MPmdRpiQvbqnkLMpTGMbsn647Zq3/Z9qJjDbvEsmM8Q9PYgVXsXb7PGhnlKxnhhgde3TpUyvs35hiaTs+PyzWFTmvdM7qPLyJSX9fIYu4HyTfFPm+UAiPP51c+wqLsXErCRNmCYzlT/ACx9RVWJIlnEs7rEHwGbHyqf6Vcg01rvzJfskssaHaZOqexGDWU5JdbG9OLfS7GXFxIl4lpKGEGMkgEMPTDdMe1T6Co/4TbT0jllkXzTgu2R9z6U11eG6iaWSSYk4PmMAoHvxkD6VPo/kH4h2iQyo+GY/KSQPkrKb9ySX8rNWnzJv+ZHYeLUB0O4f5s8ZJPWuH02VYr23Z2IRZlYktwADzxXd+K8JodyGb+EY59xXnoIJyCD+NcGWrmotM9WvK000dh4rmsNVWEW2qWaeWxLbnIzn6CkttWsbDRGszdG9kKsBhTt57ZPYVVi0XTPsEUzXLSTMgLRrOg57gZqrqmlR21m0qWV+pHR2dHQfXbWMIUGlS5nZPyX/BOiU6ibnZXa8zb8K6jp9t4eFvc3dvHKS/ySNjr6+1Zd1Hbm3lAk8PoSpw0U0pf8M8Zp+j6Jp11paXNxdOspydiyovfgc96fPodtFavMthqj4UlSssTr+O05x9KS9jCrJqTu2P8AeSgk0tjT8HapptvoRt7q+ghlLPxIcdRxXOy6NHFaPOuuaTMUBPlxzEu30GKu+GdF0/UbSSa6ujCyvtADqvGOvNXV8PWe0vHZ6rMoPWKWFs/kaXPTo1puMndvXYvllUhG6Vl6lrW9U0+XwFDYxXsD3CxRKYw2SCCM8VF4L161FjLomtyotuyERytyNv8Ad/qK5uDTr26mfybC5lSNirBYidp9DjvU9hoeoXOqRab5UkEkgJUzqU+UdT70SwtCNKUHLrzeaKjVm5qSXl6nW2moaH4c0KdLC9t9QvpWO1oz+WfYD9ap/DrUrOLV7651S9jhM0Y+eZwNzbuafJ4NhtzHE73d1Mw6RvFGP/Hzk1ja7o0em3cSS29/bxN94yBGP/ASDg1y04YatGcFJtz69f6+RtP2kGnbRHU61cabcahJNDPocsbH5Xk1SVHP1VeB+FV/AF5p+m63qTXt5borR7UcS7kJ3A8MetUND0TRtSuFhtYtamU8NOYkWNfrTda8P21rqtrp1hqCXM1wwQIwGUPuRx/WocKPK8O5PVfgvyKi539pZG9Frnh4+MJXuEdfnHl3a3TGJjgdV6AVjeO555tXiuYtQsrmKMYhe1Yb4+c4I6596saz4a0bRI4V1W6u53lz/qEQAY6/epdd8I/YtKi1LT7ozQSbPklXa3z8A5HXtUUpYaFSM4yeqsr7P07GjjNxcX6mn4R1XS9W08x+KWsnltpAYWuH2s3ufX39e9c54x1i51fUJIBP5dnFIVhji5QgHhj61rar4UsdCsYrjWb26keRtoS2jXG7GTy3pRf+FoIdBXXNMvJZYCm8pPGAwXOOo7+1TSqYaFX2sXo3Zdk/L1KcKkly/ecvZCRbiESLvPmLz0xyO1e6xRkWca27HmHfnG7OF5/KvE4Mm6gOM4lU8j3r2aa3SXSEkWRjNsChVbGFKelcmctOVO/mTFNRZ4j4TN/cPNbiNPJmldI5GIzuJ4BB6jnFdVBYX1ksdpc6C8+FA3pkH6/KwGfoK4TQBc2t1pYjZ4hJegkA9fnXrXtsKyjDDAOSQdvU/wBa9jMm6cr6Wfr0PHwVS8LLdd/M5xtB12S3MumaFeZzwrZ2n3yz5H4VieJvCXjO6ht4ZdGc5BdtijPpgEmvXNP1wNHJFYPaPPG4E6SZwvGccdDVuHXdR1GMwWT6SjyRllkjumkZB0Dbdo75rxqeOrUZ8yitO9zrqxVWPK3o+xn/AA4uLGx8CaL4anuETUEgLPbj55kJdjyFzjr3rWeysDdCZBazXCDypllwsvlHkrhvX/8AVXkt34D8UDUpb5PElit4WZ5it7sdRnrlhn9a7rwLoeo6Ak99Ndi8mugI5ZnvCQydQQ2PXgfWscZRpxbrQqpuXTzf6DoyXJy8rVu50ttovhXz1dbKyVguxdrbeBjA69OBVnVdE8M6m8k17HZNO2Ms0oySBxnmq1sbjU5wbzSYbZ2YENFqylio9AuD06jpV3VdI0yNebQ3fyEMHutuB2A3HAye/tXmSqyjJXk7+t/1HfsUbbQ/C0ZQyW2mMyjJzKCCc56A8c1dh0DwjJsJttP2BQqqr7QACSO/qTVn+wdG1Mo2oaKNOVQUCpNGquOOcp1NLb6FpdpJPFbeGbgpuJLG5jdT6Eb2JGfwqZVHa6m7+v8AwSPbXdti9e2+hXljFY3IspLeIYSNpeAMY9fSpIrTwp5CwSppyH5iMzYzkAHJzk9BVWLw1pV0CVgiifJBUMHx+VQzeDEOQgt2GeBhlP55rL2jW9ybU5ac9ie41bwXp9rcWU+s6MkEkhMkIlLlm46gZOcgU6wufAWpvmPVNJlZXL7DcGNg2ck7WIxyB2rzHXfCLjxJJKZDGqzklYWDbB6sCRnvUEvh+yuLwQQakok37GEsKqcdCepJ9K619Xa0k77+n4G6wM2rqbPZgng6RHgL6eycEgTjnAI6g56E1I914TtNOk0sXmlpbn70LXig/jls+leEaxpEdrpV3fRXllmBdoQKQd2dvJ7joa87fRrxrl5jJazPIcv5yZLfjiu/B5fDE3ftLJeXU4cXh5UWkm31PrRz4N8gh59M2soGTfL0AOOd2e5qFdK8LylZIJrMqQRs+2fIQQBnhvQCvk25068+xGSWzhX+EpGVYn3xjpXuvhjwDPP4Z06ULbKHtYmGxsNyoPpxTx2X0sLBSdS932/4JlRlOUmnJr1uejQaX4agneZzYqzBskXZ4BGD/FUsWleFoo41j+zqqP5keLs5De3zZ7V5drXgG8R0CG3kRcn98cYYD5ceo65qnbeB912Pt0EcBTJV40Dke/biuKMKHLd1f6+83dGpJ6Tf3nt9kunWkUjQLDbo7mRiXUbmY5JPP865uARWl5d3FzJFCiykDJ9W4/OvN4PB16xku/JgubpDlIjGCsnszE8ce1dvoK6paadHb6hbaXCx+by5rklgeMY47dfyrnrU6aS5JXHToule73OkS+sjjfcQHIJAMgGQOvftRLqWmLuRbi0XjndOOP1rOW0H2N5207TBek7U3EBGGfXk4xUcsd2IuNP0WSIncZGchBx16c1gkiXCLe5qwyW84zHMkjHldrg8Ci6tILhNrIN2MKxUE/Sq2nIwuLiQQ6YJiAA0Up+fA4VsjIHPatGyS8NyJZRaJB5fKxsztuz6njH4Uct2RKfKYes6Db23hPVra3ttn2u2kEjRKA5O04JPf6Zrw3wZb3FxZyW86yp5W0Y2knkHliMgc+tfTF8PMtJUDjDIVIx1yK+WvBVylrrVwobUhKo+4su6NtpwQeeRivTwnNKhUXazOrAVG53e50NpqEek3c1vMlsiTqI186AFQ4zjBJ569K9y8EvPe+EtLuHmw8cPlucYOVOOg4HTpXkUsi+IbE6TaaKsUZ6osQ4weuccc969Q+Elrc6b4XbTLuFIZLe4faqsCNrcg8Adea5arjKPvaS7afea5rf2aem51wIVBlzyOuKwPiFpw1HwRq1umdzW7MpXrkcj+Vb7jcpAYqfUHGKhkhjmtZYlIcSIUZick5GOT+NYxlZpo8Gm+WSkfIE9rtYyyTSFlPyptzg+/wD9YUsF5NbYna3EkKvnKkZTj0xXplv4HMgkae7C4kcLtBJxkg5z39qhk8B2NqGuJXlvVT/lgCEyvXk8n8q9f+2cM3ySd2fSuhreLPOpbpLmUzzwsG2/KWBwp78A+lcN43uYGvoFthAwTMhbO5g2cbSfp616h4h0i7uJj/Z+iXFkJk8xSse9guMgg8ivOdT8FX8U73Jmmh80lsvBt3D8MCvocrr0OZTlK3l/wx5OaU68ockI38zmNOsL2/YtbRPNtycnGP1rok8GarNp2nXW6zkF7JsSNZsSQHP/AC0XGEHrmrWn2viOzCxW11MQq4+Ta24em3bk/nWlp15cTajEmpziVSRuSZPNVj0wUIwB/L0r06+LqXbptWXzZ5dDBU9FNSv57GbpXhLUtX16XR7CIXdxCGNwlu6yB1HZXBx34NdrcfCbULP4U3015pd/BrqzlooraP7Q0qADapA+4PvEke2a7/S4fh1plzBq+nDTdM1kQsymyzIVBGCfLGQfTBFVW8X+IL3VJ7CbWXttMEfzXr6U4Z92RtC4+Xtkk9+K+Xq5zi6817JcsY2bumm7b2tdNP7z1YZbHld7X1XX/I8D0vw2+rWN1c6XB5htYszI7KmHxnjJyx69Aaqazomq6W8FuriaaeETBLOQS7R0G4AZB9jzXqfja1+HOiW8tz4fv9O/tJSRJFNF9oZmPUAEfKc+gry5fE13bXbXFrLsdjhsxgAfQY4zX0uBxdbFJ1IRfL2kmmeVisPQopKbs/IqR380V3YxXgmCWrqSZEKuozyMZPH869LtBbapYxXdvbo6feMkkm0c9scYXp715Rq1696D5vlMxbgiMKfxxinW011FtWOe5SMHcyLKVyfbg8V1YrAuvFNPla/ryMcHmCoTcWuZP+vM9fj06CLbLJPjYpxjgKfXNQ2L/Y9QtbpJXzbSpIjqm3ecjJ681D4IsbO8SOO7W43TFAHhujLgHuwJ4rptb8AapbziPT4Tdxtk7jKufy4r5WtWp0arpVZ/fZI+pgnOCnGJ9HROtxbx3CNkSoGB7cjNRTQTtGyKIZd3Z2YY/KsL4e6m8ng2z+3gx3FspgmTqVZDg/XtXRme3jHmGRAGxz618lNJScexwOMoStY8s+P1hczfDwyPF5R027SVZEy3ysdp4P1FeF6bdw6ddWo+y5bcMgqFLZPJ3H+VfVXjKO31vw9f6IxV/tdq6o3owGV4Pvivj24VpojA9ncb4nIXFsA/uSw9COlfVZE41cO6T2T/ADFKcqb57WZ3muXDTy7bQRWpUAfMocke9Y0mr38VxDYSXIm8w5DEkALnngHtitDTbiZdPtIotPuwhiy8gs2OW9Dwc/hUFu14boyyaPdLEMqUk04uz+hDDBX862pxjC8ZRTS/r1PTqT5rSUrN/wBeh3vwL02NfF+rags7TR/Y1j5h8vblgcZ6t0rvNZlsoNVBfUL0SxsGa3h3FSrADLY/h965L4EafILTXLySC9gaedI41uNwKhQTlQxJA5Heuh1bzxfvCNS1OFg6kmCy3LnaSOduT90/yrxcb7+JabvZJf1ZMxjbVog1O9tXkEsEurRJtw0VtZtuYnp1Hy/1pvlF9JN3Nda8uF3bHcCVcdgoHB9qks5nvI5YYfEF7OIwWldrby2IxwFOB0/GotH1CBIoonn1O8luAgRb2LCIScAFsdT6VzuLirR6f12Ron3CO7j+wNaImqToFbIkjYznrwD/AF7cVm3a2VhaF5LfxHaxW6BcCUgNxnIOTkn2q/qdwxu3tF1LV1mDMoW1tsRDJB25Ixkf3iRxVa0v7axmWZDreoSnbFNJLHhRy2Cc4HHTI9q2gpR1Sfpr+exDsxmn2w1F9r2mtWqIp2TTOY1YZ9Aev4Z96dHBPpZeK103ULiCMbt6zLIHJyDndz8uM9e9WtYgtp3W8ePU5TM0YK205whBOCcHjrg4qjpl0bG4SY2PiGSRwA0dyvmquf8Aazgfzq03ON1t2/pjsk/1INQsbKSH+0RpSXMshjZ49+05B/LIyaqGwgdi8nh3UJ4/mVG+2bo2GMYKlv0Iq7qNtbQXs4ey1eccTBobhijMSTt2+g9D0rNurWOcAjSdafc5kdftO0EnHy8N0HvW9ObstX9//wBsTKK7f19xpTPeQRrZvoLPaBAGJnXAyPu4PU1HpOl2d/cS283hyKG1QBUk84M7YGAPlPYH17Vm39tDbLHK+i6sxVlmVftPmhSAMDOSc9sVpaVfXEhlDWM1ugYt82Msx64A7e9KXNGF4fn/APbMFZu0v6/A3LPSdOs4xbWMqwpnhF5Ga8T+OenfYPHbSxu266tI3BPJ3D5Tx+Ar2FHYn5Y5SPXYcH8a4b4+wyHTtK1u2gClGa3n3ITgMNy/qD+ddOT1ZQxiu7810Y46ClRfkecWF7YG2SG6MiOn7nzhGeD1UEcDv3p97pzuki2MOJGZX85mYEf8B3Yx7YrO0qdv3tnPdpCkgBYCHIz7GtWC4+yQhBLLKpPLg9PYAV9JVjKnNuG/9en3HHRnGrBKpt+P6/eZE9jcK4W5u5Nx6oirke9aq6Fc22kLc21za7ZBvQtdqXB6HcNxI+hrP1aeTUrdBZvJFK0mAz/u3Uj+IHuBXOTaTrks0nllZxuO5inJ9+ldMIyqRXNNR7qxzValOjL3YOfmn/w5pDzg5N0EvW3A/JF2PfI6VpK8EsTea5siQFDSYA9hkA1kWGi6xb3Ky3DuuCqsQ3y4znGAK0DBHGjfbM3RZiw8wDj2Udq0q8jdou/p/VjOjKe8otev9XKFoHbzXKsGKfMvHHHWuPhA89DjPzDOe/NdfCypDK5IA64Vt2MDvXGgZbivSo9TxMc17h12lEhiBbsF5CuXGP1qS5iZpBtmkXac8YKke4o0cuLItIiYZcYB3Y59BTkkgkG6OaML935ePwxXLJvnbPQgl7OKfUfDZwKBNdRsYnPyRiPCv75+tPt5Lu2RBbtJGikiNU4xnqAKmksYbqHdBcw3ByAVkUIuO4B/+tVe4VLG/wDOeJrZSv3Y8smMY49ax5lPTd9v+AdDi4LmSsu//B/S4597SFrq4ZTjLMz/AHfYnt9Kb4O58dQymRHUI5BQ7uNvHNRG4EkPmQ48kjILnn8qteEWig8XRSXUmwMjfdUgA7eh96dRNUp+jMtJVIeqOu8aysdLlhXnaRliMDNcAu9X4GfbHFeoTRwXvMcsYxwoJ6/WnQ6fB5LCaJAxPGGyB/n0ryMNjI4eHK0exVoSqyumef8A9qKeZNI05z6+QV/kamuNfvriH7LIVhtyu0pDHjj057V34ht+FMaqR0BqlqN7cWjhYtMjlTtI0qqv69KpYynOWlPXzf8AmUqNSK1n+BxdrqaIFhbR7GQqPlZ4jlh65B5NXm8R6klv9ntYYLSLGNsMZGPoTmr15rcMjGC90pDnBzDPlgexBA61fvdWj01LWQO1wkyj9xKmJVGOu7p+Yq5yUmr07v1uOPPFu0tDlrDURFF5M2kWU4U53yREsfxzWjaeJb60VorKxsrNW5IijOfrya1Br121m14ukf6KDgv5v/1qvaDqdtqz4RNskfzPGVBJHselY1qmjlOldet/wNaaaektfQ4pri7a4MnnTl5G3ORIQWPrxU1teXUF0t3bzTi4iOUckkj257V6Fq+o/wBlWKzi2jffIExvAx1OentVGw8VwrcxmewEMch2+YHzgZ5I45xWX1uc4XjSuvU6I0lfcwz4ruppo57rSNMnuI8bZXgYEfkfWi88Sajf38FzfJbzpAxZbdo/3RJHUjqfzrtvEPiGHS54LaG1FzNKN2AwHHboDkmq+h+Jm1PUorIaaqGXOCJMngZ9K441ny+0VCyt36fodHspbc/4GJJ431CSD7PJp2ntD/c2OB+Qase+1cSvC9vpdlYyRyble1jZST7kk11Vz4uktNXktBpkRMUxjOZSC3OORtra8T+J10TUY7MaVFcbohJuLbeueMY9qmM5UpJQob6/EVySa1l+ByE3i68voI01TTNO1HyuQ00TZB/A1U8R+INS12zSxmlW0tVZSI7ZdnQ8c8njtXcaJ4usrzUVtL/TY7Fnx5bsQVyemcgYB9abrnilrbWJtJTQ4JSsqxCQyAcnHONvvUQqzjVSWHs1r8SsvTp9xTg5Racr/I5W48X3kunpZ31lY6oi4wZ0O7I6HKkc1DqnijUNSsEsWSC2tUA/dQKVGB0HPUV6fBp81sxOq2tnbSkny1SQOGHr0GD7VoKtgIGk/s+2LJ2MQXd9OK45ZlQptONK9uz0+XQpRk/tfgeGW9ywu4CB8glXqevI4r1i98TPZ2McduNxEI8wyYwvy9MDv9TWtq2g2WsWObVlsp3GBIijIHfA6Z96y/EHgt5LGaPT7plzCVXewJJweTkd/alUzDCYuUPaKzT2MpwqxjJRdzxLwy5l1PSCJfMP9oKAC2cAuOPQV7+ohD48shskYIPH514N4dii/t7RU3D91dRBiEIwd49K98SRLiZtjiSRR3fLDnng8ivXz2XvQt2f5njZbFpSv5fkSxCNUbCtyMfIuT+lGhw3DOYjfzIoX74slM34Hp19jxT30u6lsZFKPcCRkQLFLsYEsBjd2qT/AIRS7toTO1zqIRBny4blyw57BUz+VfPOpGzXNq/mem9y2thNMJAbnawB8t309WYfTjGfqPWtFIJRpSwmfbIoHzG3yBj/AGcY/DtUelyzSRSTw5k2KFZJGZGXaD2ZQQT+tVrSaxs4be8uNYv4wyiVo7iXcDuHQ/L+g/CuOXPJ69PL/gGicVsWtLs/scy3LS2jFSxxHYiN2z0JIHXHFSahC17Mz/aNPXeqrtubQuQAc43Ag/5NI1xZavKYbPW2il2lNsLjPXk4YYJ7ZqO58zTHxL4lufNADeXNHHt29BwF/r1rNuTld7+n/AFp0Lu++bEVxNp08IPyqIHwByPU9j6U6ysooJE+0HRmjUYCRK6+vYsR1NRIt1aqJLnxDIr3GDGJY0woAycYA/Wksb1vtAC+IIL/ACAdqmJcEccgHOD3+lQ1O2j/AD/yIaR0mnR2cCO1lBGgkbc5Q/ePrmtCGZ8rnkE96xLbVrSZhHHc2zsG2lY5Fbnnjj6H8quwzgycK3HcVg3JPU56lJs858VTWtj441k7JVMm13ZWBA+UHOM89emM1i6ZfzXGoOsT28GR/rDKQ6v0G4YPGKv+O3kPxFurXTbC2lvXt0LM7AbvlGM5yOB04rnLiZdGk/06WKB2+8VIkwfTIGc160aKlGyXvNL1+49bDzvSV3oaN6IDO9lcavbFB89wrRkxsDn+I4ArA0/RLDUfMl0zV7O3hR3TBvRISR0IjI6f8CqvLo+meJdQ899TllWPmfYQqqpOAcNgZ/Wt3w14G0qxuLifS3vJbgIRG1wVWPJ9VXO4H17Y4rvdSjhKWk2p+mn6ficUoYitV99Jw8tzMk8O29zCqwazeeczBXRbBGZc8DkHFfQHhqzurDQLCzlfzHit418zbtzhQORXk89zfaFfW8ha3srSSQG7cOzsqDlnC7fmGD+Fdvd/Ff4beeqy69s2qPLzBN8w9wFrjryxOMgrJyXlZ/kjnx0adBpRX5m9qyyyToRY210AhH7xsHJPIHsRTLWxItJ5RpNnbXI3+UqOCGyM8sAMZJNc7eeP/hddziS51RZH27Rm2uMAZz2XFV4viD8MYIJrG08RW8MUoO9GjnHXr1Wub6niHH4JfczmVWNrbGxbWEgd7OTwvYtagAh/P3ZbHcY5/On3mksyC4tPD1lcSFdoWaTbsAI45B9OlY1h4x+FmdzeItMMzDaGM7oSPxxVttX+HFxI6S69o2yTnH9o7f8A2YYFJ4esmuaEl8mae3Wtn/X3mra6RAZJLiTR7OOcqGA37vmx0PHHPerFjAxi+x3Gj2yW7585RMHQZ/2SPWqdjrvgawEjWniDR4w+N+L5SDjvy361FBrXgS2lE8HiDRlYdG/tBPf/AGvc1n7Oo38L+5kuonuXZ7MmWSP+xNP8olhu8za7LgAY44OOPy5rU0jebby3sUs0iOyJFcNlR346VzN1e/D+8uWuZta0iWUHcSNQHHPBIDY61et/Fng6OARr4m0ZRGMbVvkwP1pulUf2X9zJnJNf1/mb/wBotxdLbmaIzH/lnuG7H0r5y8MXP2TxPqMsyRyQJPNEFiDqcFiDkng8enFe1jxl4LQbP+Eh0AqzZJ+1xncfzr5y024sG8Z3t1BtcSzyBULECQlyQwPTHAr08Bh5So1FJNaLobYOpGNVanoNiugW9yDHo+rl5Cd06OxAHvtbgfQV1/wt1Nr+81m10We4hYRo6PdOJQWBIO0ZPHSvMPtlzGxtZPIeM/M1zBFIzr/sYzgjH61tfC3W7Sz+I9pEk13FJexvblZYNgzjIIPfO32rOWEk4Sk7t27tnfjHF0nb8T3+BNSRU82eJzgBvl4PqfaragIPlQL9BXF3GvaijuqrGSrEd/8AGp4NShe1a91S+NpGV8s7zsVST1yT1rxY1lJ2ieVVwNRLmlb5HA+Po9XXxPf29nO9vbQSltwcqB5ihh09TmotJ1i5sXne+m86RsKqeYdqnpxkfma6fVtK8Loz67eX1xJG6KklxHdMowOBwODWbcWngaDSP7YuhI+mvLse4N1MRvJ6Fc5/pXW/Z1YqDi+2i69rnr08TCNNRabMyTxRrMsFwsdtYx7VJiPmncD6DIweo57e9cp4r1Dxjc2AS8gAt9m6QQyhxJ6L8qc/mB616fJZ/Dm1msYLuzt/OvkDWwaSUiRTz1zgD61peGk8Gao9xBo2lwukLbHkeBvKYjsrHhvwrWj7Kg/aRpfev1uYTxcbO0WvuPDPDPimXw7MkNzaJbrKd8sc6IZSp4xk9OnSuwg8X+GrzLx2DGeAl1NvaF1RiP7wHBPSu9g13wXPq0dqNGt4i07W63T2aeS8i9V3/wAs118dhpcCfLZ2UYPUmJB/SrxUqFWXNKm1J+f/AADB46VK14nz5f8Airw3qExW98M6m0zAqrG0BZc++ePrms63OiW8zm+8MXEfy8pLfbwQT7Hg/n1r6Rv59NsvISS1R5Lh9kMcUKsznBPHbGATmqd9qugWV/BYXlrHFLMgc7rZdsQLbRvPRctwPeqp1Yxjywi0v8T/AAF/aPNvC/3f5HgUut6Hp72zaT4Ot5pUJO7zUV1Y9OT94D3qh4htZdflaWWy03SIB03QxvK7+vHUfWvoOSTw6thqeppYM0OnySR3Mf2cZBQAtgd+CCOafqcFlbaa2oLpbTIsRlWKG2DOy4zhR3OO1VDF+xfNGD5u7bf56fgH1yEvdknbt/Wp8pJ8PdHVnuZ7v7QvmENllAz3xgjn/OK6S8sLDSdJihNob4+WGBdlckf7WecjpzzXuNz4h0S2gHm2DLN5sUYthbqZQZM7CV/hBwRk9xipG1/T4lWSLSZZocSCeWOJdlu8eNyScZVsHOMdK6qmY4us17RNpedhU6lCjd06aVzwvTdL07TrJL20hg083hPmIF5j78jOavWfjP7DZR2n70Rhym8gAnJ5wTyBz0r3g3On3Fqs1iIJy8Qmj2KArqRkEMRjGOetYNp4l0yW3v5zAlvJZShLhbmSOLy1Iyr5PVW6DjJI6VzOu693UpuXz+7/ACNljVGKUEkc/wDBzX1vbvVrFpJnJkFyuBhMkbWAPfkA16BcSROQyo+73Yf4Vz7+JLWO00m7awuYYdSuEtwWKKYHfO0OAcjOP1FU9L8ZWWoawmnC1ngaSaaGOSQja0kX3lyOMnqME9DnFcdehUqSdSMLL/L/AIYyc4SnzN6s3rxC8kdz55TypAdhGSR0xn8a+bvHFj/ZXj/V7EGRA05kjJX5ArfMMfnX0jcR+ZEy79uR19K8R/aAtQb3TNct3k2yA2s7RL1dOmfwJ/KvQ4fqJYl039pfjuLEJqmpLoUfDVxE1mHRb+V0l2FQAQFAznHp29TXQLdpJYG6W1uAQceUUxJ1x0/WuE8F3uZJYA+pjzEMiiMbeR25HXGeK6uCUS3AjF5qgkVSxjf5R+Jrvx2GUaruvM1oVnKCL1pr3ibTdNuYNDEP+tLvHe2hZ2JwAAdwGMY+lV4PHPxGMR32NshA6GzU5+nzVRuh5SLDJPq0ikbcA9cf7XbpTgXi3Kj6wu4BtxIcAkD/AD9aVPkUdYRfqiJ07yvdr5ksfiz4iXzSLE9rGEbDFrKMc+gJJzTm1v4kbw326x3DkYsoeP0pmnXTRokUn9ozO7H554sYx9DwK0VLB87h9KmpWhCVlSjb0HCkmtZP7zlfE3jr4j6dcQW0+qw4mRmHl2kXQEDpiox4k+Ku5VW4nO4fw2cIA/Nah+I1s13r+k7biGDCMn708Z3A9Kv6lreo2EJmuYbWUKwIeNcBl9txx+dd3ND2dPkpQu/LzJo4eMpTdSckl2Zl3nij4l2UoSfUruF35AEMIz9MCqVz4s+IpBkbxFdxhRkDbGp9/wCGrl5qlpq6LcJdXE86j592GSP/AGV2jH5VmPc3q3Hy2cMkeAFkEhB/HI4rqpWt71KKfXRL8zCpQjf3Zya9W/yGWXjPx7qBM8HiC9WLJBHmRhvrjbUt34i+IzoBH4i1VM/KSgQ8+5A4qe6e1VTFPbQPGTzIZMFD2wMc/nTbnUNUfdDbpOsSIUy7AZ4+XbzyPritFODd40or1SIeGSi1Ocn6Nk+iXvxM1TUBZN4i1crAPMlwyqSOwz7/AONa2p2njgojx6rqDSDoXuQAv5c4ra+HGp+FNK0VbG9vG0/UJpcyzTxERSMeAAy5wB746muh1mG2LsLldNlBXKmaNypHQfOO/Xp614+JzGpTxHKqSUVs+Xc6KOEpuFud39djzuKD4jgKTf6y5HULfDaefTJqxJb+MXSSPVo9QeMYIWS7Dh/wzjrXY2Udi2nT2sBsfMhG5Nu4QxkjuT1PtSHz4oY4iLQxNkzICxVc+hIP15rN5pNu3JFfK36mscHGK+Jv5r/I4C107ULbUBcS6UZN6MXUrG4QfXnJzium0zTtEEZ+36EoYtt3NarjJz3X2Gau2GnpOhuZLhIFkcFWhuCY39x2/DvW3cIbeRzE0luoAIV8Jx2HDDqayxWP9o7bPybX+ZdHDcn9XMa18L+GppHNvpCwPtDE+WU4OQOCfaqmr+FbC3Xm3ikjb+HBz/Ous0+KKSCTF1IACBk3G4qfUNuOB7dTiql7ZsbtZo4Ly5QA7N04A6DJPzjP0x3rjp4yrGp8bt5v9TedKDj8J5P46e30WG1njiC75CpAJ5471xN5etfyBkuC7Ip+R5Dg+hArvvjh8t5p9nKmwrE0rRY3EE8Dp24NcFoEiGQxpaLvKkL5rKox3GOuea+4y1xlhY17anzmMc/rDo30I4EQ282egBP5iuObhsV2unNgynb8oHc4yB71xr8y5POT2r3qL1Z8/jl7sWdloSnyBwOQucODjj2qef8AeI8Xzxhu6NtNQ6D5yWjARsig/Ku8dCO46D8Kg1SaVbnD2pJUYBKgHBHQHpXGo89Zq56TqKnh07N+RZ06zlgRUfVLjy1J8tBGOB9TU1jDeW+qJcSTo8S5zH5rMH9M/SsbTbtYpc/2Ml6RkKkwwoz3BDDnitvSXMdvG99cy26IQ3lq22M+xPU08TRdNP3k7+RngMT7ay5HG3d/5/oRX1mlzJJJMixRM+4RwDv9SOPoKn8MadZaz4ritWmmt44l82WTrjaMAdcnJwKfqd6iqtpDNITnc25ycjtkn3rS+HFmAb28lJZ3kWFcLjn7xH54rkq1JQw0pbPZHaoRniIxWuup1l54DllxJpmrksQCqJIOfwNU20TxJpjAybpVHqv9abLrelxybJdTt0kBII8w8YPrV7TtdYsJLDUlmX0WbeD+Ga+f5sal73vLzX6nsJYVvTR+TIRLdMn7+PleBkc/nWRqKanOxBazMJbISSEnH8+a6yHUpXGby2juMtnIXafzrznxBd3Z8TsNY+1QaYZ8qsRITys8YI6n1710YKM6k2rJW+f3E4mUacU7t3/rUsxaHcXsglS8tYQG2kQIwx+HrWpf6FFd2ttE08pmgG0TNyWHvWF4jn8PLaRvoE8hvPMAAimduO+eetLrlzqK+FtLN/JLHcmZt28FCVwcbj64ru9nWnytStd9VZ/8E5/bwje6vbtqjYfTNWGlnTFmtmtWOT8p3DnPp0rT8OaRDpW9hcedO64J24AHXAriZEvF8NRX4s5GD/8AL0ly/wAvPdeg9K6vwPcfadL41FrqTPzKfvRD+6c8ke9c+LpVIUW+bS+un+V/0NqOIjOok10/rsa3iSxbV7a2t7b5WSTc5c8dMdvrTR4QlOiDT2kX7RDcFvNUHaFbHBzzXO/Eye4tINP8l5Yt7vuw5GcAehrf8H+K9Cg8N6ZDf6vbG4RMTpNKSTyeDzXFOniaeGhUpO6vslfudEMVT9s6c9LLc1PD/g6a3vnv767+0ukJSJVVsK23aCc+g6Unhzwhf6TqVvdm+hkEYbKmN/myCP61w3xQ1Zz40mNteTRxPHDtQSlVxtHPXitTw89lJrVoou9LyZRhU1uaVyew2NweccVNTDYp0fayqaSW3KtNNtzWnjqbqOCjs7bm5deB7+61iS6XUYBvnM2GVvXOO9aHjXwvfa1rEeoQzJHGIlhAfdnOTzwOnNclrIul1eWQ+L9OvljkYNazXzW5Xn7uBjp6irXgXxDby+I4rO3gu0mYMokivXuIVOD8zAnGB681nKjilFVozvyr+X/Oz6djZYqm5cslb5/8P+Z2OveEYLzRLJdyRX9rEkZkALK4HGDjt6GsqDwJq7XkVxNqcBKOpOS+SFxjt6CuduGvjeNcyeLdN1iPn91JqbW5/IEYPtWv4D1+wu5r208m9tj9ldnke8eaFAByct90+9ZOji6VFuM+Zem1/Vp/gXHERlKzVv68tD1m4a2mcvKqgEYIYcYrGv7i1VdkU5kdOPkXnHoTXnHwfigj1u9M2p2k7m3CRpHdbyfm5OM/SvS/sNqYGjg2woTlvKIGfx9a8LFYSOCrezcm9uljWjUdaHNaxSttUuYmYJbOwA+Utt/pzVPWL/X3tXZWS1V0JjdQWXODj0NbwtoYlV1jeQgYwMHd9adeLFHGFBlwIyAoHy/j71nTrU1UTUEOcG4tNnlfwQ1vwboN7JrfibUC9+jeVbxx2byJD6yEqD8x6D0+te3W/wASfh5eTLIPEOn+aB8rTQOjD8WSvmLRdKhuLdzJqItf3rDBjBH19cVoNorSyeSNTWSMYO+GJice3Svssfl+FxNVznOSf4L8P1PmqKrqK5Yr+vmfStx4v+H99sU+JdDVw6tuF4Im4P4U271TRZwPsXjHQ2jYf6t9QQE/iDXzRP4evVjYv5SrHz5pUhmH09asReE7ZbF7i5vbDaDkF2b046CvNlk2DSTVV/dc6ISxd7KJ9D2S/Z/tDQazaXgmHSTV0lVDg/dzyBz0qU2l2beJbbVIICiKuVMcg4GM4zz+fFfNFv4ak1FkFiImZ227WXIwP4gDWpD8N9Z88JJ86kE7ljG1R9BU1crwsH71dJ+cf+Ca054uS0p3XkfSel29yio1zerdsWJYBFTHHGMZz/8AXok0+aWYebqTQ8fcNorAndn7x7Y4x+NfM3/CLSwXMUFxeR2xc7R+7Ybfr36d6tT6BDDn7J4jlkYH73zrGB6gkisHlFFO6rb/ANzT/I05sQ94f+TI+pbrTop4Y0tZ1h25yXh3gjHTHpVVPDs+wK9/YyArhy1gMsc9eGA9q+WHsdSgWV/7du4hB82fPdQwHXB38jpWvo1h4gvLNZV8WNG7rvESaqd4+uWxmlLJoU4X9srf4TKP1iUuVRf3o+lIfD9zHIskT2cp4G0QbcDPJ3Dnp2rSgs5D8sJjBzjAz1/Kvl2WLVLFJVHje5+3KoYWzXshdlPddrkEfjTdM1fxi7Mtt4jvAEQs5e8kB/DJIz9ayeSqS5lUX3ND/ft2f6M7r4ltqy+PL+2hMOCFRpCceWNiggEHJP4VWs4GhttxMEwij3M1xaso46kEgDJrn7OTV3Zpr26gubkDi4lj3u59S2c1PYtfvLBLqpjnkgbKtGQoYemNvA/n61rOjaCgmrL8T1qM+SKTTvY17jVL+awjaSw09UnAYS5UEDJHC4BP41DPeWi3KQzXl8HThZoPmDL2AO4YrInnW3MrXKDLyFldpx09MYprxvdkpZvfROpO7MvB+mR0pxw8Vrsv69TRzurLUszxnbcf6Td3kUmcLds0hC+mAeazmTTrea1kk0wDK4byo22/Ugc5/Guj8G+HJ7vTrx7y8viLZ8mHA8yTIJwrfhXVN4FgktQqn52XO2YueT2JU/ypSxlOjJxbv6aGLjFpX0fmrnm1xoSajeM8GnWqWjtlDsKMvtknA/Krg03Q7WSO2uNAlll2/M6XIWPPrwetJ428JX+gCW7kmguIHb54oIZWaNTwWG484+tcLc+Mr9LF9EhikaxBAR5bdhMoHoM4z6V6+EwVbHwTpVPdXm1+TPLxeZ4bBytUg232Sf5nfXuh+Hr61kGl6VNdyxnDRRXPI+oxkd/TOKzbfwppMssUMtrf2kEhJh3A/vOOcM2PyqfwJ4a1DXIzeaRfQ6cyS4Tz0ZJGXAwxCjIBJIrubrwJ4outvnajpU2FwrO87MjeozxXBWqvCzdL2u3m7r9DqpVKNWKm4JX8jzPxBodlYGMRRskMhbDmDeWA9getOPhPS5bNHju5DIEywVF27sdznj+legSfD3VLCSOe6Fpq5LbRGQ7nJ7k7eAPyqxqPw/vby0uLeDSdF090cGOYzcScckBYyfbBxR/aMoqKVT56fk9SnTw7bk0vTU8nbRNPt3WObUFhZ84aMq4IH0Of/wBVT/DnwzFfafe3T3T7Gu2SNgmNyqBzgjjk16M3wvv5rYRRnSIpBHt3gkANjr9z1ra8L/DnVtJ8N2dg8+nmSJT5jRsdrMSSTnHPaqr5v/s7UJ+82u33mEcPQVaLdrK/c88vPDNlDMInupT8u4kRAgDOPxPtUnh3SbO11CGaPUJ7j5iEVoGXBxxnjHSuy1zT7jS7v7HPcKJdobMfzDB+oqqhkXcGujICM8xrke1cP9oVJ0+WUt/67fqehHDUk1KC/r7zIvtTa3u5opteWD94VVWtwcdOM45xnrTdQ1gWV3p2px3QKwXAyzgDcUPzY+tWplnwf37MR1xECTWP4oO7TRGXTlCCBEAR9ea0oezc4q39fcFaMnCX9fqe+QJDM7SAxOsoEqADnBHWqHiTQzrGh3WmrOkLTphWfJVWBBBwPpXOfC3xDaaj4F069eXzbm1BspSvXg/L+mK7GG9gmiKMJkYjG7HP1B9a+dqU3hq7j1iziTnKHNHY5nTfB2pLPaW51OKKygeKW7t1hPlzuh6x8/JuGMjuaguvA9ynh3V9GvNWu5bfVLnzYStv5htmDZHfngAdulS3niBEYwyXxgaPKDZqqgyNkDDBVJBxz0qRNZmvDdwpPay3L4ikhS9ldUI6/dTiu5VMQvev+CJcZsmb4fR3Wi6JZXupSvPpPyrMIE/epkcEHIA4xWpY+DbfTbu4m0jVdQsra4B32asrwgnuoYEqfoayrW3tn1FrSIQu0QHmo91dMTxkkA/KeDxyeatWG67upryBbSAQtvH2i3uFIXGMjkLyB0GcdT1odSpZpy09F1MpKdtyvB8PPDq6fLpd3a3dxG77lumumEik8kjGFHpnHSuntRp0FnDp8lwl3HAihftciyNjHBJPXjvTptTtFe3iLqWnGY+uG49e341ylxGUvZF/syeRFYruj0eIhhnqGZuR05rJVJ1vil5kuLl8R12qXOkSxQJftaKmQ8LNKEwR3VgRjr2NVI7Tw1cvLc/ZbG9LKIZJGYTHaMkKSxPqfzrE825CoqxahFDHF92aK2IBHO09do47cDiq0uptPeRO13faSHcjyUu7YqARwQACWyR7nmiKktpfj+gKh0R0VrJ4NE08EBsllyVmhy2SQu07l78ADnrVnRNQ0eLTnnsp7V7XcEbyYnAx0AxgnpXManrk0kiRQyxYgbaJV1VIt/bcRg8gg5HvUMeuQLF5tnr1vc3pO2aG71V2jVevyso4PTBA9RWnLKS1v99zN4c6+xvPDt1Iba1s0/fj5g9i6K+OcEsozj0NJJc6CqC0/stnjWQgIumsUDHr/Dj8a5uO8e8sJ/slxazwlA1yJby4cgDJ+U9R+A7VFbtFe2U1rbNbF5WCON9w0RQ8kZbBHQfd+nek1ZvcFh0dZY3sGoWjR28FzHEnyhZ4WQEewYcj9KqXv9n2SLA+mRBJPm3IqAMw6DacAt6fjWLpct3pOqR6ZixiWSHI8vzTuPOMF2PvVl9Wi1KzuYlDJeW6+bGF5ZsenueV/GsW4qdk9DVYeSXNbQk+32calE0xxGTvAWOIZYHj5d33vTjPFKNRs5LgEWbK7gZl2xj8Cd2c9sVkOl0XeR45I8gOsSwSEDPQcIRkDvk4NUrov9slt7e3uHWMAiZrZ97seoc+WQcDpxxWnsUzRI6i1le5yRaXEQ/6aKB+HBNcn8QfDNxrHh7UrR1EZmKzWwVwWEqjt6ZHFbOhSXJkMlzPqWckhWDCIDA7FFOa1tRd0tHkVVkIBIVjgE9qiM5YespQ3RrrJcr2Z8naclxb3qAXl0jxE5GRkHpjp16129nuaOGI3t2EUYBDEZz3Jxyfxqj8ZfDkcN2PE9hF5NrfSbLpdzD7PMOoOOBnGc+tcVb3drDbLCRNcDbkOl068fjX3U1HMKUa0H+C+Z59OX1abpyX4s9Hn0O5adpI9T1ABgMgNk59eRgflU50klkc3N2WCgbhIRjGefrz/KuGfT0cF0uL0s6gqi3ZVfwJ5qKDTIriMLLquqwM38MSlyp9OvNcf1Z21q/+S/5M6+Z30h+P+Z3gs5lIBv8AUAAeBu4P145q5BHiIQrIp29jICf51wU3h/T7C9hl1G71i6tJFBdTA6P+PYVv3ln8JBpMKtJLau67ldWmNwCf7xPy/geK56tGPu2cpJ9of8FFpyje6S9Zf8BlD4k27RS6ZcSbFXc6biCwGQP1pttqEtvGLX7FDPLsH70odm3HXnv7CuYaTR1uFsLG6M0ZfbEzMfMPoXXJAPvV+WW50xFiktWnkOSY51IxnnGPTvXpvDJU403q1tfQwpV3GcprZ9tS49yT9wW9tIT+7VYMhsdyB1/Gm694o8VeIYlsgNLhhgOFFtCIwdvbkZHWsr/R71ykt4bZQ4LKp2Yz07jA/GtK5Nu0eweJI1YEHd5uOPTg0/Z04STcby803b8BNyqptOy8miS0a52ql1Ggwo+cPksfpUixuUcSSKpP3SgIwPxrEtdQkuWJW5uJAvRudp+hIFTwGONZBC907uOV89mx9B2onh2nroFOqpLTU6rRPEPgvQNNik1nSp9R1FZmcSLEAnbbjLDJGM/jWo3xw0R4VW+0jWbqUk5YmMe/A3cCvM9QJjYpcu80RIfZIzMVP+zn+hpbq1s7mFVit4YO5Pk/MeO3NZzyrCVverqTv1u7L07GM61dNqm0reR6I/xn8NeaNugasqk4GHi/Pk0y5+MOkTxNGmk6rDk/eBiYkdxgnFcPEujWtr/pOjI+ON0KnJ9zub+tTJpujyZuP7PuBM4/cW/kqEC+jMT976dKyWU5bF39nL7/APglqpjXtUV/T/gHWQfFzw6iqk/h7U5o0OV8xISVOcgjB7VZf41eEUcqvhrVJmPJJEQH1PNeb6haWwvViGm+QM87mVlAx/s9D9apnTNPhZGnW3Yu3K+b0roWS5bNXcZa/wB5/wCZzzxONi7KS+7/AIB6kvxx0aRjHZeGrkorc/vY1wfypLv40QQ5Mfh8qCckvdqpJ/BeteUNolmsyMlzaI3KsY9xJz3HPXFWpdDjOCgncnhi3RR2IzyaP7CylP4H83L/ADFHF5g07tfh/kN8c+I5PFeuy6msRtg8apHGZdzKoHTPHv8AnVPSAv2dYpJWXzGIJmQNznjaexxV+10qGV96XRXnB3EA5/LmoVnzMbG5s42gJJLJjnHTDH/CvYi6caao0lovw+841TqKftar1f8AXQrQghJcjolcQxO/I4xXZ28jFJAQVDoduea4wnD84P1r1KG7PEx70gjq9Okv/skUkd0Y1XGUbPzg+nv+Na9mNyuGtftDMdxJUsV/rVPT57JtMgfEMcyLyI0PHNbvw7vZW8QXFsgb5oCwPPzEEdM8968/EztCclHb5HsYZLmhFy3+ZVu7K7jWJivnI6kbGtWbaOvJxj8aQRy7meXTbiUkYBWE4Tj+WOa7zVBb2yC+1FQ6wHKocuWY8ABc4JJOKz9c8QW7hIHlW1DLuliDBmBzjDFcj0rzaWLnUS5YX8/+GPQqUIwbvK39eZ59cLcxrIsdtMySHAdo26fTHFegeE7W60rwK1/JHIp8t5hzjcScKPX0rD1rUrZIFEUzOYyxkUI2Rjjnj1NbegX0d/4PuLRpAlw6SRqmcsdo3DjvgkVtjnOpRjppdXMcJGEKztK7szAtNAnSZluLme3+zkM7PEv73uRgEkj6ioX1rSbfUJ7b+yv7SaIAErCIsn0BAzS6Xca7cXolt5gcYe4mnTAdfbK4/I1salbWV/OVZbG9uNwJSW4RduODjbz/ADrOcnGp++1Xlpb+vU61Fypf7O7PzV7+n/DGMdZ0u7ljt4LK50m9kIC/6VIyj8F7/hUuvSNbzLFb+I9ZndgG2JB5yLnucYI9q0JXtfDm2ay0y4QBwzi3iTdg9mYgkLU1t4pW3uZL1bSLymYs5F2pIPsCB+VTzSup0oNrza/W4o0rxcK0lzeSa0+VjOhj1zT7Zby91C3t0cEobl5IZCM9Nu0kfWta2k1qe1SdJIp4HBZWj1JSGHc4aL2qfxDqWrajFF/ZOoJbFkysfmIDIT/CwJz09jUfhex1OO8WTWr6dFkiMfkMDNESe5OTjH9a5qlTmp+0nZS7dfuVjop4e1Tkhdrv/wAF3+7czG8SyKxSC6vpEX73kfZ7lfywpqxp/imTIeK8tGjLFC11prwYPoWQkCrfiXRtJsbeae0jt7C33D97MH2D1+VWH8qzPDuv+Hbfzv8ARZDKylZZ2UIJAOgClicH8qtRo1qTnTpt/Jf1+JFRuhUUatRJ/P8ADVfijov7XuDErTaVBexnlTZXSTH8FYA1Lpmt+Hrm4+zySRWM/Ty7yARH9Rj9a5SNrS8uJ7nRb9FvYm/5dbQwSKvTLclWX8K0/DOrpeyzaL4jjt7i4UnajW6kyL1HOev4VzVcJGMG0npva6f3O9/wOilUc5Kz32ejX3q36naS2Zeb/j2jmOOGEauCPY46VPpFrp6yC3OmWygk4kKDeD9cf1rhNUvdR8IXkd9YROumu202kmHAPXjnKjgnjpXoXhnxDbeINMt72wR4lkDFyyD5GU4Kn2968rF0K1OkqkXeD63tZ+Z1QlD2jpy0kun+RPPa6BZoWm060JB2qphR2b0xmqlpLpy3Kw2tsY9zZVBBtHrzt4xVi/gsg7T39+Ypidq7ivA9l64qG2uo4kYabEJGPDzldxPtgcAVwxT5d2/nodXKmzWP9mC2K3VjaRqSdzmBG7erVmtd6JHLE5tSUQEZiQ7c+pUYB/I1Vuba5mBmnwW65klUH8ATWabO/lYg3draxdwoMzn9No/WnSoLdy/H+mN6dLnVwXXh1LSe+jtbLy0jzI6xKpx6Hoetbeh2kWtaNbXtlujN4nmyDcAqAg44A57CvHPHEFhb6abaxlmmvJRmTzRuZeQMrzjr7V79oFo1h4T03S1meBre1ijZwoBGFGTzx1oxWGhRoxqKTbk9L9kcP1iUqjglaxkjw7qURHk3akZxww24Hb7mBUU+nTQJK1xqAWQnCo4V8Dv/AAjBqj4jtdSPiWA3d3NqOjyR+WLCG8FtK0o5JPIEg/2dw6/nk6zJpGn6nHPcaN/YtrCRvZ9NZ247tNG7BR2+YGlTwqqWd7tq+i/p/gQ8TJXTK+nfDjwlbREHX7tJJAxc7Ubr1GdtL/wgPh21aN7bxRqduytkEQI2fwpuqx6vcWFzf6Tq1u9v5Dz27LpwKSKATw4YgdMZ4qt4PfxDq+jafq8Wq2q/aVwytYghG5Bxh8kcda73LEODqSraba9//ATG8FJQUX8v+HNtfAenzETv4yn4PzeZZqAfybiqNx4KQ60trHrVpJb+XmOWRAQzEn5cb+PX0q74c1aLXbO4u4FmRbaZ4C0vBcp94gA8DPY1WOt6TL4YsNbtLK8Y6hefZI5W2JtYsRyTkKuR2zWKWJUnHrtstPyNFVjbmcvM01+HLTWzxC7tw7kN5sUb7h68g45rm/FemReF3gsNU8WkST4KRDfuVN33mBOCO1dXpOp/2LPbWuoPfWaXMnlQP5gkhLn+HcOjHsCADVDxto2g+MNVex1Syk0/VEcLBLOwUXUeOqN0P+794VOHlNVLVm+Te6Sf9edi51pbx37bHK6vbeHotTsX03xVY6vNdOIPKNuwdM9Dk5zzXF67rotJAptJZbpWImilt/3QIJHDLgkj1713vhv4c6Bc3N7L4feaeSzl8n7RMQIZWx8wjK/3e5x3r0G38JaNDpzXXiex01Ugj3STq5UKo7seM16kMwwmEmlKLqeqSf3f0zhrwxGIp6T5PR3/AMjx34fw6n4mnEdtBaz3DKxdbiMxrGBjA3EEEH8Twc11uqeCdbtXjmutMlvCnzRw2TjEeeMAqoLfUkfSvTfCMGiRxmXRdJuLa3dA0cr2xQSA9xnk/iBxTtX8TR2eu/2KlnvuBbC4Z5bhIU2FtvBPJOfbivMxGYzrYmTo01Fdv6tY3w8p0aahKXN5v+vzPPrj4d67eKJbWwt4LkrwzX2Chx1wAc1DD8K/FzOlxcDR2dMgDzdpXPcYGPz5rupPG2n2+nNqEyywKl19kVceY0snYR7M7x7itOz8Vaddi7XzWgktVDXEd2jQtGp6MwfHB9elc/1vGQj8Ono/zNZ1JSejR53Z/DjxXbtL5q6fLGeUA1E7s++VIA+lXP8AhAvEa2rR/wBnaaZWxiY3zZX14xivRHui4QF44xIQI+n7zPpk8/hWNJreh3FxdWrbrl7SXypwLSR1jfrgkLis/rNao78v3X/zKVSpHRyOC1TwD4gt7NJb260i0TzVXc92jbh6DI6n25rK13w+2iiIX0lpBcThhBcW8wZmC46rwSMkV6Vf6Vod/pzXOl2Gm3QLFzsRCrMOoOfun8M14T8UpHg8aw2Wn2NtYNb2alxEQQrMxOfQnG2vVy2M8bU9mna1+n/B/wAzOri3Qhzz1TPXPgxpyT+HL6UXLNK1yAZAByQvOBk+prvpxNawDyIGnO4LtB5APU/hXjvwit76PwKkr3srO95NnDbCQD7emK6TUNevoTaW2b+4GWOYD8+0DlSff868zG4STxc43vZ/kOFTnpqeyZ2upxo7eQ1hNc70JJQLgD3zjn271xl74O025udz+GLpEZuWSVM4+gatHSLm1voppTNr6mAFjG0jrvA9AetXbyeyvmRZrfXrdVAQFUdFIPGSe/XFc8FOjL3br7/8yubTUZ4d0m1tZnih0q5tFjXcC+3DN0xwTz9a14tSvo0CjQb5mK7jtePbnHTJIqhrUFtbXFpvj1qT7Og2m0Zirc4+YDqcfmKJILO0uI9WWHX7hzg+WGYhQ3HMeewHpU/E+Zq9/wCu4pO5rW91d3EkoutOaBEUNHmRW8w9xx05ptnf3ctwkU2l3NuGTczl1KqfTg1ybW0sGqGZX8TfYigdIU3nDZ6Hn9PzrdhWzuUvbVRqkTsomlzuVhkAAK3YnHQe9KpTS1Wv36fiJJWLE+pagPMW20S4fBIy00ahsHjGT361d0uaR1JuYZbZt3CO4cfpxXN7IPL2S2niWVASTvdjt7g5zlvrnitnSSI7aOSH7W0cvzf6W5MgHbryPxpVKcVHRf194JXVjzj4m6p5fj+a0d02CCI578imWm2UGQgquMjg9a5T4j3Uk3xW1GJlBWLyVU9TkIpNdHZylbQE4GM16WJw6p04W3aR14Ko5Ra7E82Yl+VQzEcdcZ9z6Vyuvi5NrJ5kFmk+wgiIkJz6kjNddJGzRNtfKsMgEf5zWXNZK0XnIxJbkBlIP0wRmpw01B8zN6sebS5j/BW7eFNY8PSxmNpoxdQhv769cfofwr1iy1qy8iO5lywkQMQJskH/AHe1eK6nZanDd/bdKlkjnycPEcMueo4rjo9U8YzCaWTUdWnClmfFwQduevXtXpV8pjmVR1ozUb2v6nkfWHhIqk4Nn0281vc3Dyx6jeQRsuRHEq8epztJqhHqFoLx9Pvr2eC3QEx3IufLLggH5jxyMdfevniO11GaEzCbUpSw6ec0uM9AQCSM1SutIvcQyXtjP5Tt8hcHk/l0pQ4ehe0q34L/ADCWNmo3VL8f+AfTtvr2iWMc9o3iC2khHCNNqUcrEEdiWyDVJvFnhHT9KvZYdfS5lEEgiR9T8zc2PugFj1I9K+fdN8MTTq7DTY32nGA/T656Vn6xo0lpLhLa1hXeVznLBgeRgVrTyDCyny+2f4f5mM8TiFDm9mrfM9Rm+NAl0qGJ/Dc/mQtuRxerwP8Avmu4sPiJ4V1vR7LUNYn0yIvb/PBNOpeGQ8MpBIznAOcV85XFhdlVMcDsvX5UPB+pqVdOle0eQqtswxxJF19eTxXbWyLAOK9n7r7pt/m2YQxmJcnzLm+Vv8j6Eb4ieD7SOSODV9GSJvvpHIpB7cgZHSorP4keAYpd0kmkjaQQ0cB3D0Iwhr50XT3M8bPdxbWU7VC/f/Bc1Yl06aWICO0dT6hCCfzrNcOYNb1Jfev8h/X67T/dr8f8z6E1f4reBDGYotTAU5xts3Pzev3ao2/xu8Hom1kui46slg4BI/KvDbXSpLidLSSxkiY8LKTkE+9SXenfZnZDZzARnDO6bcj1wTwPrRHIMvi7c0m/Vf5A8XinHRJL0Z7TF8b9EgTZGmoz45DG2yT+b1Vvfjnp9ziJNP1KeFwQ58tExkdvnryvSdC1DULia3gitpZMb02seF4z0H071oHwBrryyCKGNSoHdjg+4xQ8nyum/ff3sPrGLesV+BueO/iPcatZacugTarpVzZnHnF4/nTHAOM8g9D7muS0Txl4q0nxHBrs2r3d+YXLSQzTEpKp4ZSPcVp2/wAOdf3M26MMxySQQPwp8/w48QsmGubQc/cZiM+/0/Gu2lLLKMPZJxt576+e5jUp4upLnad/66bGzH8ar9XMsWiuz5yB9tJA/DZVm4+MurzwK0ugRZQ7kJu2+U/98iue1LwJqdha293qdpYJbBwreXE5dVOTnCHOM/zrDmj0fMlvHaThWYBJ9shaMd/lJ5PpWNPLssq606V/NNv9To5sZvKol62X6HZj40+I1bP9j2YXv/pEn+FR3Hxo8QOvltp1hNnkL5shGPzFYGkfD2+1jTzPBf7QzEMGt9pXHblutaNn8H9T8xJLXUkDq3zxiPBI9cgkfhTlhslpvlkkmvUw58xeqvb5Dp/inq19Y3Vnd+HtJkt7pdswkSVgwHfG7g+9YNjFaz4luI5JAGVFVCMKO2T6V08nwxunys2qSRKR2XJx+Fa+g/COC4QxPrd3KqEArsRcD6Z5H50vreXYeLVKXLftc0jRxU5XqLm9bHFSRXAlgtkgWAs52q8pUqRxnpj6cVtwaWi2zxEwwzN1cvhn9yP4vwrZ8a6Bp3giSCKGLT9R+0IzJLe24MiFWB+Upgg1y9vZ6tcD7dLqEwiXlcjcFBPYnJ7+tZusq8FOLtHpvqd1GPI2nG7+WhreBbZr/wAcW2hax5V7EyPtbcx3EKWB3A89PwrvdU8IeEbe6K3eiQ5Q/Jh5huz2HzV5v4NLw/EDQbgy5C3yq3GAQx28Y7819DarZ3N7lVlhijBHDEZPvzXm5nWlRqwcJNJro7dQprmupLr1PMZNK8GiJZ4rKBFlICyNcyIrHHQEsM1UfSfBEsitMkEjMcAnUXBJHod1dV9nvPsZSfw5EyrIUSASJjbkjeM8AYJPrzVKewkdmeHw08O1eSjRZIzjAHfoD24rCOIs377/APAl/mW4Pt+DKUHhTwdezweWm15R8iC+f94vXcOe1QyeCvBSSOHurRXK4Ie8O8ANjjJ9eMVoXVvqNnPtt9OvLgRH9zIvlhfm6gZ5Hv0qJYL5pWd/DkyySMZZH82JjvC8Ennk9BRGtVtdVXb/ABL/ADBxjty6+jOZ1jQPCMKiGY2coVyFxdbmBA+7gHOawPFUtj4dMVumn3McckRZHCyMoPUcZFekrYsbiOCTSpYyyjLxIjqBjkE4B9vx9KvMuopH9mm0SK8tQzRrslUNtwCGwcDGcjHtXZQzJUZJzXOuzkv+GMK+FlVg1GXK+6Wp4FpPiKK9uY4NS0ySa3L/ADyQu4K++CcV38Ph3RHW1lhSSRJyQhSZ224GTkZ44rqLzw7bywwT/wDCOSxyuxEkUEqHYOxyeDmo9Hg1KzUtZ6PPAzj/AFdxcRhjggfQcZ/KuvFZrRrLmoLk8rq35mGFwVSiuWrNz82jLh8J+Ejp39pTWFzOsQyUk3bgf93J5rRsfD3hK83JFpSJ5QBxIpG7IyMbufSnXesay95JbS2z2QjZlLDG045BDD19ulZJ1XV0kDGyd3VQfMW+3HkdCD75HSuB/Waq+P0947EqUX8P4Gn/AGX4UtZin/CPxl0kERZ7MOASAc5wcj19MVZurCyszGE0i1ljkyVa3s0IGBkkjGRVJ9avbW2hljlEskv34jIf3bY+nPPHFW11HVFSZJdPgWfyg9uqXQfzGPVegx9awlGrdNu/rIuPJ0X4FnSv7PknlUWqxrGxX95ZeSxPXIyORXk3xO1hbPxbdRRxu8UkaPG4O3BK45GPavSL1deuRELiHTbcGTAWS6G4D1HAyfavNPjNYCLX7Sdiykw7MjoSDn+tepk9Om8RaTvdd7/kcWYVJxo80NLHPTazIYNvkQPGRlvmJbd+P+NXbG4hijjOyNGA5Chmbn1ArK0dLKO58u4hKBx94vnkfStuOIbFVNiqOGa4T92x9icV9BWjTh7qVjz8POpP3m7/ANfIxF3fYlwdw5P4Y61xTZLYrtmdRbboxwEI5bA6d64yE/6QvP8AFXqUOrPDzDXkR0VrAf7LjGGV19FGG59evetjwcz2niq3laV1Eium1Mk9P8az5ZpyiBZABjjHPFM029zrVhKrRK0dwqnacbhkf41hVi6lOS7pnVTlGnOL7WPXp7SVI3aeRZxxkMu8A+uDjpWbfa/pcdj5kGqabvHCeXEAcA8/xcCr06S31sYpUYbjnK8cdxgDmsnU9ASG3EsNtHP5YJ8vYuQfUV8vh/ZuVqj1v5WPpa3tEr01p8zntR1VdRnEsupwyfL8ioBgLXRfDaYPc3HlP5yAKSQuMHPT8q5wCNwVFnbjqSRMoAPcZ/Q1ow6hqWl6Y/8AZ8scYbLFVRWAYDu2OQMV6uJp+0oulDS/9dDz6E3Coqk9bev6syvEWn6hPLLYQaXPJbI7GOSMsA3zHAIyAAKfD4blutPD6rcNCseQYkVTgez7eKa2u+KZtzHUwF3dfMVAPbBFR3lx4iurTF1qMzW4ORtk3ZPTsK1jCuoqPNFfO7/FGTrUuZyUZO/TZfgy7DdG6SO30y8v7RYiEIjuAu/jG45HbHWo767ur6WG00WxjvZ7YYaUuSzY6kEYzz61St/DN7dRtJK5Zh9/MnT2p0On6lpd1tttQS0OACRcMrEke1bShhEvcd5Lu+vnbc5o1Mc5XnZQfZdPK+x0kUeutIs2seGrW5kiwYjFbMZEb1J4H8/oas61pmt3k8N5pt7JBHFHgwOsqNJ6gjbgfWudf+3mjEkutSyJ94j7S5/r1xWra2OvtErQ6rqCq3IH2hq8udHlanzRX32/G569PESknDlb69L/AHovaRbapHarb6pvntQuFtfI8wKfdtox+FZGoWNpHM0j6XOy53COxs7hd31JOMfTFWri28VRW80iazfqyoSD5xPQfSuct/EPieGHzE1fUmbGCSqlT9OOaqjQqSbnTmvk2v0Jr4qNlCpB/NJ/qaunS6qymPRvDUGns6hJLi6j8oMP93kmnWmlzaPdTahqKnU7u4BGbeF3CDuBjpn8KzIPE/i15Qi6pf7TnJaNFx+lOXxP4k3LG+tXYYsVBZEH58YFayw1fVLl131d/vsRTxlNNOSk7bXSsvRJpfmM1RvEWr3MNrBpuoRQCT91G6MRk8ZJI4r1Pw3Y3+iaJb20E9vPLHG3mwyuY0aRjnIIU9OnvXnL614rEQnTWpfL77RG2f0qb+2PHZQMLy9aPGdwiQ8e2BzXLjMNVrwjTTgorzer+43o4hQqObUm35L/ADPW5o3uLZLpIY2unGzjb8h+pGcCs68trxZD5tpczQOBtkMzYcY9hivK08U+LBII012/EjHI2QKOPb5cVvQXnjdrYSL4jnk4wImeJc/iRXlyyirR+KcdfX/I7aWYxqP3YSf3f5nZ+dbRId9pN8o52ykkfhtyahfUtPjnEOCZDyFaYhsfTbXDjVfGdxC8B15Sm4rId6sCD2GFB/EVGuueIdMBdtVukl6qJbRXU9hy3OfpVxylv7Sb9X/kVLMrK/I0vl/mX7u4hvfGlr5ETIHuo4eZS+RuUenHQ19H3N8rPt8tghzuAPI5r5Z8Karqdx400mKe7SYSXSl1EYUkA5r3Wz8RaXA7m7e4tz02PC5APtgGss7wko+zhFXsul2cuCrqbnNvqbmoaVYPM2p22o6rZ3JUIxt7kgMB0BRgynH0rCfTtP1Z7i0ude1mRSMSxM6wCQHqMqik+/NbE9w7x5t4ZJFcYBWVV/HmqN5ZNCnmM/mDktkHj/69eJTnKK316dzudOL6FTTxDbWl5pENtBa6dHD5NtAjkHac7iW/vHPUZ61l6Rf6L4b05dE05nRoNxESlrh0ycjO0Ej6VqTTWttbJdXTIkYbad4wpP4ck1yt5bJJdXF3Hf8AhwtIdzSK0sDEn+9tbBI9eK7KMPa3U72evqzKo+Szja/6Gpb2NjeLezW1xqljFqCmW4S0laGOY4IJwVOCehxtzVu+07SLvwvDo224sbO2aN7dYEDeWUbcCM++c59a5XUPMl0S/wBJfxVpkv2qPahkmBWAdCAxYsQffpT9QtY7iC0RNd0WSK3j2G3lvk8uQ4ADHB6jtkEe1dXsZNp87Vnpv0Wn+Rg5xV/dW3kdnAum3l/b3Gp3WoXiW8nmw+cEWFZOzeWg5I9STWhrdnBrzNY6prkctm5Mi2UMSxmQD+85yxHIzjFcj4XtpreYS3XirSVsVUbLWK4hUBs85OAcH8Kh0vQ5LHSrlrbxfp0t9LNK0hkulkgZGPAKlsqRnG5fyNc8qFpXU7Nbad/lp8i/aJr4fx/4Op2wa+sIrex0rTY4LJFCRfZnwI8c/MuMY9wSar315D4k0CfRtUhvIfNcHejg4KkFSM5zyOhGDUPgVINA8J2Gly6vpk01uuGZbpCpYknjvjmtS5+wwD7Ut5YK4+8izLge/WuOa5ajtuno9dfM3i1KOv3Gfd6Lfa3NKlxqls7bPKeVLNllUYxwBLtB9wKs6d4O0Rb23k1R2vza2RsFjuwJVdd27eSRkNnPQ1V1OO51DQ72zh1O0tLm4jIjlil+6TjBznI4qGUa9eNpdoJIbGK0mQ3lxHfrIZgBjYF6lSeSWrRSquNlUsvkun9LQiUYJ/CbF94WSVLQw63Jt069W609Z0EohGMGJjnLJ6dx6mm6l4Xj1qLWG1PVYvtmoWi2itBEVS3iVtygAklstySTzWNb+EtUu9b1R5teniWW5Elm0EpeSOMj/ewoBB4INbOpaDcyeOdD1MTSsllBKso2EhywxyRwOfUVLk4yVquqXb52+b38xct18P4/IkuLPVtQvdIXUrnTjDpUguRFahy9xKilVzuAEa85xzVDT/D2pR+KNf1S81G6s7XUZ0nghtLoq24Lhi+B9Mc117o7yIzIiDIBYf1qdooIWaTzPmIzgqG/KudYmaTitmv1uV7KF0Y+l2FhptrJBZQSKJXaSUtIWaV26szEksa+d/iPBqV/8Ttdazs5JVidYwsTAlQqKO56ZBr6TdJLiUxh2SNjj5MB/wD61fPusXb6X8TvEoyxZrtlGE3tk4IyK9jIqtSlVqVYayt19Uc+Mo06yhTm7K/T0PYPgnpcg+GGlpdwGKVmmcq6gMMyNTvGNrbWF1CLnUmtCySOuz5dwGMk8Y4yMfWvOtO+NN/pNjDpNt4bs/JgGyMvPIpbnqeO/WrX/C7r2Uj7X4U0+TKkAi7LcdxyvSoqZbjp15VnDdt7rr6kwxFOEVTT0Wmx0sUwieGZPEdyvnSGOEjYuWHBH3fwzWza6+LrVLIjVJkO4oIY8bZSo+bcCM/jnFee3PxcYoXbwPAq/wDPRJ2XHfOdmOvNY8XxKtZpd0fh4eaoyCt6u5Qe/wBzNDynFSV5U7fOJaxlBuylr8z2O+1u1TUJhP4llswpwIY41O0hQTyVOf8A69Wbm7tktZnPiK+xG3zOAregIA284JGcdO9eRQfE+ZUIPh0yN0+a7UkjGP7nPSrSfGO4tgqz+FwUweDOg+uPkrH+yMVolD8YlPEUlrf8GeoaXNaTXXl2viXU7lwxZo/lYNgAn+EYHI6GrmmXNtd2b28Gp3k3mlmSZ/lcDdggHHY8e1eTJ8aPM+ZvCMjhmyoMytlu+cpxT1+Mj2/zt4KkBb+7cqO+f4Y6ieT4x6cmvrESxNLe/wCD/wAj1pdHnMjN/buqAEkhC6kc9vu5qxDCbe3RDNNMYhgvI2Wb6mvKrb43K2Wn8I3CEf8AT+o/9kp0nxts5ZdreGbpfpdpg/jt61DyrHPRw/Ff5lRxNO+jPP8A4galZD4ma201wUKXO3AyOQAOfbitTS/EmleYqya1CEJG1SW+Y+nSuR8Rx22u+Kb/AFfyRAb+4aTazZMYPuCAa6rwZ4e0iXVNOgurdDm4RA6MRuB4JxmvosXTw8aEee90uluiMsK8RzScbWv5nQSeKdBCAf2rbDPGN+P51Ja6nazzRQ2VwlyhUndG5c57Doa7yHwz4fgISPS4JNv8Tpu5ourKaGSI6fZ2MFuCzzu6lSuPu7cfjXyP17DN8tOL+bX+R7CnV3lb7v8AgnLjSr+LMiabcKSCcrHyc1w3i+xTw5pVpcXN1d3ckxDyRTwAeSv93POD6fT8K9gTUNTLFB/ZMfynfuuyx6ZHA7e+enOO1YeuW1zqEco1T+wVijUeYWmkJUA85IGB1/XNdOX46dGsnUinHqr7nPi4Sr0moS5X0Z4zf+M9NjuIm0ppbdON/mbCxPcggDHH1r03wTofh7xNpgujq+pRKzfJDOirtYdwPfr071FrvgzwrYNBq0UthZ28uAksoZlZj7KOmBnNdD4e0+3s7BobLVYEvoNrT3BgIUx5zkK3qO4OPevTzTMsNXoReFg4Pvr+Oj/zPPwGHxdGclXq8yJj4G021UR2+rXIVzyEijB+vTn8azNT+EXh/UWLT32oDc24lTGC3OeTtzW5pV3carpkt1put2DxQbjK/wBjcsSATkoSMEY7dakXW7d9MeJ9eP2khSt1HZkdefuEEdARj+teBGvjoSvCbT62Tv8AP3T0ZuFSPLLVGVB8LvDsKKizXgCnggpn89tJffDbw6ZI55by+LK3yh2Vl+m0LzWg19O6Fl1zVAGZipTSfvDOPlyMY9DWloVvdtqcge/1WdIol/4+UQRybsnI24yeo9qJYjGQTnKq/wAf1Qk4WtYx/wDhAfC821obe4WPIbMcu0tjpnAHHtWN458LWuj6HearZw5jtlEjDLMxXOD1OO/XFenQW8xbbsG1s46f5FGsaOL7RdQsplQrPbSR4zzypHNc9DMK8asXOTcb6oKs4xTtufM1zc39zZrNY2shj3A4GM++T2A/ziqZjTz5ftVtM8rgM7CRVAz2PvTdGmc3H9lXVzHGsRZVRY/vsM5BbB/KtS9s42t0Sza9a7DbdqJkEAZGG7mvvW1SlyW+eu3qcqvVjzp/LT8ifwHM9t450qCKAxicvGzcMWyjdSBzyBXtKRar5ZCw7lLAjfjIx7GvE/ClvPpXi3Rb7UIblGN+ilniVcBjt69R1NfRJyrY564rw85a9pBrXT9TTDcyTT0OD1vVb+3m+zfYrEEr+8MZA2HngHnnp9K0dO02Geze4uraJWA/dkXBdH46kntmrGr6PZzztu8NSXQLnMizBS2eSeSO5o0eygt4pbJtHa0tZiXZGcMGIxgHB46fjXBKUPZrl0fy/wA/0Nop31EuBqz2ot2ttLlTHOZGUY7cYx+tZUHhtbkBZrHSmMY2u/mNktj/AGehrTntAW8uDwvbyjc3JmUZAPB5HfrirFrDe2qOLPRLe3ViMJ9oAB9egIzVRqypr3Hb5pfqKye5WsLKKxsUg0+8sVn/AIg53Rnk9BnPWr93cSWtlEk15Z21y68u4wjEdcAn3FZxtrmWQSf2Xpi7eTG33lY89QOPX3qS9k1KRYzcWWlsobBMkhbCfxH5gO3apceaV2/yHsVdQ1G6WMIPEWlITjcyxjco9QCxz+VbdrrGmTMkMd9bvM3AVDy34U5orWOLzGS0iA6khQMfWnNB5bI3lJktwVXkGs5yhJWt+X+Q7M8q/aMG+y0edEGUmeM542ggHJ/KvOtEj1KW0eH7Wy2wA/dAMgYE+3J571698cbSOfwPLe+SfNt7uI7wOSGyvU/UV4pp1wbq9jtoLf7WsgKkD5Fz26cZr67Km6mASXRv/M8evaGKu+pp2MiadrWjzRKkccF7G6N5mWb5gTweR+NfSepNcicy8SKcMpIHy85xjNfNF0Y7K3aMRtbXEbgSKVDBjjP3uSR+Ve9zX6va2t35kRWaJChBx1UHmvOzmHMqcl5/5nVhbKUl6f1/SMu6g0Oy85Jft6eXhmdLqTC7iemG9Sc4HH0qrdz6TNI2mLPLF5M7ZQLM7ZYYK7l4HBz179qn1S3Ml2Z5JdVQhFcC3GUGCegxyTkcegFU/INzCxkudaKKwbZJbxxM2OgGACc/1rijayk5P7/+AzZrpYuxXWm6bJNm6eWYR4kiV5GJB7spyQfT8az7G68PyOyQpLbTnlEt3mWR8LtPBxu446VWuo4Wmkcza5aDcCVNuEUYXGCxHTv161CzxpcySJca2u45VlgVgAR0Gf8A9dbxppq93f8AryIb12Vv68zdtrfSTFa/ZoLvDx/aFTfKpwmFORnr04PWnTXnh68W5n26lEzDzpvkniPY5GOPy/KsGd7hXVZdY1e382RVHlwIQoI4ORuOPXnr2Fa1zcNp9uVa78QXHmq8ivEiPtxzydvA54B54rGpTaa95tvzf+RcXptt6f5k97DoNurw3Mt58sRmZvPmJ2nOSSDz0PFUXutAawmsoGvLkQrHMSTLklidp3cE8/z9Kn0fzNTUtdXutW7qoYu8aKrktnAG3j07Uy7tbjTrqSVrnUL6GbLeXHAsqgAEBSAc5JIORxx25oho+SUndeb/AMhtdUlb0/4Jzk93o09ymI5lliujIGTzHBkIOfUY5PTiqsltoguHnitZnJ5MsEcjLxn+7x3NbUWgzS28d02q3cG+Mh47hFiwT32gcHjOAaurpFzbwxq11EycBXkfBb0+tej9ap09FJ/e/wDIwVKUt0vu/wCCcpMuj3F2LqS0u2k3gjMEvJPfH9altNL0aZmZYZi0cjH95K4+buV5xj3FdJf2b2JPnSGQNypQYI+o9KrNJAFVRG7SZB+duMeuB/jWqxLlFcjf3mfsUn71vuHaToNmZDdwqVcsGYlizM3XvXMfGm2kXT4buNY2MU6535AIII/niukU4UKMZB6jiqnj+0/tDwjdB/nYW+9Qefu4P58VOGnOniozk7p6BXjGVCUYo8js7hLO+hdUlQ+YN7xjggjHGeg5rqdQSVgYxLddOSZsLgjPYV52kQMQ/wBLePHYPgflXQyziS0iV/3ilActKxHpnJJr6PFYbmnGSZ5WDxdoSi0QzY8hgOyHp9K4ZThwcZ5rv4AptpSQDkH68VwzbVvM7SAH6fjXo4Z/Ejx8xT9yRu2jwec5igMsroGG0Hqe2abcTG1ubd/skkIEik5HHUH1NaMqLHYxTCB/LPy53A5P0A6VQuSzwNJFchQF6H5gfb61MZKTuazg4Rt13/q57VHfWSSFBIsQxn5wVz+Yqe2kR5/MSawkjJ5Cj5yMeuev4V5RFp95JDG41vVSCoYZm6ZGasCxOcfbL0MBknzyMnHXPqa+dllcFe0/wPfhmE2len+J1uq+GRPOsscum2rDkgwM4Azxg54xU9pZ2umqLTUJ7UuRwQhRQCD17c4NczZWNymGmvrgWsiZzJMzgYOdwx+FdDGEKlYtUYDA2+UpcqB152nJP6VNVTSUXO69P11NKTg25KNn6/8ADDlt9MaUEXGmysyck2+4njnODgfQ80XOnLFGXjuo4oJCCFitQfcd+anEnkBJBd3825yxC23HPGCAucD0q8l5CygrFdHtxbuP6VyupUjqrv8Ar0OlQg9Ho/68zEgkCSIq6lsTAYpLbMN+f9rbx9K0JRC1yojnnjbA3CO1ZhnnqcVp2jNMgYQPH6iThh+FBfkSNfQJHkqMAHJ9Mk9faspV23t+X+RcaVlv/X3mZJCJAqm8vsL8/wDx6kBsevy/pWlCNsMZDlsqPmI2k/h60rTxK2W1KBVyVAG1SWHXnPb04pkjaSJDPLNGz4A3PIW289vQ5rOU3Ldfh/wEVGKWz/r72SXUU5ieMq3zKR+YrzPR5Be6ha6YGInVXyxzjHXp07dsV6ytxHaQ+ZPJ5cC4LSSucAfU15X4Fti/jyVkHKGdQ55GBkV3ZbO9Kq30X+ZyY28alNLqzYufC88gaVplkB6LFbZcepJZgMVqab4RW/UiaexWEfKXitVbecc4Ibt6457VruGntzBNbyyIzAEAgd+/t7VZtdNkuJhIdMkUsNh8yaQDA6NxgY+lY1MbPks5W+7/ADNVQipaLf1/yOd1TwpLpVuksF59sCnO3yRHtAIwM5qw2q3M9yIpdAlWJ9plgYjbIFPU9Px5xxXW3Vm1lpqxR6dDPtcMkakhA3rk5PFRafpCPO0p0Cyzhvn8zlic5GMHjB9a5vrsJwvU1a2d0vwujX2U4ytDT8fxszIi8LaTKHuZNTWwDsXFujo+xc4Az3pL3whY2ZEn9qXo8xgiERqASeg4Gea7D+z3WECz0jT43ZVDbxxgdANo5AqOdLtpIkurW1EakY2v36cZGK5Pr1Ry0lp8v+Ca+xVtVr8zgpvDehNCHk8QyRKpAOyZFOT2Ixmsfxroen6daWztquoXCyfOmZVZcHgEYXueK9dGl2ULZ+xQAOAGAROfYnuK828ZXFvc67cJbCJkgPleXkYXB6cDA5r08txVStW3dl6f5HJiqMY09ld+pkfDfTrU+OdOZTKZYyzgSMCfunsK9dmhu45pjGgdd/yqrYIFec/C/wAt/HNqMIh8qbCqvH3D+deoXN9bWy7p5QuRkDu30HesM8nJ4lJa6Bl0UqT9RLLW0tbcRXdpLGV6Njj8fSqvi3WtR0/wtd6takyGBd4jlUqpXI9D0weuaTVb+MQwyW18sZkOCgf5snoMdMmkgW6uyLN0EojBMkTLncO+cn9OleTCEYyU5R6nZK7TimQW2s6lYWH9p6xbRWunqqszxxlmw2MYw59R2rcuNZsStpFdxTxfbZhDCtxEV3tjIwD/AFxWLr2oappOjXdwunw3rxJmO3PIbkcEDPatLVr1otE+3zW9uZYIPtGxsfIwXPBIJ45GcVdSEZ8suXd20f8AXfciLcbxvt5GlPbw+SUSxjZthOQwUn0U56Z9a5e81yEazYaNL4beG5u2O0o0bBUHVjgfdFUNH8StcXFq93C1sl1aiRbjLDnG4JllHmHGfu1rWmoaKIF8RNdiaLaqJcmIpuVmA2hmA43dqtYeVF2qQb7b7/LTcl1FU1jKxS/tjTDe3dt9gkke0uPIkQIjyM3HKxg7mGD1FWLzXPCsFxe2N75EUto5SQNZAK7DB2I2PmfkfL1rVs9Y8NQ6jdW1tfQR3k1zsuMKVLygfdZiNu7A/IU/Qr/w/f39xaactq87N9rmUKCXJ48zkc/7wpScVq6ckkvT57Ak3tJP+vUXw0fD2r6Yl9b6VbeQJWhkSa0RZI3XggjHFWNdTw9o2hXGq3ukWjxREfctYicEgDg4wMkd6c8uh6RdtbbY7Wa9k851jjbDseNxwMCpLm58M3by6NfXthNI7iOS1kkHLdQpHr0wO9crbc1JKXLv8v66miVo2drmBpd3oF1dSl9L0/7DFGHkuTbwvAnOMGVPlB9q3dN0/wAGXjoYrfw7cSSNmMIsLFh7Y5/Cie48EXH2uG5m0htse26TgBlJx8wH3ueO/NOv7rwba39tYz2VnbteL9qSZoREpaLABLcNuHAAq5yc3aKkiFpu0xNc8O+GtMs5dVm0XTUs7aMyy7LVQSB9Ov0qG/tvh/YJay6jodvb/aQhh/0VsPuAIxj68+lakrabqTSaJqjwut3DnyBOd0iMePkAyvTrxUfi650fT4tOtr+O/kjvZVsIUhlIUZXA3cjjAxkVnSqTbUJOV/J9B1ILdJWNCXW9L0W3FssTW9tBEHIjgkMccfqWC7QPxq0gmkQTQnYsgDKdwIKkegrMvtA0a90+CzmjufsdsoSKCC4kVAAeMqp+bHvmtezhS3gESSTyBehlkLn8zXNKdPlvG9+tzRRknqtBYbeVGHly5IH8Q6V85eKbiS1+KevqoMryXWflQnsO47fWvpJDu+ZcnHqK+a/H14tl8WteVYYXZ7lR+8fAGVXoDxXr5GnOdRWv7v6o58TLkcHe2pfTUoNRtpbS+t7WIRHyi00gHPbayg/zpbowRW0dkLXTZS4KEwBUG4jpk/05qtGwkuAS0cLMQFKwg8+gA4zW/qdxssfs0aRzSLtJYIA34E5P8q652hJKK07XPQjecW29e9keYXl3rk9vPp1pPttGPzQpOSuPQjOMcelT6Supm5it2trcYUjf5S5I9z3/ABrc1rT7aW5hkis5ikygSFZcGIjrkAY+nNaOi6PiB57O9jtAwKRyyqzSHHbOCPw6V7dbNP3HLLb0/wAjwqGTRjiOeK19SK/tdNusWt7bCFrcp8wtyMhuN2Vb5vyzS3Gn6Dp8cMqzy3wbv9nJ2dhgZPP1FWNRiOlRR27vFOLrGPlG4HruO7kfWorG2uw0kd0xgUrugyuAfQE9ga8mMnypqTt67/hc9mUEpW5Vf0/4JPpukaa1u0sd5bof4vNvVVl/3hjqKoS6TbTC6WzvJHQn5pEm82NfUKw/lmtRryydCg0bLkESETgjp1Hyk1XRIZFQhREUGFRizkenKiojVqJttv8ABlyo05JJJfiZ1r4ehhBBuJX/ALpcAn8c0690ydoWQrHK7qdixqfwHPyg/XFa8bszTuZoQIlG4SKykkj+EEU6x0+bVozJGiKB/wAtPvHHQ9qp4monz1HoTHC07csEct9i+wwJcRmWSWJ8yRSRII1GPXdk49hitrwRPPD4m0vyoU23F4h6KOMjpyT/ACrTvrBrK33Czb7OoCjITP0wDVfwH9oufifosMdt5cIkMjBUHzYUkZNVPE+3ozb1Vn+RzVKH1do9wju33EvDIsfQMEzg984qe5aRLdpEdIyo3bpM7R7mtB7abK7IWx3yR0qhq8Oo7BFa/YxvUhluNxJ+m32zX5/GPNJI6PaxZzLWO8CKNdBd+oHkMTjJOcFuepP41Day2SltOgvNCV3fDwxQdWHXK7uvHf0p+nxXU9/C63OlM2fL2xQOrlV+UgFgMYKsB9Kn1K22ambO2vLe08wK7QyWW/cxJyWcYHPXk9QetenJS5uST/r7n/XUpSja6J/tUC27XFxqWmi3QkNIUG1T0IJ3cHtUttqul3l6YLfU7KWd1IREh3HA64Pf/wDXUb2EGk2yLIUSW4lMryw2ZdXkx94qM/NgcH2psU9xM5+z6ndqi5wZNOCA8cBS2MjvxnqOlYxpRkm19/8AUWTKSfUtWuq2siXTW14ZTarulMdpghfbI+boemahHiC2uCkUdzqQaUgKPsRTqM5JK4Aqxocd758wubm9ud+ApnthGqkZ+7j259Kr3uk39rJBEuq+IrmNlKuIWQhcjliSN2fTHPpQoUeZxfy/rlIuXJL1rWZ4WOqSGNAzMibk5BPDAdeMfiKaNZlWYbdP16cFcqYgdpPpkkcZwOnfPQGi80eS2SKf7Vq184ZfkW6EeMZIJ4HGeD9e9V7uyS9dDPo+pOwhZZJVu0iLDggFUYZ5x/u596Kcaej3/rtdESszXgvZpJgJrHyYnjDgs43KxP3CuByOueR0xVlppZXzyOMHtkVkWWkwzSxrJpkcCIzSws90JH8w/ePBz3z1P4VuLYyfLvfgY4rnxCV/d/r8WOLgtz5R8Xxvo3xC1mz8hZEju5AoJ4Csd2efY1Xl1JJp1jac2akZAjUkn8RXVfH/AE0QfEK4laAst1DE5dN2RhcHp/u1z3h3R7zU7FW0+0dkgzsYXARgPQDOTX6XRq0qmFp1p6aLX5eeh5dNVfaunHX7/wBBzX1ozxx/at8iSrIv31IYEHLcgda93uPiB4LtQkd54m09ZNoG/e+D9flrwnUdNeyYS6xaS7BjY1yh2D0xjjPv1qK8sNKnillkguVlWPcjJOWUjPOQR/KuOvhKGK5edyt5WOp+1jflsn53Pbbvxp4BuJC8viq1bO3gSSgfKcjovv8AyqpeeMfh8NzyeKwxIIVfPnK9c4xt9a8PNlFKqSaXBLvI5Ezrx+R7/TNaGl6RJADJfQ+bLJwsTQOFX/gQYfyNZvKsLTXxy9Lq/wCRMamIm7JL11sexHxd4O1e1SzbX5d8b53wrKGPHGTt5qKXVfDKsC007DG0tumJxXFeHzHYxmN7K2VRzJ5crE9eRyOmfeti/KXKKbfSpZYJODsLD9a8ypRhTnyw5reqPQp0puN5NX9DW1DxN4AgliFxqEQdSGjAim4OPp/Om3nxE8BzRhrjUROUJwDZSHGRj+7XKy+C9H1G1eXyHtpi2cSMzZyf4cH+dc2+laSlw9r5Ucgj+VgrNk+ldVHDYKr9qba9DCpHExf2bfM79/iF8N1JO2Rj0yunvV9viv4NjYJ9p1DJ7C04/MtXjd5Z2NhLMx0mQQFuGeRs+wwuav3+hTpaPNeWV1ZwqNznam0A9Ocn8+K7ZZbg3bmcte7Ryxq4l32uuyZ3Xj34heF9e8HahpUEt8k8oURl7bapZWBGcMfQ814lLrVxDcxxRSAAHawAAI9Dntx7VrW2j2QuNjS3YYH923mq24VrxWujW1rKLiBGkdflDxiTIz69q9PDU8Ngo8kE5JnDVhiMS+ZyUTk9WvXeKQRX9wxzkM7kE+xNfSfhFZbnwdo12iblazhBIP8AFsHavnebTbJmKpPIRNJtjXdg4x06V9CaLEtm9nD5hiSCJImVTgYVAB9a4eIJ05UYRj3ZrlkKiqylIsa1bEiGWZL0gkoptpiuCRnJAI7A8/h3qOBNK+wQ2gl1Ehdx/eCUyfMMEMSOeG79OK0tRu1W0M/242cSMQ0oVX6ggeuOcH8Md6zodT3N5K+KElkDbGSW1CFcNhiRjr254Br5qDnOC309f8mvxPXlyqX/AA3+ZQMOhRW6Tw3l95bOQqPcShWZV53A9sD9OK468uNCyFgudWSFcttjaYjGMZJxz1HIr0DxLqaQanDbSawLJfLYlGtvMB5GDuIx3xj3qq7u9zZEa4JEnBMQe1XDAcEBgODyBg13Yau4JSd9fN//ACJjUpqWitp6f5nGRXFhEnkx39++/B275C3HI5xkfnz0pw+x26o8t1qturgnyt8jDAPTGDj881u6tp0MVy5OqssjgstubYISO+0gcYrnbxo4EUx+IrlCEAcSwDj65GA3WvSo1IVvh6+v+RzzThuvy/zLMF9pIaK4/tDU1gnDKrQNIwYDrlQO/qetbsGr6bBZoYbG4e1MpQKYm3Kx5zgjIHvXIS6lbOiRprzwui/OyQ/fIOeeMdBjA61ds7zfI1p/aYluCQ6/u9jBfTjrRXwakru/4/5BTrW2t+H+Z0s+r2slwtp9gdI8FlbAYFh1+6eDj161Qvta06VIvKjvxkBgGgfC59jyD3rMlW8iHnf2vMylsEC3Q9eAPpzUEF81xcrDDrN1HIzMojNr0I4PUcdPWop4OC95dPX/ACKlXez/AE/zL91q0dpO0VxDeKqn7/lEoeM8Gqw16ykn8uG3u2/2ltiB3OKbcXVvE6aTc6pci8chllKYYrnpkDGOCM06R2sGht5NXvCszFk/dI2QOSM4z7fj+NdEYRS1Wvz189jNyd9/y/zL1pdR3MIkRXTIyVdCrD6g1evYhPozwtgh4iv58f1qDS9S0q5lhTyJVaRC4dsbQAccjPB7DqK07m3PkMFcGIr/ABdR+VefWqNTSat6nVTinF2dz51S1jFzJbzxnfFIUKn1BxW4oMGnSjzY1ZXO0hyQB12nIOKr+NLZbXxXfKGCbn81WJwPmGf55qrp0032O5jO5BsJJ25zx2r7KX72ClfsfM0peym4W11L9uFaykBVccjA5/OuIvwvnrME2BsEKvX867mCaNops7AFBBOMZ4615/K7s4yc46V0YW/NK5x5k1yROttLky2VusN+7qu79wy7j9d2Kp3kUqqyxqj7+oZiD9BUmmK7acVJePgKCU9+mM8VY22zshUSEkYK7Dkt/gaSShJ2L96rBXepMniC7isIYPsPMMaRkiAEkAY65/Wl1DxkZLdbeDQ44sDBYBueP0PfNN8q2jgS3ZvKlVt33WUj2J71r+GPCVpq8ssk1+kMIYK26QyAH12jr19azniaFCDlOOi8g+oYivNKE9fUp+HfEN79iWCeC9IhAUfZYlAwOvzknJ+lby+L9NiUFdL1IuOTvkBP5ZravPByWUBj0vxNHeRxIX8tI/KYKo5GWziuHuonuBv8x2XjaRgtj645ry6dTC4uTlFafNf5HseyxOGgk27/ACf+Z0EPjaK4nMUGj30jAZ5dRUr+MZISF/sK7Zm4C+cuc/gK49YZ7Zi8L3G9uAWOdp/Cuh8Hi31G5ubeea781IlcYfZ1ODnIOe1XVwdCKcoxuvVipYmtJqMpWfoi2fE1xOm248O3L7eivc/KfwAxUaeN5HxBb6HE0m7Hli6B/QLWvPZWsCKHM3zHGd/PT6VFbaPoywCVLa6jEuRlQVJx16LkVzqFG3vQ9NX/AJnQ1Vv7tT10X+RnS+ObuD93NoMSMSThpup9enWph441cKFTw0MOM7xI3P8A47zVpfDuj3M+DDqIZ+QzMyrwM91wKs22h6ZBI0b2mq3MTDC+XudV9CpHFROOES/h6/P/ADBLEX1np8v8jjdb8QalqMu++tnMYbIhe4Plgj1UKMke9dB8HrOO98SajesNqJAS3JIDO3/1jWlf+D9AtdJlvGivpJfKLLsmJVT7irnwshhttN1CeCOZfPuFj/e53YQfp941OLxdJ4Kaoq3T8SaGGqLFRdR36nRavaxMitBZPOc5KB8dAf8AIHrVeK3QoAum6wew33u3j3+eptT1RdNmdr3EdrkATIu8g7c4K5z9MU221Vruz+3WcsElqGUF2QqWywGAM8de9fPxVVQWmne7PXlKm5efyNXS4MLKnlTRb1xseYyNj16nHWi8nnYSWraTPLBgBSkypkDB5yRx/k1marc2sN7LHM1pkbTmVpFwcd9vX6U+GRP7A/dtbbZBjCByjbjg8fe/DtWfsnpNre3f/MpT3iun9diWe02OudEldQcgf2kcqOvTd9OBU1tERGkkWiuhRsqHvBuDevOf8axrLULO1v2ljfT04MbGKKUMfTJxj2/lWtH9iuY11BooDuYMGO8Hd0BxjINXUjOPxXt8/wDMmLi9rX+X+RenFxe4W9sFMSgkIJ8kt+GOP1rxXVLWZtRuZF02EecxZQJ93GTge1eyTaiYpdkjQgd2y2F9j6Vymv6Hb390tzZXdqJpGJ2OXKZA6g9Pw+vvXdlGIWHk+dWT9bHLjqXtUrPVehQ+EqxweKbWa9aKBBDKNxcbR8hGMmvYre40FI1El/pqsRkEzpnOPc14XeaPe6dPFHLZtvkTjyI2dSoz6EgfjUQszMg8y3O09pISP5iuzHYCljpqr7Syt0/4cwoVZ0I8ijqe9XF/oip5UOr6Sc8FJLuPGPXGa5y8tNNSRrnTPElpYyrnmK/i2n/gLMeK+d/FdlHaa/Isca7PLVgg6njntUHkQeV+9jhG8g42Bce1VS4ejBKUar18l/mc8s1m5OLgtPM92uNRZXuIL/W9J1EzICiTmJEfg7l3qeCeMEgjPWprHWNL1OFo4rm1+UbGgkdCycYx6H0yMivBktrVQzNCrf3QFz+gpzWto+Cjb8cgKmBiuieTU2rc33K34EwzCpe/L+J9GaTDployiOysFfZtUiJBj3B+laJawkghs3gge34CxjG35eR8vQc9vxr5fa2iZ2zshjPH7xdpz7YpXsDFD5ySK4/hC9zXPLh9Sld1nf0/4Jos0klZU/x/4B9QSQW0ls4fT41bzfOXy41cGTs/pn3NZ9n4dNnqqapNLiUwG3jWO3SFQpIYk7ep4FeB6Lpsk2kxTrEF3ljtZsEDOM4/CmTWN2ZykRg+Xs0rDP49qzWSON4qt66f8Ep5g2lJ0/x/4B9L3lhZ36bb/Tbe8ULtxIWxj0IBxViOysJIDGdBtxG0iSttgOCyAbW+oAGDXzXHps/lKBOx7lVmbA/Wie3v9sj29zK4UYY/bHXp1GPb1rFZHpZVvwf+Zbx7Wrp/j/wD6QbQvD5vCJfD1m0bRkBxBsYgkMR6cEA/UcGrP9laU00Vw+jRztEpWNpw0hAPX72euBXzNbLdeSzJe3gc5JRbtyM/XNRiTWkdtl/qA4AJXUH/ADA3cUPIpvT2+3r/AJieYL/n3/X3H1M2kabfhYZLArFGAUVZJAQc57Ed6vX8bTJC72TO8DiRQWCru6c5Br5Sk/t+J0eLVdamz1K3smAP++qT7R4hWcR/2lrD5G4gX7g/lnmsnw7OVv36/r5j/tBp/wAP+vuPqSdtVSRybYRI5G0INxX8feobhrwMNzSlscqpPH5V8vTah4phQeVqeuKTzj7e/Hsfmq7p2pa+Q7ya3r9vLjHN67j8OaX+rsoq/tF93/BKjmTlLlcGfVOn3kZVYPKcMRyWOcn6189fFS1RPi5qMkunrdK8kcnBVScovBzWLFrHiRLzyY/E2tMD1AuXUH8cmqWmXFzqN5eXt9qhuJVJBe53OSMkBSf5c10YHKpYKUqnPdNW6kyxKrSUeXr5G/qM9vYJANPsi6THc0U0ZOxx6k9vp6Uuotp+q2/l3EE1rcBc74JRhj/tFhnHtWdPcWNgyR3Mi+dINxQgpsHqamu9Q8OxLH5V4t8SwOz5ocEc9cnj8q7aeBrTipwi35/0/wAx1szw8JunUml3X9L8i7bzaZa6d/p8N5JKo2rLGiImegyTnb9ec+lZu1vtMYa6uBHGxyFuGAGeQcDg4rQ0m2sb/TxNDFaxRu2YxCTn153sd1b8Dx29jKDoUQjiGQxCgOT6Z561wzrKk3ZXd9eh6MaLqRT6W00OZZ5Eu5HUwXO8nMhQ49Afm56eldt8PtI0/wAS6PeT69pkdzKLgIjrIVyoHfHvXNavIs0Uclvowi2kGQxOM49MD+fFd34QkfS/D0NtsERZfMlXbzlucZ/GufF1H7G8VaXrr+DIu4y5W9B+oeGvDunvnThfRzswVzFdP8o9x0xWNdaPC90scn9qNLGwKyAllB/3tvvWvq2qwJPDLJYzTgMSxRgMcY59fpVIaksLpKq60VHPkyIpHfoR/LNclJVbcz1YOp0TsireaXZLdmabVLxCmcDb+7XHp8mMfjUUWmaWNQEltq90LifCkLK0WPYBQBitSO6vL+WXZc3VnGApCSW6jHHqc5qtDcXFwRbxX14krbgHaz27ffPT6VolJ3Tdv6/wh7Vrr/X3lfWPD9vNItjJ4kvxLwwt5JC2735NT/CHR0h+JztBcRzR21vLK4B5VuFHG4nvSzXtzBctDqV6roBtBS2KgHA5L5Jz+lN0PxHF4OubvVrlILx7xAiGFfKYLnOScHI6elPlryoSpx95yVl53+SM604y956HuEhkM28NgYxgjIqlfz3AnEaNfgeWWzAi7SfTJB+b2rymX4yxGEzxaLLIgON320Af+g1Vi+NTMWRtAnyDwReAZ/8AHa8WGQZitfZ3+a/zM3iKG3N+DO+iOqlSpHiYYIbMwhC/e7FOcYPTvWhqH9pT3ciRwXkUa2zbJIrhURnIBAwRweoyRivIrr46+RdNbjw5JI3Qn7djn/vimJ8dJIs48OAjpn7d/wDYV0SyTM27+xX3r/MI43DL7f4M9aR9RW2ms3h1Rl423TSIG7HAKjPbGcdzVS2XUI5lhMeqGBmAeZrlWYZBOSNueOmfp1ryqT463cjbV8OoFHAzc5x/47UN18c50jw+iKpPGFuCce/3KayHM/8AnytfNf5lLHYXdz/B/wCR7bc6fHdiPfdXihE2lUnZNwPXdjkmor6ySaCC3kSWRLdcJ+/ZWOV2nJBGePWvFLf4zXUw82HRIJcDBY3bZzj/AHf6VE3xs1SOLedIiWMNgf6SWP8A6Dk1nHh3NFoo7ea/zNP7Qwlr834M9XmshDJJbrBIRKhVlM7vlT1zlqyp4dL+0ZkKJKf3YHmsuRkNtxnntx6YHSuBf4037R5/siOQ99s5HH/fFQt8Wr8KJpPDcZVvulrw/n92uinkeZr4ov8A8CX+Y3mGF6P8H/kd+t/okE0d0LqNZISfLkVm+TrwCOg5PHStCz8Rfapnjs9RmlaMAvhyMZ6ZzXlo+MV/vKN4btnHUhp2Ix9AKhm+K2o3G7Gk6das/AIkbd+taPh/GT+OD+ckyVmOHvpL8GanxruL7dp+q7gXO6CUud2QOV6f8Crztbua4u43C3JJJ2xxZCqMdfWtfXfFN/rWm/YZbaFwzq6uJHaQEd+TgDnsKy4bG9gVZ0fzJC20RKwVsdCcsMd+9fTYDD/VsOqdRJNXR59epKrV5oXsdBPqctzZrYT3t/ejhvJmLBMDv82QcVFpNxYPdCySzks8/wAKxk8n+IgDj60CxuktVW4UqijPRW2YPdhmprS6unuJ2gvH3yKUlbPb09AKwajytR/P/gWO+PMpJv8AL+mWJo7ZLw20U6MIjz59qwOT6ev51qLcWn221S/uFiVRlQoOP94Dt/SszRNJ8RayTaWTTQzbssRGCdufr0rr/wDhAfE0UKKtraTyDO0LwfzPANefiKtGm1GdRX9dfXY6ac5b2t/Xqdh4X0bwtIf9Cuo5zKdzEsSGPXoeateLbK5s7GWWzgjmaNdylkLqo9cLyfpXMeD/AA14lS/kNzptxahSSrPMAOB1BycfhXoWmCW10mVtUu08gDKiWUHb+IH9K+UxSdOvzKfP87/kdXtOVKSfyPGmutQuriOIzzpDKCHmihz5bfRiDj6ZxjvWLrNlbw3pia9Fzs+7IXUMeOcYxj8q6vx5cadc3TW2lSWTMSWDwMysO3JwP0rk9atVghhKsJ3tmDq0ikEkdxznvX0+CnzKLty36WJrL3X1JIrQvbKrQzTKBxubbn0zjnj1rIee4vE/s68tryeNGLOskrHJzxnPDVTvtVvo5wBcKAy4JbJ2c9gtZsNxeNM0hu38wjBYBsuPT2r2aOFnZyk/Tc8uti4XUYr8jRv7AzXkAZzZSBT8kbKpA7Hmqttp01ofMGqCdlJODgsPoAf8K1G1SFIUEUMbdfl+YkAd8Fcmq8dve3brfC8toVkB2BI2w3qc45/+tWkZ1Iq0tF/XqzKdOnJ80dX/AF5pFazvn1LXtK06ERFWuYy4EeBjd6568GvbrgqbhtoCgAADpXiCH+y9Uttbtbi3nuEcom2BpF3AHOVx2ya25fiP4siUFrW1OAMM1mSMfTPSuXHYGeJ5PY2sl101+4ijiFScva7+Wuh6oftW1ltFi87CsDJHvwN3OF78A9Kew1oqRdXWmlHYlfMt2HvtwT2/E15WnxN8TlYylvpTE8xlLZvxxhqh/wCFkeIFl33el2TyBsqTHJg/m1ed/Y2L2tH9To+v0d9T1mKPWhMLqbUNMkUDawEBUAZ6BtxI/GrLx6oZxNDf2kMTxjZC0Pm7Tj5sMCM9q8Wj8eeILoSJDaadHGTh12vknryAf51PbeOfFFpGWjiscDqNsgGPpupyyXErflv8gWPpNaXseuaiNaNlAqXttDM24St5RKt6EDORjis+5tr+W1CaheWErbSI2aEqQ2Ov3uT+VeWwfFTXWGPs+nSY4yySH9d1QXXxG1uQM7WGnvIRx98jHpjdWlPJcZF7RX3GcsxoNXuzrbi21+3nkjF7aMQ3Q25AA9Mhqa1tqTRhjd20MxYF2itQdw9OTmuLm+I+rSuANMsxgAN5auT+ZbpQ/jbXUBLWdoo7NtbH0617EcFibLmSv8jjjjaHRv8AE7ULqbO229gVc/Lm2JwP++uf0qTT4tTivC9zqCXEZAAjEGzHv1rhH8ca0i5FpZjvjy2O79aiPjvX2+5BYgck7rduB/31Q8BXatZfh/kP67RT6/j/AJnei01ISSytqMMhIYL/AKIox125Oc8cUyKDWl/5i8IJ7LaDjjsc5rhv+Fg64jKj29ntHJb7MQD+ZqV/HmuIQ32awwRkYtsf1pPAYntH8P8AISx2H7v8f8z0GAaiYZUub2OdXwApgC7PccnP41o2d84lELs7r90EDivLD4+8SXLKsENmSPvYtFO3688GmyeNPFFt/rZbZWPdLVRx7Y61hPKq09JKN/X/ACRtHMKaXNHmt3t/wS98XrbyNatLsOiLNCULEYwQeB+Rrl4HiiuoVE29pG2PlRhs8dOAKXXtc1fXYFh1B1YBvMjKwgMD0zmsaXc5jiDXDHIzk53H+le5hcPKFCNOb1XY8eviU6rnBaPua5jeSyYQ5DuuBxk5/GuLU7ZPmOMGuxhkcvgtn5Twcc1xuQZME8Z6mu6gmrnnY9pqLOi0e5jbOyaQEfe3HJI96trcQW8jt1Byfmfp71hRXEInZB5axgYBQEBvwPNWLpbQIHeIY7YQqTTlTTeoU8Q4w0toX9P1fUpbkW8kbKWGQqnbvHbHB/OtOTS7OSM3ENxf2lxJjcADkH3Of5ZrDjng8uNcjzh0j5OwfhU8d9dwzgRt5sTDcBgqR+BNYVKLv7mh1UsSnG1X3v0/U0V01TKqTX99dQsOS0mxD7Yzk/lVp1nuBsdo49ny/IOCO3eqL6srssLMMt23c5pJoL93a4guFTYF3RFiAw5+YkelYOE/tux1qdNJ+zV+48QmHepLbedoKfy/xrpvAi+ZqV3cPjf5KoSqBQR24/CuU+zatNcNcvPA9uQTgZII+h5rr/htmZtU3QFWTywDxjndzx2rPEu1KTuXhneqlZr1Oi1JMxpsWVyHBxHIEOPqev0psUstx+7mjmt48ljKLgA5P8PB7fpRq0Y+zFZBGRvUDzELKTn0HP0rLje1kDAtZOYxkhbdm4HX9K8+MeaFz03NxlY1XR7dfNVZnIY7t90VAHUHng5wKvWUw1B8XISJlwwEd31IBGMLg9zVGzt7ohbdpoJIHUYi8jsO3XinG7jhkEluGiUEgFNNLNxxwwH+ea5qsbqy376msXbV7fIf4kuEh8OyRRmwEcilUV7hlk68kf3v8K5vQddudN0/7JDp1nPCkzSmQXbqVJGCMgciuvv4ftenvsnb7I+FCJY5lX+vUelZ+n+G4UXznnu5ogMlGiCSZ7YGMe9KhWw8aLjVV9fP/gGdalVlUTg7aeRmS+MtRkTzv7AtLhVGHl+0Px6c4qqPFurckaPYIFbBzK5Ab0zj2rtU0mxNsWW3kRMmIq1uhZyeMjdn+dLB4csYrZGhtrmPaShQQiUnvuw2QB7is/rOBj/y7/F/5g6GKf2/yOTTx9qSDYdMs1DfxedLk/jipbbxlqMnzf2RaSKT3upAc9+tdM/hm3IAa21bDdPJlQfiynAFM/4RGGYMIrlrZ920LPEHOPXC9KPb5a/sW+b/AEYKni19r8jin+JN8k7odFiLKxBUXLcYP0py/ErUS2f7Cix7zt/hXKjTXg1DUN08LGOZwCenDEdM9eKvaesJWQywwyP1VWQ5A74xzXqzwOCSuqd/v/zPOhXxc2k52+7/ACN//hZWog4Xw/Gze1yw/XbSx/Eu+3Bx4eAx1JuDx+lZlxo1ivk3MNtaJKpyUDSfvDj7pySB9avQ/ZVAjOkxBZl5c3QIB9AcfyNcsqOBtpSv8/8AgnXCOLv71S3yv+hcb4n3ZXI0CNh7XDf/ABNOb4pXUEOT4Ytwo6l7ls/qtc7dWE1tDLJ5wNvnhVnOM5/U1PbQ3F1Zhbm2Dxt2ebhh2znrQ8Dgbcygrer/AMwVTF83K5u/ov8AIpeItZl8Q6r/AGqum/ZXMaoFHzpx35FaEN/cXMRjtrG1eYqeFtge31rMvLp9PtZV8lHfzMeQfmGPqDXb+HvHvgTTNPBTQhHJs2sZrbzGPqN3+FaYrmp0o+youSWitr94sPKCm/aVVF9b6fccg8ZgVBdwRQycBo9gRGHoPQ5qaO303lbkxWsZwfMcg8+gPatXWPEvh7Wp4pNO8PzPcZPmu8ZEQj6jAOcnPpWZJe6dJcrHcaUiu3AU8Kv1yMCiM60ormg4v5f5mtqMX7sk/v8Azt+QG2tGuvJiggmCYbzI32oQexJ7n2qHxAYlspJ4ozBOBgs05P4YIrWOlXPlrHpslvAnOY0nwcHt/k1lapJbLposIoQ0jTgTbyGBPY5GaKc+aSad7ef5hVhyQkpK1/L8tDv9H0y1h0Sxjlg8zZbpu75YqCTj61Tk0kbsnSLAAt8ozyo79V5/Ou1uYUS48tbSYKoAV1XKngenSqkmi38ssk0MrlsnCEZVeMDjOc/5xXzEcbLmbk7X9f0PU9hBxStt6fqc5eaTbm1FvHBDtLjOCEwPXjH5Vntps0sbW0VpaRBWxmO5ww9QSV657V1yWd9a2iLcRq8q4Uu2dp/+vTm0iOQF/wCyonJ+Zjszz69KuGPcNG7/ANeqCWFjPVK39ehy1t4dspCRNp9ssiAKTHMGJ/TigaDFawhrazt5JXYKQ82QRzjBPU10T6da+d5jaXa+YeC5Xn88Vamt1khVZLaF0QgqueB2GOKHmE7/ABO39eYLCQttr/Xkc4mjCeaQy2UnlIf3ZhkQ7h7gkYpuoeHrTDNFHJIdhU7WVCO+0e5454rfXT4lKOliIxEcgI5A/H1oksi9ylx9kiaVDlGLcqfUe/vSWPkpXUtP68xvCxcdV/X3HOSeFbF2tjHDdYBDEpKoCY55yece3etRNI8yKIx28pLths7BtUHHOP4iOcdu9abWEJWMNZwt5eCgZ+AR0qRYbi2t4YNPaCJQ5aRpMtgHkgDuSe+ameOnNJc33/8ADsI4aMW2l93/AAxlDwwsxkMqT26AHDHYxPvx2rzXwva6jbQyuhJhnkIO8Zzj3zXtFs1+0NwlzJETtbY8YIyMdCD/AI15hoUVudKSHzLTzlBQuRIWUk8dDj9K7svxU3TqKWu3mYVsPF1Ytab+Rn6ppEl/qHm6p9n8rpG0e7cfXhif0qRPDGgRiKe5N1NC4ygig5POOfT8a0ru/S3gaO80dpQuFVg+RJ2yA3I+tSwWeqSWs8dvcvbwSMD9lN6xC4/PH0r0frNZQScuVeq/4JzvC0XNtR5n5pl2KzSW0FnpcTxpEcKXulyCB1CAk5/Kq8Wo6nbOdNvPtcz5GGdiQR15PTHvVFLXUrbVvLgiBQAPI/nYwPw/rT59OnWRJ5hHDvyrTMTIVB5HQ5A9q5fZwvaTTT187/edaqTteKaa08rfcWL/AFPUJZLaxtpo4GuJ1iASEHqQOpz6mvSioQg4O3AxmvNn1TTdBkjv0gGqTxHCxbiMEjj+HIq43xRuSoH/AAjiMo/h89uPzWsauFq1ox9lDReiuYVKsYTftJa/NnT6vbm7nyth5+xdqMLoxn346VAtrfhldLe7A24Mb35J/wD1/U1z8XxMimdlfwpeApjLRTjjPT+Gpz8RdPG1pdD1mAfxHarD+YpLDYuK5eT8f/tjL21F6qX4f8A6i3SeC0dnt5dyglYyQ7N9GzjmooYprkOok1KzZQoDSurBuPTB6ViR/ELQJQ2I9TAXrm2zj8jR/wALC8LqcSXF3HgZO62YYrL6ridf3bv6FOvStrJGxay3FtOq3A1WUKH+Zo1KkD12/pVfXz/aFnMkEt7C6IG8s2mFDBsdSOT9KrxfELwrLGGTUJW/7dnP58cUs/j7w7EVDXc0YIyubdxkflVKjiIzUlSd/T/gCVWk1bnVvU5WSw1KO6dJmk2RthiLXajAjoG71HJaQHdLIBhVJb0wK7QeOPCYhWQ6k7hj837p1x74IrO8X634Qv8AwrqB0/UrWW5eHaiIAsnJAOAQO2a9KljK7mlOk1fS9v8AgGE6dNRfLNP5nmGhQwalqEkrRGTeXcp5gUgY4H05FaI05YlAhaFcnb5W0S4+hHB/n9Km8KqiwuW0qCZCFTqC5XqTjaaWf+z7S6E9tJNZhW4LxZCE8HJPQe1d1WtJ1HFf5/19xFDDQVJOVvy/r7xLW0aK8YXMZaDoRHbhCmTwWJNa1xouizqlxGzzlVOwQqhHuM5xn6mrLadcSokq6zCxMYKyeUCCRyCSW7+wqPRdevzeNps8+lRLCG3Sqvy8c8HOD6etefOtUmuam9Vvuv0O+NClB8k1o9r6/qR2egWbxlXAR3U7Y1nQMB6nnP4VSuNItbO6KQwzM643FlDIw7Zx2/Gp9aWxlumube9aS8MIRUhgAjx3JJHepNNin1SP7LFPKUjzvd418tP95xnArSl7aWqbd+lmZVvYU9JJK2z0GX1s17ZvDpumxja2WEcTY49eaypNOt1u1jnjaM4w6M+CSfQHgVYnubvSn2aldQyAHPl2x3K5HfcDxx1ya04dP0nV7G5vLrTLUTkYEjPKxAxw2VYgfQCtpqrhF+8uk+3/AA6MKU6OMT9k02t7mVDY2TkW88nkYOY2Jzn/AGTiqr6Yqz+aoACt/wAsumPX5ua6K3t0itYoH0e1OwD5xcY3rjrjBIPtmrOpREWqyWlhZkDlx5y8DH+e9YLFyjKye/mv8zeWFi43tt5M4tIDdXOLS8eOGU4ZyzNkj1OMCrWmwW9ruljhvDJkc+YZB+Q/rmrthfXL2waLT4liztP+kAcZxnH9K9fW58FaPp76Xo8Vlomso/7y41CzN4rEcHDDIU/hx6UYrGypWg4t37P87f5Mxp0V8cdfl+VzyrTfEWrx4iSCOWcEqGFrlyD0B29/wqUWHjS6c3M+hajskYsjRWDqRnv935hXeXc/jsStHb+KLC8I58mz1OK1JHrsISsK8s/igrl08La5fgE/MmpJMP8Ax1zXNGrFtuEYJvzX62KnXlFJVJOy8m/0Og8I6p4ptbB9Nm8J66wfaPtsNmVAXHKnODj3HP1rp9Jvtf0lxbXGhXrpISRNZMCFyOrJIQQfXqK8wuNR+IVrGAfh3rsjjjLQyYz+CmqMWv8AjwTKb74daqkWfmKWU5bH4ivPrZTOs21CNn2kt/vN1mVJLllN6/3Wez3fhvU9UtvMj1q6kctkR34VHB7YCtiuD8R+BvF2nNvg03U9TeRwJGScFzx3ywGPbFMTxbeWSi7tvh/qVy4jH7iS2ukZX9chCrevGKkuPiD4x1G3LXPhi+hYZZbd9Mn29OBuUHn61z4fB4+g7xirdnZflqaSx1KXuc69bf0jMn8CeKMvJHoGqiV8ZZo1bH0HNYjeEPGPkSR3HhPVnZWO12tZR+JABBrWj8a+O5B8nw81FvQfYrgZ+ny1dtvEHxQl4T4a6wobkN88Yx6fNXpxePpr3oR/8CX+ZzSxOHltP/yVnCX2leMbVzDdeH3tY8cSraSEf+g8GsfUTPaRrIH2ydHBJU59QDivYItb+Jse1pPDep2DMch5dZiQYHXhnFX11PWZznXPEej2oPJiubmK7z/wBQ/5VvDMqlO3NCPykn+VzL2EaifLNv1TX6I8d0p1jCnUbWeRLhA8YiYuCvPYN6g+9X9Q1O2twkiqlrJsMYAYb0B/2fT6V6F4xuPhneeH5Ut9Phu9djjcpe6dbGyRGx94gnaR68c+1cR4W+H/AIh1iwS6i8L6fNFKMiWa7jG4Zxnh8gZHSt1iaNSPtqt4+TaX3XYQdSK9nH77f5IwbPVZzAYp/JEYOVkjtiGdu+SDjJHfFaMOrWmoW/2WVWDH70DpubA79O9dcnwp8aQ3Znh0XRRCY9hh/tRcD3AJIFZGteBPFdnCsg8NMh6G4hvhLgZ54U5P5USxeCqySUkv+3o/5jputHS9/kzHjMNvextbWi2YHDMyJtYY7eh/EUurahJ5bSGUz7VyE+VUHuTnFYuqR6jayFNRdSoYKYpG5Uk8fKcVoyau1vH5VxaWXnLwFh+YY9/Q+1dMqPwyjaX9feTGunzRk3H+vuINO1K3eR7Y6ZC12pyxh6AH36/jU93cavbSKsInkhL4CrL5hb8COtUJLs3kxkki5CHmOMAKB9Oa17D4h+KtAtxa6NLDNaIP3ayrkxn/AGSCDiqqUql704Jvs27ffr+RCrxjD35PyaWv3DdTsC0STajdXNlGh3FGjEW0n1UAE/WgWkBtS9jOxVQciZGYv0wQcCuautW1rxF4skvrmJ/ts+GZbcELkd8En8a07jVL6AtHcW19apwMEBQ349KuWHqxjGLavvbSy/z9RU8VSm5S5Xba+v8AS9CwLKC/jjjmkCygFTicISPoBmm3to2lLHepO88UTBQsm51Htk1FfwsFW5guFJxuZXnPzfTOM/gamhs9Qv7SP7TbKQcNtWfK57EjNHw2k5e72B6txUfe7lzTo9R8RFYYorSKNjjdIoQL7FicdKdfwahod0VDWEsPLNGiq6p7r3/WsC40+4+1TCHUzpzlsPFJkI2OAw4/rUY8P61Pn7RfSeXuKkoV5XHXOehp+xhzazSj2t+o/btRsqcnPumv6+81Lu+1PVrZVtrOJ4F+d/8ART+H+NZ2yUTOoQNkcxyEAq3fbu/lUeiXkdmJLN1uI4I/uYYMCw43cEVMyacoJeSE726BGLE/XkA/jWygqTcVHTyRzubrJTctet2NszeNdi3tnks7lFJSRcDI7nvUd5oF0Z/tN5rTMQc73zkfiTimvZ+TH5tqoEkZIAlumIGexGc/hSpYXt5bjzBbzRsdxLHGfbucCtLtPmjJJeiuZfFHknFyfTV2/QJAbdgyXJmYnlcjH4YNMknmuk2wW8MQAy5zgE9CM80iRFZwHjjSRDjcgGG+lRXEtjbs53CRiMMAwOPqK1Ub+bMpVLLXRCySYsp7lgqbR8hZenbt9a408muynmi+wXGGwUX5uMkH6VySW1xLlo4JJBnqqk120dLnlY3VxS1JjaXEIjmdVWM8q4YEVdDxXeYio83qWI/lnpVSS1uPJRUgu2OOQ0RAX6VLbm6hjVfsM4K5O5UIJ+vHStG7rcwirO1tPvJAkaRM8dsjRqMhmc8/jVlftcyZeeGPd/quP0zUK3N26sXtblgwwAI8j6UyF5Vb99p0uB0CxHj3qGbRdtr2+4vxQzIVdL2OPPJi67Ce+TT7OOa3lJSWW4iwciJ8Afj3+lZbtelgyWU4xxyjEHnjNTx3WpMoSW0nKD0iNS4s0jVS6P8AE0bjU3hR4zdTbsY+aP5enqa2fh/4r0/SLW//ALRkuQ9wVwUhUjaARj9a4qWG9eYymyuwx/2Gxj06VbhlvEtljOnTsVJK5hPf19ayq4anUpuD6l0sZWjU5109Wekj4haA4XbBfSOPlOYkXcPpupw8c6XIQV0/UU4wAdmMfnXl/ky+aJzZ33mFskiMj+VadrrGqRYU2d2QvQmM5P14rjlllGOsfzO2nmlZ6VHb5HfjxxZBTs06+Bz1YqCKjXx/ZyB9ml34ZTgEyRjBFcINRujMztZXmM5wIDz9TnpzUsutXoZlTTrraQMZiOV/HvUvLqf8t/mbf2jL+e3yO6h8fwDrpV7u/hIZMGpU+JEayES6PfYb7pXacH864Nr62kUmTSr1pCOptycmmxaxLHKWGnXToAMHy2HI9s1lLLaEvsfiV/aE4/8ALz8P+Aekn4j25CrPpeoDn5VTYP50z/hZ0Qb91pGolV4yzLj8a8+l12d1Q/2feAocgCM4P40sev3XG/TrxlIK7TFgfXisf7HoW/h/ia/2lLb2n/kp6JJ8U9PIzL4fumGAuROvb8KsR/FSy+WSTw5dNj5QTOpwPwXivLE1LaXVNFuHV2yxdCf0xVx9bQwtENCvNhxkeSMGpnk+G6U//Jn/AJhDMaj3qf8Akv8AwCa8kjklvL5LeaMyytKqkD7pJPX8an064nt+I59u/GVIBYH2OPrWaurWy25WG11KBWOSEhwDmmJqCjaVj1A84Ja2JO388GvQ9m5R5WjnVeEZJxl/X4G08hEvmI6vkbW8wbmOOn0NNmu41tXDwq65B2oNvHpxmsaa9gmtPKMGrxyhgd4gGG/DtUX9oDesYtLgqDkyNE7ufUYJwPrSWHv0KljEtEzSSaB7hI2H2eFySeCwU/jWpGbSFS8d9uVsLjyywyOnSsdNRssgiyugAP4rVufqahgvrWORpTazs5/hEDnH0pTpSn3RVPERh1T+82fsV3fRSLFaLLKSSZNhiGemMnNX7XR9OtrbZcWMzkJ8+MNt/wC+f0rmotZlt33W0GogA5x5JwD9Kbea/czgFLG+3AYOEbDfXOcfhWcsPXl7qdl+JccVho+9LWR1FrPZwR+bptoyxNn5vMxkeyk1R1W+1RrhFdVjtfvbShLE1ixay4QlrG/DEYKiElR9KnHiHUNqItvqDAYVv9HOOnpipWElGfNa/qy3jaUo8t2vRG3Hp8jwbpruB3I+V2Unafx/lVLVLaRbWJHmj4bAYRDBH4DNZb3LPNFKbHU2wcsgtTtI/u+/6VNDqOLtZJNJ1DyFbKxLEw/pRGlUjLmvf7hPEUpLl2+bBLGXaz/2mg+UnczuMY9cVFLCLR0/0xbpZDnzIZuF9jkite01fTYhtbw7OI2bJAtTuP4kGpn1mwdWiXw5qMbNkxtCpP4lQvX60e2rKXwO3yH7HDtX50n8/wDIpNo88jxGK4MiynBPmZHTrkHFWF0a8hOP7SeA+ombH060+31WOBnDWOqcLgKbJ85+o4/Sqt1r+op8yafO+G+6baRcj64qObESdlY05cJFXbLTabqscTmLVN0gHy/v3Bc9hgn+tPgtNTeJDNqurQMyZf53GPb79Un1+R5I5V0K/jdTlikT/Nx34pJNcu3lzLpd+saYZdkTnBHrlcEe1TyV3o0vwBzwqd03+JrXVvqVpEFi8RapNnjy0mkDLn/gWaW3i1ZmyfEmq2qhsHzpX5+nP61Fa69aRO87WGtPJJguy27IM+uAKjn1qa7bIs9Vjh6uj20rA+mCOc/XisFCs9HH52X+Rs3ht1L5Xf8AmayW+tRICvjG6O7kZuKpPf8Aim3Yyr40+TcR5RJkbA78IePeq8Or2xTyn8P3Pz4Ejy2srAgdMgChdYw7xy2F7cxquIx/Z7nHsCece1TGjLXmgn/27H/JlTnQa92Vvm/80adrqvjOeISWmsXE65+f5VAUfUqBzS2lpBaGH7XaXbPcLt3hgBv5JAK9cjFZI1FRKGXSr+NeDsispQAR7Yqa71e5u0VDHrMQXBG2xc4I6HJXiiVCV7Riory0f4BCvSirttv7/wAzQ1vTbhrWGWIXCQghmi3M0igc84Gf1qPTZLmVriFJLlJtitF529cKc9epYfWs+HxDfxx+XcWGs3QGfneF8nP/AAGqNxdrPdbxp+rW8WM4W3kBz+AqoUKnLyT+8JYmipc8Pu/rQ3JbS/25dpJwBl5IN3mFvYdjU9tKrho5pPJuAu5o5kII44yaw7edFnSWK31mJlP+tS0kLDPXg8fnWmdckhkWWPTtRmOCCDpjLn3J5yaipTntv+H+aLp1ae7dvx/yZWjv7+a4CLbFJQ2FLThVPrxtOeO+RWpMt95LGJbUPjPVTj8elUJtZumG3+wL2AjB+Wzl5OeQRtwc1HfS2OoKI30rWEXqX+wyMV9cAAcfWlKm21eNl9/6jhVik7Tu/u/QuTzmC3dZ75YTJwrh9wQ+vHSo4I1tbSU3niNruNuQqxux+nHaqcd28Y2w6de+VGflB06XJGOPpU13rd/cWRgeDVwMEFE09sMPT5hT9lPZfPb/ACYKtT3k/wCvvRu6fFo8ejNcReJjBcHpbJbsAfq2ev4ViMkGoKUgtpLt9+1n2qVB74Y9PxNc6tjprHMmieINx6gQkg+v8IxV7TFi092lg0zxAu44ANs5AX04ABrX6t7O7Um35pfoZfXIztFxSXq3+DRa+1FNZuYbLSnt2KhGxBG6ngDjsfXvWvrs9zHbRqLHRw0g+byokf6Z64zWZBqP2WVZfsOtRBv+WZsWKdc9xk/gRV0+JWAwuj3dyc7i401kB9uh/Os6kZuUWoXsXTqUlFpztcz9MUkSBtKtAdmFMkxOG9enNay6Vo0rQi5khRWXMhVShB7hcnmqNlr0bXTG70+/t0LE/urN24x0wRx+FSXd7oMrLcR22pxyxAkD+zmBdvf5f8KVT2zls16ajpuhybp+tkTS6fpMWnwAySYik/5ZPkuD2wen171qR2ukMPKSxvkEyFk810VW/wBnLc1zk2tEXCNBpt9OhUZDWbhlP070268TTXNuqy2GqLJG4Koto+119GznvUvDV52vf7y1icPC+33Gz9hvZoTbTWdlZvGwX7QsQlJHp04/CpNRtLGPTNii0kuIEHzEEuG7EKDhfyrFtPFE8UW+ax1OSYA4BtCB1/vAA9OOlZx17y7tp49JvT5i/MrI3B9ANvSnHC13Ltbt/wAEUsZh1He9+/8AwNDp7O1toLZL6GeS7mVPmkmiYhRnnG1gR6VyNxDeSzXDxNdW0Ush3YJ2uR04H1rYPijTI7D7Mvhq9GU2sPI2gnHfA6ZqBNW0bymkgsdVsp2UgtHbtnkY6jtW+G9vRk5cr/D9Dkxbw9eKjzK3z/U5hYppgGkuZGAJ4Zww/Suu0qe5hsYHnwzJhUDgYCduB16nk81iJd2FsfN/4mRc4KrNattznn8KtxazYOkyTtrbl8+VKlsFVeOm3H65rtxU6ldK6ucODhRw7fK0vSxvyalGhcvaR7cfwRYyfzzWFPqIaIPBaJAcjLkM+RnkkVnLqHk2pi+y3l0WGA88EuUA6YUHB/GrA1GwEagWF47qOSbJhn/CsIYZU+jf9f1udM8UqmnMkXbt7RU8yLUA7iRSVVMc5Hau88TXUo1W6RGYq8rZIwFPJryO6uYp9TVxaTou8FMwsv55r07W5VN9KzZVmkZiD2BPpXHj6HLKnfXf9DowVfnU7eQkCycvJ5icdc9R6VvaKBNCEijKAHDdM5x1/Gs+0aNodofzh1z1rXsZ7eA28lwZmZWOM/dTjHSvDxU3JWtqetQXK73NjTGuLR1KSGSMjkSu52+4x3rbfWZDMggub1YTtRm8w9fxNc/HJZXZY25VmyA+Q3zD2/xq9aFoXSeCLMcZ+668GvDrRTd5LU7tzvoLt4oWJlmfaOnmtx7VWuL2R5MR3VwF7ESsM1VDsY+n3gCRVe9la3t2lREyMADsK8aKbdhKlFO5havrF8bxo3uZnCsQrK7LgA8g+/TmqeoXrT225/PwoP33LGnXRjYPLKY0cMWy3AIPXFZGsagps1Fq6byeQ2Dkeoz/ADr3aNFSashNqKOa1OWSOZyjxOv8OVyapSxCYgj5JADgAgZPcVPeSMtu7KiFSPlO7r61nkbrTa0Y3rymOSPpX0tGFkjya0rsqMiRWd6do5gfPvwa5iy8cXtrara6cJ7NRx8p3Z9cV0l0c6ZfEdfs74/I15nam4BXbZyA4+8EYn619DgqFOtGXtFfbf0Pn8fiKlCUfZu1/wDM6x/Fuvll8nVryRAMFfOwc/hWx4X8ba6l3HC+oTzMv3w2dvrg5P6ivP7czQSPusp3UnIDIR1/Cu+8BeF5rqcapd2P2G3Xq7jBx3/H+VPG0MJSot1Iq3ohYHEYqtVXJJ367na/FGyTUtGguJkUylNySEDcvBI59K8ktLmV4RC9xGu/hwsYBPpyBXffETxLG9m8FmGlVFKxgAnkgj8gOc15XYboQBLazjJ5IiJ/GufJcPOGFtPTXQ3zfEQ+srk101OhjuVEJijv3jROBuYqAc+g6/nUTXVus/lkvIZBk+SwBX65OOaoiaxBGbC8l2n5S8BNPa4sZYtj6Vcrzyfs/P1BHSvTVNI4vb3Vrr8TWilVZVniiZZQpUOk3zdPY1O8t9eRBbnVZRBjhSfl2/7RAHPasGe8ijTda2N4XHQNEwH41Aup3pADaVvIHUo1Q8NfVf195axqjo/wvb8DeaxPmps1GORumxmxn356/nTlS4WZ4jcXFvF1zg4Y9MgCsKDU5TGYrrS5mRjn5VPH5ipJr61kC79Lvjs+7hSMfkaPYz2b/IFiaVrxVvv/AMg122cI4kD3UY+5KjYwfoeaeNYTT9Nitbixt5LlQQRwSR6k461Wg1G5adRLbzwRrna4jZyB7gnBp17NbXMblorrzGPU2xI+orbkulGauczqK8p0pWfn/wAHUisNZZpVVo1iQtjKtyPwFa7RRH96WMsqjnYD8ueRz9KyLfUpbb7ljI3YsUbIH9KkTVJF+/HfOh5wV6j0z6VU6d37qsTRrpK05X+RoedOGHkpbM27dvbdx/jTraOCZiGvIgzL80aueT69elYV5fSXFuYUtbgBurYxn0HAqsIiojKWMzMpyTsYbv6j8KFRdt7Cli0paK6NuayghuVlRyxz8hD9Dn0/oao6jfBVLKhimbIbdAoz/hS6S/ko5nF9E5bIxDuA/EgmqeqLJM5KPeThRk+ZHjA9quEfetLUyq1Pc5oK1+heh1eBAyq5TPUmPNTprkSP8sx2AdCuQfwrmacCvVjn2rWVGL6GEcXVjszo5te3KojuSmGydqEcU1NXt1UI1xM3UlueSfauf98EjoKmhjVwcRMw/wB8Cp9jBLYaxlVvc2f7VtRIH+03PTGATj8qkGvghR55UAdDk/0rHQRjIa1Axzy4FM80I53Qwevyjd/Wj2UHuivrVWPW33m/F4gTawlucnGAVhIP86jk1ayaIYuLreCDwxGf/rVjsq4RjbSBS2TtXGRVmW5gNt5MelJkMSJPJO/8TThhqb1vYirj6yfK1ctnUrfBKX1yC2dyHJz/AIUttqlnBcKTd3Lowww3MMfnmswRqW85FMYGMrICOe/bpTjbKEMxCBR6E4/lSdOK0LhXqtJm2db09YjtuLng8Dk5/Gl/t2zkTD3VyoXlcA5rHs4I5nVI4/PZj8qohY/kK6TSvB+p3ZDvapbpjAMp2n8hk1zVfYUlebsdlGpia3wa/eUzrto4/eX9wAeoVDUo8Q2QjwZpDg4Hynp+IrWj+HuoOEdJtO2qevmE5H/fNVtQ8F3sUZEM2mSOM/eYjp9Vwa51iMHJ2Uv6+46nTx0Vdr+vvMsa3Z72H2yXYB8oKsefU9KX+3bYnLXshByDtVhj0qRvC+rgDGkxyhu8Tqcn2p8fg/XidzaWiIvILyIAf1rV1ML1kvvRj/tj0Sf3MrjWbLJBuZ9pHPLcmmrrNuI3/wBMZQRgLtc4rVXwTqkyE/ZLWMDGSZQQP1NSweA51crK1mjJ98iXp+GKyeJwa+1+RqqOOf2fzMZ9YjEQzfyAHp8jjilm1oEqWvZFHG0bGGfet5Ph1PL80d1Ayf7+P5iszV/D1vpX7i5ubB5l6xLLvcfXAGPxop18JUlyxd3/AF5BOljYRvJWXz/zKp1aAsFa+uS/U4VqBq1uCUkurkA9Cd4OPwoj0hBAZPJZ3HbYMNVa4tI0Vml094xnGcDit0qT0X6GTliErv8AUsz65a+XmK7myv8ACAwzzT012w8kxi7uI36llTO4/XrVKGygllRUtoxx1ZiQPrVtbK3lY7NOkZvTcB/SlKFJLb8hwniJO91+Iqa3aCAg6jcbj1yGIFLHr1vHKc6lLIo6YLKTSDTULFDpk28DOPM/wFOOm2LEbIrleOR5Zbn64qWqPX9C19Z7r8SdvEtp55kFyxbs+1s/j60f8JRCHZUv5IlYjlYyDVIaZDBunlST0B8gn9CcU57R1mjjW1i5Iy0qIq4PfAORxU+yw72X9fcV7XFrdr8f8y63iS1dGSW+mIzuACng/lTR4js96s2qXe4cdW496gn0tEllWOOOaQ8qVh+UcdiG70waIzRkyxRod3TAx/X+dLkwyX/Df5Fc+Mb0t+P+Zqx+LLNISP7SuSzA5IaQDn2p6+LLCCMeTqV6S/LqsrgA1S/suGBQ7+RN3xsVce2SabY6dZXh3WsJhkzy0kYOfpnj8axdHDWu72/ryN1Vxl0tL/15li68VWT7JY9SvHkT7offxnrzmiHxckcWF1SdC339iMGx/vdajstEtoblpb2OeWQHAWO24/PGPyrQtvDGmNMzLG7KRnY0XIH1xzUSeEgrNO39eRUY4+eqa/H/ADKyeLLa2Hl22r3oySWbc+DSt4xTejjWbssMgjL8Vfi8M6WvE6xxgHOHwAf0pq6BoRYorwyFTglGX/Cs/aYN/Zb+S/yNPZY9faS+/wDzMyXxcHzu1W7Ye7PSSeKoJU2nUbr02lnIIrSuNB0vGyKJfMU/KCmQ34gVBL4YGXIittmBtLjGTWkamDXS33EOjj237yf3kEfi2JYzAup3iwuR5il3w3HpSP4ogQFYL+9KZyA0kn9KemiIboQtpqH1CFR+RJNbsHhOz8o+bYTRSgcKY92fxAAqalTB09Wt/QqlQx1TZrTyZzjeI7WNYwuoX2Mk4Z5O/br0qRvEglTP9oXKop+4rOD+Xeugm8LaZMnmrbLGiDDB7Y7vrgc1YPhPSEhQyRIMYyVtxx/WsZYzBq2jubrBY2/xKxzg8WkwKi6zdrHGOEYuCfp61MnidNgxe6kTnLZZj+tdEvhzRJEaUQQBVGFLhsZ+hAwKpXOj+HGlMflvGw4BSH5Cfqwwaz9vhJ6KD+5Gv1bGQ1c4/iY0vi1JZtz390+AQNxfHX0FQT+J7Artiv78PuO47nAx2wM8V0cvhHRCGkLuBjJAhXj9Kit/C+hPbtPbvLKM42pAGb/vmqjXwW6T+7/gEyw2Pejcf6+ZgReKoYoFhGqXnJyTucFfxqdvFdnG4ZtV1B3HVllfBPtntW/H4U0PKoJ1SbG5lkjRTj6dvxqT+wvCds6pdqm3kmZsCPP4ClLEYR7Rk/69BLDY5byj+P8AmYFp422SktrF4isCGwXY49OtSjxZZQz77bXLxVcZOS4K+gNb0PhfQJoxJ5FtcI/MTW6swK+p4qV/B+ktbPLDpwZgM4w3OPbBNZSxOBvrFr7jWOFx/L8UX9/+ZzNx4tgniZ/7WvnYtk8vj3pG8bwTx7JNRv8AdjBJmYdvpWxH4bhkhDf2ZYwP3R4mJA9+OtPXw1ZTKoYacpHJb7MQPpyOlX7XBLdPT0/REqjj3tJfc/1Zjaf4qjSOSMazeRRk53fMSR9etRt4r/fMkfiK5aFscP5m3PXsa3rbwhZzvPEtzZfKRuVLfP644p83hjQLOHzL5Y3Kd4uPwA25NS6+C5tm36L/ACKWHxzirtJLzf8AmYn/AAl6xH5NdnDNje7CUgH8T/SoB4siKS79ZvNxOSUdwG/CtCDSNC1Zy9rGkX8JWeVQ/HtjOK2F8FWQhLxpHMoGQVQMT7CqnWwVPSaafy/yJjh8bU1hJNfP/M5M+J7QS+dHq12xQDBYNkHtjmoZfFUMszPNqV4c9CpcZ/Wuzk8L6MLYF9PlS4ZcKCiMBjvgZqquj6faoZbmyRgpwpES/IPTGDVRxWEeqi/wJlhMalrJW+f+ZzEXiewLh31PUY37sGY/hTh4qt5Nztqtw2wFY1dpN3Pfg1uppWgTktFYyOUPzr5IAx6jABrMFhpX2/MltBFbscY8txgeoPX9K2jPDzv7r/A55U8XC3vR/H/MpL4ls1I/4m15jqcl/Tp19agPiKHypQmp3LDjqXBYn8c10KxeHiqrb6QbmOJtsrhT+nH86pXX9kSMskWnxWuWwYJUy4Hr0BAP1q4TpN/A/wABTpYhJfvI/iYp1+FkaManeYzkhmcj+dTW/iGwjfzTfXAlQAISWOfwOcVeFrp9xdiTEXGQVREA/EEfrTbbTxcz+Q0VjjBP7ryt4x9SK1c6LWqt/XoYKniU9Gn8n/mUrnxLFNHtk1e6OWyUywH+FRvrtuU8sanMEj+ZQAcE+nFXW0k3UxWCzdkDcyCOMt78Bq0P+EVRrZmkimjA5ObfP8qHVwtNK/6f5DVDG1L2f5/5nPTeIIpY97andeaeH3hmz6Y54qt/atqdw/tW9Izgfez9etdSdF8P2axi5WWSV+B+5K9PQHH86rw6T4fMsha8njKOAwMMYI+g3ZP4VUcRQ6RdvT/gGc8HitLyj9//AATm5L9JL+ONdQnnHmLgOTz+tey+Jo5P7TkaOQHDZdf89a8yOm2E1y5tnngZPm3TwAA+hBHety48aWy3Zg1NXEoUAzIDtfjr6iuXH0pV5QdJXsndetjfBS+rqftmle1mdLbtFAxfc0Qzu2sSA36fpWuZI3Vd+ckZya43TvEGlTDb/akWwHcqlThT9Catya1BFKht7pbiIjkDaCD6GvGr4KpKWzuepSxULXTVjsba/lWYHzBIqj7pPT8u9dBYyLM6lWDs64IEg+Xj0zXnQ1KJlcxeV5pH3RKBuP1rQ8P6/FY5keDc+ckFwcHGMZrzMRgJuLcVqd1LExvZs9hs0YQIQ6Mo+8Wbn8OTWZq9yMMr5Cr0A43c9ea5CHxYWyXtDGO21ic1V1PxC11HsWHK4w2Tg4+teNSyysqnvI6/bwtoyXWry1mYTFVEoXYdso6Z9x1rAaVVyyru57EVm3t+hvgqoNrks7ZyAPrU73VpEu554gCM8MK+kpYV04pWZ5tTEczbRZmmEkQRo9oxkkkHFcqdTge5FmGbzUZkV3zluc8EDBq/d6mGUSRXNtCnIKuwY57fSsO71bTIyrPqESOm7btO4gkYzj8a9fB4ZpaxPMxNdb8yNC8MKaZdmczDMLDIU8cdfesnR9U8GQWiR6lbi8dVAVxO6MOOc4rDvvErJpsljDM96zlszSrtwD6CudjQtGCEkY7sHAGMV7VPA80Gptr0dv8Agni18yUaidNJ6dVf/gHqKePPCenA/wBl6FaqwHDyK8rD/vqsXxB8RL/VBsEpWPgBSMBR7KOPzrK0vR9IulVlv5Y5SPuuFZf5ZH5Vfj8IRlCyStORk7YpEYn8NuaxjhMFRnzSTb7u7/M0eLx9eFo2SfbQw31Zm3brmZ955yxH54qSPWShLG5f5fRmyfpmumg8DWzqpae6H1jjwfXHep38D2G4A3ciZGQNidPyrZ43C7XM44PG7/1+ZhQ+IbdDGxuWYZ+YHdn8sGln16yk3Yvrhdx7K2R/n0reufB+kKR9ouMHbxwq5HrxUP8AwjGkBiHeNmPCYOAfYjacVCr4Z6q/3GzpYxKzaMga/Ypz9vu3xwFIJ4pDrunuQzXVx64+b+lX5fCSSORbS2YOcbdjH9StQnwzdWzk3MERQjAKovP61anhn11I5cYt0rf15lM67a5kDXkhjONqqrBvpnNR3GuQNBshu7guP4mLDNWpdJjWHJ02dhjKkW+QfxFZ3l6cs5jksQCOv7t8/l2raCpPVIxqSrx0ckvvHRa4EEXmymQkndh3G3n9amfX4BKuyUlDnOS+V/xqrcwwyQhILaOEZySVb5h6Z29azZfsw3B7aSNsZUDpn3zj9K0VKnLWxhLEV4acyOij16wXLm7n3N1GGIH0qG4160lQos1zGT/EF6c/WsNQ4jLLYlozjkqf8asfZruRFZNLj2jnoeR+dHsaad2P65XkrfozTi1ayXbi+dGQnaUgI4zUb6zAZMrfygHk7oM5NZs0cjxM0thHFjoY1PPtxn86hjtd4G2GU56DzFz+VUqUN/8AIzliq23+f+ZqpqcDwORf3YfHKknB/DOP1qFdWYQIhupGG45O07h+tUBp9ySdtu+PqCagngmhI8yKRD/tKatU4GUsRVtrp95bSxQfLIJuRncAMfqan+yRRRmW3QtIvJEkfBHsc1lbjgDAOOeRUq3UoQKCAAeMdqpp9zOMoLoaFoyoGLafBg5xvYZ/WplurKNtrWNpg9WEi4FZIuJTuBcnI9ab9oYHaEi+uwZpOFylW5Vp+SNeC4s5UwbXTM56Oz5/QUtu2mmfYU08FupG8gfQnFZEdzJG2VEefdAaet5IAfkix6bBUuBca210vuNkWG/e8TT7SeiLkH6e3vU0FhfAKY4JCq/xvKBj8CRj8awft8xIysXHT5BxTxfz4OQhGehFRKE7bm0K1K+z/r7zohpTO26G7QFmOVk+YZ9M5oFiyHa1xZs+eM5A+hNc4b+dT8m1T6gc0j6jcSACTa31z/jUeyqfzGqxNFbQ19TtLSfxFaxkQSaZaqemyIEt+IH86Q6z4tZgxWzft80KjP61xh1K4IUHYdvTg8U7+0rjJJWM9uVrL6om7tJ/I0+uR2TkvmdjF4k1+Biko05SD8wLuhH45qZPFd1Ex3Wtq55JaG6wfwBU1x6XcjNhlQjaD0PpToLyRmO5Ijz/AHelTLB0nvFFRxdRbSf4HcWPjDfKjSafe4UAHy5Vcj0z8oxWvF4gilcO9jqDgckMY0H9K87t5GZ3yF4x2qb7VcQriKZkGegrmqZdSk/dVvvO2ljqkfjd/uO8uvGVkil5dKuCAdv/AB8R5/IGq8njBZGZ4bRlOMD94jFRjvzXCG/vBMri4cE+mKmXVr9DxPnHqo5+vrULKqUVdR/FlPM5yfxP7kdhrHibU7qwFrptoYJWADzM6kqP9kKTj+lckNB3SmSbzSxbJYklifwzUa63f5XDxjJ7IKsR6zfEE70BXoQgz1rajQlh42ppK5lVqUsRK9W7t6Ei6YwkaJ9wJxgkMAPxIq0dPs2jjVkVSCMtHGoOR6ms2bWtQcl3lDN6lQag/tzURlVlVRu7IBnFXyVpdf6+4SqUIdP6+83pI47eRf8AR1YE53Kp/XmkuWtYXPmXFyikkqd0gT6detYUniDVC2TMpIHGUBoi8Qal8xZ439jGKXsKnV/j/wAApYmlsl+H/BNVrjTAc/a79udxVnbkn8aN+ljl9SuVDehNZja/qDMo3RDntGKRdZviCS6HHONgp+ynb/g/8AXt4N2t+H/2x0ttFp32Pf8Ab7mNV+Ub5Cgamw3umrMY49QJ2no5Bz+OOawYNdv2kUFkx0xt9adLrd7CsiRiFecA+WMisHQldpv8f+AdEa8bJrS3l/wTpFvLQxsRNGSOg3AZ/CmFXaTLT26ADcDlhn2ODXPQ67qOXPmRHC5H7peD+VaA8S6ku+MeRjyt3+r6nbmolh5wen5/8A0hiac1rf7v+CaUFygLxsxlx12zdB+fSoUklhikWztooSTlT5jHn1wDWcfFGqLZxyjyCdxGDHxxUun+K9TO6Upab8kZ8gHH4VDhUjd2X3v/ACNI1Kc7K7+5f5l62vLqSERXxmV+QxR9uR7c1Aumry0erTxhjnad3HtUN34u1j7R526DeRjPlCq1341114zEZINu4NzCCf1pxhWb91JX8/8AgBKpQStO7t5f8E1rSzvVfd9qmmVeQrc7vrnNTGEpKUSCBeCWxBH8np/DmsmHx5rqowxZnHT9x/gamh8Y6wC277M+R/FCDis5Rr6tpf18jWDoNKzf3f8ABL0On2cciStbzKC2QGuMqw9cBajaCEXjobcNCc4O58gnpjkD8Kz5/F2qBlHlWZx38nGT6nBqb/hN9cVkdBZKP7otUx+ozT5a/l97/wAgf1dLr9y/zNa2g8hxNaR2SsOPn4b3+8xra068uoE2wyWViGGZCkwAJ9sf1rjJfHPiCSRmMttyen2ZMD9Ksjx3raKqlLJ8Dq0HJ/I1zV8PWkryS+9/5HRQrUU3ytr5L/M6KVrZ7wyS6gjTK2VdJFGCeMABaiuLS/nVxHql06dAmSSPXhQKwF8fa0WANvpx572//wBerNt47117S7cizDRgbSLdRjnFRGlX3SX3/wD2ppKpRejv/XzNNdF1qCQCC8vpRnjCM6gf8C/wrbOl3Qjiu7rVUJjH+qEcbHd9Ccg/hxXJQ+OvEflb/tUWdxXHkrjH5VIfGmvSN5rzW5kA+8bdM/niipRxUnry/wBfIVOeGivd5v6+ZuCS9hmkDXGo3aLglvP2Z9QBg/nXZ+GtTYxnbZyq/QRy3QZvXP3K8sk8deIo3IW4h2k4I8lcEVMvxG8SqdiyWoAGB+4HSuXE4CrVjZqP3v8AyOiji6VN7v7l/meoXsuq3ZYxaXbrHgZW4ZGyM9MFDmsrVLXxNJaeVDa6XIpPCGwQ7B6gkACuG/4WH4kRUl821boSpgGD+VOk+JniIpzDpx9jb5H865o4HEUmrKP4v80dEsTQqb834GnPpWstI6zXFtaE9dkOwE+mV/8A1VqwWN/pawCDzCrn5RbO8gTI6nHAFcqvxN8SAcR6aPb7KP8AGtPS/iR4iYBgmnqTjlbUVvVWKcbNRt6/8AxgsOpXV7/15naaNLqazSiXUPKQH5DNau278ecflT9Tk18RBGngmjkbjAGMeu0rXGf8LS8S/apx5Wn4RGIHknt/wKq7fFPxJwRDpo5/54H/AOKrznhaznzcsf6/7dOyOJpWtd/18zo5tN1G8uEj3WxRSCypAig+2TgVu6Ho0ttERPZ2cq5wGMKuc+53iuFk+JniUzBVFii+XuwIO+Pc1SuPil4qaMLusAM/8+wP863lhsZViorlS+f+RHtqEHzO/wDXzPTNc0zTJIiEGlrOnKPFbKWVu3/LTr9RWbp+p6nE6Ry6hOgAwZI4k59QFOcfnXntt8UPFLvIrNp5AVv+XNOwzTYPib4nhsdyGyDs/LeRzg9uvAqo5biVDlnyv5//AGpk8dRvzK6/r1O/vbSwvrpkn8Q6i0rDdskt0AAz7EHv60unaPFAGZdTdowflXy8BvrySK4BfiJ4kiuJGjktAeD81urdf97NWF+Imv3VsrzxaezAdRb7f5EVcsHioRSUlb+v7oQxVCUr2d/68z0e9is0jJ2uNgy4jYkkY96w57DT7mdJJ7GY7fkiDzFhjOR8o4/MVyUPxD8QQbzCtmhbqREef1qrN8RvETSMh+xlVY4/c9P1pUcFiIbNfe/8iqmKoS3X4I7u51/U7C2EVldajEA4DRi1XbgenyDP1qtHrK6jembXJNSuNi4jyCgwOxAXrXFX3j3XjCHza5Iyf3Wf61nRfEPxEjZRrRT7QCuqnl0nG6ir976/fynJUxtOE7a/d/wTvp/FOmws0MGgysucLI1wyDPv8gNULe6ur6TzzpOlGNgxVgwZgPfIzXJHx7r8p3SG1YnqfK/+vQfHOuAgj7KCOhEXT9a6I4GUF7sVf/FJ/oZSxilrKTt6L/M6NNXf7QiQ2EKbyA0oTGB+KitZpxdwqIWnc4J/1q4PHQhWHH4Vw6+O9dRSv+iEdeYv/r0xfGevszMLmNeN2FiUc1p9TqS1ikreb/yI+uU46Sbd/Jf5nX6RA1lcyFdCyWxgvcB92OeMg7eau3mpalM4mk0+4gYgLsiaIjPrkqa4RfHviaNQiXiBRx/ql6UsHjfXd+Ge3fIOSYh/SpngqzfNNRfzY4YyilyxbXyid4v2u6hH2vUbq2jbIZZBFuz9QORXM63pkCt5i6pBO7/I6sFI2j1xzmspfGOsM8u4wEZOBsPH61BH4x1gBgBaZB3A+QM/T6VdHDV6crqy9P8AhjKtiqFSNpJ/18y/N4d067jEg/syIHptuth/IrVSbwROnzpHLIh5HkSZOO3OKdB4s1NFMwisiZBkg267QfYdqkfxdrR8plmjQscELGAK6lLFwdoyXzb/AMjjlSwNRXlF38kv8yong/Vy4w13CB0LSDI/Wn3HhPWIlZo9WkcqAWO/p+tIfFetXNwFmuImwOCYVOPzFIfE+sCJCLhPmyT+6X/CtlLG94/18jn9jgO0v6+ZWfS9XgtmkbW5o8EbY8tubPcD096bHY61JGCuuSuzHAjR2Zvx7D86sP4p1k4zPGeP+eS/4VGviPVTwJYlA54hUc/lWqeItql/XyMnRwt9Ob+vmIugaoyBpdUkUEkbTJhsj2LUxvDcroxk1OUsOgJzn8jU7+INTk275Yznk5iXr+VRT+KNYjJxNGcDPMS/4Uc2K7r+vkJ0cEt1L+vmMt/CkMm7z9QKkHjK9R+NTr4TtI1Z3ujIpHygcZPpms2XxRqyyMEeFA3JAiHX8asx+J9UwkOYSobqU5/nTl9b35l/XyJpwwD05Hdf13NOPQtIUD5xEwzjIDHp9SKZcJEUKHU90eMDZaxDA9PWsv8A4STVC53NA31hU4/Sqza7fngGEYPaIVMaVZv3nf8Ar0LlWw0V7kbf15M1E07T5zmO4kaVQTnYM1bTTwir5Op3ijbkZVSoJ9iawoPEF+bh1xAFx08oVMdevHnZWitDgDB8haqca3f+vuJhPDyV+X9P1NaW+1+zCpDfQ3SEZVZ4uPw6/piq0UviR5iTaWJJ4OEAA/nis1tfvdzjyrXGD/yxFN/tm7VwAkHU/wDLOqjTdvhV/QxlOF/ilb1/zubrP4qhEkkUVtEQMt5bqCffpVZ73xXIu43s0e0ZICE4/HFZMniC/IjDC3bGcboQcc1ZTxBqABQC3VSQSFhAzk+1NQmt4x+4XNSk9JS+/wD4YSS48QMR52o6kM+xA/mKiktrmVA02szk5xglif8A0KluPEN/D8irbkZzzEDQviG/aFuIFPqI+RWic1skv69DN06Lbu2/X/hyE6bakfPqVyf+2Wf601o30tt9ndOXbkAxc/zpB4i1PPLxH/tmKWbXL8urb0U7T0XHWtU6l7Pb+vIwccOleN0+/wDUiZNW1GZ9sZjeR1xJ5oHP0zVqPUDbqEvtPgmJGQVZif04qgNVvBbB94JDYweR+VRf2rdSS7m2A+wIA/WpcL9DVVOXXmbfojaW+t5YP9H062glJwB5mMe/uapPbXT3ruY2kRwAQJWH6D+VUH1K6KqDISAcgEn/ABobWL0jkxkjGCV6YpxpuHw/qKdaE/jvp5JFq4tpUZ0TTvYHe+f1NMtbeaJ1Eun24/25nx+PX+lVf7ZvgSwdNxzklATzUR1K5cfOUb6rmtFGVrP9TnlKkndX+5HQSyRyBRGlqXY7SN3y/wDfQHWq81hbsAZpERcD5VkbAPfnnNY7ajcGPyz5ezuNg5oGoXKACPy0A7LGMfyoUJdGEq9N6yVz/9k=',
  late_night: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCADcAyADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD407Z96XnGe1J2I96X+A0DAcmhuOD2pF4IzTpPWgYhyAPWlYEICfWg/wCsUewp8gzgZoERYqQjYiFlB3jP05pCp8sPnqelWEieWBH3xgL8oBHvTSAr5Xun603K+h/OrLQOCMiLHrg0n2djyPKI9iRRYLlfil4PoPoKsraSkfKit9GpjW7jgxqD6FxRZgQjZ6/pQNmeSaesEhPCfqKUwOpwY3yfQZ/rQBEQufvcfSlwvZ/0pzROG+7IOMn5e1II2wOG56fKaQCBR/z0X9aUK3Z1/wC+qXy8feJH1U00qM43LQA7ZIemD+IpPLk/uZ/AUhXDcFD+NJt5xgfgaAHbHHVCP+A0m1v7h/I0Y5wP50uG/vEGgBMH+4f1pDgdVNPO8Dl3z+NMYtxkmgBfl9x+NHy5+8f0pVMg5DEU7fJ3b8wKAGYHZj+lBB/yKkBlPRFP/ARSkuv3oo/xSgCLafUUbT6inmQDgwxfkf8AGgSIP+WKfmaLDGbT7fnRtP8Ak0/fH18kfgxo3p/zzb8G/wDrUWAjKn/JoAPpUgaEjmN/++h/hRmH+4/6Giwhnzeh/KlDEdFp2Yv7r/lQGj/2hQAzfzyKC57cfrTjsY4zgeppQsRP+s2/WgBu7PXmkLU9lQfxIfoaAikcFPxYUwIyc9aBj0JqTyv90/8AAqTZg4wv/fVIBh+lG4+tOK4HIGfXdQUwzA9VIoAZk+35UZ9h+VL6igjHXI/CkPQTPsKXcfT9aT8aWgA3H3/Ol5PQn86bSj2pgKSR60gJP/6qdGMyrnueaYOhoEOOfb8qQj2HNKMcdPekcjigA6df50YNOUMeAAB7mlMe0/6xf+A5NADOlAODninlVH3t5/DFOCoBkqn/AAJ/8KAGI2FIbPtR98AKHY1KGwfl2j/djz/OlErfxPIfq+3+VADFSRh8qYHvx/OgRnPzyxp+Of5U8vGByISfU5Y03zgPutj/AHUAoAFiUtyzuP8AZQ/1p7QALxE3Pd5AP0FQmXJ53N9WpN/92NB+Gf50DJvlTvbj8NxoLbiPndvouKg8xx0OPpSFmPVifqaQyzxnlOP+mknFNEig8GJf91c1XooETvMScl2b3wBTRKB/CxHuxqKigB7Sc5WNF/DP86QyN64+lNooGKWY8Ek0lKB74ox7n8qBXEzRTtuOxoC8dB+dFguNozTiR2AH4UZPY/lRYLjeaXDelA56nNH4UBcTvS496VOe1LtphqNAycUEY7U4jB4owBxSAbye9A/Cl2gn0oIP4UAJ+NJg04KR3oAzxRcBMCjHWlIA7/lSD60XAOBSUtHei4Afakp5GRwDmkGM/NmgBKP50p29gRSA0wAetHNB68GigQd+tH4UUd+9AxKfGMg/Smd6kgGSQPSgBmOcU5utIPvE+1K4OzPqeKBDRy+c/jT/ALxC5zjqRSIP3mO4qwiKtqw3DezDvQASJ/o6jPuKlt/+PRRt7mowGmlWFWUDGNxIAAq2YgrAKVAAxgGrgr6ikyPymZSHyMAnH4Uixc4A4z3FaUFvI6u5ZBuRlGWHemC2nKEhlxj5TuFacpHMU/K2cq+GPYd6bt4JYkk1cihlGdw+h64oltdiZ8xWbjt0o5Q5jOKkNwfzqzEgO08kEc0kqfOSeOMjjr7U62eRH3BS2Qcj6jFTYq5HcAqm5GH9w59G4pw3vnrgDjPSkuN2wSAEbWBP51IW+8JBj5SB7Gl1AFjkQbpDlfY1EwZmJAYD3qaF12gbWHrkZFIPM8wtGwIPtQMbJDOmVILcA8j1Gf61GocqQIwR3+UHFaL3FwOFIySAeOwAqOVnMZTOCSTgdwaAKWF5UpGO/wByosRrg+UhJHOV6VcSBwwV0JJzxTDGS4XbgHFAxEhtjtY26Pz84BIqpqcKQTfuwQrE4Gc4Ga2dvmbLdIyCGIyDySTVLxJGEkiUckFgT+NJrQRVs4RJBu+YHJ5BIqbyUAK5kzns5qTTWP8AZ2woCpc4bHINTxRFDkHfwDgdM+hoQ7FKW1TOG8zjnOaaIY8YDye43A1qzTFJGSSE5Hde9RGAs5xHt345PvzRZCehnmNc4SR8H+8oNI8JRsMV6d0BrWi0uQ5Z2x354p3lMj7SFGO+OadkFzGS2BG4MD6nZ0/WnfZwV3Bo/oVP+NbjW0DAhZNreijOaSOztCz+aSMRnGTjnsKOVBcxHtsf88wfo3+NRtAQODG30zW60NvsRk4AYjcRgVVmAR9v7vbtzlDRyiuZsdpMy5CKR356fpSNaSA/dQ46/N0rUWVEUqSzA9s8VXaZVL+XkKe1LlQ7lF7WfgbF57hhQttLkhoz+BH+NX47n5Su0YFRq2ZwjkoC2CcdKOVBcqNbSAcRSY91/wADSfZ3x9xsf7hq1E7M5KHDFTjmpN+HJb5gc4z/ADo5UFzOaMDjkn3UimFVwcOD+FbMMG90Z14bHNY2P3pGO5qWrDFRc9qkkQxySB/ldDgrU/lAQsV6k4pdRIOpGUjiRVkI9OBQ1oBUQZRlbHAyDTWO+QtjGTT3Pyt6lj/OmEYfaPWkArAZ6UgQsOPzp7BcYpMYNAxHXjtxSKak+VuSM0zB54NACxj98vPU0wdCfSpIhiZM+tR9AaBBRjjrSUo+7+NAwzx1o2nGeDR1ooEAU4zxSjJpeCO1GMDigY0knrz+NHGPu/rTsMB0ApvJ+lIQnHofzpflxwGz9aQjFFAxfl96OM8ZpKUdRQAcen60h+gpetGKYBg4pQPrQCe9APPTFAhMD3pOKkAJxxwaRkw2B+VAxOKQD92T3zT9uAQeKao/dn6igQrD5seqikGRxTyPmb2ApuCegoGK5AI5z9KQk4570u09+KUrkgLz+FADQOc4pSCRinlcAcc96Qjnrx9aQDSBS4X+KlxzwKfgn+GkMjxkcUdOT1+tPZeONv0pBuPQn8BQOw0DOcUhAqZImI5dgPrSeSM4GT+VFx2ZEVKjLcUDr1qdYwcAKSf96pVtZCv3E57lqLhylMhRjLfpSDHIqZ18tmG1cqcHjNA3bT8mB/u0XCxBx6GlI77TU8UZkJyCFFPaFduMGi4cpVwc9BSkPnnFWIYlNwq4yMHipzAA2dqj6igLFAA9NwH40FTnGc/QVedPnCjH4ACkCken50XFYo7e1Nxzip5BljhgDk96iVSTzTuFgIA6NSHg9c0pBz904pwQZ+9+dILEfvig59Ke67Vz3zSZwKdxWsNP3QaltgfmbpgGo2+6v0pyMViZf7wxTJGKcg1LIArruzhVBqNF6D1NS3B8yVjjjNADIupYdSeKfLywReW9qVgUG0dSORVzSreP/j4cg7WwAO3vTSu7A3ZD/wCz7dLVfPaTzsZIU8fT61E1lbgr98A+4q1O4GT1B6E9uagV90u/34FbcqM7sdFp1my7i84/75oTTrV84lnX1yBUyStESyDcWj5GOgPB/KhXkjiLlSASV3A9+P6U+VBdkUem27HH2mVfrj/Gmvp4iJ2Xbbu2P8c0qxu5JHPVuOwHNSoUVCZACWBAyfUUuVBdlVoZVYg3k4x168frQIZg2VvJcep//XVgBklZhyMcnrxQzM4zux1ABHQVLSGitPG4VAb5pDnOCpG0Dv15xTmW4yR9t3AdCU61NNBFsDSyKR/DxzmljhUxuzsPu5AP9KVhkCR3AzsvUPGTlD/hTobe8LAx3kAbsMkf0p+xVTKkgnkjHuadDDIZ+CfvAc8UWKsO8nV3YJ9oicgZA6/0p5TViVHmWZboAdoP8quIzCXEchGFHGSO2DVto2Z3kEbKxbdhRgVOxooJ7GasWtlGJjs3A65K/wCNRxrq27d9lszjscY/nWs6jczlPm3dcdKuQwiRUUKrZ7qhJrKdVR3OmnhZTfusyrNfEBk82DSbWRgOw/l81YGqy3clwwvIhE6u2VAxg55Feo6Lod3PeqsQlAJBX5cEV554wiMGqzwsPmjuJVJ9SGqKNeFVuMXqjXG4Cth6UJz2bH6CdRFli20j7XF5hw+D144q7Lc6ioPneHZBjqfmWuv+Efg3UNf8MS3tlG0gS4dCPTAU/wBal1rwtqGlkiYO+Tk4yf51k8dRU3TvqjopZPiqlFVV8LV/M4SW+lyJG0KVRjHEjY/lTpNUnZVA0WVVHPQn9cVu3do5Rd4YbeMEYNUJpp40CRJIhHoSB14rqjUUtjhq4aVN+8ZtxqiS8NYXcZHYNx+WKadRhaMAWN2GX+IVJO7n945zJzvOf51GksiJJiQqSFwT67hnHocZrSzOVjG1ZA2fKlU/7UY/xqrPfLJzuk+mzH9auSlnj4Ysec5OciqzttT5lPQFcDPOaaIe4JewYUszABs7Cpx+lQvcW4DlJOWyMFT09KeXkfzZMlSWJAHvnI9utQ7pE6OwoEOE0RTAnAPqwNEckOCHuUOfr/hQ3meUpckBuQT3FCEiNslTn/ZFIYEwHdmePGeNpP8AhTyYsDbcxAjknPNQk9lKn6AZpWIGAycnIK7Rnt7UwFQJGyt50RCnP3+adlJDzLGBjklqjUKSQEHHQbc5/wAildYSuVRScngDt60rga1mbeOGKaS8gwsgXZ5gzjB5xXP9bk47k4roodMsZ9OtXEO2aQjdtY8jnP8ASufjAFyV5ABNEgRptEpiBRuMDdVW5GWkyoG0rtOcnGMfl0q5bwbPvZAIyD61FfxAbCiEsdwY57Yz/Q0NAZ0nzOx/GkjGQWND8jPqakT5QAOv0qChpUn1NNUhSG4OD0q0eFAUj8u9RyBmyTGP8KAIictnrmkdX3Y6U/O1cFQCO9GCRk5OKACIDz0BPsaifgVIrBJEkxwDzTJRj5e9ADSKdjIA9qdjik9/TigBCvHSkJPToKdk9qXjrQFiP04pwPtS7M8etIBjigAyT1NNp+RjpSAHj0oAQCgfe/ClxjntSL98/Q0hDacv3l+tIoyacBh1+tAxoFOxkZpoGTj3p/IXFMBqjPOfyp1KQFIAP1pcbnIAH50rgNznA7ClY4J28U6MbjswCfWpCu1dxA+gouBCFJFNKncKlB7dadKuTH7rmgdhvBd8AfdFA4Ip6KTM46dOtIV2nHBPtSHYYeueaViVQdM+1SKMjOBnPpRKjMoHrQFhsQIQHrn1q2lrDli5kIX04zUcURaBSckjgAVfaJDje7biM8LSuWolFbdOSRx161JdW223Mioqrx1bmrgQAeXsJLDjgZp025AhkiYKHXJJ6fhU3LUTLhXGOnXnjNPa3cElI2Ze2F61turSDMaPnGVPQmnMjFEYxuCOOWFJyBQMFV2/KwKkfeB7UMijuDn0rTgWIz3Bm8tT5h+U4z+dSh4VPDoF6DFDkNRMlYj5sec4LAZq79mw3RsH/aq5dxvsiKqzbZASCMdKjlMpVpFjQKBnDNz/ACpcw+REKQxj/lmoHcd6ju40W1kI4470C4kIz5aZPQZJpkjySpt2g78KRjmmmxNIjMMSgbRnI7E01IU3HCgk9jVx45TIoED8+woeGWOWN2gIG7nLCi4WRUaNYZkcAng5wvSpN4xv8pue+2rN4jeUW8vgDPL1CY5Ci/KoDDPc00xWIocljIqMwYdTgUjoVzhM8dN1TpDIkYQOpx/s/wD16TY+/aWx/wABFJMOVIzY/uEEckmnpsGS+aVUIB/3iP1p7xqFy5qrkpEbbOij/Cq8w/eKAPfirDrzlQMY9agcMXXnmmmJoSbhAM55qI9eafM2QAR0NJ8uSTxTIerI+wFPcfu196aQcJx1pz5LBBzjiqIHQYXLsMkDgU5MnJAJb+EDuaRUYqVQcDlmPQfjS7wqlImyD95sYz7fSgAdvLGAd0p+82eB9Pf3rT05M6MpBGTcsOnP3RWUFBzmtTT5QNFeIAbvtIYccj5f/rVcNxS2LS26FFcnJJI2+wGaryL5Um1eAanMj+WFYgHJxngcjFQPkykgcYxz7VsZEkwP2ddqgKdylgPvdDz+VRPGXTBywwT9KuqQLGNFyrHczZ7nj/CogPm2twDkZ9qbC5FCoQtjIbGD9O4/GoZVXBA/Sr0iBQrEE7iDwPTP/wBeq7JHukK5xnI7Emk0O4yMOskqwncitgEjqPoafAq7w0jEAgk8ZycdPxqa3trhZ/MVW2sRlsEjB6jpWhpuj3F+WVJoItvP71iP6Ukr7ClJRV2Z8kUUgyoCY6Ae/bNLLYeW21mBGwN09eatXNo1s+CyOq5XK5xkHnmrGlxQXN0kNxMkKsQN/YA+9KbUVdlQ94zY4lA3sHOIycE4HWpv3flxyKU3ZyRuJ5ya7rXvCOg2Gnh7bxPb3jsOUQDI/I1RsPDGiSWJnbxFbb/7u0/L+dcDzCla+v3M9TCZZWxSvTs/VpfnY5aUBsxqiru549MVIA+/YvmCJlHHbOKS9tkW8kCzK+3I3KOtMdmjCupbIjUfXGR/hXWnzLQ5JxdN2Zd0y2ub678m3jaWVhhVGPTtXW2Gh+KSFhfRLtmQZJCjt71xWjald2N4JrWYRuBkMB7e9dHb+P8AxPEUlXWLgFsg7gpVvwrzcZQxU3+6Ubed/wBD18vxmCpR/fOXN5Wt+JoWl9qGl6m8dxDIjof9Xjp+RrzjxlI0urTytndJcSsc+5rqn1u5urxr29nBllbGcAA/UflXKeLVIv2yOfMfP5iujD4d0rykvea1sc+YZh9ZiqcW3FNtX3O6+FPiabSfDElpDAzE3DMSrEZyBx19qm1zxQdWkAyYwpwx3GuS8HuF0aXdKyL5hDYGQBgVKfJWUkTMRnJIj/DpWawFF1XUtqbxzzFQw6oJ+6lboa1zMpTHmBlPAb19qz8ebCrP82Tt4HQVUlnLJiKQnaT8xGM8+n0p2njzbhYSSqMzfd6iutU1BXPOqYqVVpCGAZIRRhTnOfp0qOW3V92TtOeckdfcV2+n+BUvrNpY5nHyk/MR6VU/4Q+Hy3la4klKfMT0JHTGfwrFY2i20nsDwdZK7RyN0kYiKjjkA4PHNUbtI0uFQgbQwDOo5PvWjqoW3+1W8fZ1xk9Bn/69ZkvGBnOQMZrrTTVzklo7FSQsFbbg7gUOeeO59ugp8ajyAdoO4srckHHHFSeXuz6g8D3/AM80xSUbaSwjDksMdfpQIgKqAMndTiApdAFIU1KI98kYyMM2057c04mNi4WPb8zHrnvxRYCvMgWZ1A5Bx9KUK8YEqMS4cFGB5HX/AAqeQp57hU6gs3sPamyP/oeI+Asi5GO+DilYZFC2H3YByOSeue9K+5PlxggnIB+lMTOMEd6kuCPNO1mKsc/N+lAup0MErx2mnJtxkDnHbnmuUUEXrAHHzH+ddWl0XtNPjCoNoHIHzHHr7Vy8QDX5B7k0SGjpre2kU7flOcFX9PbFVdTs2VxGJDyOGX34/wAauxPIkQJZhnAbA6cVYtGTzYsujEOAAeuc9qYHH3kcX2qVYR8ikbR6U5RiPGcGpphunkXaAS7E8e9RkZJA6e9ZMqww4GGyT2xRk578+tPeMjbsHTrTDu6nNIYmxS2T+VNbaGIG5aeKDs3cgHFAiJk3BUHJJ4xTXGZV96sIwWdGCkYDfyNQMMFR6YoAXHHPemnAG0Y609gcZ7dxTM/p60DsAOOcCl2kgt2pyrnHalXKqSOvbNA7EYBK55xQQTgZFBzggg5zmheTgUgE28E8UuaUBOQT+VNOOg598UxWEx9TQuN34GnZwOOtIB8/4UCBMYYdqVFyy896E+5QMeYo9DQAkY+XPvTtvXPFIhwB9acPmZiDj29aBioMEhSD9akIGdzEg+xqNdpPQU4EknigBw2hgRgGh8E8nnHSnImCDn9KCi7+Dk5oARV7bcGmyZkdFHUDGMVMoJ56UwAfaCGHBBFIdhEGbiXkYxRIpONvT3qWJW+0SnOTSyKONuMd80XLsMXPXqKCMHPapTG6jOOKf9nYxkkjgcc1N0PlY6zUG2IDAHJ6jrWvB8vlkDPygk/3fwqjYQlbbg4IY/jWlDPbwld0rMx++wyCKwlPVo6YQ0Q64hb7NMSuf3Z7c0S2vm2/yRyybl+QlT1/HpV5/IuWS2iWUNJjJ5Ax9avPaz28MeNixZ2klTwPpWEqyW50Rot7GGrLbRxx3Eckb7BkY/8Ar0rXcbKuUdsdOOlXdX0/7RdRNuZVMfDeWQOtVruxaNwhO4lenc0OrFsapSSdiom+dpZRGSHbIIwMe3NRmCQwlAMA8/fHFbuk2W7TN0eVcOcHGamlt7hIgF3szfeCIQf5U/aq+hPsm9zHiRJod6KiYYjlu9QyhzbyBUUDackk/wCFbNtGYbeSK4WQbpWKZQ5PcfjVe5e32PEA/mlSANp5pqeonDQ52OPcnPWnsqfaIAqkHeN3NbMmmwhFAD5PB2mq32GBL0wh2yFDj5uatTT1M3Ta0FMOX3bjj0FV5oykm8/MP7pFXhZBDzLIR3y5zVK4jX7cUJkdRGCASzAHNEZhKDW464j8y0fcG5QkHHA4qIrm0iIwMKO/tSyR7FVtjEntsY0hUgEtA3A7xGq5rk8tiKLasmS3PfJ6VJKY3+XegA5zuFVEiBUER8EdAtMKEksE+UetV1Fd2sRLChUurbsk+hpRCg656cmtKKyia1jk3OrMufvcZpv2eJRtkVyf980+YjlsZIVPJBTeXzzile3B5BPA7mtT7DEqZjUgd/mNQX8CRISFA+XJ+Y/hVXFy23RjTjGB0+tMCZPPSpZxlkIHFJknjirRhbUhDEbePu9KVcqpYck989KDGQOq09YiUwNvPvVmZHkkAFiR1xnindF470oifgZQe5YUTxSQyNFIu116jOaAJLYDzBnPsKvaUIzCRuKt5h57e1ZoJVQed1aulRyNprSYTaspySPmPA4rSnuTPY0YrMzEbDuQcY96tNpkhjVvKk6kEgfLis95FAjXftJB3FAc5PPP0ol1ZFTyRdEEnB3E8fkK3uluY6vY19RtdPFtAto1wZCuHMjoRn2xzU2l6FBI7tf3Twpt+Xy4w5J7DqMVz7Xtq4QK6Eg5+ZTj9BWnbavYRRKnyhgMHCNg/pU+7a1xpSXQml01omcGQMoBVGDDOPpnjrRb6XYSWLSfaZRcd08r5R/wLP8ASqw1PTwXc3DeY/TETbR/Wm22pWiHLTnJbJKwt/hTvHuFpdhs8lxEDEtzIEODtVj/ACqSP7UkAmiuZFBzkluvP/16j1C906aUvGZM8fehOKItSslgCTSyZwQAITjJ/wD1UXiKz7D5oiRmNi53EyEkcEmnNb7I0kBVlwAecEfhSXWqadK0jRM0JY/KPLbAH5VFDeWBt3Wa7Bk/h/dtgfpTvEaUgeTaGhRj86k5xzwaWaWRR9n3LhkyNoA6etMS5s9ys15CxCkDKtxn8KltLjTWuPMuJrdOo+Utz+YqLRL5pFYygXW7aFOcAfhSzvutyWU5BHbqCf8A9dWRLpckrFru3RBwTvwSPbip9RtIltl8qZQNowPXmqSXQlt9R3he7+w6iLuWBZkiGWVlBGOncH1re1PxRFeW5t1s4YhLkxny0yvOOy1zVpC7QzFWDLsPRqqXFtnyxvIyMZFZyoRk+ZrUam11LyKPNxhH2Nk8Z49RWH4mlMlwGP8Az0c/mRW3YWsrwmQKSIyCQSPXFYHiAn7SSxyxlfP506ishwlfQ2/CLpBoxeeNXikmZOWxzgdqv+WDYGaHCZXB9RXOaTMzaWYF2gq7PknHpV4XUsaNFjKsvUE4bIpxinETk0yzdQpFMEXls/MOpp9n+7uFfHOSRjjGB0qm0kkl6yeUSzbV4GauyrchBthYfuznEZqnFNWJUmtTpdO127VI4zC0kRJGzcR/KqC69cQrPiCQqxwwZvWs6OW+MKLGXyOmUPP6VVuBc+UGImZ2A3LsJrm+qQvsdP1qb6jNXgk+1I0qKnmgMRkHg0klsqMSMMoAH0JGafcPceasjpIf3e05Q8DGKs3UM8IDPHhHAYbRk9Bx7V1KKSsc7k27mLNGIow0ZbMvbHvVfyndmZwB8pP5c1o3MRdo2IcFTnoalt7XIkI2gY4yOvFJxDmsUbJQdnyHh1BJXjk9ahlRPO/dAgZfr9a2PLaO1kTAO4jgDmqbW52NIpyAcHPJ/wA80cocxm3CF5QNoG0bfr/nNNVjCkZOWAfeVz8pP0qysfmXYI3KCeOKkitZ707Le2mmK9kXOM1DRSZTtUDTIhDbGbBIHIpXTJOTjagP16CtQ6TqVrAfNgEDAh13yKvHPvVOSF9rKZYBIoxgSpyc9OtToPUubkjito1GHDAkkVg2jBNRV8ZwxPIrYiLABpJ4N24H/WD3rMjs5UuN5aLaSeRIKmTKSOltGM1u7Schskc/54p9uqR3cMat96ReM/eOazrScQlsyKRjAXcMe5pvnAzeYX5znjtVXQWZmyk/aZBk53tnn3NRg7zjkfjQ0dzhsIcls8EU8wzEg+Q+T1+WsW0aJMjbORljx0pM/KeM4p7JJGAXjZVJ4LDigj3AB9DQIi4z0NOwAeOPwpcf7Sn8aAV5ycfU0hoRGCzKSCRtb/0E1FKoVlx7fyqRiijCt2Y/oahkb5gPQCgCXaMfWoymTyePWn/w5U9uhpOGBy2MUwEbjBzn604ncvyj9ajfr1zSq5BwD+FFhXHfPn+tNwO5qxaokqkEZOTzSMmJmVUU4bA96QyvhexFOAQnnGK7PR/h/wCKtT06G/s9Gjlt5l3Rt5qDIzjoWz2rSh+FfjiXiPw/Ef8AttH/APFVhLF0IuzmvvRn7WHc84K46EY+tJ0PXnFelTfCnxzDxJ4ehU9cedH/APFVAfhv4wTroUI/7ap/8VU/XKH86+9D9pT/AJkeerjaOe1KuDIDnuK2NVtbjTru4tLq1jS4t3KSJ1ww6jINWPsSG3aRYwMKD/KtvaK1zaFNy2OdQVIqAnjFa2o20a3GPKVRtB4A9BWfdRLHGWUAHPUURqKRU6LjuRpgE+mfyqU4xgVXRyepp6g7vv4/GtLmViRR709FAPIzSIQFIIBPrUiA7fvdewpNlJDdy+hP1NLsxKnGfl/nViGIOSdpbjmpobcS3yryFyF/Gs5TsbRpcxHFCRcuTkZVamSJCSNre3Fa32CMXJUtxtQttPOMVqQWdhJJmOGeNR91WAc4/MZP4VxvExSu2dqwk72SOeWwk+UsnBGRnjPtRDazrclnRCh4KcHAHpXfaV4bt7pic3Rb0S3U/n83FegeE/hOmpSA3KXcUR6OEQfoT/KuCtnFCn7rOullVaXvM8PFjCyZgkMZLfPHJuCsPbaOtWLzwxNHE9xbXljcwpjJjkwSPoec19Ut8B/DAsY5V12RXY/xQDjABYdeuDVy3/Z+8NwxrcjWbuTIBVowqgj8M1xSzaV/cW3ozeOHobTf5o+ZPBf2K3uozeW8ruD8u1N5P0/wrs7zTknijb+z7gwu43Hy9u0e4BODXvDfBXQLILd6dLcR3QGWZ5A2f0rm9f8AAshQLPe3qPk8o20YrxcZmEvbKfK0vP8A4B7GCp0pU+SMk/keJ681t9vQQwyBY1KkMmOcjFUrm2W4KSvE4TooA6V6dfeC5ouIpQ+G4d41yfr61zuoaRd2yPvlDOpwR5CjaPx7VrTzSE2rPUqeAkvQ4mysNPFqy3KlJAzE/Mw4zxwKjurKzjngKkmIkllyxAGOp/Gt7UrO4uYI3e4jbjjYoH/66zTbXSRnaWeJOD+5AGffNevSxvMr3PNqYNLSxRcafE2I1XJ5I2HgfjWTqRga/EtthAFHzbOp+ldF5dzNAI2WMIo4YxLzWZPbG3kDy+SqOTtLcZ+ldNLE8zt1Oerh+VX6GYWmUNul3Ht8gFRJveXzt0nm7dpIA6VoTSQlSrSQA/wkSLgVXjvvLgeNJoo2DZDFwQfaumM6jWiOVxpp6szpru93FCZMA+2D+NWtFDSzXDOrbtq9SDxVe6uopnPmzxL/ALpA/Go2ubZACl7GrYwR1z+VdKUrfCc7cL/EbVzCWC7j+BHWqF20PlvETg7T0OO1UJ5dPkQBbsb15ySeT71VvZvOKk30R+gxj8KqnGXZkVJxtuie1ki+zrGFO4KN3Y0kk21/9UckYAyMGqsMsYIzLg/3sgj8qfLdqX2mVSo6Hbj+VXyO+xn7SNty/Zug0+FHR9yLg4Gec0iTQyBsE5B4BBzWZ9pBVh5hX0wAc1BazR+Y2+cLxxyKrlfUlzWiRtidDH5ikgf3thIqjqE6TRbEwTkfwkHFQFmCELKWXrgMOTUG+ZvmVcKKqMSZSZHIoAZAv6UxUABBX6HFOeR8/MuT0pyFckEgZ6VoZaNlEYpT0600cUE8GtbnOSAExj6c1NqXMsEvd4EJPqQMH+VQRtgDAyNvNSXbAwWqkn5UP/oRoAGwYyT6Vr6ACdIcAgr5/wAwx2wKwyWEZJ+ZTxn0NX9M1CG3sWtnjkJZ9xKnA6Crg0pakzV0a1raz3EoGF3dcA8KBWVr0Kw3CqAMhiG+tWbbVYIXCkvtHOVHX2qprV3Hd3DTgnLksBitJyi46ERTTIUAxgnjB/lVdegzVleAc9MH+VVAflB9qwNhx9qTJHpRnjrSEk96AFBNFIKU0gEwO9IfrS0ECgBMkdCfzoJOOp/OjtQcYNAjRkjzErr90oP5V1+m+ZqFna7DvLLtZe644zXGNIwSPb0MSgitjSNZGnW3l/Zp3ctu8yMkYBA44+la0pKMtSKsW46HYweG0Fvj7SdoJ6cg+xqO50aKTYsMkRZApIB6+tYMPicA82moPER90se/pSwa7axtvj0vUAxBG4uT/Suj2kO5zckzd8uSBTFcwLHGQRuXBAFcF4nCC8KxklQ7jn610EfiJo4ZI/st26t/C69P/r1y+qSy3Ny0nkyICxbBX1rKrJNaGtKMovU0dCty+kySvFuTewB98Ctbw/pt1e3QhREYgc7yBhce9ZOj6ilppptJrWdsuXyvTnH+FSwa/FbSkiykkjJ/jIBNEZRSQ5Rk2zZ1u6ntmKRTyxgfKArlcDpxisa/mka3ZlnmOdgXMh6gnP8ASm6ndC8umdCdgJ2g9QO1VLl874/9pW/Qis5PQ1S1K889xHIqiaQAqD96omurjP8Ar5Pzp92rSSIy4wECnJxzURt5f9j/AL7FZLYt7iNcTt96VjikW5uF+7MwHsaX7PLz9z/vqhbaU8jZj/eoYajjd3e3H2iQj03Vd015D5MxZ2IfDDJx1ql9nlA524/3qtWeYYFVgpw+7Geoo5rDUb7nQzMT1yFdhk+tSW1u83nxoyNGr8ep71jy6xvJK2MS45A88EZ9/WpLbxFdRptjtoV7nEmBXX7SJy8kjS1K2jMMflMgl2gnnB9DU3hVXtmvA6ggorbT3IOM/rWHfeIZrpVV7S3wnQg4P4mnaRrYj89JIEXKYBU5J5qXOLKUZI3r+5N3FcQSyIGGEHYFiMgVy7gyWc0mMZTdx65FTz3imN5UXazTo4ycgbRj+tQKG+xsvUGFgorCq9EdFJasz88c5/OmFm/vN+dOMcuM+W//AHyaQRSkcRv/AN8mk2TZjSzf3m/Ok3N/eP51J9nm/wCeUn/fJpRbXB6QSf8AfNTdFJMarP2dh+NPJkCZEjDBB+8eaPs1yP8Al3k/75p7W90yECCU/wDAaV0XZm5qMe/SLhsAEKrrx1Gef0Nc9AAU5AJzXRXhxpNzknIgA/UVzUbYQjIBz61lhm7O/c2xiV427GhCsf2V32JlQcHFVfNJ52x/98CrFoymzZS6gkkcnpxUQhTA/fL+n+Nard3MGnZWI2kZuCqfggFG9/SP/vgVKYUXH75Tn0x/jR5cX/Pdf0/xouFmS2SLK0isEJUAjgDvzVFsqxR+oOKuQmKKQt5gyRgjj1qtgtI79QSTQhS2I2yKRvu5p5Uk5GSfqKbtYqTjP0qiC7pZUKpb/a/pQhC3hBOMS/1qC2mSKMq4YHOQQKe09uzlipLMckkVNtS76WPpv4a61o8HgvSYZdSsUlWDDK1wilTuPUE8V6HovivRbZlP23SnHcNcx/418SJPbD0/75qZbuAf3ce614lXJYzk5c/4HE8InK9z7g1nxhol6nyz6YpA4xcxn+tcdfazpxkbbe2Jz0xcJx9ea+VUu7EjLyKD6BM1ILrSsctz/ukVl/YqTvzP7v8AglfUFJ3czY+ITJL4r1mVGR1a6kIZSCDz2Ip4Kx2LArnfFj6fdrG+1aYy7TISvpzVmfVrNoSguNpAIC7CM+lepKm3GMex6+H5aSevQl1xYUl3ndjam7H+6Kwb6RGt/l7kVZ1XUo7lischKcdV64AFZ8rB0Cqdxz6VrRpuK94WIrKUrRIlHy571raZbRyaZcXDorNGGYZ9sVmBNo5P6VsaXuGkTxjdmVCq+n3gTn8q0m3bQxpJOWpBEyZ/494PxU/41ahaPdza27fVD/jUcNncMMhV/wC+xVuGyuwcCNf++l/xqJSXc1hCXQsQPD5i7bC0XJA4Q5/nXsPw08JeGNRsra71bSLSYCa4WR3BAOEXywcH1JxXkMNrdLNGXi4DAkhh0z9a9c8CXrRQWLI52h5w47NuaMA4Ppg14ObymqX7t2PeymEXU99XOnj8B+EWnDSaLApPG5WcfyNbT+APCFnp09yunFXjhd1IuH4IUkHrTluAhPJI+tVtc1aWLR7xEcLm3kAGc/wn8q+SVavNpc7+9n00qNKKuor7jE8IXloJIpNoVsfOeMN+FenaRrKKESJtpPHGMV8/+G7mQxpG7xNJgcbxz75BxXb6d9q3Ex3UUE2zMYMoJ54/ya1xWE5ZXuRSqqcbNHrLawL23hdJI3WNnYlecE4HX045rXg15LW2iWQoiRjBJfAx9DXjdpdiyiWxMs8syiQ5VfkB2kggjj8KkXxG/n26y280vlgb90ZJzjr71wxhVTbRToUZq0j2+08Q295GJ7eZdp+6S3GPpVPWL20MbSzShn4xuB215xofiE3BuQEuELPuXFs/Ax7CrF9qFkUMks85mz/HbyEe/wDDUTq1H7skZwwNKEuaLN3UningPmSxbyfl2oe/v2rj9X0rddCAshhIJZ+S4A6j3FStrukQJ80uXHHEUhI/8dqjqWs2F4AsPzMORvicfj0FZRp1E7pM7YuKVrmY+kaeWZ7eED5iOmBmsXUrCOEtCrYeXPyAZ59c1ZvriVJsG9LBn3NsUjn8arXGpRJ8/nxkhushCn8sV6FKNVa3uYzcGY8lkY5CzIzJtwQeg/CuV+LHlw3Gl2AVf9F08TMM52vMzP8Agduyu4+12cxZpbq2zjJw2c/hXmfxEnmutd1eaVssGWMHGPlVVUfoBX0eS80sReXRHgZ1yqglHqziraad1ZnmfAOBzRJNJ/DK/PXmoIDiAfU0pbPcV9ej4+4pmmPWVvzpvmyEn941MJGaaefX8KYhzSSDne1RmaQ/xmmsxH94fWkFAhfMc/xmje+fvdfYUh4NOgG+4iXP3nA/WmBdkjC3BAXCr1FZh5Ymta5YvNcFQerHmsyNR3bHvSQpbkfapLeRo5AwYimsAGxnNB4UHvQBO7mTqS3pimEtt+97c1GnI68ipQQ8eSeR1NA73GYX1b8qCoP94ilWNup5FPKL0EbH/gZ/wqiBgUgYGaSUksqk/dXAqVYCRuAH0L//AFqGQrgGIAn9adgGRO0ZG12VuxDYpxnmJOZC/wDvHNLGxjztiU57Fc4pzPLzvj+U9wuMfpRqBCXm5O9+f9o1Gck5bJPqan2c/Ky89waaTIBhgcA889aALTRnnGABx7moTAoHVvzFROr8EhgO2CDTR5gPBYZ9eKAJRGhAI3fmKcI0x0f8x/hUKxFh/rFHtmp1tcjBYH3XmgBDHEOpb8x/hTSkXbf+f/1qmWyJONzZ/wB00hsj238nHKmkMjEadw3/AH1QEj6YP/fVP+xntn8qcLPDYJHTPIoAi2Reh/77pNkWSAC3/AquMkYgVQkKup4cDJYfTPH1pYre2V2EkzH02qo/H71OwiqASAFBOBxj0pXMhYAb9oAHcVfkWwjUNJdysQv7sIgOfb73Aqk13Ix/d/J64P8AWi1guMy3TLj2zUirM2NkMx/4ATTDdvuB3kN3KHGfxpsl3MwwZpcDsZCaLgTm2vGOBaTn/tk3+FNNvcCQhrOUH/rmari5mH3ZGH/Aj/jTTLKTy350XAl8iZpCBbSjb97EeSKmWxaVtqK6e7oQP5VT8xx3pTNJ60aAaS6Zdp8/nxsoB+6zf4VHb2d3POIIbiJ5G6LyD+orP3uTnJpRK475ougsXprLUIj8wQ/7rKaYbe9CbyCq+pIFQrMCRlTz1rQs4ZWR9sslu2e6cMPrS32GimscnIkY5HuKSQzR4+c7T0wRW+PDE0sYmW5hdmG4jcQefwqA+H9Q3bV8kkdjNj+Yo5GHMtjGEjn/AJa/rUypOyBkkR1JxgP8w+orRfRtVRdyQxsMfwXSVWe31JGKvazkn+7Jn+VFguVVglcMrBkAxk7eBU8VqgX95IPlIAON2aM3UZLS2U+Dyd2/k/lUBukXKvbrg84Zmp3ETXtmkVss6ylw7bQNuMd+KrR2l3gPFE5z3wKWS7R4wmxFUHIUM5AP0zQbuPHywxIfUbv6mpXmU7dAMN2UIEbcfeG0/wCFAuLhI/ljyo4LFO9I92G52Jn1+b/Ghb1l6bD7FSR+RNDd+g1p1FW6uT/AMeu01YjF6wBVYyDVZr0uMMkP4QCgXYAwFXHXAj/+vU/Iq9upcMeoD/lkmfpQq3+OIkwe+01XF2y7ZJMEHlRjB+v0qCS5lk4LMFHIUHgfhRyX3K9pYvt9tjBLmBD2yQKYt3eRgKssBUdBkGs/zHzwcU0lvU0ckSfaS6GhNd3csbRPNDscYIGBxmqgjAP3o+RjhqiyT1NFNJLYlylLceIecZQf8Cq1CkWSJDAeOMOF5/KqXPrRg+tMS0NIwgIZBaO8Y+8yMGA/IVFJ9nYcW8uB05x/IVXhnnh4jlZQewNW9SuFW5Vo0KbkVmVXIAbHOPT1/Go1Tsa+61cgKw5yIXH1Y/4U2XbwUKoB23E/0qRtSlbGQWx03SMatQNJcWjS5Cgbsrlj0GfWhya1YRgpOyZSUBuk6A/lS+Tu4WaP86rTStJIXPBPYU0E+tUZ6F6OymOQEWTvnNWYdNmnz5Vhux12uc1lo8g5BH5CnGWXPO0/gKT5ujGnHqvxNpfD+oMoxpUgHrmk/sPUUBH9nyADturIW5nTlcqfYkf1qVdRvB924nH0lb/GotU7r7v+CVeHYu/2ZdLy9jOv4GpotPuVOVs5gD3IH9aqRa5qsQxHf3i/SdqmHijXQNv9qXuPTzcj+VRJVulvxNYyodb/AIGvHpAa2B8i5M/psQj+dVJvDt+7ZjsLph/wGo7DxZr0blUv5mJHQ4/pirA8Y6opKyzknvy4/k1YKGKT0t+J0urhJLW/3L/MpN4d1TcUFhcRYGcyA4PtwKRPD+qBlzbjDHBPzYX3PHFayeOdQSMgSbmxwxnlGPwzUkXi641MG3vohcbUdw32mUbSBnON1PmxaesVb1Fy4JrSTv6GV/wjuoA7HuLNB23y7f5gVZTQtWijAS+tVQHICzAj9Kzrm+nnIaSQtgcbjux+JzVR5yDnCj/gA610ck2tZfgcvtKaekX95unT9VQkLe2oYdi5P/stW7K11uS6FtDc2rSM23l0Az25NcktzJntS+fKRzjFKVFy6/h/wS411Ho/v/4B6Pb+FPGDNgvpg45DXUP6fNWpFZeONNt/Ktm0iRVOQRcR7gep/ix1ryITyjo+PpVqx1a+s2DWt1cQHOf3cpGfqK4qmCqzVm4v/t3/AO2O2lj6dN3Skv8At7/gHuOgz+LLl86pqNjbLjjbJEcn6jNZV1f+OEeW3vbm1mt5AUP2d4W+U/Tnp7Vyfhv4o+JdLuEeeS11OFTloLyIMG/EYb9a7zwf8X59RuUsbuy0Czmc4jd7IeUSei5/h/E4PqK8mrgMTRk58kGv620uetSzGhVShzST/P8AEp2sEkSpHJZRqnd5EGAPc1pJaWlxbiPOlBx90+cE/pXXW/ifTLiXdqWkeB79F4cCPy3+gO4jPpmtGXVPCbwmWz+F+n3u77q291Fk+/YfrXnVK/da+TX62O6MZLZaf12ucfB4a+xxtPLeWEF0FJQLdxnt04bv0zXPXAMELedPbM0Y6pcBs/TmvVbGTSrsGQ/BkQxxglmZ1fH/AHy5qJY/Btzdfvfhzp1nGeSZZZVbd7BV4FYfXIxev5x/zNVSqSWkfzOL8GXERCT77jyJiOIJWVj+RrsZrq3hSSIz38TDGPOvpQcn2DfpUGuwaYIo7XTNI03RYvNVxNa38wYgdvuYznnp2rGi8Prc+ddz+IzLciQSQorbwQD0Z3GSTj0FYVKlGo+dzt/XlodNOFWMeXluU9Q8R25utv8AbF7IEGPnknAH+6wbpUFnr9ve3C29vrl0JWOPL+1SMc9gNwOT7VgeKrPWmv7mSDR5vJdiU/eoSB+Bqn4Nge01Vp9Y0y5EQG0qsYZuepHUZA6Zr1/q2H9jzRld27pnmrEYj23LKNl6NHaSm/8AnCaxexspPVlI/VazrttRl4fXrllHQqyFfxGK6GG58N3qHbcatDwSRJbJnjuRjn86w9Zg8PyRyKmtszHgedFIpOexwTx+GK4MM03qmv8At2/6HZWVldP/AMm/4Ji3ck8QKrr8jtjgAKc/lXJ+Mx52vaiiTB1kYfP2Pyrzx710N1AkFwXGrWhwxBKhgAOuPuiopLPTp1LXOrWQfoVFsTgdhuPJ+vFe7h5RoPn3+X+SPGxNOVePL+v/AATgItIYKE+0oR67DUE2m4cgXaDHXKNXoM+n6OBg3NiQigniRc89Dtya568g05ZtzQylCSSIiw/InJxXqUsYp7J/ceXVwDp9V95zL2DJ924hb8GH9KjNpLyd0XHuf8K2tRgtSB9hS9yOWMgGAPTp696zJI5wf9W5z/ejrrhPmVzhnT5HYqtaTdRsOfRqabSYf3D/AMDFWN12eFQH8KTfcDrGo/StDFpFY28oODt/Bx/jUkFvKtzE7p8iuCTkdM05pJYgZGMe7sA1MW+IAAiUAelAtC1MxEcvHG01lrVl71mRl8sAsMZyeKrfXI+lANpi4pGzgZ6UZI70oVm57etMQ1evFTodoIz1HORTQYwMF8/RakQOUDJuYE449fT2oBIjyPRvzo3Ac7cfjSeU399R+Jo8k55lT8z/AIUyR/ngjGxfqeaelwocHG04x8pxUX2f/ptH+v8AhS+QP+eyfkf8KLgaEFxAq/NErZ7sBTHu4FZmMaz4GFRySvX0/OqqxJklp1HGPuE05oY2AzPn38s07jHXT225ZLSMpG65MbNuKH0zjkelQlx18tfzpfs8Xe4/8hmgW8He4b8Ij/jSuAnmuABjgds0omYfwIfrS/ZoMZNw/wD36/8Ar0nkW/8Az8MT/wBcv/r0ANaQZyYkP40vn5/hA/4GakiskncRQT5lOcK0ZUHj1qnQIs+cMHO0++40zzD/ALP51DRSuBMZAB0Q0+OVAOY4SfdTVYDPNKVOM07sZOZxuz5cOPTZTkuZCwVIYM9sRiqop0bFG3A4ODincViW4Yu5bjLc5AxxUXoM8elKPv468U4rk+gpDGUvHrSqoPemkdfagAOPQUGkye9FABzmiiigAPWilIOB70qjkDqfSgBB1z2HWrn9q3pxm7m4GB0qtIRsWNcE9WI9fSoj0zRcC9Nql7MmyW8uHHoW4qKO7mTJSedT6q+KgdduPcZoX7j/AE/rSAtf2led7u5P/bU0DUrwDAuZ8f8AXQ1TpcHPAoAuLqV+cqt5cjvxMwpstzdmNXkuJmBJAzIT0qCIfvcdODUs6kWsR7F2/pQNalY5zk0U7vwKaTmgQpGOhzRilj2Z+YsB7VKots8vJj6CgCDFLVnybUjidwfcVKNPyoKsHB9HFTdIpRb2KjkM/A2j09MUN1q09hKDuQfg3+NRm3nHWI/gRT5kw5GuhD3pPrUwgnP/ACyf8qZKjxkb0ZfTI60Cs0Nz60AA04RyH+Bv++aZkUAL9aBUy28wzmPqPl+Yf41FKksT7JEKH3ouhtNasnso0dnklB8qMbnI/QfUnioJ5Hnmkmf7zHJp8sxaIQoNsanOO7H1NRgcYo63G3okhABtJ9avWTgacyZ5Jbj8KpdEzU6ELYZzyWIx+FKSvoOD5XcqUvalGNopDVEIUAsuB2pV5HI49cUqY+XPH0qV2Gwjj8aBEOOOlKMknPJxTht2n17UuMF++FFICM4689e1AIx1Ip7hfmAHQ8URhR8wySO1AySzI+2A9Bg9PpTLwg3UhAwM1JGoSdWzkEEVFc/Ncv7mgZEFOM9qls5fIuUlwSFPIHcdx+VN/wCWeKZzQI0rlYxJ+7DBWGUb1U9DVWWMnuc+pNWLOYS2f2ZsebHkxZ/iB6r/AFH41VcsOOxoG0NKkcnqDQSQccU0ZxzSnmgQEEHpihh6GgEE+9O/DpQNDMmpYnwVJ6Zww9qjAGaG4xj1oGaM13+4SYLGzlij7l5J7H8R/Koft7dfJjz6jIqvvPkumRhsE/h/+uo2GFHXmp5UVzs04tauIvuNIn+5My1dg8WarDxFqOpx/wC5fSD+tc9ngDFJ+NJ04vdDVWS2Z0//AAmmu9f7a1bPvdM38zUsXjrxBH93WLv/AIEiN/MVydFZvC0XvBfci1i6y2m/vOuk8d69KNsuopID/ftYz/7LUS+MdWRspcWq+y24ArlqSp+p4f8AkX3Iv69iP5397Oyl8aahNGI7gafcx91lhyD+BNU/7ft9xLaHpTZ7puT+TVzVJTjhKMfhjb00/IUsbXl8Ur+uv5nUNr9qQMaJEoH9y7lH9aifWbRs4sbtPXbeMc/nXOgZBOaUqQeCD9DVqhBd/vf+ZDxNR72+5f5HQjVrUjGNSHGMecCB+dH9pWoLEz3YJ6AoprnvnHTP4Gjc/wDeb86fskL28uyOgfU7ZSrQ3c6sowMwjiq7XqHaTcowXOAUYdfpWfD5Xlh5WnJJP3Mf1qUGw9bo+2VH9KajYOdvf9SZrhdq7ZFTac5QH+pqIv5z83BP/AVH8zSq1gB92YfV/wDAU5RYs2dnA/vSNz+Qp6k2T6r8SN44C3MjZ9lX/GkaGPHyEn/gNTj+z+htkGPWV6FNmW+S0gIHXMuD+pouw5Y91+JV8pG4AYH3oa1IPXA96us1jkAW6hj2XB/rU0McWwOYSecD5Q386OZ9g5FfczHt1AwZF+hao/LUcCVcez1tyEFTtCA9gbcAfyqu11cIMNHET32rQpPsDhHuZvHQSA/rTi0pj8ouWTOQpXPPtWnbXMkj7ZBtjx95cZ/I4pxkTJJW4b36cfhmjmYci7mIZnIwcflTfMb2/Km0VZnYd5j+o/Kl8x/UflTKKAsP82T+8PyFHmyf3v0plFAWH+bJ/e/QUeY/979KZRQBLAzPOiMxwxwamZdrEehxVUEhg3oc1duR++bnrzQCHWMotr2C4AH7tw3PfBpmuWy2mrXMCDCB8p/unkfoRTQOMGrOu7p5redEZme3TeQM8jj+lAMyxTwIz96Rh/wGnrbXDDiCY/8AADTvsV7n/j1m/wC+DTSJGCOM9JD+VDRIOBJz9KeLK7bkW8n5UNZ3KpuKAD03DP5ZosFyLy2zxg/jSFT3BoaN0+8rL9RSA/5zQAY9KcHPQ4NINpHK4980pCjoaBi5PoPzoJIBwFAPXkGmgkkAZJPvT9yJ/CJG9T90fh3oAYis/wBxGb6DNWBZz/xCNP8AflVf5moHlkfqxx6DgU3PtQIn+zPu/wBZbn6SrQbO5wCEDZ/uuD/WoASOhpQ7etA7EksM6YEkUi44GVNRc554+tP81sZDEfQ09ZnUY3k59eaLARDrxQ44qwk4U5aCF/8AeWnxm2mfY1uFJ7JIVJ+mcigCtNyR16CkUDYQe4zV2WyEi5tXducFHGGBqrNDNbybJo2jbbkAjqD3pBZ7kIp6ZyT7U0U5O9ADohmb8KlnObaNc5AdiP0qKP8A1p/3TUlwwMMXbls0mNbMhIIPA7cUzqalycDr+ApMBhwD+VUIjNLinEDaOuaTkCkAgHpThvJ+8fzoXOM0hJ9RRcB29j0Z8fWgup/vfiTSLnGev40rbcHkGgdhA2OQWFITlsuTj0zSDpTwwGBgD1OMmgQKS3Hr6nikA+Y9Ce3pTgcAjccHtgUgMZHJc/hQAjEjqRmnM28LnqO/rTW6cHinBQV4c5PrwKAuxh4Y04MC2KbtJPrRtYdVoC4HoKlH/Ht+dRc+hFO3nywnsaBkYNLntxTsDYME57gikOMYC0WELu+QDHP0oHLdP1oX7vKkilIBAwm33FFgFGQuCOlCseWx25pQAODvGPcU0rydpz9eKLAOXq2fWjGOSepFIPMxtHrnGRTgXI5X/wAdoC4q/wCvHsDimPxM31ojbE2cdulI/wDrmNIYueKb15pGYGkzxigBe2ferUYluXEeQTjJZjgAepNVOxqaNmTLAjkYNAE9zaLBbCcXcMjFsGNc5H1yP5VVPqDT2aQrt3AimlSF6UIbaeyLd7p01r9lLTQOt0oZGR+B04PoeatNoGoBQQ1sQOOJhzWQTkBTwQeppyzS5x5r/wDfVQ4zto/wNFKnfVP7/wDgF99JvYyN4gGe/mg/ypg0u5bqyAfj/hUEV5dwkNFcTIfZyKkbU9Qf719cn/tqaX7zyG3SfcnSxiQYdWcjvyP5Ur2ELHq6n61G2s6oUCPfTOo6BnzioptRvZRh7l2HoSKa5+v9fgJ+z6X/AK+ZI9lEDgySj/gGaiazUHCysfqmP61AZZSMGRj+NIXf+8/51Zm7FkadNjOVA9zUTWzqcF0FRAk9yfqaDnPb86AFeJlGTtI9jUdLSjmgQY/GjHFGDjApyKaAGrja36UrE9+fwpwHyY9WpS2e3FAEWfYUvGelKwUjgYpF60AGTjuBVuaARysqltuARz7VUf17VaaUknIAwvT8KAKwlkx979KGkZuuD+FNpKYDzKxA4HHelMpOMj9ajooAkMgK4K00FO4P5UmDRjtQA/eM53NTvOOBiRx+JqIrjvQRQBJ5pJyZGz7mlMj/APPX+VQiigAopRSUgCilFIaACiigUAFFGKKADHFXSd0MTE5+XH5VTPSrMJBgTPbIpgtxT04q7BIRFGd5BIx19KpHFWoMfZoz6MQaXVDWzLtvPNG25GznqDyDTkEzSb9zjP8Ad4H0qoGC/Nnb702G/hiMqGEyseEO8gA+uB1rS9iC7Jq8bny4LLyGUYJZi7E9+cgDn0FQJLM7ZRIyeh3rkCqazB3ZmSAO3fy2z/OpUM3mFhcRjcMECMY/LFRdotWZbdr1R+7mjXPVVi4qrIy+cFuPL56kWqf4ih1mh2t8jDuRGQD+oq/o9tp18xFykkcuQUKMAjex3GplPlV2VGHPKyKtzaaa6RrGWRwCXdXGG9Pl6DH1qlJpwwDFdQsD2f5TXR3enwwykSojZ53g5U5/Sq8qWm5UWOIn125q4NOKZM1aTRzLxuhIK9Djg5pldXE9nDIQ0UaehMYx/KnzHTpUxIImJPRU4P6UWJOQzRW/d6ZCymWGBPLAydkpz+RqodJYxGVWaNewcZJ/L/CiwXMuirX2C5JwgVznG0MN35HmoZoJoTiaJ4z/ALSkUhkfFOB200U5iPagQKeelOOO3Wm5B6cUhbIoAsGV2maQNgsASfU1LcXJmtCkuZGjOUc8bQTyKq5wAo4x1pzcQ45y5/QUmtSotpMhp6etN6Uqgn7qk/QUyByf60/7pqR9rW8eTjk4qPawckqwOPSpIt2wqcfL6mga2IjgMCGORTjISMYz9TUmWPQD86ChAycH6UxEJAP8I/Ojax6gH8ql8peuW/KpBEoX5Xz+HSgdirsY+lIVIOOM1aMXG7e2PpTfKjY8u34mlcLEABzywFOJjB/if68VaSK3Tn5m/wB4cUrMoXCwpgdwtJstRKX3jwAKkTzV4VAfwqctvwPLH/fIpEiJ5Kg+3SlcOUjPm/xRyD6f/qpCWxzJKPqDVpoo1b7pU9+alFqChO44/wCulLmRfI2UI0jP/LdfoamWBCM72I9Qal+yxnIEbE+uTzUq2c2QFU49c0nJDjTfYqyQRBM7n3duM1CIuepI9BWymnYxvXJ9MmnPZRK2QmD6E5FR7VGnsG+hleTGF6Z46570GFBwwOTzwc1sraRsmWS3444yDTFsVaQBUJ743AnFP2yD6szJEa7chW+u003ZH/EW+mK2VhGxlCTEd8Hp+tItlDwTBJuPTIzmj2yJeGfQxfLGCUJH5ULG2CSQT7VsPYoWJETYPquBmoXsPmAw4J7CqVWLIeHmjOCHoFx/wKgxbjnqfetT+y/4vMcexU5/lTP7OnJOxosf7TYpqrDuJ0JroZvlkHBApMFMgALV57O6DbQqsR/d5qIw3CZ3wt+VWpR7kOnJborEFsYwMd6YUYsT1q0AQcuhX/gNNKrklW/A09GTsVSpPYfnSY6nPTrVgx5P3s/SkKYJADY9xSAgAJpQMGpghzxgf7xxTWTn7yfmKAGKTnlQR6Zp/wA27gA/Q9KZtI/jT8xTgrdd8X/fVACy8YDBvfoajVkAPHUU/HX50/76pnPd8/RqAFUKxAUtuPrjFN+bGc/rT0O1sqdxwQO9M5CkEHmgBVUEZLAGjAycuPwFIo45yKXA9T+VACbm6BjTce9KQM98fSk4oC4uDmnBDt96apwQaUtxgHigdxME9qDwKM0pOR1pAB6Uq9OaBtx1qW2jWaYKX2IAWZsZwB1pgMjSSUlUUtg5PoPr6VNHFargz3LMR/DCmT+ZwP50+ecSRhViMVt/BGOjEfxMe5qszkjAXigSZaU2SAkWssgPTzJQMflSCeHG0WsQB9cZ/OqmWA9KQk+ppFXZdSSDOHtM+m1l/wAKfutsFntpvc4B/qKzuTRkincWpeUWbHiOQf8AbMn/ANmpDHYEcO+f9xh/jVMOw6MQfrSmRj1NAalgRWZz+/wfckf0py21sx/4+UH/AAMf4VUDkdOKXe3qaBFt7NOiXCN6YdT/AFpq6fIwyW6HsM/1qrk+gP4Um72X8qALD2jqeuPqpH9KaYD0BQn/AHsfzqMSEcjI+hNL5rE5LP8AnmmAvkyKPmRvqOf5UxzkgYxtGKcHOc7gT7jFK0hxyPz5FAiPNJUmxP7z/kKNsfo5/EUirkdFS4T+63/fVGE/uf8AjxoAio71Lhf7i/iTTgq4+6n5UCIaM+4qfgLkIBz12ijeAeoH0A5oGVyangYCDB7N1qXcwH3iPxqMhjyTkn2ouCQuQehqeElLVmJ+VZFz+INVwuOlSxyKLWaMkZZlIHrikykOkukVPk3bu1VvM8yYuEVcnO3nFSDaQ2SiADPI6/So3GSNgY1TIJomQnJypz2NWo2BP3iPqxqkhxk7efpUkQOSTu+mKhlonbDKD1+tami2ypbTXzg4hRn4AHbA5+tZe3ci7ckjrwa12uVh0hbSNwjOwLuXCkAD6+tZVuZpRj1OigopuUuhl6bO0dwGkWQRv8rjzCCQepB7U9HkXIWViM+lOKW/kySfb4/MUfIgy5c56ZAwPXJquPtRf5Ztv4VvFo5pXtYsxRmSTBWSXjp1q3DZxLGTJBcjv8ig/nzxWeovMhhcybu7LnNWbWeeymW6uYmvI16pKxxz3/8A18VTdlcSV2GoGFVRoWYL0+bOSarAyMuERyfYManub2e4JaOaWME52rGoA/75Iqqy3Tcm8bPuGqeYbjqTi3uJCG8qUsBnJBB/+vU62t6ygKjoehGG5ql9nuWX/j8Tr02t/hS/YpcZ+3Ln0CNRzD5S41hJs/f2Syev7vaR+IxVWTSFPRZEJ6AMGx+dIsMysAb2f6Ih/qwrR0iaJJ1M9xNIqnJSeQBSB6gZOPxpOSSuNQcnYyW0a752FCO2TjNVJrG7h/1sDj3Az/KuoSaCViFmgGexkAA9uaHgnhxOyHY3CybBjPoGAo5kLkOR7471LKxYggAcAcGuieBJX52ZbruUHNRy6TbtykPPUkS7cfhzQKxgoGLAnI9CBkipH6ZWRz7c/wCNaj6VAsbFbsBweU2k4/Ef4VBLplyqBkSNlJ4IbGfwOKYrMpMowpWQSZGWAJG0+hzQDgYLFfYAmp5IpIR++Rx9Ux+tQr5RH+rB/CnYWwihTkmR8Hg4Qc/rToWxKNwLKD028H24FCqhPyrx6U7CYIGAaTQIPkbhWHJ6UhKrwzY/GpFRCMYXj8qQBNxAjX/vmgYkaxOMmQL7FqQCLJAdcjuDUyhBn92uT7UpVSVaIAMpyM4x+RpFaEUb24yG+c+1Pje3Dc7efU4pTvdi23r1wcDNIygf8skOfVs/1pWKvYlJstuFaPP51LGICo+QDPQkdaqFC33ool99x/wqW1iEUqShYuD0yWB+o4FS1oXGTvsWsop5CAfSlSRWPBB7DApsh6KmPTgZNJHNIrhQUUDrvUDNQ4minqSM4DYKH6ilQsORwe2GAxSGfaCWPJ5AyCKasyk4yFHU1PK7bF867lhhPn7/AB1PJpUbjc5ZsdMY4qAz7Ey0oOPegXLmP5Tx61PKy1NFpNnQgkt0BApyscHfwBxxxVZJ3Ri4OSe57043JO3lVAPI5zUODLVRF0MoG3apOM4xTxPsIxsBPqv/ANeqCzfPlpNynsowf1p7yR8EFmPfLc1DplqquhpJdR4GVhLewqWSe3C5eAZ9CgFZSGNhkSBfQHFSAxAcyAk9eaydJXNVWdi/DfopGIdvqqng1I8tuwINqgJHQqOPfNZu5cgkoQeu5ulSE4jbyZ1Ru2B/XFJ0lfQpVnbUllitySWaJSP4uFqm8ljGMfaQT7ITVWa1uHG9pAc+rc1A1vKrEYJrphRXWRyVK8ltEuTX0LwhVjc49R/9eqz3cW0K2nxOB3Zv/rVDtYEjvSMr5yoIPfit1Rgkc0q9R6jJpoWxssLZcfxBmGfrUDurMSIUT6EnH61YZGYZ+XI56U3DbSevsK1jFLYwlJvcoyR7zlmP9KBCqNgDf9VqyYztBIIJ70nlY5Bx71RFiuY+g8tR7laayAHHyfgKsukhOC2V9+aZsDEYAbHtQFiqU5OO3Xik2jdhnxj2q2yAjBTaPxFKltG3zYYfQ0CsUjwcAg+4owTyTV820aDIQsfcmmgqp4jVfY0DsVAkjcBTigxSj+E1ZkyedxA9jTR7kmgCviUHHOfrTgXHBGfYgVMwLHBUn0pCpGN/GOgxQIhJxyYwfqDTWIPRAPxqdwT0UCmCNjzTsBGBkccmkxjqDUwVv4QTTdp7gj8KLAJxt4H5jNPt8bZlA5MZ/wAaaoHOeaW3YRTq5AK8gg+hoAGYtGgHAAx1pv1NOlVoXaBwNynrmoz05pAIxJNJzS8UGkMTNFFFABmiiigAo+lFFABRRRQAUUUUAGaUHFJRQA5WxRuHpRx6/pRhechvwFMQu72pC/tQMf3GNP2tjiI/XNADd3GP6Ub/AE/lTgrHPyJx15o8lyM/L+dACeY/QE4o3Du5/AU8WzEcug/GkSAuxAfleoKmgNRC8ZHG/wCm6gspHCn8TUnkKAC0hx04SpRapj/XZbsOBmi47MrAFhkIMUfOB0x9BVyO3jIPmLMMdc8f0p0Udsx27SwH8Sy8fyFHMHKUMZ+8CaBHnohrRENv5vliNWOOjOQf/r05hbxOYzbRktwuCWYe+M0uYfKZpQqeSR+NOCP6v+dacYiOcRwnH/TA/wBasJNZKu2exjLE/eUBQB9M/wBaTkNQMdYN3XP409YYVPzITWqtrYTKxhmdD1wGDgD6Hn9ahOmT5ZoXSbA/hOG/I8/lQmmHK0VVMK8IhP4Yp6yNnOBimtEySbSjBh1DZH6UfL0JwR6VVxWH+bIX3KSKnMzTQvHKQAwxkVWBjTJ8zn2pGuYREcN+8zgZ6Y/xoAW3lA+RuDn8jU7Mox8wzWWzuXLkq30IqUSu2Nytx7VLQ4zNFSD3FO6DJ6VRVwefLk/AUr3B4Uq5x2IqeUvnLTyA/KvJ9aclvF9lkuliEzlgg5yFHc1R84k4GFzwSzDpRA0CyBSYlUkZ3Zb+VNoOZF/z9iAyRxoPQ023uLrZJFG0i2rncUz8u7sQD6etRXjWnnj7Ej7AoyXABZu5AHQe2SaYwlfnLAfiap2ktSE3F6E3myRy/wCsdTjsB/SiSWdyHIY4PUioI45A2dgJ9zipB5gUZ2j6HNO4kiQ3k64AZgR2Apwu5JQd0ic9mX/61QyKoKs+7j6jNAESP8o2jvyKLsLE8dxu4UqjDgmNyAaXzInJEghf13KCfzGDUazRbTllH5VA867xtkb8BSK2J5YrYYYKy5/55tn9D/jUYtRMreTOoPcSKFP9agkm3sS2TxjpimhlJ4Q0CVupMtq6bgVWQj/nmwOPy5pgDxkriRfZuKaCcZEYp63V2vyBmx3XqKV2HKgTYDkD5vWjKFj8uD3OOlL5zOSPKjA787P60wNFnJ8wHpgNuH9Kq4uXsSCTjh/1pPMUn7wNKgR2AEqn0BGKeI3U8QZT1Az/ACpXQWYwYJzv/SkDKG7nHtTmIPGQPXikV8t1bHtTBEqGRjlSI/xxmhWm3YJJX6Aiot3zZOcD3obDMCO3oTU2LuSsrk5IUj1BFLuiVdrxknvzTAVB43U4MucFgf8AeWkO9iMYVsgfrU6zR4BcNkdRnrTUcoD+5BB69aJJVl42Dnv6Umr9Bx06jxJCMZLc9j2p4Cs5KMhHfk1X8wqpAwf96hC235NpHtwalxKUy0rJt5ZMj3/+vTTLHkhvvdscimLGoXJwDjoOlHkMgLBgT34wKmy7mnM+w4XEIBByfTaDT4Z4d333TnjPOKgaDapZcHP8PpTkR4WViEw3qc07RsHNK+xaLQ7smZiT7CnMiEL+9BH1pI0jK4xCxHoOn60jFSpURJx1+WszRX7DWVm5WTAB5BHWl+ZE8zYdpOB8tLlU+6q7z9MVI0jeVyirg9AePrSdx6EW6VjzGwX+L5MUJDzzGoP4nNPQ5XOdw79waFnUHBOT/vcii7Ww7Re5FNAwyOAQf4STTPswUAlGAbpzVozsuSsTkHrggZpu8uAfKIX/AGh0/KmpyJdODKxtiGAP+NK9oyDnp7irW4rGyq3Uc4GfxxTcbDne2PpT9rIXsIEC2D8f6ts/7XSmvps2zfujxnsxyPrVvKkZDEn6ZzUTtLg+WVK9yOMfnR7SbD2NMji0xSV+0XnDdQoyRUn9nWyMVCGT3Ev9KhjmlSQEMdwPrmraXV4riQbiR6E1EnU7lQjS7EB063kbEbyxEevzDNQtpUwl8tZAz4ztKkZHr6VckupZZ904GD2wc/rUTTlXO0Bl+nIojOouo5U6L6FSTT7tTgxEEe2DVeVJBgyRsPTIwK1jeoDkhg46bnprXyFcMzn2Bz/MVoqk+qMZUafRmSp5OTj0BFNbnA4H0FX5mj3EoQwPXIqEpG3LYAI6DtWqqeRg6TWiZUI29cGmZHY1Ze1TPysPyphtnHQCrU0ZuEkRZ5oznI5BpzRzKfu8Umw4O5cZ61V0TZjcrtzhifWmPggHH6UrbF4w2PY0jBdoIB59TTAfdt5gjm7uu1/qP/rYqHPrUqcxNH1Dcj2PrUSY5DdfepsNu4z2ox14qQJlsDqabj3osIbSU5hzx1ppFAwooopAFFFFABRRRQAUUUZoAKKKKAJyeTyCvak3ZJBJGOmD1pmechTkdDmnbn/u/rTJHcY3Ku4/QHmlGFwTwT65ApoD9goHpmjDf3ox+tAyTec4JbcOwA6UhKhTnBGeNp5pm0D/AJaIPotKAveY/gtAEiZODglO6nr/ACp24iIqiFU6huuP0qIGLvJKfpRvt8/8tT65aiwyVXOd8ZG88EbiM/rSRzA/LNvLqeAxBH61Fvtx0h/Wjz4+0EY/A0ATvMQ+QyGPHzLuAzThcRKuyEhQf7zdP0qv9px0hjH/AACj7XIOiqPoopWC5YS5Xbuxh8YyFPI98GiF8gh4pJDnI+TP8+ar/apuxNH2mfsxH407BcuMsu7zILeRWPBDIu0ipf37DDWme+S6jH0IFZhmnbjex/Gm7pD/ABGlYdzSkjnPOYwD/fmBIP1FPjknRg0s9s/ruck/nWWEk5O6gIx6MT607C5jVmulmj8ue4SQDp14+lVGhhdXaO6Rdgztcn5vYcdareU3ctSBRnOM49aethAxJIz+tKdrD7tGCeo4+lOCnAwp/KgNRhWPHGc0gj7gHFT7cLksg/Gk+XvJGPxzU3Q7EYiYnrUq2+7q3600tHnmbP0U0hkQjG9yP92i40iY2aBQd/PelRY0PGGIqJpo9gUK/wCgpvmoo4jYf8D/APrUh3RdWZwu0Y+tO3y7eMD0yKoCdg2Qi/iSaHuZDj7gx7UWHc1N0nlB2K4xyckVD5pJZtuM8YNUGuJmGC4H0UCmmaU9ZH/Oiwm0aIIK7QXX3xmkbdkMUGR324/rWbuYnBZj+JpOM8iiwcxps8ancwj/AO+gKY1zEG3gp9BWfwP/ANVJx3p2DmZoG8iPUKPcA00XUKtkGRvooH9ao0ZpWDnZeN8oPEbn6sB/SmvfO3/LIZ9SxqnkUbsdqdkHOyZ7mRudqj8KT7RL2Kj6KKiHJxyaOhIxzRYV2TG6nJz5rA/7IA/lTGmlPWVz/wACNNQFnC5AzUmyPHUk/WhJCbY+yJIkJ56ck1KrqOe9QoEUAD5c857U4Mi9AT75qhImyTgqx+maRi5YYcg/WomkUsGxyPakMpPBGaVh3Jw79yTj3pQepPr0qEqmM5x9aWNSVy0oX9KATLDzdBgEelMUx787D+BqMEDguGIPOBTnIC/eANKxV2SDPB7U8sVX5Mr+Oc1WaQDkEH2FODLIPmULx34osCkT7nc5ABOOTxUiyMke1lbnpnmqRlAyCVz7AU5G3rn88Gk4lKRY8yR0z5g47GlSadgSACQPyqt82QFP1p0m4AEOAfc8mlyoakyzHMZQFl65+XC8/nippDMh3luD1JI4/SqHU8Hn0NKJFXq+M9u1LlRSm+pZEm8mM4YdsDrUhZ48kZTP5fyql5u7o2T64phlLNjeOPU0cgKoW/Onn/dgL7YGKVftMZ2jHHIINVTPIMHzc47AUG4Zyd0Yb2K0coc66suS3czYQFRkelItzN9wsMdyQTVRpeAnkquf9mkKtyeAP5UuRD9o+5eSeJCR5Z+veiW6HIjZ8Y7jGaz2c71XzFbjtnilYMD98Y9qORB7Vk7TgYBc+3NKWYqOGKnnrUCSoD3fjuaPOQN9zIzwM07C5ydNnXzAB+ualSRcZ876jNVM7lwECjPrSGRAQoyMdTScblKdix5iHnzmJ9yaa75G1d31BqFcu+yIEsehNHmqmVjkd2H9zp+Zp8onMduLDGM+5HNAGDkhiewFQlmI+6g+rEmnB5T1ZVHqsYp2J5iclVPJUe1IXRm2q6j1zUYaYnBlkx7YFNKSN/E5/wCB0rA5Msc46q340HZ/HuHHQciqRjwTw5+jVII2A3BpV/4FTsHM+xMzjbhZDn3pjvlcZf24NRrGGPM0i/U04Rbidrsx980WQnJvoIfu8gj6g0nlggAJx6jNK8TYxsU/8CIP600rEqZDsjDqrHH5etMliMgXgiQE+ophUMBuOPT1qQeTnIOfctSNtPTdke5NO5LREokTBAJx6ikc5OSNv4cVZilcDbuH5YpMgnHVj6Dk0XDlK3BPBGaQ4qy6JhvuHDY9TTBErNjbgn3p7isyIrjqDTQB9KMnpmg570CAqaSlyetKAzAkLwOtFguNop2G/un8qb+B/Kiw7hRR3ooFcKKOfQ0pVsZwaLAGW9TRmkHNBpgLgn1o2n1xRknvS5oATafWl2D+9j8KUZx1NNyaBDgq92pCo/vCkzRk0hjgq9c0u1e2fypoZsfeP503J9TQBIAo96MgjoB+NR0UXCxIGA7gfjS71zyR+VRUUXAkMi9Bn8qPMGMfMaYaSi4WHmQ+hI9zR5noiimUdqLgPMrnuPypDI5/iptFAxd7/wB5vzpDz1NFKKBCDFKKMCjFFguLQc4xSGkoC4ppcj1zTe9L3oC4uRmjcP7tIelJ3oC4pb2o3Gg0lAC5pMn1ooHWkMOfWig0UxBRRRSAKKKKBijgqfelblzTR1FL3NMCS3I89CfWpTjJJYCoE4cH3p2Tgmhbg9hQCer9/SnYXGBuP4UxeVyTSbiARTEPRckZU/XrTjgsQFXn61ErtupWkYHANMCUqmzncaFkK5K8H3qv5jnvUrjcu4k5pAPEijkKuT70bvmLFRj0zUBAyMACnbiOO1FguSg7juZB7YpJCcjCYAqHew6HFG9j3pWAlIQrlhtPbnrRlMDDEfrUfmMSBmlBKjcDgnrRYABKng09XY/eY/nUZkbdnjj2pCdxz/KiwXJN+Cc5NNZ93B/nTCcHFSCNTCGOcmiwXHKyAHAX8aafmPyqc00ACPdjmlBOKLDuP8sdSSB9KUKoH3yD9DUYchePWneY3r0pBckywH32IPseKFU/e3sfY0wO2zOetNckYx6ZoHcsDG3Ix+VGWx8wU+1VixwTgZoj+Zuf0oDmLCewC08lRyFB9sVAVGe/50N/qzjjFFg5iTzAp5G32FMf5jlSx+tMHzKCeopnmNnPBoBsnR9mHjcK+CCG5BBGCKajKDgFkA/ED+tRu3sKazE46UWC5Z3E/IHL5P8AC1BLKfmLIewbNVSenAp6jKg5PHvRYOYmBc/MJOfypoaTP+s5+lReY/ILE/WkZ2Jxx+AosLmLCTMpyTg+/NEk5POWNVdxPBxTg3OMCiw+ZkxkDYLAkChWwDggfWgkso7fSlSJWUk5yPSgeom5ge2PrTVkIYFjn2PSpRHgE72qNx933oExXxsJVee2KhMsgAAkbA96t2qeZnczDHpSSwRhyMGi+tgcXa5VEjDkinF0bruH0NOKYOATj3pUhVwSSRj0oDUjDKBgEY+nNSJJ19u9K0CBM8moThScAelFws0MHrTgc5pMcUnSmSKOlSQtt3L61GKDTAmJ5yeKQdepA+lRbmA60B245pASkMRx+NNO4nBOKaWbPWk3Gi4ErKwGSQR9aTJxjrUe4560FiaLgf/Z',
};

// Preloaded Image objects
const SCENE_IMG_OBJECTS = {};
function preloadSceneImages() {
  Object.entries(SCENE_IMAGES).forEach(([key, src]) => {
    const img = new Image();
    img.src = src;
    SCENE_IMG_OBJECTS[key] = img;
  });
}

function loadSceneAssets() {
  preloadSceneImages();
  return Promise.resolve();
}

// Active canvas animation frame IDs
const _sceneAnims = {};

function renderSceneBanner(bannerId, bgKey) {
  if (_sceneAnims[bannerId]) { cancelAnimationFrame(_sceneAnims[bannerId]); delete _sceneAnims[bannerId]; }
  const banner = document.getElementById(bannerId);
  if (!banner) return;
  banner.innerHTML = '';
  const cv = document.createElement('canvas');
  // Use banner's actual rendered size, fallback to sensible defaults
  const w = banner.getBoundingClientRect().width  || banner.offsetWidth  || 700;
  const h = banner.getBoundingClientRect().height || banner.offsetHeight || 110;
  cv.width  = Math.max(w, 100);
  cv.height = Math.max(h, 80);
  cv.style.cssText = 'width:100%;height:100%;display:block;';
  banner.appendChild(cv);
  const ctx = cv.getContext('2d');
  const img = SCENE_IMG_OBJECTS[bgKey];
  const drawBg = () => {
    if (img && img.complete && img.naturalWidth) {
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
    } else {
      ctx.fillStyle = '#080600'; ctx.fillRect(0,0,cv.width,cv.height);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.fillRect(0,0,cv.width,cv.height);
  };
  const animFns = { cafe_main: animCafeMain, terminal_7: animTerminal7, corkboard: animCorkboard, late_night: animLateNight };
  const fn = animFns[bgKey];
  if (fn) _sceneAnims[bannerId] = fn(ctx, cv, drawBg);
  else drawBg();
}

function animCafeMain(ctx, cv, drawBg) {
  const drops = Array.from({length:70}, () => ({x:Math.random()*cv.width*0.38, y:Math.random()*cv.height, len:6+Math.random()*10, spd:3+Math.random()*4, op:0.2+Math.random()*0.35}));
  let neonV=1, neonT=0;
  function frame() {
    drawBg();
    neonT++; if(neonT>25+Math.random()*40){neonV=0.3+Math.random()*0.7;neonT=0;}else{neonV=Math.min(1,neonV+0.1);}
    ctx.fillStyle=`rgba(232,60,80,${0.07*neonV})`; ctx.fillRect(cv.width*0.62,0,cv.width*0.38,cv.height*0.45);
    drops.forEach(d=>{
      ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x-1,d.y+d.len);
      ctx.strokeStyle=`rgba(160,200,255,${d.op})`; ctx.lineWidth=0.8; ctx.stroke();
      d.y+=d.spd; if(d.y>cv.height){d.y=-d.len; d.x=Math.random()*cv.width*0.38;}
    });
    return requestAnimationFrame(frame);
  }
  return frame();
}

function animTerminal7(ctx, cv, drawBg) {
  const steam = Array.from({length:20}, (_,i) => ({x:cv.width*0.73+(Math.random()-0.5)*18, y:cv.height*0.4-i*3, vx:(Math.random()-0.5)*0.4, vy:-(0.35+Math.random()*0.5), op:0.1+Math.random()*0.12, r:1.2+Math.random()*2}));
  let glow=0;
  function frame() {
    drawBg(); glow+=0.025;
    ctx.fillStyle=`rgba(232,160,32,${0.04+Math.sin(glow)*0.02})`; ctx.fillRect(cv.width*0.12,0,cv.width*0.58,cv.height*0.9);
    steam.forEach(p=>{
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(200,175,130,${p.op})`; ctx.fill();
      p.x+=p.vx+Math.sin(glow+p.y*0.05)*0.25; p.y+=p.vy; p.op-=0.0007;
      if(p.op<=0||p.y<-8){p.x=cv.width*0.73+(Math.random()-0.5)*18; p.y=cv.height*0.44; p.op=0.09+Math.random()*0.1; p.vy=-(0.3+Math.random()*0.45);}
    });
    return requestAnimationFrame(frame);
  }
  return frame();
}

function animCorkboard(ctx, cv, drawBg) {
  const motes = Array.from({length:22}, () => ({x:Math.random()*cv.width, y:Math.random()*cv.height, vx:(Math.random()-0.5)*0.25, vy:-0.08-Math.random()*0.18, op:0.06+Math.random()*0.18, r:0.6+Math.random()*1.4, ph:Math.random()*Math.PI*2}));
  let t=0;
  function frame() {
    drawBg(); t+=0.018;
    motes.forEach(m=>{
      m.x+=m.vx+Math.sin(t+m.ph)*0.12; m.y+=m.vy;
      if(m.y<-5){m.y=cv.height+5; m.x=Math.random()*cv.width;}
      ctx.beginPath(); ctx.arc(m.x,m.y,m.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(255,215,140,${m.op})`; ctx.fill();
    });
    return requestAnimationFrame(frame);
  }
  return frame();
}

function animLateNight(ctx, cv, drawBg) {
  const drops = Array.from({length:110}, () => ({x:Math.random()*cv.width*0.52, y:Math.random()*cv.height, len:8+Math.random()*14, spd:5+Math.random()*6, op:0.12+Math.random()*0.3}));
  const moth={x:0,y:0,ph:0,r:16};
  let lampV=1, lampT=0;
  function frame() {
    drawBg();
    lampT++; if(lampT>35+Math.random()*55){lampV=0.5+Math.random()*0.5;lampT=0;}else{lampV=Math.min(1,lampV+0.06);}
    const g=ctx.createRadialGradient(cv.width*0.74,cv.height*0.28,0,cv.width*0.74,cv.height*0.28,cv.width*0.3);
    g.addColorStop(0,`rgba(232,160,32,${0.2*lampV})`); g.addColorStop(1,'rgba(232,160,32,0)');
    ctx.fillStyle=g; ctx.fillRect(0,0,cv.width,cv.height);
    drops.forEach(d=>{
      ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x-1.5,d.y+d.len);
      ctx.strokeStyle=`rgba(110,150,190,${d.op})`; ctx.lineWidth=0.7; ctx.stroke();
      d.y+=d.spd; if(d.y>cv.height){d.y=-d.len; d.x=Math.random()*cv.width*0.52;}
    });
    moth.ph+=0.038;
    const mx=cv.width*0.74+Math.cos(moth.ph)*moth.r, my=cv.height*0.28+Math.sin(moth.ph*1.3)*moth.r*0.5;
    ctx.beginPath(); ctx.arc(mx,my,1.4,0,Math.PI*2); ctx.fillStyle=`rgba(255,220,160,${0.55*lampV})`; ctx.fill();
    ctx.beginPath(); ctx.ellipse(mx-2.5,my,2.5,1.2,moth.ph,0,Math.PI*2); ctx.fillStyle=`rgba(200,175,110,${0.35*lampV})`; ctx.fill();
    ctx.beginPath(); ctx.ellipse(mx+2.5,my,2.5,1.2,-moth.ph,0,Math.PI*2); ctx.fill();
    return requestAnimationFrame(frame);
  }
  return frame();
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
  // Small delay so banner div has rendered dimensions
  setTimeout(() => renderSceneBanner('scene-bg-banner', bgKey), 50);

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
        const b64src = spriteKey === 'ren'    ? REN_SPRITE_B64    :
                       spriteKey === 'dougie' ? DOUGIE_SPRITE_B64 :
                       spriteKey === 'nadia'  ? NADIA_SPRITE_B64  :
                       spriteKey === 'mrk'    ? MRK_SPRITE_B64    :
                       spriteKey === 'bytos'  ? BYTOS_SPRITE_B64  : null;
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
  {
    id: 'p11', title: 'PUZZLE 11 — SWITCH STATEMENT',
    desc: 'Create a variable <code>year_of_study <- 2</code>, then use <code>switch()</code> to print "Freshperson", "Experienced", "Very Experienced", or "Ready to graduate" based on the value.',
    hint: 'switch(year_of_study, print("Freshperson"), print("Experienced"), print("Very Experienced"), print("Ready to graduate"))',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your practice sheet!<br><code style="color:var(--amber-bright)">switch(year_of_study,<br>  print("Freshperson"),<br>  print("Experienced"),<br>  print("Very Experienced"),<br>  print("Ready to graduate"))</code><br><br>switch() picks by position — value 1 → first option, value 2 → second, etc.</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasSwitch = /switch\s*\(/.test(allCode);
      const hasYear = /year_of_study\s*<-\s*2/.test(allCode);
      const hasOutput = outputs.some(o => o.includes('Experienced'));
      return hasSwitch && hasYear && hasOutput;
    },
    successMsg: '✓ CORRECT! switch() is cleaner than chained if/else when selecting from a fixed set of options.',
  },
  {
    id: 'p12', title: 'PUZZLE 12 — PASTE0 & STRINGS',
    desc: 'Create variables <code>name <- "Ren"</code> and <code>score <- 95</code>. Use <code>paste0()</code> to print: <code>Ren scored 95</code>',
    hint: 'name <- "Ren"; score <- 95; print(paste0(name, " scored ", score))',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br><code style="color:var(--amber-bright)">paste0()</code> joins strings with no separator:<br><code style="color:var(--amber-bright)">paste0("Hello", " ", "World")</code><br>→ "Hello World"<br><br>Mix variables and strings freely:<br><code style="color:var(--amber-bright)">paste0(name, " scored ", score)</code></div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasPaste = /paste0\s*\(/.test(allCode);
      const hasName = /name\s*<-\s*["']Ren["']/.test(allCode);
      const hasOutput = outputs.some(o => o.includes('Ren') && o.includes('95'));
      return hasPaste && hasName && hasOutput;
    },
    successMsg: '✓ CORRECT! paste0() is your go-to for building strings from variables. Used constantly in R output.',
  },
  {
    id: 'p13', title: 'PUZZLE 13 — RBIND & CBIND',
    desc: 'Create two vectors: <code>r1 <- c(1,2,3)</code> and <code>r2 <- c(4,5,6)</code>. Combine them into a matrix using <code>rbind()</code>, then print it.',
    hint: 'r1 <- c(1,2,3); r2 <- c(4,5,6); m <- rbind(r1, r2); print(m)',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your matrices sheet!<br><code style="color:var(--amber-bright)">rbind(r1, r2)</code> — stacks rows<br><code style="color:var(--amber-bright)">cbind(c1, c2)</code> — stacks columns<br><br>Result of rbind:<br><code style="color:var(--amber-bright)">   [,1] [,2] [,3]<br>r1    1    2    3<br>r2    4    5    6</code></div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasRbind = /rbind\s*\(/.test(allCode);
      const hasVecs = /r1\s*<-\s*c\(/.test(allCode) && /r2\s*<-\s*c\(/.test(allCode);
      const hasOutput = outputs.some(o => o.includes('[,1]') || o.includes('r1') || o.includes('1    2    3'));
      return hasRbind && hasVecs && hasOutput;
    },
    successMsg: '✓ CORRECT! rbind() builds matrices row by row. cbind() does it column by column. Both essential.',
  },
  {
    id: 'p14', title: 'PUZZLE 14 — MATRIX OPERATIONS',
    desc: 'Create matrix <code>m <- matrix(1:4, nrow=2, ncol=2)</code>. Then print its transpose with <code>t(m)</code> and check its inverse with <code>solve(m)</code>.',
    hint: 'm <- matrix(1:4, nrow=2, ncol=2); t(m); solve(m)',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>Matrix operations from your sheet:<br><code style="color:var(--amber-bright)">t(m)</code> — transpose (flip rows/cols)<br><code style="color:var(--amber-bright)">solve(m)</code> — matrix inverse<br><code style="color:var(--amber-bright)">m1 %*% m2</code> — matrix multiply<br><br>Note: solve() only works on square matrices. A matrix times its inverse = identity matrix.</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasMat = /matrix\s*\(1:4/.test(allCode);
      const hasT = /\bt\s*\(\s*m\s*\)/.test(allCode);
      const hasSolve = /solve\s*\(\s*m\s*\)/.test(allCode);
      return hasMat && hasT && hasSolve;
    },
    successMsg: '✓ CORRECT! t() and solve() are standard matrix tools. You\'ll see these in linear algebra and stats.',
  },
  {
    id: 'p15', title: 'PUZZLE 15 — DATA FRAME FILTERING',
    desc: 'Create the kids data frame: Name=c("Alice","Bob","Carol"), Age=c(15,12,5). Then filter it to show only kids older than 10: <code>kids[kids$Age > 10, ]</code>',
    hint: 'kids <- data.frame(Name=c("Alice","Bob","Carol"), Age=c(15,12,5)); kids[kids$Age > 10, ]',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>Filter a data frame with a condition:<br><code style="color:var(--amber-bright)">df[df$column > value, ]</code><br><br>The comma after the condition is required — it means "all columns".<br><br>So <code style="color:var(--amber-bright)">kids[kids$Age > 10, ]</code> returns rows where Age > 10, keeping all columns.</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasDf = /data\.frame\s*\(/.test(allCode);
      const hasFilter = /kids\s*\[\s*kids\s*\$\s*Age/.test(allCode);
      const hasOutput = outputs.some(o => o.includes('Alice') || o.includes('Bob'));
      return hasDf && hasFilter && hasOutput;
    },
    successMsg: '✓ CORRECT! df[condition, ] is the core filtering pattern in R. The comma means "keep all columns".',
  },
  {
    id: 'p16', title: 'PUZZLE 16 — MERGE DATA FRAMES',
    desc: 'Create two data frames: <code>kids1</code> with Name+Age and <code>kids2</code> with Name+Height. Merge them by Name using <code>merge(kids1, kids2, by="Name")</code>.',
    hint: 'kids1 <- data.frame(Name=c("Alice","Bob"), Age=c(15,12)); kids2 <- data.frame(Name=c("Alice","Bob"), Height=c(162,148)); merge(kids1, kids2, by="Name")',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your data frames sheet!<br><code style="color:var(--amber-bright)">merge(df1, df2, by="Name")</code><br><br>This is an inner join — only rows with matching Name in BOTH frames are kept.<br><br>If column names differ:<br><code style="color:var(--amber-bright)">merge(df1, df2,<br>  by.x="Name",<br>  by.y="Student")</code></div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasMerge = /merge\s*\(/.test(allCode);
      const hasBoth = /kids1/.test(allCode) && /kids2/.test(allCode);
      const hasBy = /by\s*=/.test(allCode);
      return hasMerge && hasBoth && hasBy;
    },
    successMsg: '✓ CORRECT! merge() is how you join tables in R — essential for real data work. Dougie needed this.',
  },
  {
    id: 'p17', title: 'PUZZLE 17 — GGPLOT GEOM_LINE & LAYERS',
    desc: 'Using the ggplot practice sheet pattern: create <code>xdat <- c(1:12)</code> and <code>ydat <- xdat^2</code>. Plot a line graph with <code>geom_line()</code>.',
    hint: 'xdat <- c(1:12); ydat <- xdat^2; print(ggplot(data=NULL) + geom_line(aes(x=xdat, y=ydat)))',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your ggplot sheet!<br><code style="color:var(--amber-bright)">ggplot(data=NULL) +<br>  geom_line(aes(x=xdat, y=ydat))</code><br><br>Key geom types:<br><code style="color:var(--amber-bright)">geom_point()</code> — scatter<br><code style="color:var(--amber-bright)">geom_line()</code> — line chart<br><code style="color:var(--amber-bright)">geom_bar()</code> — bar chart<br><code style="color:var(--amber-bright)">geom_histogram()</code> — histogram</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasLine = /geom_line\s*\(/.test(allCode);
      const hasAes = /aes\s*\(/.test(allCode);
      const hasData = /xdat/.test(allCode) && /ydat/.test(allCode);
      return hasLine && hasAes && hasData;
    },
    successMsg: '✓ CORRECT! geom_line() is the line chart layer. Swap it for geom_point() for scatter, geom_bar() for bars.',
  },
  {
    id: 'p18', title: 'PUZZLE 18 — GGPLOT HISTOGRAM & FACETS',
    desc: 'Write a ggplot histogram of engine displacement from the <code>mpg</code> dataset. Then add <code>facet_grid(year~.)</code> to split by year.',
    hint: 'ggplot(mpg) + geom_histogram(aes(x=displ), color="blue", fill="lightblue") + facet_grid(year~.)',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>From your ggplot sheet!<br><code style="color:var(--amber-bright)">ggplot(mpg) +<br>  geom_histogram(<br>    aes(x=displ),<br>    color="blue",<br>    fill="lightblue") +<br>  facet_grid(year~.)</code><br><br><code style="color:var(--amber-bright)">facet_grid(var~.)</code> splits the plot into subplots — one per value of var. Very useful for comparing groups.</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasHist = /geom_histogram\s*\(/.test(allCode);
      const hasFacet = /facet_grid\s*\(/.test(allCode);
      const hasMpg = /mpg/.test(allCode);
      return hasHist && hasFacet && hasMpg;
    },
    successMsg: '✓ CORRECT! facet_grid() splits one plot into a grid of subplots by a variable. Powerful for comparison.',
  },
  {
    id: 'p19', title: 'BONUS — THE CIRCLE FUNCTION',
    desc: 'From your practice sheet: write the <code>circle()</code> function that takes xcord, ycord, radius, and nsamples=64, builds x and y vectors using a for loop and cos/sin, then calls plot().',
    hint: 'circle <- function(xcord, ycord, radius, nsamples=64){ x<-c(); y<-c(); for(s in 1:nsamples){ x[s]<-radius*cos(2*pi*s/nsamples)+xcord; y[s]<-radius*sin(2*pi*s/nsamples)+ycord }; plot(x,y,asp=1) }',
    bytosTip: `<div class="tip"><b>BYTOS TIP:</b><br>This is straight from your practice sheet — the full circle function:<br><code style="color:var(--amber-bright)">circle <- function(xcord, ycord,<br>  radius, nsamples=64){<br>  x <- c()<br>  y <- c()<br>  for(s in 1:nsamples){<br>    x[s] <- radius*cos(<br>      2*pi*s/nsamples)+xcord<br>    y[s] <- radius*sin(<br>      2*pi*s/nsamples)+ycord<br>  }<br>  plot(x, y, asp=1)<br>}</code><br><br>This tests: functions + default args + for loops + vectors + math.</div>`,
    check: (code, outputs) => {
      const allCode = code.join('');
      const hasFunc = /circle\s*<-\s*function/.test(allCode);
      const hasFor = /for\s*\(/.test(allCode);
      const hasCos = /cos\s*\(/.test(allCode);
      const hasSin = /sin\s*\(/.test(allCode);
      const hasPlot = /plot\s*\(/.test(allCode);
      return hasFunc && hasFor && hasCos && hasSin && hasPlot;
    },
    successMsg: '✓ PERFECT! The circle function combines everything: functions, default args, for loops, vectors, and math. This is real R.',
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
const PUZZLE_XP    = [30, 35, 40, 40, 55, 50, 50, 45, 60, 70, 50, 45, 55, 60, 55, 65, 60, 65, 80];
const PUZZLE_COINS = [ 0,  0,  0,  1,  0,  1,  0,  0,  1,  2,  1,  0,  1,  1,  1,  2,  1,  2,  3];
const PUZZLE_REP   = [ 1,  1,  1,  1,  2,  2,  2,  2,  2,  3,  2,  2,  2,  3,  2,  3,  2,  3,  4];

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
  'switch() mastered. Your code now has taste.',
  'paste0() unlocked. You can now talk to R and it talks back.',
  'rbind() and cbind(). The building blocks of matrices. Solid.',
  't() and solve(). Linear algebra in two function calls. Respect.',
  'Filtered like a pro. df[condition, ] is burned into your brain now.',
  'merge() conquered. Dougie owes you a coffee. Several coffees.',
  'geom_line() added to your arsenal. The grammar grows.',
  'facet_grid() — the plot splits. You win.',
  "BYTOS: ...That's the circle function. From the practice sheet. You actually did it. I'm not crying. You're crying.",
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
  'terminal_7', // 1  variables
  'terminal_7', // 2  vectors
  'terminal_7', // 3  if/else
  'cafe_main',  // 4  for loop
  'terminal_7', // 5  functions
  'late_night', // 6  matrices
  'late_night', // 7  data frames
  'cafe_main',  // 8  while loop
  'late_night', // 9  ggplot basics
  'late_night', // 10 ggplot layers
  'terminal_7', // 11 switch
  'terminal_7', // 12 paste0
  'late_night', // 13 rbind/cbind
  'late_night', // 14 matrix ops
  'cafe_main',  // 15 df filtering
  'late_night', // 16 merge
  'terminal_7', // 17 geom_line
  'late_night', // 18 histogram+facet
  'cafe_main',  // 19 bonus circle
];

function setConsoleBanner(idx) {
  const key = PUZZLE_BG[idx] || 'terminal_7';
  // Small delay so the banner div is rendered and has dimensions
  setTimeout(() => renderSceneBanner('console-bg-banner', key), 50);
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

  // switch statement
  if (/^switch\s*\(/.test(trimmed)) {
    if (/year_of_study/.test(allCode)) {
      const yearMatch = allCode.match(/year_of_study\s*<-\s*(\d)/);
      const yr = yearMatch ? parseInt(yearMatch[1]) : 1;
      const opts = ['Freshperson','Experienced','Very Experienced','Ready to graduate'];
      return '[1] "' + (opts[yr-1] || 'Freshperson') + '"';
    }
    return '[1] (switch result)';
  }

  // paste0
  if (/paste0\s*\(/.test(trimmed)) {
    if (/name/.test(allCode) && /score/.test(allCode)) return '[1] "Ren scored 95"';
    const inner = trimmed.replace(/print\s*\(|paste0\s*\(|\)/g,'');
    return '[1] "' + inner.replace(/['"]/g,'').replace(/,\s*/g,'') + '"';
  }

  // rbind / cbind
  if (/rbind\s*\(/.test(trimmed)) {
    return '   [,1] [,2] [,3]\nr1    1    2    3\nr2    4    5    6';
  }
  if (/cbind\s*\(/.test(trimmed)) {
    return '     r1 r2\n[1,]  1  4\n[2,]  2  5\n[3,]  3  6';
  }

  // Transpose
  if (/^t\s*\(\s*m\s*\)/.test(trimmed)) {
    return '     [,1] [,2]\n[1,]    1    3\n[2,]    2    4';
  }

  // solve
  if (/^solve\s*\(\s*m\s*\)/.test(trimmed)) {
    return '     [,1] [,2]\n[1,]   -2  1.5\n[2,]    1 -0.5';
  }

  // matplot
  if (/matplot\s*\(/.test(trimmed)) return '# matplot: multi-column plot rendered';

  // Data frame filtering
  if (/kids\s*\[\s*kids\s*\$\s*Age\s*>/.test(trimmed)) {
    return '   Name Age\n1 Alice  15\n2   Bob  12';
  }

  // merge
  if (/^merge\s*\(/.test(trimmed) || /merge\s*\(/.test(trimmed) && /<-/.test(trimmed)) {
    return '   Name Age Height\n1 Alice  15    162\n2   Bob  12    148';
  }

  // geom_line, geom_bar, geom_histogram, facet_grid
  if (/geom_line\s*\(/.test(trimmed) || /geom_bar\s*\(/.test(trimmed) ||
      /geom_histogram\s*\(/.test(trimmed) || /facet_grid\s*\(/.test(trimmed)) {
    return '# ggplot2: plot rendered (visualization layer)';
  }

  // plot() for circle function
  if (/^plot\s*\(/.test(trimmed)) return '# base R plot rendered';

  // circle function call
  if (/^circle\s*\(/.test(trimmed)) return '# circle plot rendered';

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
    'Great! Variables store values. The foundation of everything in R.',
    'Vectors! c() combines values. Most R data is vectors at heart.',
    'if/else! Conditional logic lets code make decisions.',
    'for loops! Iterate over sequences. Your circle function uses this.',
    'Functions! Write once, reuse forever. This is the core of good R code.',
    'Matrices! 2D data structures. Matrix math is powerful in R.',
    'Data frames! Tables of mixed data types. Your bread and butter.',
    'while loops! Condition-based repetition. Handle edge cases carefully!',
    'ggplot2 basics! The grammar of graphics — canvas, aesthetics, geom.',
    'ggplot2 layers! Multi-layer plots with colour mapping.',
    'switch()! Cleaner than chained if/else for fixed option sets.',
    'paste0()! String building. You can now construct any output message.',
    'rbind() and cbind()! Build matrices from vectors — two directions.',
    'Matrix operations! Transpose, multiply, invert. Linear algebra unlocked.',
    'Data frame filtering! df[condition, ] is the core query pattern.',
    'merge()! Joining tables by a common column. Real data work.',
    'geom_line()! Line charts. Another layer type in the ggplot grammar.',
    'facet_grid()! Subplots by variable. The full ggplot toolkit.',
    'The circle function! Functions + loops + vectors + math. You covered everything. 🎉',
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
function exportSave() {
  try {
    const raw    = localStorage.getItem(SAVE_KEY);
    const modal  = document.getElementById('save-modal');
    const title  = document.getElementById('save-modal-title');
    const desc   = document.getElementById('save-modal-desc');
    const text   = document.getElementById('save-modal-text');
    const action = document.getElementById('save-modal-action');

    title.textContent = 'EXPORT SAVE';
    desc.textContent  = 'Copy this text and keep it somewhere safe. Paste it back using [ IMPORT SAVE ] to restore your progress.';

    if (raw) {
      text.value = raw;
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

function importSave() {
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
  action.onclick = () => {
    const raw = text.value.trim();
    if (!raw) { showToast('Nothing to import.', 'red'); return; }
    try {
      JSON.parse(raw);
      localStorage.setItem(SAVE_KEY, raw);
      showToast('Save restored! Reloading...', 'green');
      setTimeout(() => location.reload(), 1200);
    } catch(e) {
      showToast('Invalid save data. Check the text and try again.', 'red');
    }
  };
  modal.style.display = 'flex';
}

