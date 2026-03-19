const LEGACY_SAVE_KEY = 'bytecafe_save_v1';
const SAVE_KEY_PREFIX = 'bytecafe_course_save_v2_';

function getActiveSaveKey() {
  const courseId = typeof getActiveCourseId === 'function' ? getActiveCourseId() : 'r-terminal';
  return SAVE_KEY_PREFIX + courseId;
}

function saveGame() {
  try {
    const payload = {
      courseId: typeof getActiveCourseId === 'function' ? getActiveCourseId() : 'r-terminal',
      xp: econ.xp, coins: econ.coins, rep: econ.rep, level: econ.level,
      inventory: econ.inventory, owned: econ.owned,
      cosmetics: econ.cosmetics,
      badgesEarned: econ.badgesEarned, storyFlags: econ.storyFlags,
      hintsUsed: econ.hintsUsed,
      courseProgress: typeof exportCourseProgress === 'function' ? exportCourseProgress() : null,
      currentPuzzle, completedPuzzles,
      savedAt: Date.now(),
    };
    localStorage.setItem(getActiveSaveKey(), JSON.stringify(payload));
    flashSaveDot();
  } catch (e) {
    console.warn('BYTE/OS: save failed', e);
  }
}

function loadGame() {
  try {
    let raw = localStorage.getItem(getActiveSaveKey());
    if (!raw && (typeof getActiveCourseId !== 'function' || getActiveCourseId() === 'r-terminal')) {
      raw = localStorage.getItem(LEGACY_SAVE_KEY);
    }
    if (!raw) return false;
    const d = JSON.parse(raw);
    econ.xp = d.xp ?? 0;
    econ.coins = d.coins ?? 3;
    econ.rep = d.rep ?? 0;
    econ.level = d.level ?? 1;
    econ.inventory = d.inventory ?? {};
    econ.owned = d.owned ?? {};
    econ.cosmetics = d.cosmetics ?? { theme: 'default', glow: 'default', scanlines: 'default', cursor: 'default', shell: 'default', ambience: 'default' };
    econ.badgesEarned = d.badgesEarned ?? {};
    econ.storyFlags = d.storyFlags ?? {};
    econ.hintsUsed = d.hintsUsed ?? 0;
    if (typeof ensureCosmeticState === 'function') ensureCosmeticState();
    if (typeof loadCourseProgress === 'function') {
      loadCourseProgress(d.courseProgress);
    }
    if (d.currentPuzzle != null) currentPuzzle = d.currentPuzzle;
    if (d.completedPuzzles != null) completedPuzzles = d.completedPuzzles;
    if (typeof getActiveLectureId === 'function' && getActiveLectureId() && typeof syncLectureRuntime === 'function') {
      syncLectureRuntime(typeof getActiveCoursePack === 'function' ? getActiveCoursePack() : undefined, getActiveLectureId(), false);
    }
    return true;
  } catch (e) {
    console.warn('BYTE/OS: load failed', e);
    return false;
  }
}

function exportSave() {
  try {
    const raw = localStorage.getItem(getActiveSaveKey());
    const modal = document.getElementById('save-modal');
    const title = document.getElementById('save-modal-title');
    const desc = document.getElementById('save-modal-desc');
    const text = document.getElementById('save-modal-text');
    const action = document.getElementById('save-modal-action');

    title.textContent = 'EXPORT SAVE';
    desc.textContent = 'Copy this text and keep it somewhere safe. Paste it back using [ IMPORT SAVE ] to restore the active course.';

    if (raw) {
      text.value = raw;
      text.readOnly = true;
      action.textContent = '[ COPY ]';
      action.onclick = () => {
        navigator.clipboard.writeText(text.value).then(() => {
          action.textContent = '[ COPIED ]';
          setTimeout(() => { action.textContent = '[ COPY ]'; }, 2000);
        }).catch(() => {
          text.select();
          document.execCommand('copy');
          action.textContent = '[ COPIED ]';
          setTimeout(() => { action.textContent = '[ COPY ]'; }, 2000);
        });
      };
    } else {
      text.value = '(no save data found for the active course - play a bit first)';
      text.readOnly = true;
      action.textContent = '[ COPY ]';
      action.onclick = () => {};
    }
    modal.style.display = 'flex';
  } catch (e) {
    showToast('Export failed: ' + e.message, 'red');
  }
}

function importSave() {
  const modal = document.getElementById('save-modal');
  const title = document.getElementById('save-modal-title');
  const desc = document.getElementById('save-modal-desc');
  const text = document.getElementById('save-modal-text');
  const action = document.getElementById('save-modal-action');

  title.textContent = 'IMPORT SAVE';
  desc.textContent = 'Paste your exported save data below, then press [ RESTORE ]. The page will reload into the active course.';
  text.value = '';
  text.readOnly = false;
  text.placeholder = 'Paste save JSON here...';

  action.textContent = '[ RESTORE ]';
  action.onclick = () => {
    const raw = text.value.trim();
    if (!raw) {
      showToast('Nothing to import.', 'red');
      return;
    }
    try {
      JSON.parse(raw);
      localStorage.setItem(getActiveSaveKey(), raw);
      showToast('Save restored! Reloading...', 'green');
      setTimeout(() => location.reload(), 1200);
    } catch (e) {
      showToast('Invalid save data. Check the text and try again.', 'red');
    }
  };
  modal.style.display = 'flex';
}
