# Numboo — App Store ve gelir kontrol listesi

## Mevcut durum

- iOS Capacitor projesi eklendi: `ios/App/App.xcworkspace`.
- Paket kimliği: `com.tahacimen.numboo`.
- Android'in Google Play'de incelemedeki sürümüne dokunulmadı.
- Gelir modeli hedefi: isteğe bağlı ödüllü reklamlar ve reklamları kaldıran tek seferlik Premium satın alma.

## Hesap ve finansal kurulum

Bu adımları Apple Developer hesabının sahibi tamamlar:

1. Apple Developer Program üyeliğini etkinleştir.
2. App Store Connect'te **Numboo** için yeni uygulama kaydı aç; bundle ID `com.tahacimen.numboo` olmalı.
3. **Agreements, Tax, and Banking** alanında ücretli uygulama sözleşmesini, vergi ve banka bilgilerini tamamla.
4. Uygulama içi satın alma ürünü oluştur:
   - Reference name: `Numboo Premium`
   - Product ID: `com.tahacimen.numboo.premium`
   - Type: Non-consumable
   - Amaç: reklamları kalıcı olarak kapatmak.
5. Google AdMob'da iOS uygulaması oluştur ve **Rewarded** reklam birimi aç. Üretim kimliklerini kaynak koda sabitleme; gizli yapılandırmayla gir.

## Ürün davranışı

- Reklam, zorunlu geçiş reklamı olarak değil yalnızca oyuncu isterse gösterilir.
- Önerilen ödül: bir ek can/Devam Et hakkı veya bir ek güçlendirici.
- Premium satın alan oyuncu reklam görmez; oyun özellikleri ve skor dengesi herkes için aynı kalır.
- Satın alma geri yükleme (Restore Purchases) ekranında bulunur.

## StoreKit ve reklam entegrasyonundan önce gerekenler

Bu bilgileri topladığında iOS gelir kodu eklenir:

- App Store Connect Premium ürününün onaylanmış product ID'si
- AdMob iOS app ID'si
- AdMob rewarded ad unit ID'si
- Gizlilik politikasının herkese açık URL'si

## App Store gönderim kontrol listesi

- Uygulama simgesi ve App Store ekran görüntüleri
- Gizlilik beslenme etiketi (reklam SDK'sının topladığı veriler dahil)
- Reklam içerdiği beyanı ve yaş derecelendirmesi
- Premium için uygulama içi satın alma ekran görüntüsü ve inceleme bilgisi
- Fiziksel iPhone'da satın alma ve reklam testleri
- Xcode'dan Archive → Distribute App → App Store Connect

Android'de benzer gelir modeli daha sonra ayrı bir sürüm olarak eklenir; mevcut Play Console başvurusu değişmez.
