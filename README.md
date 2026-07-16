# NumDrop

Mobil odaklı, bağımlılıksız sayı/refleks oyunu prototipi.

## Çalıştırma

Bir statik dosya sunucusu ile proje klasörünü açın; örneğin:

```bash
python -m http.server 4173
```

Sonra `http://127.0.0.1:4173` adresini ziyaret edin.

## Test

```bash
npm test
```

Oyun çekirdek kuralları `game-core.js` içinde, arayüz ise `app.js` ve `styles.css` içindedir.
