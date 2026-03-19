const BASE_SHOP_ITEMS = [
  // ── CONSUMABLES ──────────────────────────────────────────────
  { id:'hint_x1',     category:'consumable', icon:'💡',    name:'HINT TOKEN',
    desc:'BYTOS whispers the answer. No shame. Mostly shame.',
    cost:1, repCost:0, type:'hint', qty:1 },
  { id:'hint_x3',     category:'consumable', icon:'💡💡💡', name:'HINT BUNDLE',
    desc:'Three hints. Dougie calls this cheating. Dougie has 3 Goals columns.',
    cost:2, repCost:0, type:'hint', qty:3 },
  { id:'double_xp',   category:'consumable', icon:'⚡',    name:'DOUBLE XP TOKEN',
    desc:'Next puzzle gives 2× XP. Choose the hard one.',
    cost:2, repCost:0, type:'double_xp', qty:1 },
  { id:'xp_boost',    category:'consumable', icon:'🚀',    name:'XP SURGE',
    desc:'Instantly gain 80 XP. No puzzle required. BYTOS is conflicted.',
    cost:3, repCost:0, type:'xp_boost', qty:80 },
  { id:'coin_flip',   category:'consumable', icon:'🪙',    name:'COIN FLIP',
    desc:'50/50. Win 3 coins or lose 1. The café has a gambling problem.',
    cost:1, repCost:0, type:'coin_flip', qty:1 },

  // ── STORY UNLOCKS ─────────────────────────────────────────────
  { id:'story_nadia', category:'story', icon:'📼', name:"NADIA'S TAPE",
    desc:"Unlocks a secret BBS channel. What Nadia knows about port 3127.",
    cost:3, repCost:5, type:'story', unlock:'story_nadia' },
  { id:'story_misterK', category:'story', icon:'☕', name:"MR. K'S STORY",
    desc:"The café owner's origin. He wasn't always just a man with good coffee.",
    cost:4, repCost:5, type:'story', unlock:'story_misterK' },
  { id:'story_dougie2', category:'story', icon:'🏒', name:"DOUGIE'S CSV SAGA",
    desc:"The full disaster, post by post. It gets worse before it gets worse.",
    cost:2, repCost:0, type:'story', unlock:'dougie_saga' },
  { id:'story_bytos',   category:'story', icon:'🖥️', name:"BYTOS INTERNAL LOG",
    desc:"Fragment of BYTOS's own process log. Dry. Precise. Unsettling.",
    cost:5, repCost:8, type:'story', unlock:'story_bytos' },

  // ── COSMETICS — THEMES ───────────────────────────────────────
  { id:'theme_green',    category:'cosmetic', icon:'🟢', name:'PHOSPHOR GREEN',
    desc:'Switch to classic green phosphor. Very hacker. Very 1982.',
    cost:2, repCost:0, type:'cosmetic', unlock:'theme_green' },
  { id:'theme_blue',     category:'cosmetic', icon:'🔵', name:'COOL BLUE MODE',
    desc:"Blue terminal. Nadia's setup. Don't tell her.",
    cost:3, repCost:0, type:'cosmetic', unlock:'theme_blue' },
  { id:'theme_red',      category:'cosmetic', icon:'🔴', name:'RED ALERT',
    desc:'Red phosphor. Extremely stressful. Perfect for exam season.',
    cost:4, repCost:0, type:'cosmetic', unlock:'theme_red' },
  { id:'theme_white',    category:'cosmetic', icon:'⬜', name:'PAPER WHITE',
    desc:'Inverted. Light background, dark text. For the contrarians.',
    cost:3, repCost:0, type:'cosmetic', unlock:'theme_white' },

  // ── COSMETICS — TERMINAL ─────────────────────────────────────
  { id:'crt_glow',       category:'cosmetic', icon:'✨', name:'CRT GLOW BOOST',
    desc:'Extra phosphor bloom. Your eyes will hate you. Your aesthetic will not.',
    cost:2, repCost:0, type:'cosmetic', unlock:'crt_glow' },
  { id:'scanlines_off',  category:'cosmetic', icon:'👁',  name:'SCANLINES OFF',
    desc:'Remove scanlines. Purists will know. You will not care.',
    cost:1, repCost:0, type:'cosmetic', unlock:'scanlines_off' },
  { id:'scanlines_fine', category:'cosmetic', icon:'▤', name:'FINE SCANLINES',
    desc:'A tighter scanline lattice. Cleaner than stock, still gloriously fake.',
    cost:2, repCost:0, type:'cosmetic', unlock:'scanlines_fine', minLevel:3 },
  { id:'scanlines_heavy',category:'cosmetic', icon:'📺', name:'HEAVY SCANLINES',
    desc:'Maximum scanline intensity. Legally blind in 1999.',
    cost:2, repCost:0, type:'cosmetic', unlock:'scanlines_heavy' },
  { id:'cursor_beam',    category:'cosmetic', icon:'|',  name:'BEAM CURSOR',
    desc:'Switch from block cursor to a thin beam. Subtle. Classy.',
    cost:1, repCost:0, type:'cosmetic', unlock:'cursor_beam' },
  { id:'cursor_underline',category:'cosmetic', icon:'_',  name:'UNDERLINE CURSOR',
    desc:'Low-profile, late-shift cursor styling for cleaner reading.',
    cost:2, repCost:0, type:'cosmetic', unlock:'cursor_underline', minLevel:3 },
  { id:'theme_ice',      category:'cosmetic', icon:'❄️', name:'ICE MODE',
    desc:'Cool cyan phosphor for long study sessions and suspiciously calm nerves.',
    cost:4, repCost:0, type:'cosmetic', unlock:'theme_ice', minLevel:2 },
  { id:'theme_honey',    category:'cosmetic', icon:'🍯', name:'HONEY PHOSPHOR',
    desc:'Warm amber-gold shell for cozy review nights.',
    cost:5, repCost:0, type:'cosmetic', unlock:'theme_honey', minLevel:4 },
  { id:'theme_noir',     category:'cosmetic', icon:'🌒', name:'NOIR TERMINAL',
    desc:'A darker, sharper look for harder checkpoint runs.',
    cost:6, repCost:4, type:'cosmetic', unlock:'theme_noir', minLevel:6 },
  { id:'glow_soft',      category:'cosmetic', icon:'🫧', name:'SOFT BLOOM',
    desc:'Less arcade burn, more polished phosphor bloom.',
    cost:2, repCost:0, type:'cosmetic', unlock:'glow_soft', minLevel:2 },
  { id:'glow_hot',       category:'cosmetic', icon:'🔥', name:'HOT PHOSPHOR',
    desc:'Aggressive afterglow for when the chapter boss is watching.',
    cost:4, repCost:3, type:'cosmetic', unlock:'glow_hot', minLevel:6 },
  { id:'shell_polished', category:'cosmetic', icon:'🪞', name:'POLISHED SHELL',
    desc:'Cleans up the monitor chrome and gives the whole station a premium finish.',
    cost:4, repCost:0, type:'cosmetic', unlock:'shell_polished', minLevel:4 },
  { id:'shell_lab',      category:'cosmetic', icon:'🧪', name:'LAB SHELL',
    desc:'Clinical, study-heavy shell styling unlocked once the RNA-splicing run is truly under control.',
    cost:5, repCost:4, type:'cosmetic', unlock:'shell_lab', moduleComplete:'module_12_13' },
  { id:'ambience_rain',  category:'cosmetic', icon:'🌧', name:'RAIN DRIFT',
    desc:'Adds a moody rain-haze shimmer to the screen atmosphere.',
    cost:2, repCost:0, type:'cosmetic', unlock:'ambience_rain', minLevel:2 },
  { id:'ambience_grid',  category:'cosmetic', icon:'🧬', name:'RESEARCH GRID',
    desc:'Subtle analysis grid for study-heavy chapters and lab vibes.',
    cost:4, repCost:0, type:'cosmetic', unlock:'ambience_grid', minLevel:5 },
  { id:'ambience_dust',  category:'cosmetic', icon:'✨', name:'PHOSPHOR DUST',
    desc:'A floating dust-and-noise layer that makes the screen feel haunted in a useful way.',
    cost:5, repCost:4, type:'cosmetic', unlock:'ambience_dust', minLevel:7 },

  // ── UPGRADES — PERMANENT ─────────────────────────────────────
  { id:'xp_multiplier',  category:'upgrade', icon:'📈', name:'XP MULTIPLIER',
    desc:'Permanent 1.25× XP on all future puzzle solves. Stacks with Double XP.',
    cost:6, repCost:0, type:'upgrade', unlock:'xp_multiplier' },
  { id:'hint_discount',  category:'upgrade', icon:'💸', name:'BYTOS DISCOUNT',
    desc:'Hint tokens cost 0¢ from the shop forever. BYTOS is not pleased.',
    cost:8, repCost:10, type:'upgrade', unlock:'hint_discount' },
  { id:'rep_boost',      category:'upgrade', icon:'⭐', name:'REPUTATION BOOST',
    desc:'Earn +1 bonus REP on every puzzle solve. Permanently.',
    cost:5, repCost:0, type:'upgrade', unlock:'rep_boost' },

  // ── PERSONALISATION ──────────────────────────────────────────
  { id:'bytos_sarcasm',  category:'personal', icon:'😐', name:'BYTOS: SARCASM MODE',
    desc:'Unlocks a new set of BYTOS responses. Dryer. Meaner. Still helping.',
    cost:3, repCost:5, type:'bytos_mode', unlock:'bytos_sarcasm' },
  { id:'bytos_warm',     category:'personal', icon:'🤗', name:'BYTOS: WARM MODE',
    desc:'BYTOS is actually encouraging for once. Suspicious but welcome.',
    cost:3, repCost:5, type:'bytos_mode', unlock:'bytos_warm' },
  { id:'name_tag',       category:'personal', icon:'🏷️', name:'NAME TAG',
    desc:'Your name appears in the story instead of Ren. Enter it when prompted.',
    cost:4, repCost:0, type:'name_tag', unlock:'name_tag' },
  { id:'custom_boot',    category:'personal', icon:'💾', name:'CUSTOM BOOT MSG',
    desc:'Add your own line to the boot sequence. One line. Make it count.',
    cost:3, repCost:0, type:'custom_boot', unlock:'custom_boot' },
];

