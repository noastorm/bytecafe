let currentPuzzle = 0;
let cmdHistory = [];
let historyIdx = -1;
let completedPuzzles = 0;
let studySubmission = null;
let studySequenceDraft = [];
let studyMinigameState = null;
let puzzleResolved = false;

function normalizeStudyAnswer(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getStudyFeedbackCatalog() {
  const activePack = typeof getActiveCoursePack === 'function' ? getActiveCoursePack() : null;
  return (activePack && activePack.runtime && activePack.runtime.feedback) || {};
}

function getStudyFeedbackLine(puzzle, fallback, offset = 0) {
  const catalog = getStudyFeedbackCatalog();
  const tags = Array.isArray(puzzle && puzzle.masteryTags) ? puzzle.masteryTags : [];
  for (let i = 0; i < tags.length; i++) {
    const lines = catalog[tags[i]];
    if (Array.isArray(lines) && lines.length) {
      const idx = (currentPuzzle + wrongAttempts + offset + i) % lines.length;
      return lines[idx];
    }
  }
  return fallback;
}

function getPuzzleMode(puzzle) {
  return puzzle && puzzle.mode ? puzzle.mode : 'r_console';
}

function isStudyModePuzzle(puzzle) {
  return getPuzzleMode(puzzle) !== 'r_console';
}

function getRewardValue(puzzle, key, fallback) {
  if (puzzle && puzzle.rewards && puzzle.rewards[key] != null) return puzzle.rewards[key];
  return fallback;
}

function resetStudyWidget() {
  const panel = document.getElementById('study-widget-panel');
  if (!panel) return;
  panel.style.display = 'none';
  panel.innerHTML = '';
  studySequenceDraft = [];
  studySubmission = null;
  studyMinigameState = null;
}

function updateSequencePreview() {
  const preview = document.getElementById('study-sequence-preview');
  if (!preview) return;
  preview.textContent = studySequenceDraft.length
    ? studySequenceDraft.map((id, idx) => (idx + 1) + '. ' + id).join('   ')
    : 'No steps selected yet.';
}

function submitStudyAnswer(payload) {
  const puzzle = puzzles[currentPuzzle];
  if (!puzzle || puzzleResolved) return;
  studySubmission = payload;
  const label = payload.answer || payload.choiceLabel || payload.summary || (Array.isArray(payload.sequence) ? payload.sequence.join(' -> ') : '');
  appendOutput('r-result', '> ' + label);
  sessionCode.push(label);
  sessionOutputs.push(label);
  checkPuzzle();
}

function disableStudyInteractions() {
  const panel = document.getElementById('study-widget-panel');
  if (panel) {
    panel.querySelectorAll('button').forEach(btn => {
      btn.disabled = true;
    });
  }
  const input = document.getElementById('r-input');
  const runBtn = document.querySelector('.run-btn');
  if (input && isStudyModePuzzle(puzzles[currentPuzzle])) input.disabled = true;
  if (runBtn && isStudyModePuzzle(puzzles[currentPuzzle])) runBtn.disabled = true;
}

function buildSpliceBuilderActions(puzzle) {
  const config = puzzle.config || {};
  return {
    order: [
      { id: 'u1', label: "U1 -> 5-prime splice site" },
      { id: 'u2', label: "U2 -> branchpoint" },
      { id: 'u2af', label: "U2AF -> 3-prime splice region" },
      { id: 'u5', label: "U5 -> exon alignment" },
      { id: 'u6', label: "U6 -> catalytic handoff" }
    ],
    branchpoints: [
      { id: 'branch_a', label: 'Branchpoint A' },
      { id: 'five_prime_gu', label: "5-prime GU" },
      { id: 'three_prime_ag', label: "3-prime AG" }
    ],
    exons: (config.availableExons || []).map(exonId => ({
      id: exonId,
      label: exonId.replace('exon', 'Exon ')
    }))
  };
}

function updateSpliceBuilderUI(puzzle) {
  const state = studyMinigameState;
  const preview = document.getElementById('splice-builder-order-preview');
  const branchLabel = document.getElementById('splice-builder-branch-label');
  const exonPreview = document.getElementById('splice-builder-exon-preview');
  const orderButtons = document.querySelectorAll('[data-splice-order]');
  const branchButtons = document.querySelectorAll('[data-branch-choice]');
  const exonButtons = document.querySelectorAll('[data-exon-choice]');

  if (preview) {
    preview.textContent = state.order.length
      ? state.order.map((stepId, idx) => (idx + 1) + '. ' + stepId.toUpperCase()).join('   ')
      : 'No recognition steps selected yet.';
  }
  if (branchLabel) branchLabel.textContent = state.branchpoint ? state.branchpoint.replace(/_/g, ' ') : 'No branchpoint selected yet.';
  if (exonPreview) exonPreview.textContent = state.selectedExons.length ? state.selectedExons.map(id => id.replace('exon', 'Exon ')).join(' + ') : 'No mature transcript chosen yet.';

  orderButtons.forEach(btn => {
    btn.disabled = state.order.includes(btn.dataset.spliceOrder);
  });
  branchButtons.forEach(btn => {
    btn.classList.toggle('active', state.branchpoint === btn.dataset.branchChoice);
  });
  exonButtons.forEach(btn => {
    btn.classList.toggle('active', state.selectedExons.includes(btn.dataset.exonChoice));
  });

  const submitBtn = document.getElementById('splice-builder-submit');
  if (submitBtn) {
    submitBtn.disabled = !(state.order.length && state.branchpoint && state.selectedExons.length);
  }

  const helper = document.getElementById('splice-builder-helper');
  if (helper) helper.textContent = puzzle.config && puzzle.config.prompt ? puzzle.config.prompt : 'Build the mature transcript using the controls below.';
}

function renderSpliceBuilder(puzzle, panel, visualHtml) {
  const actions = buildSpliceBuilderActions(puzzle);
  studyMinigameState = {
    type: 'splice_builder',
    order: [],
    branchpoint: null,
    selectedExons: [],
  };

  panel.innerHTML =
    visualHtml +
    '<div class="study-widget-copy">Complete the splice decision board. This minigame checks recognition order, branchpoint use, and the final mature transcript.</div>' +
    '<div class="splice-builder">' +
      '<div class="splice-builder-panel">' +
        '<div class="splice-builder-title">Recognition Order</div>' +
        '<div class="splice-builder-helper" id="splice-builder-helper"></div>' +
        '<div class="splice-builder-preview" id="splice-builder-order-preview">No recognition steps selected yet.</div>' +
        '<div class="study-choice-grid">' +
          actions.order.map(step => '<button class="study-choice-btn" data-splice-order="' + step.id + '">' + step.label + '</button>').join('') +
        '</div>' +
      '</div>' +
      '<div class="splice-builder-panel">' +
        '<div class="splice-builder-title">Branchpoint</div>' +
        '<div class="splice-builder-preview" id="splice-builder-branch-label">No branchpoint selected yet.</div>' +
        '<div class="study-choice-grid">' +
          actions.branchpoints.map(choice => '<button class="study-choice-btn" data-branch-choice="' + choice.id + '">' + choice.label + '</button>').join('') +
        '</div>' +
      '</div>' +
      '<div class="splice-builder-panel">' +
        '<div class="splice-builder-title">Mature Transcript</div>' +
        '<div class="splice-builder-preview" id="splice-builder-exon-preview">No mature transcript chosen yet.</div>' +
        '<div class="study-choice-grid">' +
          actions.exons.map(exon => '<button class="study-choice-btn" data-exon-choice="' + exon.id + '">' + exon.label + '</button>').join('') +
        '</div>' +
      '</div>' +
      '<div class="study-sequence-actions">' +
        '<button class="study-secondary-btn" id="splice-builder-reset">[ RESET BOARD ]</button>' +
        '<button class="study-secondary-btn" id="splice-builder-submit">[ SUBMIT BUILD ]</button>' +
      '</div>' +
    '</div>';

  panel.querySelectorAll('[data-splice-order]').forEach(btn => {
    btn.onclick = () => {
      if (!studyMinigameState.order.includes(btn.dataset.spliceOrder)) {
        studyMinigameState.order.push(btn.dataset.spliceOrder);
      }
      updateSpliceBuilderUI(puzzle);
    };
  });
  panel.querySelectorAll('[data-branch-choice]').forEach(btn => {
    btn.onclick = () => {
      studyMinigameState.branchpoint = btn.dataset.branchChoice;
      updateSpliceBuilderUI(puzzle);
    };
  });
  panel.querySelectorAll('[data-exon-choice]').forEach(btn => {
    btn.onclick = () => {
      const exonId = btn.dataset.exonChoice;
      if (studyMinigameState.selectedExons.includes(exonId)) {
        studyMinigameState.selectedExons = studyMinigameState.selectedExons.filter(id => id !== exonId);
      } else {
        studyMinigameState.selectedExons.push(exonId);
      }
      updateSpliceBuilderUI(puzzle);
    };
  });
  document.getElementById('splice-builder-reset').onclick = () => renderStudyWidget(puzzle);
  document.getElementById('splice-builder-submit').onclick = () => {
    submitStudyAnswer({
      minigame: 'splice_builder',
      order: [...studyMinigameState.order],
      branchpoint: studyMinigameState.branchpoint,
      selectedExons: [...studyMinigameState.selectedExons],
      summary: 'Splice Builder submission'
    });
  };
  updateSpliceBuilderUI(puzzle);
}

function updateRBPDockingUI(puzzle) {
  const state = studyMinigameState;
  const assignmentSummary = document.getElementById('rbp-docking-summary');
  if (assignmentSummary) {
    const lines = Object.keys(state.assignments).map(slotId => {
      const tokenId = state.assignments[slotId];
      if (!tokenId) return slotId.replace(/_/g, ' ') + ': [empty]';
      return slotId.replace(/_/g, ' ') + ': ' + tokenId.replace(/_/g, ' ');
    });
    assignmentSummary.textContent = lines.length ? lines.join('   ') : 'No docking assignments yet.';
  }

  document.querySelectorAll('[data-rbp-token]').forEach(btn => {
    const tokenId = btn.dataset.rbpToken;
    const placed = Object.values(state.assignments).includes(tokenId);
    btn.disabled = placed;
    btn.classList.toggle('active', state.selectedToken === tokenId);
  });

  document.querySelectorAll('[data-rbp-slot]').forEach(btn => {
    const slotId = btn.dataset.rbpSlot;
    const tokenId = state.assignments[slotId];
    btn.classList.toggle('active', !!tokenId);
    btn.textContent = tokenId
      ? slotId.replace(/_/g, ' ') + ' <- ' + tokenId.replace(/_/g, ' ')
      : slotId.replace(/_/g, ' ') + ' <- [drop target]';
  });

  const submitBtn = document.getElementById('rbp-docking-submit');
  if (submitBtn) {
    const filledCount = Object.values(state.assignments).filter(Boolean).length;
    submitBtn.disabled = filledCount !== Object.keys(state.assignments).length;
  }
}

function renderRBPDocking(puzzle, panel, visualHtml) {
  const config = puzzle.config || {};
  const slots = config.slots || [];
  const tokens = config.tokens || [];
  studyMinigameState = {
    type: 'rbp_docking',
    selectedToken: null,
    assignments: Object.fromEntries(slots.map(slot => [slot.id, null])),
  };

  panel.innerHTML =
    visualHtml +
    '<div class="study-widget-copy">Select an RNA-binding factor, then dock it to the role it best matches in this chapter.</div>' +
    '<div class="rbp-docking">' +
      '<div class="rbp-docking-panel">' +
        '<div class="splice-builder-title">Available Factors</div>' +
        '<div class="study-choice-grid">' +
          tokens.map(token => '<button class="study-choice-btn" data-rbp-token="' + token.id + '">' + token.label + '</button>').join('') +
        '</div>' +
      '</div>' +
      '<div class="rbp-docking-panel">' +
        '<div class="splice-builder-title">Docking Lanes</div>' +
        '<div class="rbp-docking-grid">' +
          slots.map(slot => '<button class="study-choice-btn rbp-slot-btn" data-rbp-slot="' + slot.id + '">' + slot.label + ' <- [drop target]</button>').join('') +
        '</div>' +
        '<div class="splice-builder-preview" id="rbp-docking-summary">No docking assignments yet.</div>' +
      '</div>' +
      '<div class="study-sequence-actions">' +
        '<button class="study-secondary-btn" id="rbp-docking-reset">[ RESET BOARD ]</button>' +
        '<button class="study-secondary-btn" id="rbp-docking-submit">[ SUBMIT DOCKING ]</button>' +
      '</div>' +
    '</div>';

  panel.querySelectorAll('[data-rbp-token]').forEach(btn => {
    btn.onclick = () => {
      studyMinigameState.selectedToken = btn.dataset.rbpToken;
      updateRBPDockingUI(puzzle);
    };
  });
  panel.querySelectorAll('[data-rbp-slot]').forEach(btn => {
    btn.onclick = () => {
      const slotId = btn.dataset.rbpSlot;
      if (!studyMinigameState.selectedToken) {
        const currentToken = studyMinigameState.assignments[slotId];
        if (currentToken) {
          studyMinigameState.assignments[slotId] = null;
        }
      } else {
        Object.keys(studyMinigameState.assignments).forEach(key => {
          if (studyMinigameState.assignments[key] === studyMinigameState.selectedToken) {
            studyMinigameState.assignments[key] = null;
          }
        });
        studyMinigameState.assignments[slotId] = studyMinigameState.selectedToken;
        studyMinigameState.selectedToken = null;
      }
      updateRBPDockingUI(puzzle);
    };
  });
  document.getElementById('rbp-docking-reset').onclick = () => renderStudyWidget(puzzle);
  document.getElementById('rbp-docking-submit').onclick = () => {
    submitStudyAnswer({
      minigame: 'rbp_docking',
      assignments: { ...studyMinigameState.assignments },
      summary: 'RBP Docking submission'
    });
  };
  updateRBPDockingUI(puzzle);
}

function updateLevelSortUI(puzzle) {
  const state = studyMinigameState;
  const rows = document.querySelectorAll('[data-sort-item]');
  rows.forEach(row => {
    const itemId = row.dataset.sortItem;
    row.querySelectorAll('[data-sort-choice]').forEach(btn => {
      btn.classList.toggle('active', state.assignments[itemId] === btn.dataset.sortChoice);
    });
  });
  const preview = document.getElementById('level-sort-summary');
  if (preview) {
    const filled = Object.keys(state.assignments).filter(key => state.assignments[key]).length;
    preview.textContent = filled + ' / ' + Object.keys(state.assignments).length + ' statements classified.';
  }
  const submitBtn = document.getElementById('level-sort-submit');
  if (submitBtn) {
    submitBtn.disabled = Object.keys(state.assignments).some(key => !state.assignments[key]);
  }
}

function renderLevelSort(puzzle, panel, visualHtml) {
  const config = puzzle.config || {};
  const items = config.items || [];
  const categories = config.categories || [];
  studyMinigameState = {
    type: 'level_sort',
    assignments: Object.fromEntries(items.map(item => [item.id, null])),
  };

  panel.innerHTML =
    visualHtml +
    '<div class="study-widget-copy">Classify each statement by the biological level it is talking about. This is a fast way to stop mixing up DNA, RNA processing, transcript output, and protein consequence.</div>' +
    '<div class="level-sort">' +
      items.map(item =>
        '<div class="level-sort-row" data-sort-item="' + item.id + '">' +
          '<div class="level-sort-prompt">' + item.prompt + '</div>' +
          '<div class="level-sort-choices">' +
            categories.map(choice => '<button class="study-choice-btn" data-sort-choice="' + choice.id + '">' + choice.label + '</button>').join('') +
          '</div>' +
        '</div>'
      ).join('') +
      '<div class="splice-builder-preview" id="level-sort-summary">0 / ' + items.length + ' statements classified.</div>' +
      '<div class="study-sequence-actions">' +
        '<button class="study-secondary-btn" id="level-sort-reset">[ RESET SORT ]</button>' +
        '<button class="study-secondary-btn" id="level-sort-submit">[ SUBMIT SORT ]</button>' +
      '</div>' +
    '</div>';

  panel.querySelectorAll('[data-sort-item]').forEach(row => {
    const itemId = row.dataset.sortItem;
    row.querySelectorAll('[data-sort-choice]').forEach(btn => {
      btn.onclick = () => {
        studyMinigameState.assignments[itemId] = btn.dataset.sortChoice;
        updateLevelSortUI(puzzle);
      };
    });
  });
  document.getElementById('level-sort-reset').onclick = () => renderStudyWidget(puzzle);
  document.getElementById('level-sort-submit').onclick = () => {
    submitStudyAnswer({
      minigame: 'level_sort',
      assignments: { ...studyMinigameState.assignments },
      summary: 'Level Sort submission'
    });
  };
  updateLevelSortUI(puzzle);
}

function updateAltSplicingUI(puzzle) {
  const state = studyMinigameState;
  document.querySelectorAll('[data-alt-exon]').forEach(btn => {
    btn.classList.toggle('active', state.selectedExons.includes(btn.dataset.altExon));
  });
  document.querySelectorAll('[data-alt-outcome]').forEach(btn => {
    btn.classList.toggle('active', state.outcomeId === btn.dataset.altOutcome);
  });
  const transcript = document.getElementById('alt-splicing-transcript');
  if (transcript) {
    transcript.textContent = state.selectedExons.length
      ? state.selectedExons.map(id => id.replace('exon', 'Exon ')).join(' + ')
      : 'No isoform assembled yet.';
  }
  const outcome = document.getElementById('alt-splicing-outcome');
  if (outcome) {
    outcome.textContent = state.outcomeId
      ? state.outcomeId.replace(/_/g, ' ')
      : 'No consequence selected yet.';
  }
  const submitBtn = document.getElementById('alt-splicing-submit');
  if (submitBtn) {
    submitBtn.disabled = !(state.selectedExons.length && state.outcomeId);
  }
}

function renderAlternativeSplicing(puzzle, panel, visualHtml) {
  const config = puzzle.config || {};
  const availableExons = config.availableExons || [];
  const outcomes = config.outcomes || [];
  studyMinigameState = {
    type: 'alternative_splicing',
    selectedExons: [],
    outcomeId: null,
  };

  panel.innerHTML =
    visualHtml +
    '<div class="study-widget-copy">Build the requested isoform, then choose the consequence that best matches the lecture example.</div>' +
    '<div class="splice-builder">' +
      '<div class="splice-builder-panel">' +
        '<div class="splice-builder-title">Isoform Target</div>' +
        '<div class="splice-builder-helper">' + (config.prompt || 'Assemble the mature transcript for this alternative splicing case.') + '</div>' +
        '<div class="splice-builder-preview" id="alt-splicing-transcript">No isoform assembled yet.</div>' +
        '<div class="study-choice-grid">' +
          availableExons.map(exon => '<button class="study-choice-btn" data-alt-exon="' + exon.id + '">' + exon.label + '</button>').join('') +
        '</div>' +
      '</div>' +
      '<div class="splice-builder-panel">' +
        '<div class="splice-builder-title">Predicted Outcome</div>' +
        '<div class="splice-builder-preview" id="alt-splicing-outcome">No consequence selected yet.</div>' +
        '<div class="study-choice-grid">' +
          outcomes.map(outcome => '<button class="study-choice-btn" data-alt-outcome="' + outcome.id + '">' + outcome.label + '</button>').join('') +
        '</div>' +
      '</div>' +
      '<div class="study-sequence-actions">' +
        '<button class="study-secondary-btn" id="alt-splicing-reset">[ RESET ISOFORM ]</button>' +
        '<button class="study-secondary-btn" id="alt-splicing-submit">[ SUBMIT ISOFORM ]</button>' +
      '</div>' +
    '</div>';

  panel.querySelectorAll('[data-alt-exon]').forEach(btn => {
    btn.onclick = () => {
      const exonId = btn.dataset.altExon;
      if (studyMinigameState.selectedExons.includes(exonId)) {
        studyMinigameState.selectedExons = studyMinigameState.selectedExons.filter(id => id !== exonId);
      } else {
        studyMinigameState.selectedExons.push(exonId);
      }
      updateAltSplicingUI(puzzle);
    };
  });
  panel.querySelectorAll('[data-alt-outcome]').forEach(btn => {
    btn.onclick = () => {
      studyMinigameState.outcomeId = btn.dataset.altOutcome;
      updateAltSplicingUI(puzzle);
    };
  });
  document.getElementById('alt-splicing-reset').onclick = () => renderStudyWidget(puzzle);
  document.getElementById('alt-splicing-submit').onclick = () => {
    submitStudyAnswer({
      minigame: 'alternative_splicing',
      selectedExons: [...studyMinigameState.selectedExons],
      outcomeId: studyMinigameState.outcomeId,
      summary: 'Alternative Splicing submission'
    });
  };
  updateAltSplicingUI(puzzle);
}

function renderStudyWidget(puzzle) {
  const panel = document.getElementById('study-widget-panel');
  if (!panel) return;
  resetStudyWidget();
  panel.style.display = 'block';

  const visualHtml = puzzle.visual
    ? '<div class="study-visual-wrap">' +
        "<img class=\"study-visual\" src=\"" + puzzle.visual.imagePath + "\" alt=\"" + (puzzle.visual.alt || 'Study visual') + "\" onerror=\"this.parentElement.classList.add('missing');this.remove();\">" +
        '<div class="study-visual-fallback">Study visual unavailable. Use the explanation and notes fallback.</div>' +
      '</div>'
    : '';

  if (puzzle.mode === 'minigame') {
    const minigame = typeof getCurrentCourseMinigame === 'function' ? getCurrentCourseMinigame(puzzle) : null;
    if (minigame && minigame.type === 'splice_builder') {
      renderSpliceBuilder(puzzle, panel, visualHtml);
      return;
    }
    if (minigame && minigame.type === 'rbp_docking') {
      renderRBPDocking(puzzle, panel, visualHtml);
      return;
    }
    if (minigame && minigame.type === 'level_sort') {
      renderLevelSort(puzzle, panel, visualHtml);
      return;
    }
    if (minigame && minigame.type === 'alternative_splicing') {
      renderAlternativeSplicing(puzzle, panel, visualHtml);
      return;
    }
  }

  if (puzzle.mode === 'multiple_choice') {
    panel.innerHTML =
      visualHtml +
      '<div class="study-widget-copy">Choose the best answer.</div>' +
      '<div class="study-choice-grid">' +
        puzzle.choices.map(choice =>
          '<button class="study-choice-btn" data-choice-id="' + choice.id + '">' + choice.label + '</button>'
        ).join('') +
      '</div>';
    panel.querySelectorAll('.study-choice-btn').forEach(btn => {
      btn.onclick = () => {
        const choice = puzzle.choices.find(item => item.id === btn.dataset.choiceId);
        submitStudyAnswer({ choiceId: choice.id, choiceLabel: choice.label, answer: choice.label });
      };
    });
    return;
  }

  if (puzzle.mode === 'sequence') {
    panel.innerHTML =
      visualHtml +
      '<div class="study-widget-copy">Click the steps in order, then submit.</div>' +
      '<div class="study-sequence-preview" id="study-sequence-preview">No steps selected yet.</div>' +
      '<div class="study-choice-grid">' +
        puzzle.sequenceSteps.map(step =>
          '<button class="study-choice-btn" data-step-id="' + step.id + '">' + step.label + '</button>'
        ).join('') +
      '</div>' +
      '<div class="study-sequence-actions">' +
        '<button class="study-secondary-btn" id="study-sequence-reset">[ RESET ]</button>' +
        '<button class="study-secondary-btn" id="study-sequence-submit">[ SUBMIT ORDER ]</button>' +
      '</div>';
    panel.querySelectorAll('.study-choice-btn').forEach(btn => {
      btn.onclick = () => {
        const stepId = btn.dataset.stepId;
        if (studySequenceDraft.includes(stepId)) return;
        studySequenceDraft.push(stepId);
        btn.disabled = true;
        updateSequencePreview();
      };
    });
    document.getElementById('study-sequence-reset').onclick = () => renderStudyWidget(puzzle);
    document.getElementById('study-sequence-submit').onclick = () => {
      submitStudyAnswer({ sequence: [...studySequenceDraft], answer: studySequenceDraft.join(' -> ') });
    };
    return;
  }

  panel.innerHTML = visualHtml + '<div class="study-widget-copy">Type your answer in the input below, then press [ CHECK ].</div>';
}

function configureConsoleInputForPuzzle(puzzle) {
  const input = document.getElementById('r-input');
  const runBtn = document.querySelector('.run-btn');
  const prompt = document.querySelector('.r-prompt-label');
  if (!input || !runBtn || !prompt) return;

  if (!isStudyModePuzzle(puzzle)) {
    input.disabled = false;
    input.placeholder = 'type R code here...';
    input.value = '';
    prompt.textContent = 'R>';
    runBtn.textContent = '[ RUN ]';
    runBtn.disabled = false;
    resetStudyWidget();
    return;
  }

  prompt.textContent = '>';
  input.value = '';
  runBtn.textContent = '[ CHECK ]';
  if (puzzle.mode === 'short_answer') {
    input.disabled = false;
    input.placeholder = 'type your answer here...';
    runBtn.disabled = false;
  } else {
    input.disabled = true;
    input.placeholder = 'use the study controls above';
    runBtn.disabled = true;
  }
  renderStudyWidget(puzzle);
}

function evaluateStudyPuzzle(puzzle, payload) {
  if (!puzzle || !payload) return { ok: false, feedback: 'No study response found yet.' };
  if (puzzle.mode === 'multiple_choice') {
    return {
      ok: payload.choiceId === puzzle.correctChoiceId,
      feedback: getStudyFeedbackLine(puzzle, 'That answer misses the main distinction this question is testing.')
    };
  }
  if (puzzle.mode === 'short_answer') {
    const guess = normalizeStudyAnswer(payload.answer);
    const accepted = (puzzle.acceptedAnswers || [puzzle.canonicalAnswer]).map(normalizeStudyAnswer);
    return {
      ok: accepted.includes(guess),
      feedback: getStudyFeedbackLine(puzzle, 'Close, but tighten the answer to the core mechanism or effect.')
    };
  }
  if (puzzle.mode === 'sequence') {
    const actual = Array.isArray(payload.sequence) ? payload.sequence : [];
    const expected = puzzle.correctOrder || [];
    return {
      ok: JSON.stringify(actual) === JSON.stringify(expected),
      feedback: getStudyFeedbackLine(puzzle, 'The sequence is off. Rebuild the recognition or pathway order from first principles.')
    };
  }
  if (puzzle.mode === 'minigame') {
    if (payload.minigame === 'splice_builder') {
      const config = puzzle.config || {};
      if (JSON.stringify(payload.order || []) !== JSON.stringify(config.correctOrder || [])) {
        return { ok: false, feedback: getStudyFeedbackLine(puzzle, "Recognition order is off. Start with the 5-prime splice site, then anchor the branchpoint and 3-prime region before the catalytic handoff.") };
      }
      if (payload.branchpoint !== config.branchpointChoice) {
        return { ok: false, feedback: getStudyFeedbackLine(puzzle, 'Wrong branchpoint logic. The first spliceosomal attack uses the branchpoint A, not a splice-junction label.', 1) };
      }
      const actualExons = [...(payload.selectedExons || [])].sort();
      const expectedExons = [...(config.correctExons || [])].sort();
      if (JSON.stringify(actualExons) !== JSON.stringify(expectedExons)) {
        return { ok: false, feedback: getStudyFeedbackLine(puzzle, 'Mature transcript mismatch. Re-check which exons survive this splicing outcome.', 2) };
      }
      return { ok: true, feedback: puzzle.explanation || 'Correct splicing build.' };
    }
    if (payload.minigame === 'rbp_docking') {
      const expectedAssignments = (puzzle.config && puzzle.config.correctAssignments) || {};
      const actualAssignments = payload.assignments || {};
      const wrongSlot = Object.keys(expectedAssignments).find(slotId => expectedAssignments[slotId] !== actualAssignments[slotId]);
      if (wrongSlot) {
        const feedbackMap = (puzzle.config && puzzle.config.failureFeedbackMap) || {};
        return {
          ok: false,
          feedback: feedbackMap[wrongSlot] || getStudyFeedbackLine(puzzle, 'One of the factors is docked to the wrong role. Re-check what that protein or method actually does in the lecture.')
        };
      }
      return { ok: true, feedback: puzzle.explanation || 'Correct RBP docking map.' };
    }
    if (payload.minigame === 'level_sort') {
      const expectedAssignments = (puzzle.config && puzzle.config.correctAssignments) || {};
      const actualAssignments = payload.assignments || {};
      const wrongItem = Object.keys(expectedAssignments).find(itemId => expectedAssignments[itemId] !== actualAssignments[itemId]);
      if (wrongItem) {
        const itemConfig = ((puzzle.config && puzzle.config.items) || []).find(item => item.id === wrongItem);
        return {
          ok: false,
          feedback: (itemConfig && itemConfig.feedback) || getStudyFeedbackLine(puzzle, 'One statement is at the wrong biological level. Re-check whether the prompt is about DNA, RNA processing, transcript output, or protein consequence.')
        };
      }
      return { ok: true, feedback: puzzle.explanation || 'Correct level sorting.' };
    }
    if (payload.minigame === 'alternative_splicing') {
      const config = puzzle.config || {};
      const actualExons = [...(payload.selectedExons || [])].sort();
      const expectedExons = [...(config.correctExons || [])].sort();
      if (JSON.stringify(actualExons) !== JSON.stringify(expectedExons)) {
        return { ok: false, feedback: getStudyFeedbackLine(puzzle, 'Isoform mismatch. Rebuild the transcript before choosing the consequence.') };
      }
      if (payload.outcomeId !== config.correctOutcomeId) {
        return { ok: false, feedback: getStudyFeedbackLine(puzzle, 'The isoform is close, but the predicted consequence is off. Reconnect exon choice to the lecture example or phenotype.', 1) };
      }
      return { ok: true, feedback: puzzle.explanation || 'Correct alternative splicing outcome.' };
    }
  }
  return { ok: false, feedback: 'Study evaluation unavailable for this mode.' };
}

function setConsoleBanner(idx) {
  const puzzle = puzzles[idx];
  const key = (puzzle && puzzle.bgKey) || PUZZLE_BG[idx] || 'terminal_7';
  setTimeout(() => renderSceneBanner('console-bg-banner', key), 50);
  // Late night puzzles get late pool, others get console pool
  const pool = key === 'late_night' ? 'late' : 'console';
  musicSetPool(pool);
}

function loadPuzzle(idx) {
  currentPuzzle    = idx;
  wrongAttempts    = 0;
  puzzleStartTime  = Date.now();
  studySubmission  = null;
  puzzleResolved   = false;
  const p = puzzles[idx];
  if (!p) {
    showAllComplete();
    return;
  }
  if (typeof recordActiveLectureProgress === 'function') {
    recordActiveLectureProgress(idx, completedPuzzles, false);
  }
  document.getElementById('puzzle-title').innerHTML = p.title;
  document.getElementById('puzzle-desc').innerHTML = p.desc;
  const pct = (idx / puzzles.length) * 100;
  document.getElementById('progress-fill').style.width = pct + '%';
  let bytosHtml = p.bytosTip || '<div class="tip">Study prompt loaded.</div>';
  if (isStudyModePuzzle(p) && typeof getModuleRank === 'function') {
    const weak = typeof getModuleWeakSpot === 'function' ? getModuleWeakSpot() : null;
    const rank = getModuleRank();
    bytosHtml += '<div class="tip"><b>RUN STATUS:</b><br>Current chapter state: ' + rank + (weak ? ' | Weak spot: ' + weak.label : ' | No single weak spot yet.') + '</div>';
  }
  document.getElementById('bytos-console-msg').innerHTML = bytosHtml;
  setConsoleBanner(idx);
  configureConsoleInputForPuzzle(p);

  sessionCode = [];
  sessionOutputs = [];
  document.getElementById('r-output').innerHTML = '';

  appendOutput('r-result hint', '-'.repeat(52));
  appendOutput('r-result hint', '  ' + p.title);
  appendOutput('r-result hint', '  Task: ' + p.desc.replace(/<[^>]+>/g, ''));
  if (p.learningObjective) appendOutput('r-result hint', '  Goal: ' + p.learningObjective);
  appendOutput('r-result hint', '-'.repeat(52));
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
  const puzzle = puzzles[currentPuzzle];
  const input = document.getElementById('r-input');
  if (puzzle && isStudyModePuzzle(puzzle)) {
    const answer = input.value.trim();
    if (!answer) return;
    input.value = '';
    submitStudyAnswer({ answer });
    return;
  }

  const code = input.value.trim();
  if (!code) return;

  if (!_firstCodeDone) { _firstCodeDone = true; earnBadge('first_code'); }

  cmdHistory.unshift(code);
  historyIdx = -1;
  appendOutput('r-result', '> ' + code);

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
    output.split('\n').forEach(line => {
      if (line.trim()) {
        const isErr = line.startsWith('Error');
        appendOutput(isErr ? 'r-result error' : 'r-result', line);
        sessionOutputs.push(line);
      }
    });
  }

  input.value = '';
  checkPuzzle();
}

