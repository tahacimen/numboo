const DICTIONARIES = {
  tr: {
    'home.tagline': 'Sayıları yakala,<br><span>rekoru kap!</span>',
    'home.copy': 'Hedef sıradaki sayıları hızla bul, hepsini temizle ve yeni seviyeye çık.',
    'home.modeAria': 'Oyun modu seçimi',
    'home.modeTitle': 'OYUN MODU',
    'home.play': 'OYNA',
    'home.note': 'Her doğru seçim seni bir sonraki seviyeye taşır.',
    'home.dailyAria': 'Günlük meydan okuma',
    'home.dailyTitle': '🏆 GÜNLÜK GÖREV',
    'home.dailyHint': '3 hedefi tamamla, +1 rozet kazan',
    'home.progressAria': 'İlerleme',
    'home.badgesLabel': 'rozet',
    'home.shopAria': 'Rozet marketi',
    'home.shopTitle': 'GÜÇLENDİRİCİLER · 1 🏅',
    'home.langAria': 'Dili değiştir',
    'mode.standard': '▣ Standart<small>Hedef satırı</small>',
    'mode.fall': '↓ Akış<small>Düşen sayılar</small>',
    'mode.standardDesc': 'Alt sıradaki hedef sayıların hepsini temizle.',
    'mode.fallDesc': 'Alan boş başlar. Hedef sayı yere değmeden ona dokun.',
    'power.shield': '🛡<small>Kalkan</small>',
    'power.scan': '🔍<small>Tarayıcı</small>',
    'power.time': '⏱<small>+15 sn</small>',
    'game.screenTitle': 'Numboo oyun ekranı',
    'game.statsAria': 'Oyun istatistikleri',
    'game.gridAria': 'Oyun alanı',
    'game.queueAria': 'Hedef sırası',
    'game.queueLabel': 'SIRA',
    'game.targetAria': 'Aktif hedef',
    'game.nextAria': 'Sıradaki hedef',
    'game.next2Aria': 'Sonraki hedef',
    'game.remaining': 'kaldı',
    'game.forbidden': '🚫 Basma:',
    'game.timerAria': 'Kalan süre',
    'game.time': '⏱ SÜRE',
    'game.frozen': '❄️ Dondu',
    'game.powerAria': 'Güçlendiriciler',
    'game.modeStandard': 'STANDART MOD',
    'game.modeFall': 'AKIŞ MODU · HIZ ×{speed}',
    'game.cellAria': 'Satır {row}, sütun {col}, sayı {value}',
    'game.fallLayerAria': 'Düşen sayılar',
    'game.fallItemAria': 'Düşen sayı {value}',
    'game.fallHint': 'HEDEFİ YAKALA · YERE DEĞDİRME',
    'game.combo': 'COMBO {count} ×{multiplier}',
    'sound.mute': 'Sesi kapat',
    'sound.unmute': 'Sesi aç',
    'progress.dailyDone': 'Tamamlandı ✓',
    'progress.daily': '{done}/3 hedef',
    'progress.achievements': '{done}/3 açıldı',
    'toast.dailyDone': 'GÜNLÜK GÖREV +1 ROZET',
    'toast.shield': 'KALKAN SENİ KORUDU!',
    'toast.levelUp': 'LEVEL {level}!',
    'toast.needBadge': '1 rozet gerekli',
    'toast.powerReady': 'Güçlendirici hazır!',
    'toast.scan': 'HEDEFLER GÖSTERİLİYOR!',
    'toast.timeBoost': '+15 SANİYE',
    'stat.badges': '🏅 ROZET',
    'stat.level': 'LEVEL',
    'stat.score': 'SKOR',
    'stat.best': 'EN YÜKSEK',
    'over.eyebrow': 'TUR TAMAMLANDI',
    'over.title': 'TEKRAR<br><span>DENE!</span>',
    'over.scoreLabel': 'PUANIN',
    'over.continue': '▶️ Devam Et (🏅 {count})',
    'over.continueNone': '▶️ Devam Et (🏅 yok)',
    'over.restart': '↻ Tekrar Oyna',
    'over.home': '⌂ Ana Menü',
  },
  en: {
    'home.tagline': 'Catch the numbers,<br><span>beat the record!</span>',
    'home.copy': 'Spot the target numbers fast, clear them all and reach the next level.',
    'home.modeAria': 'Game mode selection',
    'home.modeTitle': 'GAME MODE',
    'home.play': 'PLAY',
    'home.note': 'Every correct tap pushes you toward the next level.',
    'home.dailyAria': 'Daily challenge',
    'home.dailyTitle': '🏆 DAILY GOAL',
    'home.dailyHint': 'Complete 3 targets, earn +1 badge',
    'home.progressAria': 'Progress',
    'home.badgesLabel': 'badges',
    'home.shopAria': 'Badge shop',
    'home.shopTitle': 'POWER-UPS · 1 🏅',
    'home.langAria': 'Change language',
    'mode.standard': '▣ Classic<small>Target row</small>',
    'mode.fall': '↓ Rush<small>Falling numbers</small>',
    'mode.standardDesc': 'Clear every target number in the bottom row.',
    'mode.fallDesc': 'The board starts empty. Tap the target before it hits the floor.',
    'power.shield': '🛡<small>Shield</small>',
    'power.scan': '🔍<small>Scanner</small>',
    'power.time': '⏱<small>+15 s</small>',
    'game.screenTitle': 'Numboo game screen',
    'game.statsAria': 'Game stats',
    'game.gridAria': 'Game board',
    'game.queueAria': 'Target queue',
    'game.queueLabel': 'QUEUE',
    'game.targetAria': 'Active target',
    'game.nextAria': 'Next target',
    'game.next2Aria': 'Upcoming target',
    'game.remaining': 'left',
    'game.forbidden': '🚫 Avoid:',
    'game.timerAria': 'Time left',
    'game.time': '⏱ TIME',
    'game.frozen': '❄️ Frozen',
    'game.powerAria': 'Power-ups',
    'game.modeStandard': 'CLASSIC MODE',
    'game.modeFall': 'RUSH MODE · SPEED ×{speed}',
    'game.cellAria': 'Row {row}, column {col}, number {value}',
    'game.fallLayerAria': 'Falling numbers',
    'game.fallItemAria': 'Falling number {value}',
    'game.fallHint': 'CATCH THE TARGET · KEEP IT OFF THE FLOOR',
    'game.combo': 'COMBO {count} ×{multiplier}',
    'sound.mute': 'Mute sound',
    'sound.unmute': 'Unmute sound',
    'progress.dailyDone': 'Completed ✓',
    'progress.daily': '{done}/3 targets',
    'progress.achievements': '{done}/3 unlocked',
    'toast.dailyDone': 'DAILY GOAL +1 BADGE',
    'toast.shield': 'THE SHIELD SAVED YOU!',
    'toast.levelUp': 'LEVEL {level}!',
    'toast.needBadge': '1 badge required',
    'toast.powerReady': 'Power-up ready!',
    'toast.scan': 'TARGETS REVEALED!',
    'toast.timeBoost': '+15 SECONDS',
    'stat.badges': '🏅 BADGE',
    'stat.level': 'LEVEL',
    'stat.score': 'SCORE',
    'stat.best': 'BEST',
    'over.eyebrow': 'ROUND OVER',
    'over.title': 'TRY<br><span>AGAIN!</span>',
    'over.scoreLabel': 'YOUR SCORE',
    'over.continue': '▶️ Continue (🏅 {count})',
    'over.continueNone': '▶️ Continue (🏅 none)',
    'over.restart': '↻ Play Again',
    'over.home': '⌂ Main Menu',
  },
};

export const SUPPORTED_LANGS = Object.keys(DICTIONARIES);
const FALLBACK_LANG = 'en';
const STORAGE_KEY = 'numboo_lang';

function detectLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (SUPPORTED_LANGS.includes(stored)) return stored;
  const tags = navigator.languages?.length ? navigator.languages : [navigator.language ?? ''];
  for (const tag of tags) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (SUPPORTED_LANGS.includes(base)) return base;
  }
  return FALLBACK_LANG;
}

let currentLang = detectLang();

export function getLang() { return currentLang; }

export function nextLang() { return SUPPORTED_LANGS[(SUPPORTED_LANGS.indexOf(currentLang) + 1) % SUPPORTED_LANGS.length]; }

/** Renders the auto-detected language without pinning it, so a device language change still takes effect. */
export function initLang() {
  document.documentElement.lang = currentLang;
  applyTranslations();
  return currentLang;
}

export function setLang(lang) {
  if (SUPPORTED_LANGS.includes(lang)) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
  }
  return initLang();
}

export function t(key, vars) {
  const template = DICTIONARIES[currentLang][key] ?? DICTIONARIES[FALLBACK_LANG][key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
}
