export const CONFIG = Object.freeze({
  COLS: 6,
  ROWS: 8,
  TIME_MAX: 100,
  START_DRAIN: 7,
  DRAIN_PER_LEVEL: 2.2,
  TIME_PER_HIT_BASE: 9,
  TARGETS_PER_LEVEL: 5,
  FREEZE_DURATION_MS: 3000,
  FREEZE_SPAWN_CHANCE: 0.18,
  COMBO_CAP: 5,
  COMBO_TIMEOUT_MS: 2500,
  MIN_SCORE_DELTA_MS: 80,
  SCAN_DURATION_MS: 5000,
  TIME_BOOST: 15,
  FALL_INTERVAL_MS: 850,
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export class GameEngine {
  constructor(random = Math.random) {
    this.random = random;
    this.badges = 0;
    this.bestScore = 0;
    this.start();
  }

  rnd() { return Math.floor(this.random() * 10); }
  pick(list) { return list[Math.floor(this.random() * list.length)]; }

  start(mode = 'standard') {
    const { ROWS, COLS, TIME_MAX } = CONFIG;
    this.grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => this.rnd()));
    this.special = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    this.queue = [];
    this.fillQueue(30);
    this.score = 0;
    this.mode = mode === 'fall' ? 'fall' : 'standard';
    this.level = 1;
    this.targetsDone = 0;
    this.combo = 0;
    this.lastClickTime = 0;
    this.frozenUntil = 0;
    this.scanUntil = 0;
    this.shieldCharges = 0;
    this.fallCarry = 0;
    this.timeLeft = TIME_MAX;
    this.gameActive = true;
    this.forbiddenNum = null;
    this.advanceTarget();
  }

  fillQueue(count) { for (let i = 0; i < count; i += 1) this.queue.push(this.rnd()); }

  recalc() {
    const cells = this.mode === 'fall' ? this.grid.flat() : this.grid[CONFIG.ROWS - 1];
    this.remaining = cells.filter((value) => value === this.currentTarget).length;
    return this.remaining;
  }

  advanceTarget() {
    if (this.queue.length < 5) this.fillQueue(20);
    this.currentTarget = this.queue[0];
    if (this.recalc() === 0) {
      this.currentTarget = this.pick([...this.grid[CONFIG.ROWS - 1]]);
      this.queue[0] = this.currentTarget;
      this.recalc();
    }
    this.forbiddenNum = this.level >= 2 ? this.pick([...Array(10).keys()].filter((n) => n !== this.currentTarget)) : null;
  }

  shiftColumn(column) {
    for (let row = CONFIG.ROWS - 1; row > 0; row -= 1) {
      this.grid[row][column] = this.grid[row - 1][column];
      this.special[row][column] = this.special[row - 1][column];
    }
    this.grid[0][column] = this.rnd();
    this.special[0][column] = null;
    this.recalc();
  }

  dropRows() {
    for (let column = 0; column < CONFIG.COLS; column += 1) {
      for (let row = CONFIG.ROWS - 1; row > 0; row -= 1) {
        this.grid[row][column] = this.grid[row - 1][column];
        this.special[row][column] = this.special[row - 1][column];
      }
      this.grid[0][column] = this.rnd();
      this.special[0][column] = null;
    }
    if (this.recalc() === 0) {
      this.grid[0][this.pick([...Array(CONFIG.COLS).keys()])] = this.currentTarget;
      this.recalc();
    }
  }

  levelUp() {
    this.level += 1;
    this.badges += 1;
    this.timeLeft = clamp(this.timeLeft + 15, 0, CONFIG.TIME_MAX);
  }

  maybeSpawnFreeze() {
    if (this.random() > CONFIG.FREEZE_SPAWN_CHANCE) return false;
    const candidates = this.grid[CONFIG.ROWS - 1]
      .map((value, column) => ({ value, column }))
      .filter(({ value, column }) => value !== this.currentTarget && value !== this.forbiddenNum && !this.special[CONFIG.ROWS - 1][column]);
    if (!candidates.length) return false;
    this.special[CONFIG.ROWS - 1][this.pick(candidates).column] = 'freeze';
    return true;
  }

  finishTarget() {
    this.targetsDone += 1;
    const leveledUp = this.targetsDone % CONFIG.TARGETS_PER_LEVEL === 0;
    if (leveledUp) this.levelUp();
    this.queue.shift();
    this.advanceTarget();
    const spawnedFreeze = this.maybeSpawnFreeze();
    return { completedTarget: true, leveledUp, spawnedFreeze };
  }

  pointsAt(now) {
    const rawDelta = this.lastClickTime ? now - this.lastClickTime : 800;
    const delta = Math.max(CONFIG.MIN_SCORE_DELTA_MS, rawDelta);
    const base = Math.max(10, Math.floor(900 / (delta / 1000 + 0.4)));
    this.combo += 1;
    const multiplier = Math.min(CONFIG.COMBO_CAP, 1 + Math.floor(this.combo / 4));
    this.lastClickTime = now;
    return { points: base * multiplier, multiplier };
  }

  end(reason) {
    if (!this.gameActive) return { ended: false, reason };
    this.gameActive = false;
    this.combo = 0;
    return { ended: true, reason };
  }

  click(column, now = Date.now(), row = CONFIG.ROWS - 1) {
    if (!this.gameActive || column < 0 || column >= CONFIG.COLS || row < 0 || row >= CONFIG.ROWS) return { type: 'ignored' };
    if (this.mode === 'standard' && row !== CONFIG.ROWS - 1) return { type: 'ignored' };
    const value = this.grid[row][column];
    const isFreeze = this.special[row][column] === 'freeze';
    const wasTarget = value === this.currentTarget;

    if (isFreeze) {
      this.special[row][column] = null;
      this.frozenUntil = Math.max(this.frozenUntil, now) + CONFIG.FREEZE_DURATION_MS;
      this.score += 50;
      if (this.mode === 'fall') this.grid[row][column] = this.rnd(); else this.shiftColumn(column);
      this.recalc();
      const targetProgress = wasTarget && this.remaining === 0 ? this.finishTarget() : { completedTarget: false };
      return { type: 'freeze', points: 50, ...targetProgress };
    }

    if (!wasTarget) {
      if (this.shieldCharges > 0) {
        this.shieldCharges -= 1;
        if (this.mode === 'fall') this.grid[row][column] = this.rnd(); else this.shiftColumn(column);
        this.recalc();
        return { type: 'shield', remaining: this.remaining };
      }
      return { type: 'gameover', ...this.end('wrong') };
    }

    const { points, multiplier } = this.pointsAt(now);
    this.score += points;
    this.timeLeft = clamp(this.timeLeft + Math.max(3, CONFIG.TIME_PER_HIT_BASE - (this.level - 1) * 0.5), 0, CONFIG.TIME_MAX);
    if (this.mode === 'fall') {
      this.grid[row][column] = this.rnd();
      this.special[row][column] = null;
      this.recalc();
    } else this.shiftColumn(column);
    const targetProgress = this.remaining === 0 ? this.finishTarget() : { completedTarget: false };
    return { type: 'correct', points, multiplier, ...targetProgress };
  }

  tick(dtMs, now = Date.now()) {
    if (!this.gameActive) return { type: 'inactive' };
    if (this.lastClickTime && now - this.lastClickTime > CONFIG.COMBO_TIMEOUT_MS) this.combo = 0;
    if (now >= this.frozenUntil) {
      const drain = CONFIG.START_DRAIN + (this.level - 1) * CONFIG.DRAIN_PER_LEVEL;
      this.timeLeft = Math.max(0, this.timeLeft - drain * (dtMs / 1000));
      if (this.mode === 'fall') {
        this.fallCarry += dtMs;
        while (this.fallCarry >= CONFIG.FALL_INTERVAL_MS) {
          this.fallCarry -= CONFIG.FALL_INTERVAL_MS;
          this.dropRows();
        }
      }
    }
    return this.timeLeft === 0 ? { type: 'gameover', ...this.end('time') } : { type: 'tick' };
  }

  continueGame(now = Date.now()) {
    if (!this.badges) return false;
    this.badges -= 1;
    this.timeLeft = CONFIG.TIME_MAX;
    this.combo = 0;
    this.frozenUntil = 0;
    this.lastClickTime = 0;
    this.gameActive = true;
    if (this.recalc() === 0) this.advanceTarget();
    return true;
  }

  usePowerup(type, now = Date.now()) {
    if (!this.gameActive) return false;
    if (type === 'scan') this.scanUntil = Math.max(this.scanUntil, now) + CONFIG.SCAN_DURATION_MS;
    if (type === 'time') this.timeLeft = clamp(this.timeLeft + CONFIG.TIME_BOOST, 0, CONFIG.TIME_MAX);
    return type === 'scan' || type === 'time';
  }
}