function getActiveShopConfig() {
  const activePack = typeof getActiveCoursePack === 'function' ? getActiveCoursePack() : null;
  return activePack && activePack.runtime && activePack.runtime.shop ? activePack.runtime.shop : null;
}

function getActiveShopItems() {
  const config = getActiveShopConfig();
  return config && Array.isArray(config.items) && config.items.length ? config.items : BASE_SHOP_ITEMS;
}

function getShopProgressSnapshot() {
  const activePack = typeof getActiveCoursePack === 'function' ? getActiveCoursePack() : null;
  const modules = activePack && typeof getCourseModules === 'function' ? getCourseModules(activePack) : [];
  const completedModules = modules.filter(module => {
    const state = typeof getModuleProgressState === 'function' ? getModuleProgressState(module.id, activePack) : null;
    return !!(state && state.completed);
  }).length;
  const activeModule = typeof getActiveModule === 'function' ? getActiveModule(activePack) : null;
  const activeState = activeModule && typeof getModuleProgressState === 'function' ? getModuleProgressState(activeModule.id, activePack) : null;
  return {
    level: econ.level,
    rep: econ.rep,
    coins: econ.coins,
    activeCourseId: activePack ? activePack.id : 'r-terminal',
    activeCourseTitle: activePack ? activePack.title : 'R Terminal Session',
    activeModuleId: activeModule ? activeModule.id : null,
    activeModuleTitle: activeModule ? (activeModule.shortLabel || activeModule.title) : null,
    activeModuleProgress: activeState ? activeState.completedPuzzles || 0 : 0,
    completedModules,
  };
}

