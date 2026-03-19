# 🎵 Melodify - PC Uygulaması Kurulum Rehberi

Bu rehber, Melodify'i tarayıcı olmadan çalışan bir Windows PC uygulamasına dönüştürmenizi sağlar.

---

## 📋 Gereksinimler

Başlamadan önce bilgisayarınıza şunları kurun:

1. **Node.js 18+** → https://nodejs.org (LTS sürümünü indirin)
2. **pnpm** → Kurulum için terminale şunu yazın:
   ```
   npm install -g pnpm
   ```

---

## 🔧 Adım Adım Kurulum

### Adım 1: Projeyi indirin ve açın

```bash
# ZIP dosyasını çıkartın, ardından klasöre girin:
cd melodify-desktop
```

### Adım 2: Bağımlılıkları yükleyin

```bash
pnpm install
```

### Adım 3: `.env.local` dosyası oluşturun

Proje klasörünün içinde `.env.local` adında bir dosya oluşturun ve aşağıdaki bilgileri ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxx...
YOUTUBE_API_KEY=AIzaxxxxxxxxxxxxxx
```

> **Bu bilgileri nereden alırsınız?**
> - Supabase URL ve Key: https://supabase.com → Projeniz → Settings → API
> - YouTube API Key: https://console.cloud.google.com → YouTube Data API v3

### Adım 4: Windows Setup (.exe) oluşturun

```bash
pnpm electron:build:win
```

Bu işlem birkaç dakika sürer. Tamamlandığında `dist-electron` klasöründe:
- `Melodify Setup 1.0.0.exe` → **Kurulum dosyası** (bunu çalıştırın!)
- `Melodify 1.0.0.exe` → Portable sürüm (kurulum gerektirmez)

---

## 🚀 Uygulamayı Kurmak

1. `dist-electron` klasörüne gidin
2. `Melodify Setup 1.0.0.exe` dosyasına çift tıklayın
3. Kurulum sihirbazını takip edin
4. Melodify masaüstünüze ve başlat menüsüne eklenir!

---

## 🛠️ Geliştirici Modu (Test için)

Kurulum dosyası oluşturmadan test etmek için:

```bash
pnpm electron:dev
```

Bu komut Next.js sunucusunu ve Electron penceresini aynı anda başlatır.

---

## ❓ Sık Karşılaşılan Sorunlar

### "pnpm komutu bulunamadı"
```bash
npm install -g pnpm
```

### Build sırasında ikon hatası
`public/icon.ico` dosyası yoksa oluşturun. ImageMagick ile:
```bash
magick public/icon.png -define icon:auto-resize=256,128,64,48,32,16 public/icon.ico
```
Ya da https://convertio.co adresinden PNG → ICO dönüştürün.

### "Electron uygulaması başlatılmıyor"
```bash
# node_modules temizleyip yeniden kurun
rmdir /s node_modules
pnpm install
```

### Beyaz ekran görünüyor
`next.config.mjs` dosyasında `output: 'export'` ve `assetPrefix: './'` olduğundan emin olun.

---

## 📁 Proje Yapısı

```
melodify-desktop/
├── electron/
│   ├── main.js        ← Electron ana process
│   └── preload.js     ← Güvenli API köprüsü
├── app/               ← Next.js sayfalar
├── components/        ← React bileşenler
├── public/
│   ├── icon.png       ← Uygulama ikonu (Linux)
│   ├── icon.ico       ← Uygulama ikonu (Windows) ← BU GEREKLI!
│   └── icon.icns      ← Uygulama ikonu (macOS)
├── next.config.mjs    ← Next.js yapılandırma
├── package.json       ← Proje yapılandırma
└── .env.local         ← API anahtarları (kendiniz oluşturun)
```

---

## 🎯 Özet Komutlar

| Amaç | Komut |
|------|-------|
| Bağımlılıkları kur | `pnpm install` |
| Test modu | `pnpm electron:dev` |
| Windows kurulum dosyası | `pnpm electron:build:win` |
| macOS disk imajı | `pnpm electron:build:mac` |
| Linux AppImage | `pnpm electron:build:linux` |
