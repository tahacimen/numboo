# NumDrop — Teknik Gereksinim Dokümanı (Game Spec)

> Bu doküman, NumDrop adlı web tabanlı arcade oyununun bir Android mobil uygulaması (APK) olarak sıfırdan yeniden inşa edilmesi için hazırlanmış eksiksiz bir teknik şartnamedir. Kaynak koda bakılmadan, yalnızca bu dokümana dayanarak oyun bire bir aynı mekanik, denge ve his ile yeniden üretilebilmelidir.

---

## 1. Oyun Özeti & Amaç

**Tek cümlelik konsept:** NumDrop, ekranın en alt satırında beliren rakamlar arasından "Sıra" kutusunda gösterilen hedef rakamı hızlıca bulup tıklaman/dokunman gereken, tempolu, tek yanlışın oyunu bitirdiği bir refleks/dikkat oyunudur.

**Hedef kitle:** Kısa oturumlarla (1-3 dakika) oynanabilen, yüksek skor/rekor peşinde koşan, "one more try" hissi veren casual/hyper-casual mobil oyuncular. Tüm yaş grupları için uygun, basit kurallı ama ustalaşması zor bir refleks oyunu.

**Oynanış döngüsü (game loop):**
1. Oyuncuya bir hedef rakam gösterilir (Sıra kutusundaki ilk eleman).
2. Oyuncu, 6 sütunluk ızgaranın en alt satırında bu rakamı arar ve bulduğu her hücreye tıklar.
3. Doğru tıklama: skor kazanılır, süre artar, tıklanan sütun bir aşağı kayar (yeni rastgele rakam üstten girer), combo büyür.
4. Yanlış tıklama (hedef olmayan herhangi bir rakama basmak, özellikle "yasak rakam"a basmak): oyun **anında** biter.
5. Hedefin alt satırdaki tüm örnekleri tıklanınca sıradaki hedefe geçilir.
6. Süre sürekli azalır (bir çubukla gösterilir); süre sıfırlanırsa oyun biter.
7. Her 5 hedef tamamlandığında level atlanır: oyun hızlanır (süre daha hızlı erir), 1 kalıcı rozet kazanılır, level 2'den itibaren "yasak rakam" mekaniği devreye girer.
8. Oyun bittiğinde skor gösterilir; oyuncu elindeki rozetlerden birini harcayarak kaldığı yerden (skor/level/grid korunarak, süre dolu) devam edebilir, yeniden başlayabilir veya çıkabilir.

---

## 2. Grid & Görsel Yapı

- **Boyut:** `COLS = 6`, `ROWS = 8` (6 sütun, 8 satır).
- **Koordinat sistemi:** `grid[r][c]` — `r=0` en üst satır, `r=ROWS-1` (7. indeks, yani 8. satır) görünür/tıklanabilir **en alt satır**.
- **Sadece en alt satır (`r = ROWS-1`) tıklanabilir.** Diğer satırlar sadece görsel, dekoratif "gelecek rakamlar" katmanıdır — dokunma olayı yalnızca alt satır hücrelerine bağlanır.
- **Kayma (shift) mantığı — `shiftColumn(c)`:**
  - Tıklanan sütunda, `r = ROWS-1`'den `r = 1`'e kadar her hücre bir üstteki hücrenin değerini alır (`grid[r][c] = grid[r-1][c]`), yani sütun aşağı doğru kayar.
  - `special[r][c]` (örn. dondurucu işareti) de aynı şekilde bir satır aşağı taşınır.
  - En üst satıra (`r=0`) yeni rastgele bir rakam (`rnd()`, 0-9 arası) girer, `special[0][c] = null` (yeni giren hücre asla özel değildir).
  - Sonuç: tıklanan sütun görsel olarak bir satır aşağı "düşer", tepeden yeni bir rakam belirir. Bu, "slide-in" animasyonu ile (bkz. Bölüm 7) desteklenir.
  - **State kuralı:** Her `shiftColumn(c)` çağrısından sonra, animasyondan bağımsız olarak `recalc()` çalıştırılır. Hedef tamamlama kararı yalnızca kaydırma sonrasındaki güncel alt satıra göre verilir; eski `remaining` değeri kullanılmaz.
- **Hücre boyutlandırma / aspect-ratio:**
  - Grid konteyneri: genişlik `%100`, `max-width: 440px`, `aspect-ratio: 6 / 8` (COLS/ROWS oranı — kare değil, dikey dikdörtgen).
  - `display: grid; grid-template-columns: repeat(6, 1fr); grid-template-rows: repeat(8, 1fr); gap: 6px;`
  - Grid konteyner iç boşluğu (`padding`): 10px, köşe yuvarlaklığı 16px, 2px kenarlık.
  - Her hücre: `display:flex; align-items:center; justify-content:center;` ortalanmış tek haneli rakam metni.
  - Hücre font boyutu: `clamp(20px, 7vw, 34px)` — ekran genişliğine göre esnek, min 20px maks 34px.
  - Hücre köşe yuvarlaklığı: 10px, kenarlık 1.5px.
  - Alt satır (tıklanabilir) hücreleri farklı arka plan/kenarlık rengiyle (`--bottom-row`, `--bottom-border`) diğerlerinden görsel olarak ayrılır ve `cursor: pointer` alır; diğer satırlar `cursor: default`.

---

## 3. Renk Paleti & Tipografi

### CSS Custom Properties (Renkler)

