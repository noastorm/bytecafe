const ACTIVE_COURSE_KEY = 'bytecafe_active_course_v1';
const DEFAULT_COURSE_ID = 'r-terminal';

window.ACTIVE_COURSE_ID = window.ACTIVE_COURSE_ID || localStorage.getItem(ACTIVE_COURSE_KEY) || DEFAULT_COURSE_ID;
window.ACTIVE_COURSE_PACK = null;
window.ACTIVE_MODULE_ID = window.ACTIVE_MODULE_ID || null;
window.COURSE_PROGRESS = window.COURSE_PROGRESS || {
  activeModuleId: null,
  moduleProgress: {},
  storyQueue: [],
  seenStoryScenes: [],
  activeStorySceneId: null,
};

const BUILTIN_COURSE_PACKS = {
  [DEFAULT_COURSE_ID]: {
    id: DEFAULT_COURSE_ID,
    title: 'R Terminal Session',
    shortLabel: 'EECS 1520',
    description: 'The original ByteCafe R assignment campaign.',
    consoleButtonLabel: 'R CONSOLE',
    notesTitle: 'NOTES - EECS 1520 REFERENCE',
    consoleTitle: 'R CONSOLE - EECS 1520',
    storyTitle: 'STORY - BYTE/CAFE MAIN FLOOR',
    storyMode: 'story',
    themeClass: 'course-r-terminal',
  },
};

function getCourseCatalog() {
  const generated = window.GENERATED_COURSE_PACKS || {};
  return { ...BUILTIN_COURSE_PACKS, ...generated };
}

