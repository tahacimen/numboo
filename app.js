import { CONFIG, GameEngine } from './game-core.js';

const $ = (selector) => document.querySelector(selector);
const gridEl = $('#grid');
const engine = new GameEngine();
let rafId = null;
let gameOverTimer = null;
let lastTick = performance.now();
let audioContext = null;
let soundEnabled = localStorage.getItem('numdrop_sound') !== 'false';
let inventory = { shield: 0, scan: 0, time: 0 };
let daily = { date: '', targets: 0, claimed: false };
let achievements = [];

const todayKey = () => new Date().toISOString().slice(0, 10);

function loadPersistentState() {
  engine.bestScore = Math.max(0, Number.parseInt(localStorage.getItem('numdrop_best'), 10) || 0);
  engine.badges = Math.max(0, Number.parseInt(localStorage.getItem('numdrop_badges'), 10) || 0);
  inventory = { ...inventory, ...(JSON.parse(localStorage.getItem('numdrop_inventory') || '{}')) };
  daily = { ...daily, ...(JSON.parse(localStorage.getItem('numdrop_daily') || '{}')) };
  if (daily.date !== todayKey()) daily = { date: todayKey(), targets: 0, claimed: false };
  achievements = JSON.parse(localStorage.getItem('numdrop_achievements') || '[]');
}
function savePersistentState() {
  localStorage.setItem('numdrop_best', String(engine.bestScore));
  localStorage.setItem('numdrop_badges', String(engine.badges));
  localStorage.setItem('numdrop_inventory', JSON.stringify(inventory));
  localStorage.setItem('numdrop_daily', JSON.stringify(daily));
  localStorage.setItem('numdrop_achievements', JSON.stringify(achievements));
}
function renderProgress() {
  const homeBadges = $('#home-badges');
  if (homeBadges) homeBadges.textContent = engine.badges;
  const dailyText = $('#daily-progress');
  if (dailyText) dailyText.textContent = daily.claimed ? 'Tamamlandı ✓' : `${daily.targets}/3 hedef`;
  const achievementText = $('#achievement-count');
  if (achievementText) achievementText.textContent = `${achievements.length}/3 açıldı`;
  ['shield', 'scan', 'time'].forEach((type) => {
    const count = $(`#power-${type}-count`);
    if (count) count.textContent = type === 'shield' ? engine.shieldCharges : inventory[type];
    const button = $(`[data-power="${type}"]`);
    if (button) button.disabled = type === 'shield' || inventory[type] === 0 || !engine.gameActive;
  });
}
function recordProgress(outcome) {
  if (outcome.completedTarget && !daily.claimed) {
    daily.targets += 1;
    if (daily.targets >= 3) { daily.claimed = true; engine.badges += 1; showToast('GÜNLÜK GÖREV +1 ROZET'); }
  }
  if (engine.score >= 1000 && !achievements.includes('score')) achievements.push('score');
  if (engine.level >= 2 && !achievements.includes('level')) achievements.push('level');
  if (engine.combo >= 6 && !achievements.includes('combo')) achievements.push('combo');
  savePersistentState();
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
      if (bottom && value === engine.currentTarget && Date.now() < engine.scanUntil) cell.classList.add('scan-target');
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
  if (outcome.type === 'shield') {
    playFeedback('freeze');
    showToast('KALKAN SENİ KORUDU!');
    savePersistentState();
    render();
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
  recordProgress(outcome);
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
  engine.shieldCharges = inventory.shield;
  inventory.shield = 0;
  savePersistentState();
  $('#home-screen').hidden = true;
  $('#game-screen').hidden = false;
  $('#gameover').hidden = true;
  render();
  renderProgress();
  startLoop();
}
function continueGame() {
  if (!engine.continueGame()) return;
  clearTimeout(gameOverTimer);
  savePersistentState();
  $('#gameover').hidden = true;
  render();
  renderProgress();
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
function buyPower(type) {
  if (!['shield', 'scan', 'time'].includes(type) || engine.badges < 1) { showToast('1 rozet gerekli'); return; }
  engine.badges -= 1;
  inventory[type] += 1;
  savePersistentState();
  renderProgress();
  showToast('Güçlendirici hazır!');
}
function usePower(type) {
  if (type === 'shield' || !engine.gameActive || !inventory[type]) return;
  inventory[type] -= 1;
  engine.usePowerup(type);
  savePersistentState();
  render();
  renderProgress();
  showToast(type === 'scan' ? 'HEDEFLER GÖSTERİLİYOR!' : '+15 SANİYE');
}
window.startNumDrop = startGame;
window.restartNumDrop = startGame;
window.continueNumDrop = continueGame;
window.toggleNumDropSound = toggleSound;
window.goNumDropHome = goHome;
window.buyNumDropPower = buyPower;
window.useNumDropPower = usePower;
document.addEventListener('click', (event) => {
  if (event.target.closest('[onclick]')) return;
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'start' || action === 'restart') startGame();
  if (action === 'continue') continueGame();
  if (action === 'sound') toggleSound();
  if (action === 'home') goHome();
  if (action === 'buy') buyPower(event.target.closest('[data-type]')?.dataset.type);
  if (action === 'power') usePower(event.target.closest('[data-power]')?.dataset.power);
});
loadPersistentState();
syncSoundToggle();
engine.gameActive = false;
render();
renderProgress();