| Değişken | Hex/RGBA | Kullanım |
|---|---|---|
| `--bg` | `#0f0e17` | Sayfa arka planı |
| `--surface` | `#1a1a2e` | Kart/panel arka planları (header stat kutuları, grid konteyner, queue alanı, overlay kutusu) |
| `--cell-bg` | `#16213e` | Normal (alt satır olmayan) hücre arka planı |
| `--cell-border` | `#0f3460` | Normal hücre / panel kenarlıkları |
| `--accent1` | `#ff6b6b` | Kırmızı — yanlış/tehlike/yasak rakam/kritik süre |
| `--accent2` | `#ffd93d` | Sarı/altın — vurgu, aktif sıra öğesi, logo, skor |
| `--accent3` | `#6bcb77` | Yeşil — olumlu durum, dolu süre, devam et butonu |
| `--accent4` | `#4d96ff` | Mavi — level göstergesi, "next" sıra öğesi |
| `--text` | `#fffffe` | Ana metin rengi |
| `--text-dim` | `#a7a9be` | İkincil/soluk metin |
| `--bottom-row` | `rgba(255, 217, 61, 0.15)` | Tıklanabilir alt satır arka planı |
| `--bottom-border` | `#ffd93d` | Tıklanabilir alt satır kenarlığı |

**Ek renkler (kod içinde doğrudan kullanılan):**
- Dondurucu (freeze) mavi: `#4dc8ff`, açık mavi glow `#a0e9ff`
- Devam Et butonu gradyanı: `--accent3` → `#4dd98a`
- Süre çubuğu geçişleri: yüksek süre → `--accent3`→`--accent2` gradyanı; orta → `--accent2`→`#ffa94d`; kritik → `--accent1`→`#ff8787`

### Tipografi

- **Başlık/vurgu fontu:** `Fredoka One` (cursive fallback) — logo, hücre rakamları, sıra öğeleri, overlay başlıkları, butonlar, combo/level metinleri.
- **Gövde fontu:** `Nunito` (ağırlıklar: 400, 600, 700, 900) — body varsayılanı, istatistik etiketleri, açıklama metinleri.
- Google Fonts importu: `Fredoka+One` ve `Nunito:wght@400;600;700;900`.

---

## 4. Oyun Mekanikleri

### 4.1 Sıra (Queue) Sistemi ve Hedef Belirleme

- `queue`: 0-9 arası rastgele rakamlardan oluşan bir dizi (FIFO). Oyun başında `fillQueue(30)` ile 30 eleman üretilir.
- `fillQueue(n)`: `n` adet `rnd()` (0-9 arası rastgele tam sayı) diziye eklenir. Kuyruk 5 elemanın altına düşerse otomatik olarak 20 eleman daha eklenir (`advanceTarget` içinde kontrol edilir).
- `advanceTarget()`:
  1. Kuyruk 5'ten azsa doldur.
  2. `currentTarget = queue[0]` (kuyruğun ilk elemanı güncel hedeftir).
  3. `recalc()` çağrılarak alt satırda bu hedeften kaç tane olduğu (`remaining`) hesaplanır.
  4. **Kilitlenme koruması:** Eğer `remaining === 0` ise (hedef rakam şu an alt satırda hiç yoksa), alt satırda **gerçekten var olan** rakamlardan rastgele biri seçilip hem `queue[0]` hem `currentTarget` bu değerle değiştirilir, `recalc()` tekrar çağrılır. Bu, oyunun asla imkânsız bir hedefle kilitlenmemesini garanti eder.
  5. **Yasak rakam ataması:** `level >= 2` ise, `currentTarget`'tan farklı rastgele bir rakam seçilip `forbiddenNum`'a atanır (bkz. 4.7). `level < 2` ise `forbiddenNum = null`.
- Ekranda "Sıra" alanında kuyruğun ilk 3 elemanı gösterilir: `active` (güncel hedef, büyütülmüş/parlak), `next`, `next2` (soluklaşan, küçülen).
- Hedef tamamlanınca (`remaining <= 0`): `queue.shift()` ile kuyruktan çıkarılır, `advanceTarget()` tekrar çağrılarak yeni hedefe geçilir.

### 4.2 Doğru/Yanlış Tıklama Sonuçları — Anlık Ölüm Kuralı

- Tıklama yalnızca alt satır (`r = ROWS-1`) hücrelerinde geçerlidir.
- Tıklanan hücrenin değeri (`val = grid[ROWS-1][c]`) `currentTarget`'a **eşit değilse**: hücreye `wrong` görsel sınıfı eklenir (kırmızı highlight + shake animasyonu), `combo = 0`, `gameActive = false`, 500ms sonra oyun sonu ekranı (`showGameOver`) tetiklenir. **İstisnasız her yanlış tıklama anında oyunu bitirir** (yasak rakam da dahil, çünkü yasak rakam zaten hedefe eşit olamaz).
- Tıklanan hücre dondurucu (`freeze`) işaretliyse, değeri ne olursa olsun bu **her zaman güvenlidir** ve yanlış tıklama sayılmaz (bkz. 4.8) — bu kontrol yanlış/doğru kontrolünden **önce** yapılır.
- Doğru tıklamada: skor, süre, combo güncellemeleri yapılır (bkz. 4.3-4.4), sütun kaydırılır (`shiftColumn`), tüm sütun yeniden boyanır (`paintCell` ile animasyonlu), hedef tamamlandıysa level kontrolü ve yeni hedef ataması yapılır.