function isItemOwned(item) {
  return (item.type === 'cosmetic' || item.type === 'story' || item.type === 'upgrade' || item.type === 'bytos_mode' || item.type === 'name_tag' || item.type === 'custom_boot')
    ? !!econ.owned[item.unlock]
    : false;
}

function getItemRequirements(item, progress = getShopProgressSnapshot()) {
  const reqs = [];
  if (item.minLevel) reqs.push('LV ' + item.minLevel);
  if (item.minRep) reqs.push(item.minRep + ' REP');
  if (item.moduleComplete) reqs.push('clear ' + item.moduleComplete.replace('module_', 'M'));
  if (item.courseId && progress.activeCourseId !== item.courseId) reqs.push(progress.activeCourseTitle + ' only');
  return reqs;
}

function isShopItemUnlocked(item, progress = getShopProgressSnapshot()) {
  if (item.minLevel && progress.level < item.minLevel) return false;
  if (item.minRep && progress.rep < item.minRep) return false;
  if (item.moduleComplete && typeof getModuleProgressState === 'function') {
    const state = getModuleProgressState(item.moduleComplete);
    if (!state || !state.completed) return false;
  }
  if (item.courseId && progress.activeCourseId !== item.courseId) return false;
  return true;
}

function getShopTier(progress = getShopProgressSnapshot()) {
  const config = getActiveShopConfig();
  const labels = config && config.tierLabels ? config.tierLabels : {
    opening: 'OPENING HOURS',
    mid: 'LATE SHIFT',
    late: 'MIDNIGHT LAB'
  };
  if (progress.completedModules >= 1 || progress.level >= 7) return labels.late || labels.mid || labels.opening;
  if (progress.level >= 4) return labels.mid || labels.opening;
  return labels.opening || 'OPENING HOURS';
}