function sanitizeCourseTheme(id) {
  return 'course-' + String(id || DEFAULT_COURSE_ID).replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

function getActiveCourseId() {
  return window.ACTIVE_COURSE_ID || DEFAULT_COURSE_ID;
}

function getActiveCoursePack() {
  const catalog = getCourseCatalog();
  return catalog[getActiveCourseId()] || catalog[DEFAULT_COURSE_ID];
}

function getModuleStorageKey(courseId) {
  return 'bytecafe_active_module_v1_' + courseId;
}

function ensureCourseProgressShape() {
  if (!window.COURSE_PROGRESS || typeof window.COURSE_PROGRESS !== 'object') {
    window.COURSE_PROGRESS = {};
  }
  if (!window.COURSE_PROGRESS.moduleProgress) window.COURSE_PROGRESS.moduleProgress = {};
  if (!Array.isArray(window.COURSE_PROGRESS.storyQueue)) window.COURSE_PROGRESS.storyQueue = [];
  if (!Array.isArray(window.COURSE_PROGRESS.seenStoryScenes)) window.COURSE_PROGRESS.seenStoryScenes = [];
  if (window.COURSE_PROGRESS.activeStorySceneId == null) window.COURSE_PROGRESS.activeStorySceneId = null;
}

function getCourseModules(pack = getActiveCoursePack()) {
  if (!pack || !pack.runtime || !Array.isArray(pack.runtime.modules)) return [];
  return pack.runtime.modules;
}

function getDefaultModuleId(pack = getActiveCoursePack()) {
  const modules = getCourseModules(pack);
  return modules.length ? modules[0].id : null;
}

function getActiveModuleId() {
  return window.ACTIVE_MODULE_ID || (window.COURSE_PROGRESS && window.COURSE_PROGRESS.activeModuleId) || null;
}

function getActiveModule(pack = getActiveCoursePack()) {
  const moduleId = getActiveModuleId();
  return getCourseModules(pack).find(module => module.id === moduleId) || null;
}

function getModuleProgressState(moduleId = getActiveModuleId(), pack = getActiveCoursePack()) {
  ensureCourseProgressShape();
  if (!moduleId) return null;
  const module = getCourseModules(pack).find(item => item.id === moduleId);
  if (!module) return null;
  if (!window.COURSE_PROGRESS.moduleProgress[moduleId]) {
    window.COURSE_PROGRESS.moduleProgress[moduleId] = {
      currentPuzzle: 0,
      completedPuzzles: 0,
      completed: false,
      unlocked: module.unlockAfterModuleId ? false : true,
      midSceneQueued: false,
      completeSceneQueued: false,
      queuedStoryBeats: {},
      mastery: {},
      totalAttempts: 0,
      totalWrong: 0,
      firstTryClears: 0,
      checkpointUnlocked: false,
    };
  }
  const state = window.COURSE_PROGRESS.moduleProgress[moduleId];
  if (!state.mastery || typeof state.mastery !== 'object') state.mastery = {};
  if (state.totalAttempts == null) state.totalAttempts = 0;
  if (state.totalWrong == null) state.totalWrong = 0;
  if (state.firstTryClears == null) state.firstTryClears = 0;
  if (state.checkpointUnlocked == null) state.checkpointUnlocked = false;
  const modulePuzzles = getModulePuzzles(pack, moduleId);
  const maxCount = modulePuzzles.length;
  state.completedPuzzles = Math.max(0, Math.min(state.completedPuzzles || 0, maxCount));
  state.currentPuzzle = Math.max(0, Math.min(state.currentPuzzle || 0, maxCount));
  state.completed = !!state.completed || (maxCount > 0 && state.completedPuzzles >= maxCount);
  if (!module.unlockAfterModuleId) state.unlocked = true;
  if (state.completed) {
    state.completedPuzzles = maxCount;
    state.currentPuzzle = maxCount;
  }
  return state;
}

function getMasteryLabelMap(pack = getActiveCoursePack()) {
  return (pack && pack.runtime && pack.runtime.masteryLabels) || {};
}

function ensureMasteryBucket(state, key) {
  if (!state.mastery[key]) {
    state.mastery[key] = { correct: 0, wrong: 0 };
  }
  return state.mastery[key];
}

function getPuzzleMasteryTags(puzzle) {
  return Array.isArray(puzzle && puzzle.masteryTags) && puzzle.masteryTags.length
    ? puzzle.masteryTags
    : ['general'];
}

function recordModuleAttempt(puzzle, solved, firstTry = false) {
  const moduleId = puzzle && puzzle.moduleId ? puzzle.moduleId : getActiveModuleId();
  const state = getModuleProgressState(moduleId);
  if (!state || !puzzle) return;
  state.totalAttempts = (state.totalAttempts || 0) + 1;
  if (!solved) state.totalWrong = (state.totalWrong || 0) + 1;
  if (solved && firstTry) state.firstTryClears = (state.firstTryClears || 0) + 1;

  getPuzzleMasteryTags(puzzle).forEach(tag => {
    const bucket = ensureMasteryBucket(state, tag);
    if (solved) bucket.correct += 1;
    else bucket.wrong += 1;
  });
  updateModuleSelectorUI();
}

function getModuleAccuracy(state) {
  if (!state) return 0;
  const attempts = Math.max(1, state.totalAttempts || 0);
  return Math.max(0, ((attempts - (state.totalWrong || 0)) / attempts));
}

function getModuleWeakSpot(moduleId = getActiveModuleId(), pack = getActiveCoursePack()) {
  const state = getModuleProgressState(moduleId, pack);
  if (!state) return null;
  const labels = getMasteryLabelMap(pack);
  let weakest = null;
  Object.keys(state.mastery || {}).forEach(tag => {
    const bucket = state.mastery[tag];
    const score = (bucket.correct || 0) - (bucket.wrong || 0) * 1.5;
    if (!weakest || score < weakest.score) {
      weakest = {
        tag,
        label: labels[tag] || tag.replace(/_/g, ' '),
        score,
        wrong: bucket.wrong || 0,
        correct: bucket.correct || 0,
      };
    }
  });
  if (!weakest || weakest.wrong <= 0) return null;
  return weakest;
}

function getModuleStrongestArea(moduleId = getActiveModuleId(), pack = getActiveCoursePack()) {
  const state = getModuleProgressState(moduleId, pack);
  if (!state) return null;
  const labels = getMasteryLabelMap(pack);
  let strongest = null;
  Object.keys(state.mastery || {}).forEach(tag => {
    const bucket = state.mastery[tag];
    const score = (bucket.correct || 0) * 2 - (bucket.wrong || 0);
    if (!strongest || score > strongest.score) {
      strongest = {
        tag,
        label: labels[tag] || tag.replace(/_/g, ' '),
        score,
        wrong: bucket.wrong || 0,
        correct: bucket.correct || 0,
      };
    }
  });
  if (!strongest || strongest.correct <= 0) return null;
  return strongest;
}

function getModuleRank(moduleId = getActiveModuleId(), pack = getActiveCoursePack()) {
  const state = getModuleProgressState(moduleId, pack);
  if (!state) return 'Fresh';
  const accuracy = getModuleAccuracy(state);
  if (state.completed && accuracy >= 0.9 && (state.firstTryClears || 0) >= Math.max(3, Math.floor((state.completedPuzzles || 0) * 0.5))) return 'Locked In';
  if (state.completed && accuracy >= 0.72) return 'Stable';
  if (state.completed) return 'Survived';
  if ((state.completedPuzzles || 0) > 0) return 'In Progress';
  return 'Fresh';
}

function resolveStoryToken(token, moduleId = getActiveModuleId(), pack = getActiveCoursePack()) {
  const weak = getModuleWeakSpot(moduleId, pack);
  const strong = getModuleStrongestArea(moduleId, pack);
  const rank = getModuleRank(moduleId, pack);
  const fallbackWeak = 'no single weak spot yet';
  const weakLine = weak
    ? 'Current weak spot: ' + weak.label + '. Keep separating mechanism from level-of-effect mistakes.'
    : 'Current weak spot: none identified yet. Keep building clean recall before speed.';
  const strongLine = strong
    ? 'Strongest lane so far: ' + strong.label + '.'
    : 'No strongest lane yet. The chapter is still warming up.';
  const tokenMap = {
    WEAK_SPOT_LABEL: weak ? weak.label : fallbackWeak,
    STRONGEST_LABEL: strong ? strong.label : 'still forming',
    PERF_LABEL: rank,
    WEAK_SPOT_LINE: weakLine,
    STRONGEST_LINE: strongLine,
  };
  return tokenMap[token] != null ? tokenMap[token] : '{' + token + '}';
}

function resolveStoryText(text, moduleId = getActiveModuleId(), pack = getActiveCoursePack()) {
  return String(text || '').replace(/\{([A-Z_]+)\}/g, (_, token) => resolveStoryToken(token, moduleId, pack));
}

function isModuleUnlocked(moduleId, pack = getActiveCoursePack()) {
  const module = getCourseModules(pack).find(item => item.id === moduleId);
  if (!module) return false;
  const state = getModuleProgressState(moduleId, pack);
  if (!module.unlockAfterModuleId) return true;
  if (state && state.unlocked) return true;
  const prereq = getModuleProgressState(module.unlockAfterModuleId, pack);
  return !!(prereq && prereq.completed);
}

function getModulePuzzles(pack = getActiveCoursePack(), moduleId = getActiveModuleId()) {
  const allPuzzles = pack && pack.runtime && Array.isArray(pack.runtime.puzzles) ? pack.runtime.puzzles : [];
  const module = getCourseModules(pack).find(item => item.id === moduleId);
  if (!module) return allPuzzles;
  if (Array.isArray(module.puzzleIds) && module.puzzleIds.length) {
    const ids = new Set(module.puzzleIds);
    return allPuzzles.filter(puzzle => ids.has(puzzle.id));
  }
  return allPuzzles.filter(puzzle => puzzle.moduleId === moduleId);
}

function getModuleMinigameCatalog(pack = getActiveCoursePack()) {
  return (pack && pack.runtime && pack.runtime.minigames) || {};
}

function getCourseStoryScenes(pack = getActiveCoursePack()) {
  return (pack && pack.runtime && pack.runtime.storyScenes) || {};
}

function getStoryQueue() {
  ensureCourseProgressShape();
  return window.COURSE_PROGRESS.storyQueue;
}

function getSeenStoryScenes() {
  ensureCourseProgressShape();
  return window.COURSE_PROGRESS.seenStoryScenes;
}

function queueCourseStoryScene(sceneId) {
  const scenes = getCourseStoryScenes();
  const queue = getStoryQueue();
  const seen = getSeenStoryScenes();
  if (!sceneId || !scenes[sceneId] || seen.includes(sceneId) || queue.includes(sceneId)) return false;
  queue.push(sceneId);
  showToast('New chapter scene unlocked in STORY.', 'green');
  return true;
}

function markCourseStorySceneSeen(sceneId) {
  const seen = getSeenStoryScenes();
  if (!seen.includes(sceneId)) seen.push(sceneId);
}

function getStorySpeakerClass(speaker) {
  const spk = String(speaker || '').toUpperCase();
  let cls = 'system';
  if (spk === 'REN' || spk === 'YOU') cls = 'ren';
  else if (spk === 'DOUGIE') cls = 'dougie';
  else if (spk === 'BYTOS' || spk === 'BYTE/OS') cls = 'bytos';
  else if (spk === 'NADIA') cls = 'nadia';
  else if (spk.includes('MR') || spk.includes('K')) cls = 'mrk';
  return cls;
}

function getPortraitLookupKey(speaker) {
  const spk = String(speaker || '').toUpperCase();
  if (spk === 'YOU') return 'REN';
  if (spk === 'BYTE/OS') return 'BYTOS';
  if (spk === 'MR K') return 'MR. K';
  return spk;
}

function getPortraitHTML(speaker) {
  const cls = getStorySpeakerClass(speaker);
  const portraitKey = getPortraitLookupKey(speaker);
  const portraitData = window.CHAR_PORTRAITS ? window.CHAR_PORTRAITS[portraitKey] : null;

  if (portraitData && portraitData.startsWith('__SPRITE__')) {
    const spriteKey = portraitData.replace('__SPRITE__', '').replace('__', '');
    const b64src = spriteKey === 'ren'    ? window.REN_SPRITE_B64 :
                   spriteKey === 'dougie' ? window.DOUGIE_SPRITE_B64 :
                   spriteKey === 'nadia'  ? window.NADIA_SPRITE_B64 :
                   spriteKey === 'mrk'    ? window.MRK_SPRITE_B64 :
                   spriteKey === 'bytos'  ? window.BYTOS_SPRITE_B64 : null;
    if (b64src) return `<div class="sprite-portrait ${cls}" style="background-image:url('${b64src}')"></div>`;
  }
  if (portraitData) return `<div class="char-portrait ${cls}">${portraitData}</div>`;
  return `<div class="char-portrait system"></div>`;
}

function renderCourseStoryScene(sceneId) {
  const scenes = getCourseStoryScenes();
  const scene = scenes[sceneId];
  if (!scene) return false;

  window.COURSE_PROGRESS.activeStorySceneId = sceneId;
  markCourseStorySceneSeen(sceneId);

  const header = document.getElementById('scene-header');
  const dialogue = document.getElementById('dialogue-container');
  const choices = document.getElementById('choices-container');
  const bytos = document.getElementById('bytos-msg');

  if (header) header.textContent = resolveStoryText(scene.scene || scene.title || 'Study Night');
  if (dialogue) dialogue.innerHTML = '';
  if (choices) choices.innerHTML = '';
  if (bytos && scene.bytosHtml) bytos.innerHTML = resolveStoryText(scene.bytosHtml);
  if (typeof renderSceneBanner === 'function') {
    setTimeout(() => renderSceneBanner('scene-bg-banner', scene.bgKey || 'late_night'), 50);
  }
  if (typeof musicSetPool === 'function') {
    musicSetPool((scene.bgKey || 'late_night') === 'late_night' ? 'late' : 'cafe');
  }

  (scene.dialogue || []).forEach(entry => {
    const block = document.createElement('div');
    const cssClass = entry.css || getStorySpeakerClass(entry.speaker);
    block.className = 'dialogue-block';
    block.innerHTML =
      getPortraitHTML(entry.speaker) +
      `<div class="portrait-content">
        <div class="speaker ${cssClass}">${entry.speaker}</div>
        <div class="dialogue-text ${cssClass}">${resolveStoryText(entry.text)}</div>
      </div>`;
    dialogue.appendChild(block);
  });

  const choiceWrap = document.createElement('div');
  choiceWrap.className = 'choices';
  (scene.choices || []).forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = choice.text;
    btn.onclick = () => {
      if (choice.moduleId) setActiveModule(choice.moduleId, { persist: true, reload: true });
      if (choice.window && typeof switchWindow === 'function') switchWindow(choice.window);
      if (choice.sceneId) renderCourseStoryScene(choice.sceneId);
    };
    choiceWrap.appendChild(btn);
  });
  if (!(scene.choices || []).length) {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = 'Return to console';
    btn.onclick = () => switchWindow('console');
    choiceWrap.appendChild(btn);
  }
  choices.appendChild(choiceWrap);
  return true;
}