#### Tıklama akışının atomik sırası

Her dokunuş, yalnızca `gameActive === true` iken ve tek bir senkron state güncellemesi olarak işlenir. Geçmiş animasyonların veya gecikmeli callback'lerin yeni oyunun state'ini değiştirmesine izin verilmez.

1. Dondurucu hücreye tıklanmışsa güvenli toplama uygulanır, hücre kaydırılır ve hemen `recalc()` çalıştırılır. Dondurucu artık güncel hedef rakamını taşıyorsa bu toplama ayrıca bir doğru hedef tıklaması sayılır; böylece hedef sayacı eksilmeden hedef rakamın grid'den çıkması engellenir.
2. Normal hücre hedef değilse tekil `endGame(reason)` çağrılır. Bu fonksiyon `gameActive` kontrolüyle idempotenttir, aktif RAF'ı ve bekleyen oyun-sonu zamanlayıcılarını iptal eder; overlay'i yalnızca bir kez açar.
3. Normal hücre hedefse skor/süre/combo güncellenir, sütun kaydırılır ve `recalc()` yapılır.
4. `remaining === 0` ise sırasıyla `targetsDone++`, gerekliyse `levelUp()`, `queue.shift()` ve `advanceTarget()` çağrılır. Böylece level 2'nin ilk hedefi de yasak-rakam kuralıyla oluşturulur.
5. `maybeSpawnFreeze()` yalnızca yeni hedef ve varsa yeni yasak rakam belirlendikten sonra çağrılır; uygunluk filtresi güncel hedefi kullanır.

### 4.3 Skor Hesaplama Formülü

Her doğru tıklamada:

```
rawDelta = lastClickTime ? (now - lastClickTime) : 800 // ms cinsinden, önceki tıklamadan bu yana geçen süre
delta = max(80, rawDelta)                              // aynı zaman damgası/çoklu dokunuş için alt sınır
base  = max(10, floor(900 / (delta/1000 + 0.4)))       // hıza dayalı temel puan
mult  = min(COMBO_CAP, 1 + floor(combo / 4))           // combo çarpanı
bonus = base * mult
score += bonus
```

- İlk tıklamada (`lastClickTime` henüz yoksa) `delta` varsayılan olarak 800ms kabul edilir.
- `delta` 80ms'nin altına inemez; bu, aynı zaman damgalı çoklu dokunuşların veya otomasyonun skoru anormal biçimde şişirmesini önler.
- `base` formülü: ne kadar hızlı tıklarsan (delta küçükse) o kadar yüksek puan alırsın; formül `900 / (saniye + 0.4)` şeklinde ters orantılıdır, minimum 10 puan garantilenir.
- Skor `bestScore`'u geçerse anında `localStorage.numdrop_best` güncellenir.
- Ekranda skor popup'ı gösterilir: çarpan >1 ise `"+{bonus} x{mult}"`, değilse `"+{bonus}"`.

### 4.4 Combo Sistemi

- Her doğru tıklamada `combo++`.
- Çarpan formülü: `mult = min(COMBO_CAP, 1 + floor(combo / 4))` — yani her 4 ardışık doğru tıklamada çarpan 1 artar, `COMBO_CAP` (5) ile sınırlıdır.
- **Sıfırlanma koşulları:**
  - Yanlış tıklama anında `combo = 0`.
  - Oyun döngüsünde (`gameLoop`), son doğru tıklamadan bu yana **2500ms (2.5 saniye)** geçtiyse combo otomatik olarak `0`'a döner ve combo metni temizlenir.
- Combo görsel göstergesi (`showCombo`):
  - `combo < 2` ise gösterge boş.
  - `combo >= 12`: çift ateş emoji `🔥🔥`, renk `#ff6b6b` (kırmızı).
  - `combo >= 6`: tek ateş emoji `🔥`, renk `#ffd93d` (sarı).
  - Diğer durumlarda (2-5 arası): emoji yok, renk `#6bcb77` (yeşil).
  - Metin formatı: `"{fire} COMBO {combo}  x{mult}"`.
  - `comboPop` animasyonu her güncellemede yeniden tetiklenir (class remove + reflow + add tekniğiyle).

### 4.5 Süre (timeLeft) Mekaniği

