import assert from 'node:assert/strict';
import { CONFIG, GameEngine } from './game-core.js';

const fixed = (value) => () => value;

{
  const game = new GameEngine(fixed(0));
  game.grid[CONFIG.ROWS - 1] = [1, 2, 3, 4, 5, 6];
  game.queue = [1, 9, 8, 7, 6];
  game.currentTarget = 1;
  game.recalc();
  game.grid[CONFIG.ROWS - 2][0] = 1;
  game.click(0, 1000);
  assert.equal(game.remaining, 1, 'Kaydırmayla gelen hedef yeniden sayılmalı');
  assert.equal(game.targetsDone, 0, 'Yeni hedef geldiyse eski hedef tamamlanmamalı');
}

{
  const game = new GameEngine(fixed(0));
  game.grid[CONFIG.ROWS - 1] = [1, 2, 3, 4, 5, 6];
  game.currentTarget = 1;
  game.recalc();
  game.shieldCharges = 1;
  const result = game.click(1, 1000);
  assert.equal(result.type, 'shield');
  assert.equal(game.gameActive, true, 'Kalkan yanlış dokunuşu affetmeli');
  assert.equal(game.shieldCharges, 0);
}

{
  const game = new GameEngine(fixed(0));
  game.timeLeft = 50;
  assert.equal(game.usePowerup('time', 1000), true);
  assert.equal(game.timeLeft, 65);
  assert.equal(game.usePowerup('scan', 1000), true);
  assert.equal(game.scanUntil, 1000 + CONFIG.SCAN_DURATION_MS);
}

{
  const game = new GameEngine(fixed(0));
  game.grid[CONFIG.ROWS - 1] = [1, 2, 3, 4, 5, 6];
  game.queue = [1, 9, 8, 7, 6];
  game.currentTarget = 1;
  game.special[CONFIG.ROWS - 1][0] = 'freeze';
  game.recalc();
  const result = game.click(0, 1000);
  assert.equal(result.type, 'freeze');
  assert.equal(game.targetsDone, 1, 'Hedef olan dondurucu hedef ilerlemesini korumalı');
  assert.equal(game.score, 50);
}

{
  const game = new GameEngine(fixed(0));
  game.lastClickTime = 1000;
  const score = game.pointsAt(1000);
  assert.equal(score.points, Math.floor(900 / (CONFIG.MIN_SCORE_DELTA_MS / 1000 + 0.4)), 'Skor hesabı minimum delta kullanmalı');
}

{
  const game = new GameEngine(fixed(0));
  game.badges = 1;
  game.end('wrong');
  assert.equal(game.continueGame(5000), true);
  assert.equal(game.timeLeft, CONFIG.TIME_MAX);
  assert.equal(game.gameActive, true);
}

console.log('game-core tests passed');
