# Trend Store E-Ticaret Sitesi

Bu proje, Trend Store erkek giyim mağazası için geliştirilmiş modern bir e-ticaret web sitesidir.

## Özellikler

- **Modern ve Responsive Tasarım**: Mobil ve masaüstü cihazlarda mükemmel görünüm
- **Marka Vitrin Alanı**: Premium markalar için özel showcase bölümü
- **İndirim Banner'ı**: Öne çıkan kampanyalar için görsel alan
- **Müşteri Hizmetleri**: WhatsApp destek, ücretsiz kargo, iade garantisi
- **Sosyal Medya Entegrasyonu**: Facebook, Instagram, Twitter bağlantıları
- **SEO Optimizasyonu**: Arama motorları için optimize edilmiş yapı

## Teknolojiler

- HTML5
- CSS3 (Flexbox, Grid, Animations)
- Vanilla JavaScript
- Font Awesome Icons
- Google Fonts (Inter)

## Kurulum

1. Projeyi bilgisayarınıza indirin
2. `index.html` dosyasını web tarayıcınızda açın
3. Canlı geliştirme için bir local server kullanabilirsiniz:
   ```bash
   python -m http.server 8000
   ```
   veya
   ```bash
   npx serve .
   ```

## Proje Yapısı

```
TrendStore2/
├── index.html          # Ana sayfa
├── css/
│   └── style.css       # Stil dosyası
├── js/
│   └── script.js       # JavaScript dosyası
├── images/
│   ├── logo.svg        # Logo dosyası
│   └── brands/         # Marka logoları
└── README.md           # Bu dosya
```

## Özelleştirme

### Renkler
CSS dosyasındaki `:root` bölümünden ana renkleri değiştirebilirsiniz:
```css
:root {
    --primary-color: #000;
    --secondary-color: #fff;
    --accent-color: #d4af37;
}
```

### Logo
`images/logo.svg` dosyasını kendi logonuzla değiştirin.

### Marka Logoları
`images/brands/` klasörüne marka logolarınızı ekleyin ve HTML'deki ilgili bölümleri güncelleyin.

## Responsive Tasarım

Site 3 ana breakpoint'te optimize edilmiştir:
- Desktop: 1024px+
- Tablet: 768px - 1024px
- Mobile: 768px altı

## İletişim

Herhangi bir soru veya öneriniz için iletişime geçebilirsiniz.

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## Sunucu tabanlı Yönetim (Node + SQLite)

Proje, sunucu tabanlı admin ve API desteği için bir Node/Express + SQLite backend içerir.

Kurulum (Windows / PowerShell):

1. Terminali proje kökünde aç:

    cd "C:\Users\bedir\Desktop\TrendStore2\server"
2. Bağımlılıkları yükle:

    npm install

3. Geliştirme modu ile çalıştır:

    npm run dev

4. Admin paneli tarayıcıda aç:

    http://localhost:3000/admin/

Notlar:
- Görseller `uploads/` klasörüne yüklenir ve `/uploads/` üzerinden servis edilir.
- Shopiere entegrasyonu için merchant anahtarlarını sağladığınızda checkout endpoint'ini gerçek ödeme yönlendirmesiyle bağlayacağım.