function checkPuzzle() {
  const p = puzzles[currentPuzzle];
  if (!p || puzzleResolved) return;

  const evaluation = typeof p.check === 'function'
    ? { ok: p.check(sessionCode, sessionOutputs), feedback: null }
    : evaluateStudyPuzzle(p, studySubmission);
  const solved = !!(evaluation && evaluation.ok);

  if (solved) {
    puzzleResolved = true;
    disableStudyInteractions();
    if (typeof recordModuleAttempt === 'function' && isStudyModePuzzle(p)) {
      recordModuleAttempt(p, true, wrongAttempts === 0);
    }
    SFX.success();
    if (!_muted && !isStudyModePuzzle(p)) {
      const sting = new Audio('assets/audio/ost_victory.mp3');
      sting.volume = 0.55;
      sting.play().catch(() => {});
    }
    const flash = document.createElement('div');
    flash.className = 'complete-flash';
    document.getElementById('main-screen').appendChild(flash);
    setTimeout(() => flash.remove(), 800);

    appendOutput('r-result success', '');
    appendOutput('r-result success', 'STAR ' + (p.successMsg || p.explanation || 'Correct.'));

    const funnyLine = p.explanation || BYTOS_SUCCESS[currentPuzzle % BYTOS_SUCCESS.length];
    appendOutput('r-result hint', '  BYTOS: ' + funnyLine);
    appendOutput('r-result success', '');

    const idx = currentPuzzle;
    let xpAward = getRewardValue(p, 'xp', PUZZLE_XP[idx] || 40);
    if (econ.owned['xp_multiplier']) xpAward = Math.round(xpAward * 1.25);

    if (econ.storyFlags['double_xp_active']) {
      xpAward *= 2;
      econ.storyFlags['double_xp_active'] = false;
      appendOutput('r-result hint', '  Double XP active! ' + xpAward + ' XP earned!');
    }

    const coinReward = getRewardValue(p, 'coins', PUZZLE_COINS[idx] || 0);
    let repReward = getRewardValue(p, 'rep', PUZZLE_REP[idx] || 1);
    if (econ.owned['rep_boost']) repReward += 1;

    awardXP(xpAward, p.title.replace('PUZZLE ', 'P'));
    if (coinReward) awardCoins(coinReward, 'puzzle bonus');
    awardRep(repReward, 'puzzle complete');

    appendOutput('r-result hint', '  [+' + xpAward + ' XP  +' + repReward + ' REP' + (coinReward ? '  +' + coinReward + 'c' : '') + ']');

    if (idx === 0) earnBadge('p1_done');
    if (idx === 4) earnBadge('p5_done');
    if (idx === 9) earnBadge('p10_done');

    const elapsed = (Date.now() - puzzleStartTime) / 1000;
    if (elapsed < 30 && wrongAttempts === 0) earnBadge('speed_runner');
    if (econ.hintsUsed === 0 && idx >= 4) earnBadge('no_hints');
    if (econ.hintsUsed >= 3) earnBadge('hint_user');

    completedPuzzles++;
    document.getElementById('progress-fill').style.width = ((currentPuzzle + 1) / puzzles.length * 100) + '%';
    if (typeof recordActiveLectureProgress === 'function') {
      recordActiveLectureProgress(
        Math.min(currentPuzzle + 1, puzzles.length),
        completedPuzzles,
        currentPuzzle + 1 >= puzzles.length
      );
    }
    if (typeof handleCourseContentSolved === 'function') {
      handleCourseContentSolved();
    }

    updateStoryProgress(currentPuzzle + 1);
    saveGame();

    setTimeout(() => {
      if (currentPuzzle !== idx) return;
      if (idx + 1 < puzzles.length) {
        loadPuzzle(idx + 1);
      } else {
        showAllComplete();
      }
    }, 1600);
  } else if (sessionCode.length > 0) {
    if (typeof recordModuleAttempt === 'function' && isStudyModePuzzle(p)) {
      recordModuleAttempt(p, false, false);
    }
    wrongAttempts++;
    SFX.error();
    const wrongLine = isStudyModePuzzle(p)
      ? (evaluation && evaluation.feedback) || 'Close, but not exam-safe yet. Check the notes and try again.'
      : BYTOS_WRONG[(Math.floor(wrongAttempts / 2)) % BYTOS_WRONG.length];
    if (wrongAttempts % 2 === 1 || isStudyModePuzzle(p)) {
      appendOutput('r-result hint', '  BYTOS: ' + wrongLine);
    }
    if (!isStudyModePuzzle(p) && wrongAttempts === 3) {
      appendOutput('r-result hint', '  Hint tokens available in the SHOP (1c each).');
    }
  }
}