function openNextCourseStoryScene() {
  const queue = getStoryQueue();
  const scenes = getCourseStoryScenes();
  while (queue.length) {
    const nextId = queue.shift();
    if (nextId && scenes[nextId]) {
      renderCourseStoryScene(nextId);
      return true;
    }
  }
  if (window.COURSE_PROGRESS.activeStorySceneId && scenes[window.COURSE_PROGRESS.activeStorySceneId]) {
    renderCourseStoryScene(window.COURSE_PROGRESS.activeStorySceneId);
    return true;
  }
  return false;
}

function initCourseStory() {
  const pack = getActiveCoursePack();
  if (!pack || pack.id === DEFAULT_COURSE_ID) return false;
  ensureModuleState(pack);
  const scenes = getCourseStoryScenes(pack);
  const openingId = pack.runtime && pack.runtime.openingSceneId;
  if (openingId && scenes[openingId] && !getSeenStoryScenes().includes(openingId)) {
    queueCourseStoryScene(openingId);
  }
  if (!openNextCourseStoryScene()) {
    const activeModule = getActiveModule(pack);
    if (activeModule && activeModule.storySceneIds && activeModule.storySceneIds.intro) {
      renderCourseStoryScene(activeModule.storySceneIds.intro);
      return true;
    }
    return false;
  }
  return true;
}