function getNextShopUnlock(progress = getShopProgressSnapshot()) {
  return getActiveShopItems().find(item => !isItemOwned(item) && !isShopItemUnlocked(item, progress)) || null;
}

function getItemLockCopy(item) {
  if (item.moduleComplete) return 'Unlock by clearing ' + item.moduleComplete.replace('module_', 'Module ').replace(/_/g, '-');
  if (item.minLevel) return 'Unlocks at Level ' + item.minLevel;
  if (item.minRep) return 'Requires ' + item.minRep + ' REP';
  return 'Progress locked';
}

function renderShop() {
  const panel = document.getElementById('shop-items-panel');
  if (!panel) return;
  panel.innerHTML = '';
  const progress = getShopProgressSnapshot();
  const nextUnlock = getNextShopUnlock(progress);
  const config = getActiveShopConfig();
  const catalogKicker = config && config.catalogKicker ? config.catalogKicker : 'BYTE/CAFE CATALOG TIER';
  const categoryLabels = (config && config.categoryLabels) || {};
  const activeItems = getActiveShopItems();
  const overview = document.createElement('div');
  overview.className = 'shop-progress-panel';
  overview.innerHTML =
    '<div class="shop-progress-kicker">' + catalogKicker + '</div>' +
    '<div class="shop-progress-title">' + getShopTier(progress) + '</div>' +
    '<div class="shop-progress-copy">Course: ' + progress.activeCourseTitle + (progress.activeModuleTitle ? ' | Module: ' + progress.activeModuleTitle : '') + '</div>' +
    '<div class="shop-progress-copy">Level ' + progress.level + ' | ' + progress.rep + ' REP | ' + progress.completedModules + ' chapter(s) cleared</div>' +
    '<div class="shop-progress-next">' + (nextUnlock ? 'Next unlock: ' + nextUnlock.name + ' [' + getItemLockCopy(nextUnlock) + ']' : 'All current catalog items unlocked.') + '</div>';
  panel.appendChild(overview);
  const cats = [
    { key:'consumable', label:'CONSUMABLES' },
    { key:'story',      label:'STORY UNLOCKS' },
    { key:'cosmetic',   label:'COSMETICS — THEMES & TERMINAL' },
    { key:'upgrade',    label:'UPGRADES — PERMANENT' },
    { key:'personal',   label:'PERSONALISATION' },
  ].filter(cat => activeItems.some(item => item.category === cat.key));
  cats.forEach(cat => {
    const title = document.createElement('div');
    title.className = 'shop-section-title';
    title.textContent = categoryLabels[cat.key] || cat.label;
    panel.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'shop-grid';
    activeItems.filter(i => i.category === cat.key).forEach(item => {
      const isOwned = isItemOwned(item);
      const isUnlocked = isShopItemUnlocked(item, progress);
      const displayCost = (item.type === 'hint' && econ.owned['hint_discount']) ? 0 : item.cost;
      const effectiveCost = displayCost;
      const cantAfford = !isUnlocked || econ.coins < effectiveCost || (item.repCost && econ.rep < item.repCost);
      const el = document.createElement('div');
      el.className = 'shop-item' + (isOwned ? ' owned' : !isUnlocked ? ' locked' : cantAfford ? ' cant-afford' : '');
      const reqs = getItemRequirements(item, progress);
      el.innerHTML =
        '<div class="shop-item-icon">' + item.icon + '</div>' +
        '<div class="shop-item-name">' + item.name + '</div>' +
        '<div class="shop-item-desc">' + item.desc + '</div>' +
        (reqs.length ? '<div class="shop-item-req">' + reqs.join(' • ') + '</div>' : '') +
        '<div class="shop-item-cost">Cost: <span class="c">' + effectiveCost + '¢</span>' +
          (item.repCost ? ' + <span class="c">' + item.repCost + ' REP</span>' : '') +
          (effectiveCost < item.cost ? ' <span style="color:var(--green);font-size:9px;">[DISCOUNTED]</span>' : '') +
        '</div>' +
        (isOwned ? '<div class="shop-owned-tag">OWNED</div>' : !isUnlocked ? '<div class="shop-lock-tag">LOCKED</div>' : '');
      if (!isOwned && isUnlocked && !cantAfford) el.onclick = () => { const i2 = {...item, cost: effectiveCost}; buyItem(i2); };
      grid.appendChild(el);
    });
    panel.appendChild(grid);
  });
  renderInventory();
  updateHUD();
}

