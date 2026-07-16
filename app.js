import { CONFIG, GameEngine } from './game-core.js';

const $ = (selector) => document.querySelector(selector);
const gridEl = $('#grid');
const engine = new GameEngine();
let rafId = null;
let gameOverTimer = null;
let lastTick = performance.now();
let audioContext = null;
let soundEnabled = localStorage.getItem('numdrop_sound') !== 'false';

function loadPersistentState() {
  engine.bestScore = Math.max(0, Number.parseInt(localStorage.getItem('numdrop_best'), 10) || 0);
  engine.badges = Math.max(0, Number.parseInt(localStorage.getItem('numdrop_badges'), 10) || 0);
}
function savePersistentState() {
  localStorage.setItem('numdrop_best', String(engine.bestScore));
  localStorage.setItem('numdrop_badges', String(engine.badges));
}
function syncSoundToggle() {
  const control = $('#sound-toggle');
  control.textContent = soundEnabled ? '🔊' : '🔇';
  control.setAttribute('aria-label', soundEnabled ? 'Sesi kapat' : 'Sesi aç');
  control.setAttribute('aria-pressed', String(soundEnabled));
}
function playFeedback(kind) {
  if (navigator.vibrate) navigator.vibrate(kind === 'wrong' ? [35, 40, 60] : 18);
  if (!soundEnabled || !window.AudioContext) return;
  audioContext ??= new AudioContext();
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.frequency.setValueAtTime(kind === 'wrong' ? 150 : kind === 'freeze' ? 740 : 520, audioContext.currentTime);
  oscillator.type = kind === 'wrong' ? 'sawtooth' : 'sine';
  gain.gain.setValueAtTime(.06, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .11);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + .11);
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
      cell.disabled = !bottom || !engine.gameActive;
      cell.setAttribute('aria-label', bottom ? `Sütun ${col + 1}, sayı ${value}` : `Sayı ${value}`);
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
    playFeedback('wrong');
    cell.classList.add('wrong');
    renderHud();
    clearTimeout(gameOverTimer);
    gameOverTimer = setTimeout(showGameOver, 260);
    return;
  }
  if (outcome.type === 'freeze') {
    playFeedback('freeze');
    showToast('❄️ +50');
  } else {
    playFeedback('correct');
    showToast(`+${outcome.points}${outcome.multiplier > 1 ? ` ×${outcome.multiplier}` : ''}`);
  }
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
  if (engine.gameActive) rafId = requestAnimationFrame(gameLoop);
}
function startLoop() {
  cancelAnimationFrame(rafId);
  clearTimeout(gameOverTimer);
  gameOverTimer = null;
  lastTick = performance.now();
  rafId = requestAnimationFrame(gameLoop);
}
function showGameOver() {
  if (engine.gameActive) return;
  cancelAnimationFrame(rafId);
  clearTimeout(gameOverTimer);
  gameOverTimer = null;
  $('#final-score').textContent = engine.score;
  $('#continue').disabled = engine.badges === 0;
  $('#continue').textContent = engine.badges ? `▶️ Devam Et (🏅 ${engine.badges})` : '▶️ Devam Et (🏅 yok)';
  $('#gameover').hidden = false;
}
function startGame() {
  clearTimeout(gameOverTimer);
  engine.start();
  loadPersistentState();
  $('#home-screen').hidden = true;
  $('#game-screen').hidden = false;
  $('#gameover').hidden = true;
  render();
  startLoop();
}
function continueGame() {
  if (!engine.continueGame()) return;
  clearTimeout(gameOverTimer);
  savePersistentState();
  $('#gameover').hidden = true;
  render();
  startLoop();
}
function goHome() {
  cancelAnimationFrame(rafId);
  clearTimeout(gameOverTimer);
  engine.end('home');
  $('#gameover').hidden = true;
  $('#game-screen').hidden = true;
  $('#home-screen').hidden = false;
}
function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem('numdrop_sound', String(soundEnabled));
  syncSoundToggle();
  if (soundEnabled) playFeedback('correct');
}
window.startNumDrop = startGame;
window.restartNumDrop = startGame;
window.continueNumDrop = continueGame;
window.toggleNumDropSound = toggleSound;
window.goNumDropHome = goHome;
document.addEventListener('click', (event) => {
  if (event.target.closest('[onclick]')) return;
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'start' || action === 'restart') startGame();
  if (action === 'continue') continueGame();
  if (action === 'sound') toggleSound();
  if (action === 'home') goHome();
});
loadPersistentState();
syncSoundToggle();
engine.gameActive = false;
render();