function getCurrentModuleStoryBeat() {
  const activeModule = getActiveModule();
  return activeModule && activeModule.storySceneIds ? activeModule.storySceneIds : {};
}

function subsetNotesByModule(pack, module) {
  const notes = (pack && pack.runtime && pack.runtime.notes) || {};
  if (!module || !Array.isArray(module.noteKeys) || !module.noteKeys.length) return notes;
  const selected = {};
  module.noteKeys.forEach(key => {
    if (notes[key]) selected[key] = notes[key];
  });
  return selected;
}

function subsetBoardsByModule(pack, module) {
  const boards = (pack && pack.runtime && pack.runtime.bbsBoards) || {};
  if (!module || !Array.isArray(module.bbsBoardKeys) || !module.bbsBoardKeys.length) return boards;
  const selected = {};
  module.bbsBoardKeys.forEach(key => {
    if (boards[key]) selected[key] = boards[key];
  });
  return selected;
}

function ensureModuleState(pack = getActiveCoursePack()) {
  const modules = getCourseModules(pack);
  if (!modules.length) {
    window.ACTIVE_MODULE_ID = null;
    ensureCourseProgressShape();
    window.COURSE_PROGRESS.activeModuleId = null;
    updateModuleSelectorUI();
    return null;
  }

  ensureCourseProgressShape();

  modules.forEach(module => {
    const state = getModuleProgressState(module.id, pack);
    if (module.unlockAfterModuleId) {
      const prereq = getModuleProgressState(module.unlockAfterModuleId, pack);
      state.unlocked = !!(state.unlocked || (prereq && prereq.completed));
    }
  });

  const storedModuleId = localStorage.getItem(getModuleStorageKey(pack.id));
  const preferredModuleId = getActiveModuleId() || storedModuleId || getDefaultModuleId(pack);
  const preferredModule = modules.find(module => module.id === preferredModuleId && isModuleUnlocked(module.id, pack));
  const validModule = preferredModule || modules.find(module => isModuleUnlocked(module.id, pack)) || modules[0];

  window.ACTIVE_MODULE_ID = validModule.id;
  window.COURSE_PROGRESS.activeModuleId = validModule.id;
  updateModuleSelectorUI();
  return validModule.id;
}