function buyItem(item) {
  if (!isShopItemUnlocked(item)) { showToast('That catalog item is still locked by progress.', 'amber'); return; }
  if (!spendCoins(item.cost)) { showToast('Not enough coins, Ren.', 'red'); return; }
  if (item.repCost && econ.rep < item.repCost) {
    econ.coins += item.cost; updateHUD();
    showToast('Not enough REP for that.', 'red'); return;
  }
  if (item.repCost) { econ.rep -= item.repCost; updateHUD(); }

  if (item.type === 'hint') {
    econ.inventory['hint'] = (econ.inventory['hint'] || 0) + item.qty;
    showToast('Bought ' + item.qty + ' hint token(s). BYTOS: "Use wisely. Or not."', 'green');

  } else if (item.type === 'double_xp') {
    econ.inventory['double_xp'] = (econ.inventory['double_xp'] || 0) + 1;
    showToast('Double XP token ready. Choose the hard puzzle.', 'green');

  } else if (item.type === 'xp_boost') {
    awardXP(item.qty, 'XP Surge purchase');
    showToast('BYTOS: "That felt wrong. But the XP is real."', 'amber');

  } else if (item.type === 'coin_flip') {
    const won = Math.random() > 0.5;
    if (won) { econ.coins += 3; updateHUD(); saveGame(); showToast('Coin flip: WIN. +3 coins. Do not make this a habit.', 'green'); }
    else      { econ.coins -= 1; if(econ.coins<0) econ.coins=0; updateHUD(); saveGame(); showToast('Coin flip: LOSS. -1 coin. The house always wins.', 'red'); }

  } else if (item.type === 'cosmetic') {
    econ.owned[item.unlock] = true;
    const slot = getCosmeticSlot(item.unlock);
    if (slot) econ.cosmetics[slot] = item.unlock;
    applyOwnedCosmetics();
    showToast(item.name + ' applied.', 'green');

  } else if (item.type === 'upgrade') {
    econ.owned[item.unlock] = true;
    applyUpgrades();
    showToast(item.name + ' unlocked permanently.', 'green');

  } else if (item.type === 'story') {
    econ.owned[item.unlock] = true;
    showToast('Story unlocked: ' + item.name + '. Check the BBS.', 'green');
    if (item.unlock === 'story_nadia')   unlockNadiaStory();
    if (item.unlock === 'story_misterK') unlockMrKStory();
    if (item.unlock === 'dougie_saga')   unlockDougieStory();
    if (item.unlock === 'story_bytos')   unlockBytosLog();

  } else if (item.type === 'bytos_mode') {
    // Deactivate other modes first
    delete econ.owned['bytos_sarcasm'];
    delete econ.owned['bytos_warm'];
    econ.owned[item.unlock] = true;
    showToast('BYTOS mode changed. Prepare yourself.', 'green');

  } else if (item.type === 'name_tag') {
    econ.owned['name_tag'] = true;
    const name = prompt('Enter your name (shown in the story):');
    if (name && name.trim()) {
      econ.owned['player_name'] = name.trim().substring(0, 20);
      showToast('Name set to: ' + econ.owned['player_name'] + '. The story knows you now.', 'green');
    } else {
      showToast('Name tag purchased. Set your name next time you open the shop.', 'amber');
    }

  } else if (item.type === 'custom_boot') {
    econ.owned['custom_boot'] = true;
    const msg = prompt('Enter your custom boot message (one line, max 60 chars):');
    if (msg && msg.trim()) {
      econ.owned['custom_boot_msg'] = msg.trim().substring(0, 60);
      showToast('Boot message saved. Reload to see it.', 'green');
    } else {
      showToast('Custom boot purchased. Enter your message next time.', 'amber');
    }
  }

  saveGame();
  renderShop();
  SFX.purchase();
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
  const cosmeticSlots = Object.keys(COSMETIC_SLOTS).map(key => ({ key, label: COSMETIC_SLOT_LABELS[key] || key }));
  let anyCosmetics = false;
  cosmeticSlots.forEach(slot => {
    const options = getOwnedCosmeticOptions(slot.key);
    if (options.length <= 1) return;
    anyCosmetics = true;
    const current = econ.cosmetics[slot.key] || 'default';
    const el = document.createElement('div');
    el.className = 'inv-item cosmetic-item';
    el.innerHTML =
      '<span>' + slot.label + '</span>' +
      '<span class="inv-equipped-label">' + (COSMETIC_LABELS[current] || 'DEFAULT') + '</span>';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'inv-use-btn';
    resetBtn.textContent = '[ DEFAULT ]';
    resetBtn.disabled = current === 'default';
    resetBtn.onclick = () => {
      setEquippedCosmetic(slot.key, 'default');
      showToast(slot.label + ' reset to default.', 'amber');
      renderInventory();
    };

    const cycleBtn = document.createElement('button');
    cycleBtn.className = 'inv-use-btn';
    cycleBtn.textContent = '[ CYCLE ]';
    cycleBtn.onclick = () => {
      const next = cycleCosmeticSlot(slot.key);
      showToast(slot.label + ': ' + (COSMETIC_LABELS[next] || 'DEFAULT'), 'green');
      renderInventory();
    };

    el.appendChild(resetBtn);
    el.appendChild(cycleBtn);
    panel.appendChild(el);
  });

  if (!any && !anyCosmetics) {
    panel.innerHTML = '<div style="font-size:11px;color:var(--text-dim);">Empty. Go buy something.</div>';
  }
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
