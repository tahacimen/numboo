import { CONFIG, GameEngine } from './game-core.js';

const $ = (selector) => document.querySelector(selector);
const gridEl = $('#grid');
const engine = new GameEngine();
let rafId = null;
let lastTick = performance.now();
let paused = false;

function loadPersistentState() {
  engine.bestScore = Math.max(0, Number.parseInt(localStorage.getItem('numdrop_best'), 10) || 0);
  engine.badges = Math.max(0, Number.parseInt(localStorage.getItem('numdrop_badges'), 10) || 0);
}
function savePersistentState() {
  localStorage.setItem('numdrop_best', String(engine.bestScore));
  localStorage.setItem('numdrop_badges', String(engine.badges));
}
function renderGrid() {
  gridEl.innerHTML = '';
  for (let row = 0; row < CONFIG.ROWS; row += 1) {
    for (let col = 0; col < CONFIG.COLS; col += 1) {
      const cell = document.createElement('button');
      const bottom = row === CONFIG.ROWS - 1;
      const value = engine.grid[row][col];
      cell.className = `cell${bottom ? ' bottom' : ''}`;
      cell.textContent = value;
      cell.disabled = !bottom || !engine.gameActive || paused;
      if (bottom && value === engine.forbiddenNum) cell.classList.add('forbidden');
      if (engine.special[row][col] === 'freeze') cell.classList.add('freeze');
      if (bottom) cell.addEventListener('click', () => handleClick(col, cell));
      gridEl.append(cell);
    }
  }
}
function renderHud() {
  $('#target').textContent = engine.currentTarget;
  $('#next').textContent = engine.queue[1] ?? '–';
  $('#next2').textContent = engine.queue[2] ?? '–';
  $('#remaining').textContent = engine.remaining;
  $('#score').textContent = engine.score;
  $('#best').textContent = engine.bestScore;
  $('#level').textContent = engine.level;
  $('#badges').textContent = engine.badges;
  const pct = Math.max(0, engine.timeLeft / CONFIG.TIME_MAX * 100);
  $('#time-fill').style.width = `${pct}%`;
  $('#time-fill').classList.toggle('critical', pct <= 25 && !isFrozen());
  $('#time-label').textContent = isFrozen() ? '❄️ Dondu' : '⏱ Süre';
  $('#forbidden-wrap').hidden = engine.forbiddenNum === null;
  $('#forbidden').textContent = engine.forbiddenNum ?? '';
  const combo = $('#combo');
  combo.textContent = engine.combo >= 2 ? `${engine.combo >= 12 ? '🔥🔥' : engine.combo >= 6 ? '🔥' : ''} COMBO ${engine.combo} ×${Math.min(CONFIG.COMBO_CAP, 1 + Math.floor(engine.combo / 4))}` : '';
}
function isFrozen() { return Date.now() < engine.frozenUntil; }
function render() { renderGrid(); renderHud(); }
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.remove('show');
  requestAnimationFrame(() => toast.classList.add('show'));
}
function handleClick(column, cell) {
  const outcome = engine.click(column);
  if (outcome.type === 'ignored') return;
  if (outcome.type === 'gameover') {
    cell.classList.add('wrong');
    renderHud();
    setTimeout(showGameOver, 260);
    return;
  }
  if (outcome.type === 'freeze') showToast('❄️ +50');
  else showToast(`+${outcome.points}${outcome.multiplier > 1 ? ` ×${outcome.multiplier}` : ''}`);
  if (engine.score > engine.bestScore) engine.bestScore = engine.score;
  savePersistentState();
  render();
  if (outcome.leveledUp) showToast(`LEVEL ${engine.level}!`);
}
function gameLoop(now) {
  const result = engine.tick(Math.min(100, now - lastTick), Date.now());
  lastTick = now;
  renderHud();
  if (result.type === 'gameover') { showGameOver(); return; }
  if (engine.gameActive && !paused) rafId = requestAnimationFrame(gameLoop);
}
function startLoop() {
  cancelAnimationFrame(rafId);
  lastTick = performance.now();
  rafId = requestAnimationFrame(gameLoop);
}
function showGameOver() {
  cancelAnimationFrame(rafId);
  $('#final-score').textContent = engine.score;
  $('#continue').disabled = engine.badges === 0;
  $('#continue').textContent = engine.badges ? `▶️ Devam Et (🏅 ${engine.badges})` : '▶️ Devam Et (🏅 yok)';
  $('#gameover').hidden = false;
}
function startGame() {
  engine.start();
  loadPersistentState();
  paused = false;
  $('#start').hidden = true;
  $('#gameover').hidden = true;
  render();
  startLoop();
}
function continueGame() {
  if (!engine.continueGame()) return;
  savePersistentState();
  $('#gameover').hidden = true;
  render();
  startLoop();
}
function pauseForVisibility() {
  if (document.hidden && engine.gameActive) {
    paused = true;
    cancelAnimationFrame(rafId);
    $('#pause').hidden = false;
    render();
  }
}
function resumeGame() {
  if (!paused) return;
  paused = false;
  $('#pause').hidden = true;
  render();
  startLoop();
}

$('#start-btn').addEventListener('click', startGame);
$('#restart').addEventListener('click', startGame);
$('#continue').addEventListener('click', continueGame);
$('#resume').addEventListener('click', resumeGame);
document.addEventListener('visibilitychange', pauseForVisibility);
loadPersistentState();
engine.gameActive = false;
render();