function updateCourseSelectorUI() {
  const pack = getActiveCoursePack();
  const select = document.getElementById('course-select');
  const desc = document.getElementById('course-select-desc');
  const subtitle = document.getElementById('boot-subtitle');
  if (select) select.value = pack.id;
  if (desc) desc.textContent = pack.description || 'Choose a ByteCafe course pack before booting.';
  if (subtitle) subtitle.textContent = 'BYTE/OS v2.1 - ' + (pack.title || 'TERMINAL SESSION');
}

function updateModuleSelectorUI() {
  const pack = getActiveCoursePack();
  const modules = getCourseModules(pack);
  const bar = document.getElementById('lecture-level-bar');
  const select = document.getElementById('lecture-select');
  const meta = document.getElementById('lecture-level-meta');
  const label = document.querySelector('.lecture-level-label');

  if (!bar || !select || !meta) return;
  if (label) label.textContent = modules.length ? 'CHAPTER MODULE' : 'LECTURE LEVEL';

  if (!modules.length) {
    bar.style.display = 'none';
    select.innerHTML = '';
    meta.textContent = '';
    return;
  }

  bar.style.display = 'grid';
  select.innerHTML = '';
  modules.forEach(module => {
    const option = document.createElement('option');
    option.value = module.id;
    option.textContent = module.shortLabel || module.title;
    option.disabled = !isModuleUnlocked(module.id, pack);
    select.appendChild(option);
  });

  const activeModule = getActiveModule(pack) || modules[0];
  select.value = activeModule.id;
  const state = getModuleProgressState(activeModule.id, pack);
  const total = getModulePuzzles(pack, activeModule.id).length;
  const status = !isModuleUnlocked(activeModule.id, pack)
    ? 'Locked'
    : state.completed
      ? getModuleRank(activeModule.id, pack)
      : state.checkpointUnlocked
        ? 'Checkpoint Ready'
      : state.completedPuzzles > 0
        ? 'In progress'
        : 'Fresh';
  const weak = getModuleWeakSpot(activeModule.id, pack);
  const weakText = weak ? ' - weak spot: ' + weak.label : '';
  meta.textContent = (activeModule.title || activeModule.shortLabel) + ' - ' + (state.completedPuzzles || 0) + '/' + total + ' cleared - ' + status + weakText;
}