function syncStoryMilestones(idx) {
  if (!Array.isArray(STORY_BEATS)) return;
  STORY_BEATS.forEach(beat => {
    const key = 'story_beat_' + beat.node;
    if (idx >= beat.at) {
      if (!econ.storyFlags[key]) econ.storyFlags[key] = true;
      if (!story.visited.has(beat.node)) queueStoryNode(beat.node);
    }
  });
}

function updateStoryProgress(idx) {
  const activePack = typeof getActiveCoursePack === 'function' ? getActiveCoursePack() : null;
  if (activePack && activePack.id !== 'r-terminal') return;
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
    'ggplot2 basics! The grammar of graphics - canvas, aesthetics, geom.',
    'ggplot2 layers! Multi-layer plots with colour mapping.',
    'switch()! Cleaner than chained if/else for fixed option sets.',
    'paste0()! String building. You can now construct any output message.',
    'rbind() and cbind()! Build matrices from vectors - two directions.',
    'Matrix operations! Transpose, multiply, invert. Linear algebra unlocked.',
    'Data frame filtering! df[condition, ] is the core query pattern.',
    'merge()! Joining tables by a common column. Real data work.',
    'geom_line()! Line charts. Another layer type in the ggplot grammar.',
    'facet_grid()! Subplots by variable. The full ggplot toolkit.',
    'The circle function! Functions + loops + vectors + math. You covered everything.'
  ];
  syncStoryMilestones(idx);
  if (msgs[idx]) setBytosMsg(msgs[idx]);
}