- `TIME_MAX = 100` — süre çubuğunun maksimum/başlangıç değeri (birim yok, soyut "dolu çubuk" değeri).
- Süre her karede (`requestAnimationFrame` tabanlı `gameLoop`) şu şekilde azalır:
  ```
  drainRate() = START_DRAIN + (level - 1) * DRAIN_PER_LEVEL
  timeLeft -= drainRate() * dt   // dt: saniye cinsinden kare arası geçen süre
  ```
  - `START_DRAIN = 7` (level 1'de saniyede erime miktarı)
  - `DRAIN_PER_LEVEL = 2.2` (her level saniyedeki erime hızına eklenen miktar)
  - Bu erime, **yalnızca** dondurma aktif değilse (`Date.now() >= frozenUntil`) uygulanır.
- Doğru tıklamada eklenen süre:
  ```
  timeGain = max(3, TIME_PER_HIT_BASE - (level - 1) * 0.5)
  timeLeft = min(TIME_MAX, timeLeft + timeGain)
  ```
  - `TIME_PER_HIT_BASE = 9` (level 1'de doğru tıklama başına eklenen süre)
  - Level arttıkça eklenen süre azalır (level başına -0.5), minimum 3 ile sınırlanır. Bu, yüksek levellerde oyunu zorlaştırır.
- `timeLeft <= 0` olduğunda: `timeLeft = 0`, `gameActive = false`, 300ms sonra `showGameOver()` çağrılır.
- Süre çubuğu (`speed-fill`) genişliği `pct = timeLeft / TIME_MAX` oranında ayarlanır; renk pct'ye göre değişir (bkz. Bölüm 3), `pct <= 0.25` iken `critical` sınıfı ile yanıp söner (`blink` animasyonu, 0.5s döngü).

### 4.6 Level Sistemi

- `TARGETS_PER_LEVEL = 5` — her 5 hedef tamamlanınca (`targetsDone % TARGETS_PER_LEVEL === 0`) `levelUp()` çağrılır.
- `levelUp()` içinde:
  - `level++`
  - **+1 kalıcı rozet** kazanılır (`badges++`, `localStorage.numdrop_badges` güncellenir, ekran anında yenilenir).
  - **Süre bonusu:** `timeLeft = min(TIME_MAX, timeLeft + 15)`.
  - **Görsel flaş:** `#levelup-flash` elemanı `"LEVEL {level}"` metniyle `levelPop` animasyonunu (1s, tam ekran ortalanmış, opaklık ve ölçek geçişli) tetikler.
  - Dolaylı etki: level arttıkça `drainRate()` artar (oyun hızlanır) ve `timeGain` azalır (süre kazancı düşer) — yani oyun kademeli olarak zorlaşır.

### 4.7 Yasak Rakam (Forbidden Number) Mekaniği

- Yalnızca `level >= 2` iken aktiftir.
- Her `advanceTarget()` çağrısında, güncel hedeften (`currentTarget`) farklı rastgele bir rakam `forbiddenNum` olarak seçilir (do-while döngüsüyle hedefe eşit olmaması garantilenir).
- Alt satırda `forbiddenNum` değerine sahip hücreler görsel olarak işaretlenir (`forbidden` class): kırmızı arka plan/kenarlık, `dangerPulse` animasyonu (0.8s, sürekli, box-shadow yoğunluğu titreşimi) ile "tehlike" hissi verir.
- Yasak rakama tıklamak, teknik olarak zaten "hedef değil" kategorisine girdiği için normal yanlış tıklama kuralıyla (4.2) **anında oyun sonu** tetikler — ayrı bir ceza mekanizması yoktur, görsel uyarı amaçlıdır.
- Sıra alanında ayrıca ayrı bir "🚫 Basma" kutusu (`forbidden-box`) gösterilir, içinde güncel yasak rakam yazar.

### 4.8 Dondurucu (Freeze) Mekaniği

- `FREEZE_DURATION = 3` (saniye) — dondurmanın süre erimesini durdurma süresi.
- `FREEZE_SPAWN_CHANCE = 0.18` (%18) — bir hedef tamamlandığında dondurucunun ortaya çıkma olasılığı.
- `maybeSpawnFreeze()` — hedef tamamlama akışında **yeni hedef ve yasak rakam atandıktan sonra** çağrılır:
  1. `Math.random() > FREEZE_SPAWN_CHANCE` ise çıkış yapılmaz (spawn olmaz).
  2. Alt satırda, **hedef olmayan, yasak rakam olmayan ve zaten özel işaretli olmayan** hücreler arasından rastgele biri seçilir.
  3. Uygun hücre yoksa spawn iptal edilir.
  4. Seçilen hücreye `special[ROWS-1][c] = 'freeze'` atanır; görsel olarak mavi glow (`freeze` class, `freezeGlow` animasyonu, sağ üstte ❄️ emoji) ile işaretlenir.
- Dondurucu hücreye tıklanınca (`onClick` içinde en öncelikli kontrol):
  - `frozenUntil = Date.now() + FREEZE_DURATION * 1000` (3 saniyeliğine süre erimesi durur).
  - `score += 50` sabit bonus, `"❄️ +50"` popup'ı gösterilir.
  - Hücrenin özel işareti temizlenir, sütun normal şekilde kaydırılır (`shiftColumn`).
  - **Bu tıklama combo'yu etkilemez, hedef ilerlemesini saymaz** — sadece bonus puan ve dondurma sağlar.
- Dondurma aktifken süre çubuğu `frozen` görünümüne geçer: mavi gradyan, `"❄️ Dondu"` etiketi, `critical` blink kapatılır.

### 4.9 Rozet (Badge) Sistemi

- `badges`: `localStorage.numdrop_badges`'ten okunur, `0` varsayılan.
- **Kazanma:** Her level atlayışında (`levelUp()`) +1 rozet, kalıcı olarak `localStorage`'a yazılır.
- **Kalıcılık:** Rozetler oyun oturumları arasında **kalıcıdır** — `startGame()` çağrısında rozet sayısı **sıfırlanmaz** (yalnızca skor, level, grid, combo gibi oturuma özel state sıfırlanır).
- **Harcama — "Devam Et" (`continueGame()`):**
  - Yalnızca `badges > 0` iken aktiftir; aksi halde buton `disabled` görünümde ve tıklanamaz durumda gösterilir (`"(🏅 yok)"` etiketiyle).
  - Tıklanınca: `badges--`, `localStorage` güncellenir, oyun sonu ekranı kapanır.
  - **Skor, level ve grid durumu korunur** (sıfırlanmaz) — oyuncu kaldığı yerden devam eder.
  - Yanlış tıklama görsel vurgusu (`wrong` class) temizlenir.
  - Hedefin hâlâ alt satırda olup olmadığı kontrol edilir (`recalc()`); yoksa `advanceTarget()` ile yeni hedef atanır.
  - `timeLeft` tam doldurulur (`TIME_MAX`), `combo = 0`, `frozenUntil = 0`, `lastClickTime = 0` sıfırlanır.
  - `lastTick = performance.now()` atanır; böylece oyun sonu ekranında geçen süre ilk karede süre çubuğundan düşmez.
  - Eski RAF ve gecikmeli callback'ler iptal edilir; oyun döngüsü yalnızca tek bir RAF isteğiyle yeniden başlatılır.

---

## 5. Tüm Sabit/Ayarlanabilir Değerler (Config Tablosu)

| Sabit | Değer | Açıklama |
|---|---|---|
| `COLS` | `6` | Izgara sütun sayısı |
| `ROWS` | `8` | Izgara satır sayısı (en alt satır = tıklanabilir alan) |
| `TIME_MAX` | `100` | Süre çubuğunun maksimum/dolu değeri |
| `START_DRAIN` | `7` | Level 1'de saniyede süre erime miktarı |
| `DRAIN_PER_LEVEL` | `2.2` | Her level ile saniyedeki erime hızına eklenen miktar |
| `TIME_PER_HIT_BASE` | `9` | Level 1'de doğru tıklama başına eklenen süre |
| `TARGETS_PER_LEVEL` | `5` | Kaç hedef tamamlanınca level atlanacağı |
| `FREEZE_DURATION` | `3` | Dondurucunun süre erimesini durdurma süresi (saniye) |
| `FREEZE_SPAWN_CHANCE` | `0.18` | Hedef tamamlanınca dondurucunun ortaya çıkma olasılığı (%18) |
| `COMBO_CAP` | `5` | Combo çarpanının ulaşabileceği maksimum değer |

**Türetilmiş / ek sabitler (config bloğu dışında ama sabit değerli):**

| Değer | Kullanım |
|---|---|
| `800` (ms) | İlk tıklamada varsayılan `delta` değeri (skor formülü) |
| `2500` (ms) | Combo'nun otomatik sıfırlanma eşiği (son tıklamadan bu yana geçen süre) |
| `10` | Skor formülünde `base` için minimum değer |
| `3` | `timeGain` için minimum değer (level yükseldikçe süre kazancının düşemeyeceği alt sınır) |
| `15` | Level atlayışında eklenen sabit süre bonusu |
| `50` | Dondurucuya tıklamada kazanılan sabit puan bonusu |
| `0.5` | Level başına `timeGain`'den düşülen miktar |
| `30` | Oyun başlangıcında kuyruğa doldurulan ilk eleman sayısı |
| `20` | Kuyruk 5'in altına düşünce eklenen ek eleman sayısı |
| `5` | Kuyruğun yeniden doldurulmasını tetikleyen eşik (kuyruk uzunluğu bu değerin altına düşünce) |

---

## 6. Ekranlar & UI Bileşenleri

### 6.1 Header (üst bilgi çubuğu)
- Sol: "NumDrop" logosu (gradyan metin, Fredoka One, 2rem, harf aralığı 2px).
- Sağ: 4 istatistik kutusu (`stat-box`), her biri etiket + değer:
  1. 🏅 Rozet (yeşil `--accent3`)
  2. Level (mavi `--accent4`)
  3. Skor (varsayılan sarı `--accent2`)
  4. En Yüksek (varsayılan sarı `--accent2`)

### 6.2 Başlangıç Ekranı (`start-overlay`)
- Tam ekran karartma overlay'i (`rgba(15,14,23,.92)`), ortalanmış kutu.
- Gradyan başlıklı "NumDrop" logosu.
- Açıklama metni (`overlay-sub`): oyun kuralları özet halinde — hedefi bulma, süre mekaniği, level/rozet sistemi, yanlış tıklamanın ölümcül olduğu uyarısı, yasak rakam ve combo/dondurucu açıklaması.
- "🎮 Başla" butonu → `startGame()`.
- Sayfa ilk yüklendiğinde bu overlay varsayılan olarak görünür (`show` class).

### 6.3 Oyun İçi HUD
- **Grid** (`#grid`): 6x8 ızgara.
- **Level-up flash** (`#levelup-flash`): grid üstünde, tam ekran, geçici "LEVEL N" metni.
- **Queue alanı** (`#queue-area`): "Sıra" etiketi + ilk 3 kuyruk elemanı (active/next/next2 stilleri) + kalan sayısı (`"× N kaldı"`) + yasak rakam kutusu (yalnızca level 2+ görünür).
- **Combo göstergesi** (`#combo-display` / `#combo-text`): combo ≥2 iken belirir.
- **Süre çubuğu** (`#speed-wrap`): "⏱ Süre" etiketi + dolum çubuğu (`#speed-fill`), renk/durum süreye göre değişir.

### 6.4 Oyun Sonu Ekranı (`gameover-overlay`)
- Tam ekran karartma overlay'i.
- "💥 Bitti" başlığı (kırmızı).
- Final skor (büyük, sarı).
- Alt mesaj: rekor kırıldıysa `"🏆 Yeni rekor! · Level {level}"`, kırılmadıysa `"Level {level} · En yüksek: {bestScore}"`.
- Üç buton (dikey sıralı, `btn-row`):
  1. **▶️ Devam Et** (`continue-btn`) — yalnızca `badges > 0` iken aktif; pasifken gri/disabled görünüm ve `"(🏅 yok)"` etiketi, aktifken `"(🏅 {badges})"` etiketi. → `continueGame()`.
  2. **🔄 Tekrar Oyna** → `startGame()` (her şeyi sıfırdan başlatır, rozetler hariç).
  3. **✖ Bitir** (`btn-quit`, soluk stil) → `quitGame()` (başlangıç ekranına döner).

---

## 7. Animasyonlar & Geri Bildirimler

| Animasyon | Tetiklenme Anı | Amaç / Davranış |
|---|---|---|
| `slideDown` (.22s ease-out) | Bir sütun kaydırıldığında (`shiftColumn` sonrası `paintCell(..., animate=true)`) | Hücrenin yukarıdan kayarak (translateY -105% → 0, opacity .3 → 1) yerine gelmesi |
| `shake` (.3s) | Yanlış hücreye tıklanınca | Hücrenin yatayda sarsılması (kırmızı highlight ile birlikte) |
| `comboPop` (.5s ease-out) | Her doğru tıklamada `combo >= 2` olduğunda | Combo metninin büyüyerek belirmesi (scale .6 → 1.25 → 1, opacity 0 → 1) |
| `levelPop` (1s ease-out) | Level atlandığında | Tam ekran "LEVEL N" flaşının belirip kaybolması (opacity/scale geçişi) |
| `dangerPulse` (.8s infinite alternate) | Level 2+ iken, yasak rakamlı hücrede sürekli | Kırmızı box-shadow yoğunluğunun titreşerek tehlike hissi vermesi |
| `freezeGlow` (1s infinite alternate) | Dondurucu hücre ekranda olduğu sürece | Mavi box-shadow yoğunluğunun titreşerek dikkat çekmesi |
| `floatUp` (.8s forwards) | Her doğru tıklama / dondurucu tıklamasında (`showPopup`) | Skor popup'ının (`+N` veya `+N xM` veya `❄️ +50`) yukarı doğru süzülerek solması (translateY 0 → -50px, opacity 1 → 0) |
| `blink` (.5s infinite) | Süre çubuğu `pct <= 0.25` (kritik seviyede) olduğunda | Süre çubuğunun opaklığının titreşerek acil uyarı vermesi |

**Skor popup detayı:** `showPopup(col, text)` tıklanan hücrenin tam konumunda (`getBoundingClientRect` ile hesaplanan grid-relative pozisyon) geçici bir `div` oluşturur, animasyon bitince (`animationend` event) DOM'dan kaldırır.

---

## 8. State Yönetimi

### 8.1 Oturum İçi (Runtime) State — her `startGame()` çağrısında sıfırlanır

| Değişken | Tip | Açıklama |
|---|---|---|
| `grid` | `number[8][6]` | Izgara değerleri (0-9) |
| `special` | `(string\|null)[8][6]` | Hücre başına özel durum: `null` veya `'freeze'` |
| `queue` | `number[]` | Bekleyen hedef rakamlar kuyruğu |
| `score` | `number` | Güncel skor |
| `gameActive` | `boolean` | Oyunun aktif/duraklı olduğu |
| `currentTarget` | `number\|null` | Güncel hedef rakam |
| `remaining` | `number` | Alt satırda hedeften kalan adet |
| `lastClickTime` | `number` (timestamp) | Skor/combo hesaplaması için son tıklama zamanı |
| `level` | `number` | Güncel level (1'den başlar) |
| `targetsDone` | `number` | Tamamlanan toplam hedef sayısı |
| `forbiddenNum` | `number\|null` | Güncel yasak rakam (yalnızca level 2+) |
| `combo` | `number` | Ardışık doğru tıklama sayacı |
| `frozenUntil` | `number` (timestamp) | Dondurmanın bitiş zamanı |
| `timeLeft` | `number` | Kalan süre (0-100 arası) |
| `lastTick` | `number` (timestamp) | `requestAnimationFrame` kare zamanlaması için |
| `rafId` | `number\|null` | Aktif animasyon kare isteği ID'si (iptal için) |

### 8.2 Kalıcı State (localStorage) — oturumlar arası korunur

| Anahtar | Tip | Açıklama |
|---|---|---|
| `numdrop_best` | `number` (string olarak saklanır) | En yüksek skor (`bestScore`) |
| `numdrop_badges` | `number` (string olarak saklanır) | Biriken rozet sayısı (`badges`) — yalnızca level atlayışında artar, "Devam Et" ile azalır; `startGame()`'de **sıfırlanmaz** |

**Önemli davranış notu:** `continueGame()` çağrıldığında `score`, `level`, `grid`, `special`, `targetsDone`, `queue` gibi ilerleme durumu **korunur** — yalnızca `timeLeft`, `combo`, `frozenUntil`, `lastClickTime` sıfırlanır/doldurulur. `startGame()` (Tekrar Oyna) ise `badges` hariç **her şeyi** sıfırdan başlatır.

---

## 9. Mobil Uygulamaya Taşıma Gereksinimleri

### 9.1 Teknoloji Önerisi
- Bu prototip vanilla HTML/CSS/JS ve `localStorage` kullanan tek dosyalık bir web uygulamasıdır. Android APK'ya taşımak için önerilen yaklaşımlar (öncelik sırasıyla):
  1. **Capacitor** (Ionic) — mevcut web kodunu neredeyse değiştirmeden native bir WebView kabına sarar; en düşük efor, en hızlı yol. `localStorage` → Capacitor Preferences API ile native depolamaya taşınabilir (opsiyonel, WebView localStorage da çalışır).
  2. **React Native** — daha native performans/his isteniyorsa, oyun mantığı JS'de korunarak UI React Native View/Pressable bileşenlerine, animasyonlar `Reanimated`/`Animated` API'sine taşınır.
  3. **Flutter** — tamamen yeniden yazım gerektirir (Dart), ancak en iyi native performans ve animasyon kontrolü sağlar.
- **Öneri:** Hızlı bir MVP için Capacitor, uzun vadeli/performans kritik bir ürün için React Native.

### 9.2 Dokunmatik Optimizasyon
- Mevcut `cursor: pointer` / `:hover` stilleri mobilde anlamsızdır; bunların yerine `:active` (basılı tutma) durumları için görsel geri bildirim (örn. hafif scale-down veya opacity değişimi) eklenmelidir.
- Tıklama hedefleri (alt satır hücreleri) parmak dokunuşu için yeterince büyük olmalı — mevcut `clamp(20px,7vw,34px)` font boyutu korunmalı, hücre dokunma alanı en az 44x44pt (iOS HIG) / 48x48dp (Material) önerisine uygun olmalı.
- `touch-action: manipulation` ve `-webkit-tap-highlight-color: transparent` zaten mevcut kodda var — native tarafta da çift dokunma zoom'u ve highlight flaşı engellenmelidir.
- Çoklu hızlı dokunuşlarda (fast combo oynanışı) dokunma olaylarının kaçırılmaması için debounce/throttle **uygulanmamalı** — oyun tasarımı gereği her dokunuş anında işlenmelidir.

### 9.3 Safe-Area / Notch Desteği
- Mevcut kodda `env(safe-area-inset-top)` ve `env(safe-area-inset-bottom)` zaten kullanılıyor; native tarafa geçişte bu, platformun kendi safe-area API'leri ile eşleştirilmeli (Capacitor: `SafeArea` plugin veya CSS env() WebView içinde de çalışır; React Native: `SafeAreaView`/`react-native-safe-area-context`).
- Ekranın üst/alt kenarlarına yakın interaktif elemanlar (header, alt overlay butonları) çentik/ev çubuğu (home indicator) ile çakışmamalı.

### 9.3.1 Uygulama Yaşam Döngüsü ve Duraklatma
- Uygulama arka plana alındığında, ekran kilitlendiğinde veya görünürlük kaybolduğunda oyun açıkça duraklatılmalıdır: RAF iptal edilir, süre erimez ve dokunmalar devre dışı kalır.
- Uygulama tekrar görünür olduğunda otomatik oynatmak yerine bir "Devam Et" pause overlay'i gösterilir. Oyuncu onay verdiğinde `lastTick = performance.now()` atanır ve yalnızca tek bir oyun döngüsü başlatılır.
- Bu davranış, arka plana alma ile süre kaybı ya da ilk karede büyük `dt` nedeniyle anlık oyun sonu oluşmasını engeller.

### 9.4 Ekran Yönü Kilidi
- Oyun **yalnızca dikey (portrait)** modda tasarlanmıştır (grid `aspect-ratio: 6/8`). Android manifestinde `android:screenOrientation="portrait"` kilidi uygulanmalı.

### 9.5 Performans
- Mevcut oyun döngüsü zaten `requestAnimationFrame` tabanlıdır (`gameLoop`) — bu native/hibrit WebView içinde de korunmalı, `setInterval`'a geçilmemeli.
- 48 hücrelik (6x8) DOM manipülasyonu her tıklamada yalnızca ilgili sütun için yapılıyor (`for r in ROWS: paintCell(r,c)`) — tüm grid'i her karede yeniden çizmiyor, bu verimli yaklaşım korunmalı.
- React Native'e taşınırsa, her hücre `React.memo` ile sarılmalı; yalnızca değişen sütun/hücreler yeniden render edilmeli.

### 9.6 Ses / Haptic Feedback (Öneri Alanı — Mevcut Kodda Yok)
- Mevcut web prototipinde **ses efekti yoktur**. Mobil versiyon için önerilir:
  - Doğru tıklama: kısa "tık/ping" sesi + hafif haptic (Android `Vibration` API, kısa 10-20ms darbe).
  - Yanlış tıklama / oyun sonu: düşük ton "buzz" sesi + orta şiddette haptic (50-100ms).
  - Level atlama: yükselen ton/fanfar sesi + çift haptic darbe.
  - Dondurucu toplama: "cam kırılma/donma" tarzı kısa ses efekti.
  - Ayarlarda ses/haptic açma-kapama seçeneği eklenmeli (bkz. Bölüm 10, Açık Sorular).

### 9.7 İkon / Splash Screen
- Uygulama ikonu: logo temasına uygun (sarı-kırmızı gradyan, "N" harfi veya rakam motifi öneri), Android adaptive icon formatında (foreground + background layer) hazırlanmalı.
- Splash screen: `--bg` (#0f0e17) arka plan üzerine "NumDrop" logosu (gradyan metin veya statik PNG versiyonu), kısa süreli gösterim.

### 9.8 Offline Çalışma
- Oyun mantığı tamamen client-side'dır (harici API çağrısı yok), tek bağımlılık Google Fonts CDN importudur. Native versiyonda fontlar **bundle içine gömülmeli** (offline erişim için `Fredoka One` ve `Nunito` font dosyaları assets olarak paketlenmeli), CDN'e bağımlılık kaldırılmalı.
- `localStorage` yerine native depolama (Capacitor Preferences / AsyncStorage / SharedPreferences) kullanılırsa veri cihaz üzerinde offline kalıcı olarak saklanmaya devam eder.

### 9.9 APK Build / Export Adımları (Capacitor Örneği)
1. Node.js + npm kurulumu, `npm init`, `@capacitor/core` ve `@capacitor/cli` kurulumu.
2. Mevcut `index.html` (ve varsa ayrılmış CSS/JS dosyaları) bir `www/` klasörüne yerleştirilir.
3. `npx cap init` ile proje yapılandırılır, `npx cap add android` ile Android platformu eklenir.
4. Gerekli SDK: **Android Studio** (Android SDK, minimum API level öneri: **minSdkVersion 24 (Android 7.0)** — modern WebView/CSS özellikleri için makul bir alt sınır; targetSdkVersion güncel Play Store gereksinimlerine göre ayarlanmalı (örn. API 34+).
5. `npx cap sync android` ile web varlıkları native projeye kopyalanır.
6. Android Studio üzerinden `Build > Generate Signed Bundle / APK` ile imzalı APK/AAB üretimi:
   - Bir keystore (.jks) oluşturulmalı (`keytool -genkey -v -keystore ...`), imzalama bilgileri güvenli saklanmalı.
   - Play Store dağıtımı için **AAB (Android App Bundle)** formatı önerilir, doğrudan APK dağıtımı için **APK** yeterlidir.
7. Test: fiziksel cihaz veya emülatörde (Android Studio AVD) tam oynanış testi, özellikle dokunma tepkisi ve performans (60fps hedefi) doğrulanmalı.

---

## 10. Kapsam Dışı / Netleştirilmesi Gerekenler (Açık Sorular)

Aşağıdaki noktalar mevcut web prototipinde (`index.html`) **bulunmamaktadır** ve mobil sürüm için karar verilmesi/netleştirilmesi gerekmektedir:

- **Reklam / IAP:** Uygulamada reklam gösterimi (banner, interstitial, rewarded — örn. "reklam izle, rozet kazan") olacak mı? Rozetlerin parayla satın alınabileceği bir IAP (in-app purchase) modeli düşünülüyor mu?
- **Ses efektleri / müzik:** Arka plan müziği eklenecek mi? Bölüm 9.6'da önerilen SFX'ler onaylanacak mı, yoksa farklı bir ses tasarımı mı istenir?
- **Çoklu dil desteği:** Şu an tüm metinler Türkçe sabit kodlanmış (hardcoded). Uygulama çok dilli mi olacak (örn. İngilizce, Almanca)? Eğer evetse i18n altyapısı (string dosyaları, dil seçimi) gerekir.
- **App Store / Play Store meta verileri:** Uygulama adı, açıklama metni, ekran görüntüleri, kategori (Arcade/Puzzle), yaş derecelendirmesi (ESRB/PEGI), gizlilik politikası metni henüz belirlenmemiş.
- **Giriş / hesap sistemi:** Skor ve rozetler şu an yalnızca cihaz-lokal (`localStorage`). Bulut senkronizasyonu, kullanıcı hesabı (Google Play Games Services entegrasyonu, liderlik tablosu/leaderboard, başarımlar) planlanıyor mu?
- **Analitik / kaza raporlama:** Firebase Analytics, Crashlytics gibi araçlar entegre edilecek mi?
- **Zorluk ayarları:** Config tablosundaki sabitler (Bölüm 5) oyuncuya açık bir "zorluk seçimi" (Kolay/Normal/Zor) olarak sunulacak mı, yoksa sabit mi kalacak?
- **Erişilebilirlik:** Renk körlüğü desteği (özellikle kırmızı/yeşil ayrımı — yasak rakam vs. normal, süre çubuğu renkleri kritik), ekran okuyucu desteği gerekiyor mu?
- **Duraklama (pause) mekanizması:** Web prototipinde oyunu duraklatma özelliği yok (yalnızca sekme arka plana alındığında `requestAnimationFrame` doğal olarak durur). Mobilde uygulama arka plana alındığında/çağrı geldiğinde açık bir pause/resume ekranı gerekli mi?
- **Yatay mod desteği:** Tablet gibi büyük ekranlarda da yalnızca dikey mi kilitlenecek, yoksa responsive bir yatay layout mu düşünülecek?
- **Görsel varlıklar:** Şu an tüm görseller CSS/emoji ile üretiliyor (özel sprite/illüstrasyon yok). Native versiyon için özel illüstrasyon/ikon seti (logo, güç-up ikonları vb.) hazırlanacak mı?

---

*Bu doküman, NumDrop v1 (web prototip) kaynak kodunun tam analizine dayanmaktadır ve geliştirme ajanının kaynak koda erişimi olmadan bire bir aynı oyunu yeniden inşa edebilmesi amacıyla hazırlanmıştır.*