function syncModuleRuntime(pack = getActiveCoursePack(), moduleId = getActiveModuleId(), reloadPuzzle = false) {
  const module = getCourseModules(pack).find(item => item.id === moduleId) || null;
  const modulePuzzles = getModulePuzzles(pack, moduleId);
  if (modulePuzzles.length && typeof setActivePuzzles === 'function') {
    setActivePuzzles(modulePuzzles);
  } else if (pack && pack.runtime && Array.isArray(pack.runtime.puzzles) && typeof setActivePuzzles === 'function') {
    setActivePuzzles(pack.runtime.puzzles);
  }

  if (typeof setActiveNotes === 'function') setActiveNotes(subsetNotesByModule(pack, module));
  if (typeof setActiveBbsBoards === 'function') setActiveBbsBoards(subsetBoardsByModule(pack, module));
  if (typeof initNotes === 'function') initNotes();
  if (typeof initBBS === 'function') initBBS();

  const state = moduleId ? getModuleProgressState(moduleId, pack) : null;
  currentPuzzle = state ? (state.currentPuzzle || 0) : 0;
  completedPuzzles = state ? (state.completedPuzzles || 0) : 0;

  if (module && module.storySceneIds && module.storySceneIds.intro && !getSeenStoryScenes().includes(module.storySceneIds.intro)) {
    queueCourseStoryScene(module.storySceneIds.intro);
  }

  updateModuleSelectorUI();
  if (reloadPuzzle && typeof loadPuzzle === 'function') loadPuzzle(currentPuzzle || 0);
}

function setActiveModule(moduleId, options = {}) {
  const opts = {
    persist: options.persist !== false,
    reload: !!options.reload,
  };
  const pack = getActiveCoursePack();
  const modules = getCourseModules(pack);
  if (!modules.length) return;

  const candidate = modules.find(module => module.id === moduleId) || modules[0];
  if (!isModuleUnlocked(candidate.id, pack)) return;

  window.ACTIVE_MODULE_ID = candidate.id;
  ensureCourseProgressShape();
  window.COURSE_PROGRESS.activeModuleId = candidate.id;
  getModuleProgressState(candidate.id, pack);
  if (opts.persist) localStorage.setItem(getModuleStorageKey(pack.id), candidate.id);
  syncModuleRuntime(pack, candidate.id, opts.reload);
}

function setActiveCourse(courseId, persist = true) {
  const catalog = getCourseCatalog();
  if (!catalog[courseId]) courseId = DEFAULT_COURSE_ID;
  window.ACTIVE_COURSE_ID = courseId;
  window.ACTIVE_COURSE_PACK = catalog[courseId];
  window.ACTIVE_MODULE_ID = null;
  window.COURSE_PROGRESS = {
    activeModuleId: null,
    moduleProgress: {},
    storyQueue: [],
    seenStoryScenes: [],
    activeStorySceneId: null,
  };
  if (typeof resetBadgeTrackers === 'function') resetBadgeTrackers();
  if (persist) localStorage.setItem(ACTIVE_COURSE_KEY, courseId);
  updateCourseSelectorUI();
  updateModuleSelectorUI();
}

function initCourseSelector() {
  const select = document.getElementById('course-select');
  if (!select) return;
  const catalog = getCourseCatalog();
  select.innerHTML = '';
  Object.values(catalog).forEach(pack => {
    const option = document.createElement('option');
    option.value = pack.id;
    option.textContent = pack.title;
    select.appendChild(option);
  });
  setActiveCourse(getActiveCourseId(), false);
  select.onchange = () => setActiveCourse(select.value, true);
}