function showAllComplete() {
  const activePack = typeof getActiveCoursePack === 'function' ? getActiveCoursePack() : null;
  const activeLecture = typeof getActiveLectureModule === 'function' ? getActiveLectureModule(activePack) : null;
  const nextLecture = typeof getNextLectureModule === 'function' ? getNextLectureModule(activePack, activeLecture && activeLecture.id) : null;
  const lectureScoped = !!(activePack && typeof isLecturePack === 'function' && isLecturePack(activePack) && activeLecture);

  if (lectureScoped && typeof recordActiveLectureProgress === 'function') {
    recordActiveLectureProgress(puzzles.length, puzzles.length, true);
  }
  if (lectureScoped && typeof handleActiveCourseModuleComplete === 'function') {
    handleActiveCourseModuleComplete();
  }

  if (lectureScoped && activePack && activePack.runtime && activePack.runtime.completion && !(typeof isCoursePackComplete === 'function' && isCoursePackComplete(activePack))) {
    const moduleRank = typeof getModuleRank === 'function' ? getModuleRank(activeLecture.id, activePack) : 'Complete';
    const weakSpot = typeof getModuleWeakSpot === 'function' ? getModuleWeakSpot(activeLecture.id, activePack) : null;
    const strongSpot = typeof getModuleStrongestArea === 'function' ? getModuleStrongestArea(activeLecture.id, activePack) : null;
    document.getElementById('puzzle-title').textContent = (activeLecture.title || activeLecture.shortLabel || 'Lecture') + ' complete';
    document.getElementById('puzzle-desc').innerHTML = activeLecture.description || 'Lecture study run complete. Review the notes, then move to the next lecture when you are ready.';
    document.getElementById('progress-fill').style.width = '100%';
    appendOutput('r-result success', '');
    appendOutput('r-result success', 'STAR STAR STAR  LECTURE COMPLETE  STAR STAR STAR');
    appendOutput('r-result success', '');
    appendOutput('r-result hint', 'BYTE/OS: ' + (activeLecture.completionLine || 'Lecture mastery checkpoint logged.'));
    appendOutput('r-result hint', '  Chapter rank: ' + moduleRank);
    if (strongSpot) appendOutput('r-result hint', '  Strongest lane: ' + strongSpot.label);
    if (weakSpot) appendOutput('r-result hint', '  Review next: ' + weakSpot.label);
    if (nextLecture) {
      appendOutput('r-result hint', '  Next lecture unlocked: ' + (nextLecture.title || nextLecture.shortLabel));
      appendOutput('r-result hint', '  [Use the module selector above or open STORY for the next chapter.]');
    } else {
      appendOutput('r-result hint', '  [No next lecture found. Add another reviewed lecture module to keep going.]');
    }
    return;
  }

  if (activePack && activePack.runtime && activePack.runtime.completion) {
    document.getElementById('puzzle-title').textContent = activePack.runtime.completion.title;
    document.getElementById('puzzle-desc').innerHTML = activePack.runtime.completion.summary;
    document.getElementById('progress-fill').style.width = '100%';
    appendOutput('r-result success', '');
    appendOutput('r-result success', 'STAR STAR STAR  STUDY PACK COMPLETE  STAR STAR STAR');
    appendOutput('r-result success', '');
    appendOutput('r-result hint', 'BYTE/OS: ' + activePack.runtime.completion.bytosLine);
    appendOutput('r-result hint', '  [Open NOTES to review weak spots and extend the pack with real lecture slides.]');
    return;
  }
  document.getElementById('puzzle-title').textContent = 'ALL PUZZLES COMPLETE';
  document.getElementById('puzzle-desc').innerHTML = "Variables. Vectors. Control flow. Functions. Matrices. Data frames. ggplot2. The circle function. <b style=\"color:var(--green)\">Ren's assignment is done.</b>";
  document.getElementById('progress-fill').style.width = '100%';
  appendOutput('r-result success', '');
  appendOutput('r-result success', 'STAR STAR STAR  ALL PUZZLES COMPLETE  STAR STAR STAR');
  appendOutput('r-result success', '');
  appendOutput('r-result success', 'BYTE/OS: You covered everything.');
  appendOutput('r-result success', '');
  appendOutput('r-result success', '  Variables & assignment    Vectors & c()');
  appendOutput('r-result success', '  if/else & switch          for & while loops');
  appendOutput('r-result success', '  Functions & return        paste0 & strings');
  appendOutput('r-result success', '  Matrices & operations     rbind & cbind');
  appendOutput('r-result success', '  Data frames & filtering   merge()');
  appendOutput('r-result success', '  ggplot2 - all layer types facet_grid()');
  appendOutput('r-result success', '  The circle function');
  appendOutput('r-result success', '');
  appendOutput('r-result hint', 'BYTE/OS: Uploading assignment. 56k modem. Please hold.');
  appendOutput('r-result success', '');
  appendOutput('r-result success', '  11:58 PM. The upload bar moves. Slowly.');
  appendOutput('r-result success', '  It finishes.');
  appendOutput('r-result success', '  Dougie, from across the room: "LETSGOOO"');
  appendOutput('r-result success', '  Mr. K looks up. Nods once. Goes back to his crossword.');
  appendOutput('r-result success', '');
  appendOutput('r-result hint', 'BYTE/OS: Session complete. It was good working with you.');
  appendOutput('r-result hint', '  [Switch to STORY - there is one more thing]');
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
  } else if (e.key.length === 1) {
    SFX.type();
  }
});

// ══════════════════════════════════════════════════════════════
//  SHOP & INVENTORY
// ══════════════════════════════════════════════════════════════

