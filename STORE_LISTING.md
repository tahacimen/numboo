# Play Store Mağaza Metinleri

Play Console → **Grow > Store presence > Main store listing**. Her dil için ayrı giriş yapılır
(Türkçe için varsayılan dil, İngilizce için **Manage translations > Add translations > English (US)**).

Karakter sınırları: uygulama adı **30**, kısa açıklama **80**, tam açıklama **4000**.

---

## Türkçe (varsayılan dil: `tr-TR`)

### Uygulama adı — 19/30

```
Numboo: Sayı Yakala
```

### Kısa açıklama — 49/80

```
Hedef sayıyı yakala, kombonu büyüt, rekorunu kır!
```

### Tam açıklama — 1.517/4.000

```
Numboo, refleksini ve dikkatini aynı anda sınayan hızlı tempolu bir sayı oyunudur. Kurallar ilk saniyede anlaşılır, ustalaşmak ise aylar alır.

Ekranda beliren hedef sayıyı bul ve zaman dolmadan ona dokun. Tek bir yanlış dokunuş turu bitirir.

▣ İKİ OYUN MODU
• Standart — Alt sıradaki hedef sayıların hepsini temizle. Her doğru dokunuş sütunu yukarı kaydırır ve sana zaman kazandırır.
• Akış — Sayılar yukarıdan düşer. Hedefi yere değmeden yakala. Her turda hızlanır.

⚡ TEMPOYU YÜKSELTEN MEKANİKLER
• Kombo çarpanı — Hızlı ve arka arkaya doğru dokun, puanın 5 katına kadar çıksın.
• ❄️ Dondurucu hücreler — Süreyi geçici olarak durdurur, nefes almanı sağlar.
• 🚫 Yasak sayı — 2. seviyeden sonra bir sayı yasaklanır. Ona dokunursan tur biter.
• Her 5 hedefte seviye atlarsın; oyun hızlanır, süre daha çabuk erir.

🏅 İLERLEME VE GÜÇLENDİRİCİLER
• Seviye atladıkça rozet kazan, rozetlerini üç güçlendiriciye harca:
  🛡 Kalkan — Bir yanlış dokunuşu affeder.
  🔍 Tarayıcı — Hedef sayıları beş saniye boyunca aydınlatır.
  ⏱ +15 Saniye — Süreni anında uzatır.
• Rozetini "Devam Et" için saklayıp turu kaldığın yerden sürdürebilirsin.
• Günlük görevi tamamla, ekstra rozet kazan.

✓ İNTERNET GEREKTİRMEZ
Numboo tamamen çevrimdışı çalışır. Reklam yok, satın alma yok, kayıt yok. Hiçbir veri toplamaz — skorların yalnızca senin cihazında saklanır.

Türkçe ve İngilizce dil desteği. Uygulama telefonunun dilini otomatik algılar, dilediğin an ana menüden değiştirebilirsin.

Bir sayıya dokunmak ne kadar zor olabilir ki? Dene.
```

---

## English (`en-US`)

### App name — 25/30

```
Numboo: Catch the Numbers
```

### Short description — 58/80

```
Catch the target number, build your combo, beat your best!
```

### Full description — 1.578/4.000

```
Numboo is a fast-paced number game that tests your reflexes and focus at the same time. You will understand it in one second and spend months mastering it.

Find the target number on screen and tap it before the clock runs out. A single wrong tap ends the round.

▣ TWO GAME MODES
• Classic — Clear every target number in the bottom row. Each correct tap pushes the column up and buys you more time.
• Rush — Numbers fall from above. Catch the target before it hits the floor. Every wave gets faster.

⚡ MECHANICS THAT RAISE THE STAKES
• Combo multiplier — Tap fast and keep your streak alive to multiply your score up to 5x.
• ❄️ Freeze cells — Stop the clock for a moment and catch your breath.
• 🚫 Forbidden number — From level 2 on, one number is off limits. Tap it and the round is over.
• Level up every 5 targets. The game speeds up and your time drains faster.

🏅 PROGRESSION AND POWER-UPS
• Earn badges as you level up, then spend them on three power-ups:
  🛡 Shield — Forgives one wrong tap.
  🔍 Scanner — Lights up the target numbers for five seconds.
  ⏱ +15 Seconds — Extends your clock instantly.
• Save a badge for Continue and pick the round back up where you left off.
• Complete the daily goal to earn an extra badge.

✓ NO INTERNET REQUIRED
Numboo runs fully offline. No ads, no purchases, no sign-up. It collects no data at all — your scores stay on your device and nowhere else.

Available in English and Turkish. The app detects your phone language automatically, and you can switch any time from the main menu.

How hard can tapping a number be? Find out.
```

---

## Görsel varlıklar (Play Console zorunlu alanları)

| Varlık | Boyut | Adet | Not |
|---|---|---|---|
| Uygulama simgesi | 512×512 PNG | 1 | `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` kaynak alınabilir |
| Öne çıkan görsel | 1024×500 PNG/JPG | 1 | Zorunlu. Marka logosu + arkaplan görseli iyi durur |
| Telefon ekran görüntüsü | en az 320px, en fazla 3840px kenar | **min 2, max 8** | Ana menü, standart mod, akış mod, game over ekranı önerilir |

Ekran görüntülerini Android Studio'da emülatörden alabilirsin (emülatör yan panelindeki kamera simgesi).
Hem Türkçe hem İngilizce liste için ayrı ekran görüntüsü yüklemek zorunlu değil — yüklemezsen varsayılan dilinkiler kullanılır.

## Diğer zorunlu beyanlar

- **Gizlilik politikası URL'si** — App content bölümünde isteniyor. Oyun veri toplamasa da bir sayfa gerekiyor; GitHub Pages'te basit bir sayfa yeterli.
- **Data safety** — "Bu uygulama kullanıcı verisi toplamıyor veya paylaşmıyor" seçilebilir. Oyun ağ isteği yapmıyor, tüm durum cihazda `localStorage`'da tutuluyor.
- **İçerik derecelendirmesi** — Anket doldurulmalı. Şiddet, ürkütücü içerik, kumar öğesi yok.
- **Hedef kitle** — 13 yaş altını dahil edersen Families politikası ek gereksinimler getirir. Bilinçli seç.
- **Reklam beyanı** — "Bu uygulama reklam içermiyor".