function applyCourseTitles(pack) {
  const consoleBtn = document.getElementById('btn-console');
  const consoleTitle = document.querySelector('#console-window .window-titlebar');
  const notesTitle = document.querySelector('#notes-window .window-titlebar');
  const storyTitle = document.querySelector('#story-window .window-titlebar');
  if (consoleBtn) consoleBtn.textContent = '▶ ' + (pack.consoleButtonLabel || 'R CONSOLE');
  if (consoleTitle) consoleTitle.innerHTML = '<span class="dot"></span> ' + (pack.consoleTitle || 'R CONSOLE - EECS 1520');
  if (notesTitle) notesTitle.innerHTML = '<span class="dot"></span> ' + (pack.notesTitle || 'NOTES - EECS 1520 REFERENCE');
  if (storyTitle) storyTitle.innerHTML = '<span class="dot"></span> ' + (pack.storyTitle || 'STORY - BYTE/CAFE MAIN FLOOR');
}

function applyCourseTheme(pack) {
  const themeClass = sanitizeCourseTheme(pack.id);
  document.body.className = document.body.className
    .split(/\s+/)
    .filter(Boolean)
    .filter(name => !name.startsWith('course-'))
    .join(' ');
  document.body.classList.add(themeClass);
}

function applyCoursePackRuntime() {
  const pack = getActiveCoursePack();
  window.ACTIVE_COURSE_PACK = pack;
  applyCourseTheme(pack);
  applyCourseTitles(pack);

  if (pack.runtime && pack.runtime.notes && typeof setActiveNotes === 'function') {
    setActiveNotes(pack.runtime.notes);
  }
  if (pack.runtime && pack.runtime.bbsBoards && typeof setActiveBbsBoards === 'function') {
    setActiveBbsBoards(pack.runtime.bbsBoards);
  }

  if (getCourseModules(pack).length) {
    ensureModuleState(pack);
    const selector = document.getElementById('lecture-select');
    if (selector) {
      selector.onchange = () => {
        setActiveModule(selector.value, { persist: true, reload: true });
        if (typeof saveGame === 'function') saveGame();
      };
    }
    syncModuleRuntime(pack, getActiveModuleId(), false);
  } else if (pack.runtime && Array.isArray(pack.runtime.puzzles) && typeof setActivePuzzles === 'function') {
    setActivePuzzles(pack.runtime.puzzles);
    updateModuleSelectorUI();
  }
}

function exportCourseProgress() {
  ensureCourseProgressShape();
  return JSON.parse(JSON.stringify(window.COURSE_PROGRESS));
}

function loadCourseProgress(progress) {
  const pack = getActiveCoursePack();
  ensureCourseProgressShape();

  const nextProgress = progress && typeof progress === 'object' ? progress : {};
  window.COURSE_PROGRESS = {
    activeModuleId: nextProgress.activeModuleId || nextProgress.activeLectureId || null,
    moduleProgress: nextProgress.moduleProgress || nextProgress.lectureProgress || {},
    storyQueue: Array.isArray(nextProgress.storyQueue) ? nextProgress.storyQueue : [],
    seenStoryScenes: Array.isArray(nextProgress.seenStoryScenes) ? nextProgress.seenStoryScenes : [],
    activeStorySceneId: nextProgress.activeStorySceneId || null,
  };

  ensureModuleState(pack);
  const moduleId = window.COURSE_PROGRESS.activeModuleId || getDefaultModuleId(pack);
  if (moduleId) setActiveModule(moduleId, { persist: false, reload: false });
}

function recordActiveModuleProgress(currentIdx, completedCount, completed = false) {
  const pack = getActiveCoursePack();
  const moduleId = getActiveModuleId();
  if (!getCourseModules(pack).length || !moduleId) return;

  const state = getModuleProgressState(moduleId, pack);
  const modulePuzzles = getModulePuzzles(pack, moduleId);
  state.currentPuzzle = Math.max(0, Math.min(currentIdx, modulePuzzles.length));
  state.completedPuzzles = Math.max(0, Math.min(completedCount, modulePuzzles.length));
  state.completed = completed || state.completedPuzzles >= modulePuzzles.length;
  if (state.completed) {
    state.currentPuzzle = modulePuzzles.length;
    state.completedPuzzles = modulePuzzles.length;
  }
  window.COURSE_PROGRESS.activeModuleId = moduleId;
  updateModuleSelectorUI();
}

