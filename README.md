# NumDrop

Alt sıradaki hedef rakamlarına dokunarak sütunları yukarı kaydırdığın, hızlı karar gerektiren mobil öncelikli mini oyun.

## Web'de çalıştırma

```bash
python -m http.server 4173
```

Ardından `http://127.0.0.1:4173` adresini aç.

## Kontroller

- Alt sıradaki hedef sayının tüm örneklerine dokun.
- Yanlış sayıya dokunmak oyunu bitirir.
- Her beş hedefte level atlarsın ve bir rozet kazanırsın.
- ❄️ dondurucu hücreler süreyi geçici olarak durdurur.
- Sağ üstteki ses düğmesiyle sesli geri bildirimi açıp kapatabilirsin.

## Test

```bash
pnpm test
```

## Android uygulaması

Proje Capacitor ile Android uygulamasına hazırdır. İlk kurulumda Node.js 22+ ve pnpm gerekir.

```bash
pnpm install
pnpm run android:sync
pnpm run android:open
```

`android:open`, Android Studio'yu açar. Android Studio içinden bir emülatör veya bağlı telefonda çalıştırabilir; imzalı APK/AAB paketini **Build** menüsünden alabilirsin.
