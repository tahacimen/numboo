/* =========================================================================
   NumDrop — game logic
   Faithful implementation of GAME_SPEC.md (sections 1–8).
   Pure, DOM-free helpers live in the CORE object so they can be unit-tested
   under Node (see test/game.test.js); the rest wires them to the DOM.
   ========================================================================= */
(function () {
  "use strict";

  /* ----------------------------- Config (§5) ---------------------------- */
  var CFG = {
    COLS: 6,
    ROWS: 8,
    TIME_MAX: 100,
    START_DRAIN: 7,
    DRAIN_PER_LEVEL: 2.2,
    TIME_PER_HIT_BASE: 9,
    TARGETS_PER_LEVEL: 5,
    FREEZE_DURATION: 3, // seconds
    FREEZE_SPAWN_CHANCE: 0.18,
    COMBO_CAP: 5,
  };

  var LS_BEST = "numdrop_best";
  var LS_BADGES = "numdrop_badges";
  var LS_MUTE = "numdrop_mute";

  /* ---------------------- Pure, testable helpers ------------------------ */
  var CORE = {
    rnd: function () {
      return Math.floor(Math.random() * 10); // 0..9
    },

    /* §4.3 base score from click delta (ms) */
    baseScore: function (deltaMs) {
      return Math.max(10, Math.floor(900 / (deltaMs / 1000 + 0.4)));
    },

    /* §4.4 combo multiplier */
    multiplier: function (combo, cap) {
      cap = cap == null ? CFG.COMBO_CAP : cap;
      return Math.min(cap, 1 + Math.floor(combo / 4));
    },

    /* §4.5 drain rate per second for a level */
    drainRate: function (level) {
      return CFG.START_DRAIN + (level - 1) * CFG.DRAIN_PER_LEVEL;
    },

    /* §4.5 time added per correct hit */
    timeGain: function (level) {
      return Math.max(3, CFG.TIME_PER_HIT_BASE - (level - 1) * 0.5);
    },

    /* §2 column shift — mutates grid & special in place.
       Bottom row = ROWS-1; a new random digit enters at row 0. */
    shiftColumn: function (grid, special, c, rows, rndFn) {
      rndFn = rndFn || CORE.rnd;
      for (var r = rows - 1; r >= 1; r--) {
        grid[r][c] = grid[r - 1][c];
        special[r][c] = special[r - 1][c];
      }
      grid[0][c] = rndFn();
      special[0][c] = null;
    },

    /* count occurrences of target in the bottom row */
    countInBottom: function (grid, target, rows, cols) {
      var n = 0;
      for (var c = 0; c < cols; c++) if (grid[rows - 1][c] === target) n++;
      return n;
    },

    /* distinct digit values present in the bottom row */
    bottomValues: function (grid, rows, cols) {
      var vals = [];
      for (var c = 0; c < cols; c++) vals.push(grid[rows - 1][c]);
      return vals;
    },

    /* §4.7 pick a forbidden digit different from target */
    pickForbidden: function (target, rndFn) {
      rndFn = rndFn || CORE.rnd;
      var f;
      do {
        f = rndFn();
      } while (f === target);
      return f;
    },

    CFG: CFG,
  };

  /* Export pure core for Node tests; stop here when there is no DOM. */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = CORE;
  }
  if (typeof document === "undefined") return;

  /* ============================= Runtime state ========================== */
  var grid, special, queue;
  var score, gameActive, currentTarget, remaining, lastClickTime;
  var level, targetsDone, forbiddenNum, combo, frozenUntil, timeLeft;
  var lastTick, rafId;

  /* Persistent state */
  var bestScore = num(localStorage.getItem(LS_BEST), 0);
  var badges = num(localStorage.getItem(LS_BADGES), 0);
  var muted = localStorage.getItem(LS_MUTE) === "1";

  function num(v, d) {
    var n = parseInt(v, 10);
    return isNaN(n) ? d : n;
  }

  /* ============================= DOM refs =============================== */
  var $ = function (id) {
    return document.getElementById(id);
  };
  var gridEl = $("grid");
  var flashEl = $("levelup-flash");
  var queueItemsEl = $("queue-items");
  var remainingEl = $("remaining");
  var forbiddenBoxEl = $("forbidden-box");
  var forbiddenNumEl = $("forbidden-num");
  var comboTextEl = $("combo-text");
  var speedFillEl = $("speed-fill");
  var speedTextEl = $("speed-text");
  var startOverlay = $("start-overlay");
  var gameoverOverlay = $("gameover-overlay");
  var continueBtn = $("continue-btn");

  /* cell element cache: cells[r][c] */
  var cells = [];

  function buildGrid() {
    gridEl.innerHTML = "";
    cells = [];
    for (var r = 0; r < CFG.ROWS; r++) {
      cells[r] = [];
      for (var c = 0; c < CFG.COLS; c++) {
        var cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.r = r;
        cell.dataset.c = c;
        gridEl.appendChild(cell);
        cells[r][c] = cell;
      }
    }
  }

  /* ============================= Audio (§9.6) ========================== */
  var audioCtx = null;
  function ensureAudio() {
    if (audioCtx || muted) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
    }
  }
  function beep(freq, dur, type, gain) {
    if (muted || !audioCtx) return;
    try {
      var t = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain || 0.06, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur);
    } catch (e) {}
  }
  function vibrate(ms) {
    if (muted) return;
    if (navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {}
    }
  }
  var sfx = {
    correct: function () {
      beep(660, 0.08, "triangle", 0.05);
      vibrate(12);
    },
    wrong: function () {
      beep(150, 0.35, "sawtooth", 0.09);
      vibrate([60, 40, 60]);
    },
    level: function () {
      beep(523, 0.12, "sine", 0.06);
      setTimeout(function () {
        beep(784, 0.18, "sine", 0.06);
      }, 110);
      vibrate([20, 30, 20]);
    },
    freeze: function () {
      beep(880, 0.12, "sine", 0.05);
      setTimeout(function () {
        beep(1175, 0.14, "sine", 0.05);
      }, 90);
      vibrate(15);
    },
  };

  /* ============================= Queue (§4.1) ========================== */
  function fillQueue(n) {
    for (var i = 0; i < n; i++) queue.push(CORE.rnd());
  }

  function advanceTarget() {
    if (queue.length < 5) fillQueue(20);
    currentTarget = queue[0];
    recalc();
    /* §4.1 deadlock guard: target must exist in the bottom row */
    if (remaining === 0) {
      var vals = CORE.bottomValues(grid, CFG.ROWS, CFG.COLS);
      var pick = vals[Math.floor(Math.random() * vals.length)];
      queue[0] = pick;
      currentTarget = pick;
      recalc();
    }
    /* §4.7 forbidden digit only from level 2 */
    if (level >= 2) {
      forbiddenNum = CORE.pickForbidden(currentTarget);
    } else {
      forbiddenNum = null;
    }
  }

  function recalc() {
    remaining = CORE.countInBottom(grid, currentTarget, CFG.ROWS, CFG.COLS);
  }

  /* ============================= Freeze (§4.8) ========================= */
  function maybeSpawnFreeze() {
    if (Math.random() > CFG.FREEZE_SPAWN_CHANCE) return;
    var candidates = [];
    var br = CFG.ROWS - 1;
    for (var c = 0; c < CFG.COLS; c++) {
      var v = grid[br][c];
      if (v === currentTarget) continue;
      if (forbiddenNum != null && v === forbiddenNum) continue;
      if (special[br][c]) continue;
      candidates.push(c);
    }
    if (!candidates.length) return;
    var col = candidates[Math.floor(Math.random() * candidates.length)];
    special[br][col] = "freeze";
  }

  /* ============================= Level (§4.6) ========================== */
  function levelUp() {
    level++;
    badges++;
    localStorage.setItem(LS_BADGES, String(badges));
    timeLeft = Math.min(CFG.TIME_MAX, timeLeft + 15);
    flashEl.textContent = "LEVEL " + level;
    flashEl.classList.remove("pop");
    void flashEl.offsetWidth;
    flashEl.classList.add("pop");
    sfx.level();
    renderStats();
  }

  /* ============================= Clicks (§4.2) ======================== */
  function onCellClick(c) {
    if (!gameActive) return;
    var br = CFG.ROWS - 1;
    var now = Date.now();

    /* §4.8 freeze is always safe — checked FIRST, before wrong/right */
    if (special[br][c] === "freeze") {
      frozenUntil = now + CFG.FREEZE_DURATION * 1000;
      score += 50;
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem(LS_BEST, String(bestScore));
      }
      showPopup(c, "❄️ +50", "#a0e9ff");
      special[br][c] = null;
      CORE.shiftColumn(grid, special, c, CFG.ROWS, CORE.rnd);
      recalc();
      /* Anti-lock (§4.1): a freeze cell's digit can equal the current target
         (targets change over its lifetime), so shifting it out may remove the
         last target instance. Advance to a guaranteed-present target instead of
         soft-locking. This does NOT count as target progress (no level/badge). */
      var advanced = false;
      if (remaining <= 0) {
        advanceTarget();
        advanced = true;
      }
      sfx.freeze();
      if (advanced) repaintAll();
      else paintColumn(c, true);
      renderStats();
      renderQueue();
      renderTime(now);
      return; // does NOT affect combo or target progress
    }

    var val = grid[br][c];

    /* §4.2 any non-target click = instant death */
    if (val !== currentTarget) {
      combo = 0;
      gameActive = false;
      cells[br][c].classList.add("wrong");
      sfx.wrong();
      setTimeout(showGameOver, 500);
      return;
    }

    /* ------- correct click ------- */
    var delta = lastClickTime ? now - lastClickTime : 800;
    var base = CORE.baseScore(delta);
    combo++;
    var mult = CORE.multiplier(combo, CFG.COMBO_CAP);
    var bonus = base * mult;
    score += bonus;
    lastClickTime = now;

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(LS_BEST, String(bestScore));
    }

    /* §4.5 time gain */
    timeLeft = Math.min(CFG.TIME_MAX, timeLeft + CORE.timeGain(level));

    showPopup(c, mult > 1 ? "+" + bonus + " x" + mult : "+" + bonus);
    sfx.correct();

    CORE.shiftColumn(grid, special, c, CFG.ROWS, CORE.rnd);
    recalc();
    paintColumn(c, true);

    if (remaining <= 0) {
      /* target completed */
      targetsDone++;
      if (targetsDone % CFG.TARGETS_PER_LEVEL === 0) levelUp();
      queue.shift();
      advanceTarget();
      maybeSpawnFreeze();
      repaintAll();
    }

    renderStats();
    renderQueue();
    renderCombo(mult);
    renderTime(now);
  }

  /* ============================= Rendering ============================= */
  function paintCell(r, c, animate) {
    var cell = cells[r][c];
    var v = grid[r][c];
    var isBottom = r === CFG.ROWS - 1;
    var sp = special[r][c];

    cell.className = "cell";
    if (isBottom) cell.classList.add("bottom");
    if (sp === "freeze") cell.classList.add("freeze");
    if (
      isBottom &&
      level >= 2 &&
      forbiddenNum != null &&
      v === forbiddenNum &&
      sp !== "freeze"
    ) {
      cell.classList.add("forbidden");
    }

    var badge = sp === "freeze" ? '<span class="fbadge">❄️</span>' : "";
    cell.innerHTML =
      '<span class="cnum' + (animate ? " slide" : "") + '">' + v + "</span>" + badge;
  }

  function paintColumn(c, animate) {
    for (var r = 0; r < CFG.ROWS; r++) paintCell(r, c, animate);
  }

  function repaintAll() {
    for (var c = 0; c < CFG.COLS; c++)
      for (var r = 0; r < CFG.ROWS; r++) paintCell(r, c, false);
  }

  function renderStats() {
    $("stat-badges").textContent = badges;
    $("stat-level").textContent = level;
    $("stat-score").textContent = score;
    $("stat-best").textContent = bestScore;
  }

  function renderQueue() {
    var labels = ["active", "next", "next2"];
    var html = "";
    for (var i = 0; i < 3; i++) {
      if (queue[i] == null) continue;
      html += '<div class="q ' + labels[i] + '">' + queue[i] + "</div>";
    }
    queueItemsEl.innerHTML = html;
    remainingEl.textContent = "× " + remaining + " kaldı";

    if (level >= 2 && forbiddenNum != null) {
      forbiddenBoxEl.classList.add("show");
      forbiddenNumEl.textContent = forbiddenNum;
    } else {
      forbiddenBoxEl.classList.remove("show");
    }
  }

  function renderCombo(mult) {
    if (combo < 2) {
      comboTextEl.textContent = "";
      return;
    }
    var fire = "",
      color = "#6bcb77";
    if (combo >= 12) {
      fire = "🔥🔥";
      color = "#ff6b6b";
    } else if (combo >= 6) {
      fire = "🔥";
      color = "#ffd93d";
    }
    if (mult == null) mult = CORE.multiplier(combo, CFG.COMBO_CAP);
    comboTextEl.style.color = color;
    comboTextEl.textContent =
      (fire ? fire + " " : "") + "COMBO " + combo + "  x" + mult;
    comboTextEl.classList.remove("pop");
    void comboTextEl.offsetWidth;
    comboTextEl.classList.add("pop");
  }

  function renderTime(now) {
    now = now || Date.now();
    var pct = timeLeft / CFG.TIME_MAX;
    speedFillEl.style.width = Math.max(0, pct * 100) + "%";
    var frozen = now < frozenUntil;
    speedFillEl.classList.remove("mid", "critical", "frozen");
    if (frozen) {
      speedFillEl.classList.add("frozen");
      speedTextEl.textContent = "❄️ Dondu";
    } else {
      speedTextEl.textContent = "⏱ Süre";
      if (pct <= 0.25) speedFillEl.classList.add("critical");
      else if (pct <= 0.5) speedFillEl.classList.add("mid");
    }
  }

  function showPopup(c, text, color) {
    var br = CFG.ROWS - 1;
    var cellRect = cells[br][c].getBoundingClientRect();
    var wrapRect = gridEl.parentElement.getBoundingClientRect();
    var el = document.createElement("div");
    el.className = "popup";
    el.textContent = text;
    if (color) el.style.color = color;
    el.style.left = cellRect.left - wrapRect.left + cellRect.width / 2 + "px";
    el.style.top = cellRect.top - wrapRect.top + "px";
    el.style.transform = "translateX(-50%)";
    gridEl.parentElement.appendChild(el);
    el.addEventListener("animationend", function () {
      if (el.parentElement) el.parentElement.removeChild(el);
    });
  }

  /* ============================= Game loop (§4.5) ===================== */
  function gameLoop() {
    if (!gameActive) return;
    var now = Date.now();
    var dt = (now - lastTick) / 1000;
    lastTick = now;

    /* drain unless frozen */
    if (now >= frozenUntil) {
      timeLeft -= CORE.drainRate(level) * dt;
    }

    /* §4.4 combo auto-reset after 2500ms idle */
    if (combo > 0 && lastClickTime && now - lastClickTime > 2500) {
      combo = 0;
      comboTextEl.textContent = "";
    }

    if (timeLeft <= 0) {
      timeLeft = 0;
      renderTime(now);
      gameActive = false;
      setTimeout(showGameOver, 300);
      return;
    }

    renderTime(now);
    rafId = requestAnimationFrame(gameLoop);
  }

  function startLoop() {
    lastTick = Date.now();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(gameLoop);
  }

  /* ============================= Screens ============================== */
  function startGame() {
    ensureAudio();
    grid = [];
    special = [];
    for (var r = 0; r < CFG.ROWS; r++) {
      grid[r] = [];
      special[r] = [];
      for (var c = 0; c < CFG.COLS; c++) {
        grid[r][c] = CORE.rnd();
        special[r][c] = null;
      }
    }
    queue = [];
    fillQueue(30);
    score = 0;
    level = 1;
    targetsDone = 0;
    combo = 0;
    timeLeft = CFG.TIME_MAX;
    frozenUntil = 0;
    lastClickTime = 0;
    forbiddenNum = null;
    gameActive = true;

    advanceTarget();
    repaintAll();
    renderStats();
    renderQueue();
    comboTextEl.textContent = "";
    renderTime();

    startOverlay.classList.remove("show");
    gameoverOverlay.classList.remove("show");
    startLoop();
  }

  function showGameOver() {
    if (rafId) cancelAnimationFrame(rafId);
    var isRecord = score >= bestScore && score > 0;
    $("final-score").textContent = score;
    $("final-sub").textContent = isRecord
      ? "🏆 Yeni rekor! · Level " + level
      : "Level " + level + " · En yüksek: " + bestScore;

    if (badges > 0) {
      continueBtn.disabled = false;
      continueBtn.textContent = "▶️ Devam Et (🏅 " + badges + ")";
    } else {
      continueBtn.disabled = true;
      continueBtn.textContent = "▶️ Devam Et (🏅 yok)";
    }
    gameoverOverlay.classList.add("show");
  }

  function continueGame() {
    if (badges <= 0) return;
    badges--;
    localStorage.setItem(LS_BADGES, String(badges));
    gameoverOverlay.classList.remove("show");

    /* clear leftover wrong highlight */
    var br = CFG.ROWS - 1;
    for (var c = 0; c < CFG.COLS; c++) cells[br][c].classList.remove("wrong");

    /* progress (score/level/grid) is preserved */
    recalc();
    if (remaining === 0) advanceTarget();

    timeLeft = CFG.TIME_MAX;
    combo = 0;
    frozenUntil = 0;
    lastClickTime = 0;
    gameActive = true;

    repaintAll();
    renderStats();
    renderQueue();
    comboTextEl.textContent = "";
    renderTime();
    startLoop();
  }

  function quitGame() {
    if (rafId) cancelAnimationFrame(rafId);
    gameActive = false;
    gameoverOverlay.classList.remove("show");
    startOverlay.classList.add("show");
  }

  /* ============================= Wiring =============================== */
  function toggleMute() {
    muted = !muted;
    localStorage.setItem(LS_MUTE, muted ? "1" : "0");
    $("sound-btn").textContent = muted ? "🔇" : "🔊";
    if (!muted) ensureAudio();
  }

  gridEl.addEventListener(
    "click",
    function (e) {
      var cell = e.target.closest ? e.target.closest(".cell") : null;
      if (!cell) return;
      var r = parseInt(cell.dataset.r, 10);
      var c = parseInt(cell.dataset.c, 10);
      if (r === CFG.ROWS - 1) onCellClick(c);
    },
    false
  );

  $("start-btn").addEventListener("click", startGame);
  $("replay-btn").addEventListener("click", startGame);
  continueBtn.addEventListener("click", continueGame);
  $("quit-btn").addEventListener("click", quitGame);
  $("sound-btn").addEventListener("click", toggleMute);

  /* pause the drain when the app/tab is backgrounded, resume on return */
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
    } else if (gameActive) {
      startLoop();
    }
  });

  /* initial paint */
  buildGrid();
  bestScore = num(localStorage.getItem(LS_BEST), 0);
  badges = num(localStorage.getItem(LS_BADGES), 0);
  level = 1;
  score = 0;
  renderStats();
  $("sound-btn").textContent = muted ? "🔇" : "🔊";
})();