function handleCourseContentSolved() {
  const pack = getActiveCoursePack();
  const module = getActiveModule(pack);
  if (!module) return;
  const state = getModuleProgressState(module.id, pack);
  const beats = Array.isArray(module.storyBeats) ? module.storyBeats : [];
  beats.forEach(beat => {
    if (!beat || !beat.sceneId || !beat.at) return;
    if (!state.queuedStoryBeats[beat.sceneId] && state.completedPuzzles >= beat.at) {
      queueCourseStoryScene(beat.sceneId);
      state.queuedStoryBeats[beat.sceneId] = true;
    }
  });

  const fallbackBeat = module.storyBeatAt || 0;
  const storySceneIds = module.storySceneIds || {};
  if (fallbackBeat && storySceneIds.mid && !state.midSceneQueued && state.completedPuzzles >= fallbackBeat) {
    queueCourseStoryScene(storySceneIds.mid);
    state.midSceneQueued = true;
  }
  if (module.checkpointAt && !state.checkpointUnlocked && state.completedPuzzles >= module.checkpointAt) {
    state.checkpointUnlocked = true;
    showToast('Checkpoint round unlocked. Finish strong.', 'green');
  }
}

function handleActiveCourseModuleComplete() {
  const pack = getActiveCoursePack();
  const module = getActiveModule(pack);
  if (!module) return;
  const state = getModuleProgressState(module.id, pack);
  state.completed = true;
  state.unlocked = true;

  if (module.storySceneIds && module.storySceneIds.complete && !state.completeSceneQueued) {
    queueCourseStoryScene(module.storySceneIds.complete);
    state.completeSceneQueued = true;
  }

  const nextModule = getNextLectureModule(pack, module.id);
  if (nextModule) {
    const nextState = getModuleProgressState(nextModule.id, pack);
    nextState.unlocked = true;
    if (nextModule.storySceneIds && nextModule.storySceneIds.intro) {
      queueCourseStoryScene(nextModule.storySceneIds.intro);
    }
  }
  if (typeof earnBadge === 'function') {
    earnBadge(module.id + '_clear');
    if (getModuleRank(module.id, pack) === 'Locked In') {
      earnBadge(module.id + '_locked_in');
    }
  }
  updateModuleSelectorUI();
}

function isCourseBriefingMode() {
  const pack = getActiveCoursePack();
  return !!(pack && pack.storyMode === 'briefing' && pack.runtime && pack.runtime.storyBriefing);
}

function initCourseBriefing() {
  const pack = getActiveCoursePack();
  if (!isCourseBriefingMode()) return;
  const header = document.getElementById('scene-header');
  const dialogue = document.getElementById('dialogue-container');
  const choices = document.getElementById('choices-container');
  const bytos = document.getElementById('bytos-msg');
  if (header) header.textContent = pack.runtime.storyBriefing.header || pack.title;
  if (dialogue) dialogue.innerHTML = pack.runtime.storyBriefing.bodyHtml || '';
  if (choices) choices.innerHTML = pack.runtime.storyBriefing.choiceHtml || '';
  if (bytos) bytos.innerHTML = pack.runtime.storyBriefing.bytosHtml || bytos.innerHTML;
  setTimeout(() => renderSceneBanner('scene-bg-banner', pack.runtime.storyBriefing.bgKey || 'terminal_7'), 50);
}

function isCourseModuleStoryMode() {
  const pack = getActiveCoursePack();
  return !!(pack && pack.id !== DEFAULT_COURSE_ID && getCourseModules(pack).length && getCourseStoryScenes(pack));
}

function getCurrentCourseMinigame(puzzle) {
  if (!puzzle || !puzzle.minigameId) return null;
  return getModuleMinigameCatalog()[puzzle.minigameId] || null;
}

function isLecturePack(pack = getActiveCoursePack()) {
  return getCourseModules(pack).length > 0;
}

function isCoursePackComplete(pack = getActiveCoursePack()) {
  const modules = getCourseModules(pack);
  return !!(modules.length && modules.every(module => {
    const state = getModuleProgressState(module.id, pack);
    return !!(state && state.completed);
  }));
}

function getNextLectureModule(pack = getActiveCoursePack(), moduleId = getActiveModuleId()) {
  const modules = getCourseModules(pack);
  const idx = modules.findIndex(module => module.id === moduleId);
  if (idx === -1 || idx + 1 >= modules.length) return null;
  return modules[idx + 1];
}

function getActiveLectureModule(pack = getActiveCoursePack()) {
  return getActiveModule(pack);
}

function getActiveLectureId() {
  return getActiveModuleId();
}

function setActiveLecture(moduleId, options = {}) {
  setActiveModule(moduleId, options);
}

function recordActiveLectureProgress(currentIdx, completedCount, completed = false) {
  recordActiveModuleProgress(currentIdx, completedCount, completed);
}

function syncLectureRuntime(pack = getActiveCoursePack(), moduleId = getActiveModuleId(), reloadPuzzle = false) {
  syncModuleRuntime(pack, moduleId, reloadPuzzle);
}
