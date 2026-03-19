# Melodify - Masaustu Uygulamasi Derleme Kilavuzu

Bu kilavuz, Melodify'i Windows, macOS veya Linux icin masaustu uygulamasi olarak nasil derleyeceginizi anlatir.

## Gereksinimler

- Node.js 18 veya daha yeni surum
- pnpm (veya npm/yarn)
- Windows icin: Windows 10/11
- macOS icin: macOS 10.15 veya daha yeni
- Linux icin: Ubuntu 18.04 veya daha yeni (veya esdeger)

## Kurulum

1. **Bagimliliklari yukleyin:**

```bash
pnpm install
```

2. **Ortam degiskenlerini ayarlayin:**

`.env.local` dosyasi olusturun ve Supabase bilgilerinizi ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
YOUTUBE_API_KEY=your-youtube-api-key
```

## Gelistirme Modunda Calistirma

Electron ile gelistirme modunda calistirmak icin:

```bash
pnpm electron:dev
```

Bu komut, Next.js sunucusunu baslatir ve ardindan Electron penceresini acar.

## Derleme (Build)

### Windows icin (.exe / Setup)

```bash
pnpm electron:build:win
```

Derleme tamamlandiginda, `dist-electron` klasorunde:
- `Melodify Setup x.x.x.exe` - Kurulum dosyasi
- `Melodify x.x.x.exe` - Portable surum

### macOS icin (.dmg)

```bash
pnpm electron:build:mac
```

Derleme tamamlandiginda, `dist-electron` klasorunde:
- `Melodify-x.x.x.dmg` - Disk imaji

### Linux icin (.AppImage / .deb)

```bash
pnpm electron:build:linux
```

Derleme tamamlandiginda, `dist-electron` klasorunde:
- `Melodify-x.x.x.AppImage` - AppImage dosyasi
- `melodify_x.x.x_amd64.deb` - Debian paketi

### Tum Platformlar

```bash
pnpm electron:build
```

## Ikon Dosyalari

Farkli platformlar icin ikon dosyalari gereklidir:

- **Windows**: `public/icon.ico` (256x256 ICO formatinda)
- **macOS**: `public/icon.icns` (ICNS formatinda)
- **Linux**: `public/icon.png` (512x512 PNG formatinda)

### Ikon Donusturme

PNG dosyasindan diger formatlara donusturmek icin:

**ICO (Windows):**
```bash
# imagemagick kullanarak
convert icon.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

**ICNS (macOS):**
```bash
# iconutil kullanarak (macOS)
mkdir icon.iconset
sips -z 16 16 icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset
```

## Sorun Giderme

### "Electron uygulamasi baslatilmiyor"

1. `node_modules` klasorunu silin ve `pnpm install` tekrar calistirin
2. Electron'un dogru yuklendiginden emin olun: `pnpm add electron -D`

### "Build hatasi"

1. Tum bagimliliklarin yuklendiginden emin olun
2. Node.js surumunuzun 18 veya uzerinde oldugunu kontrol edin
3. `dist-electron` ve `.next` klasorlerini silip tekrar deneyin

### "Ikon bulunamadi hatasi"

Ikon dosyalarinin dogru konumda ve formatta oldugundan emin olun:
- Windows: `public/icon.ico`
- macOS: `public/icon.icns`  
- Linux: `public/icon.png`

## Dagitim

### Windows

- **Microsoft Store**: MSIX paketi olusturmak icin ek yapilandirma gerekir
- **Dogrudan Dagitim**: Setup.exe dosyasini paylasabilirsiniz

### macOS

- **App Store**: Apple Developer hesabi ve imzalama gerektirir
- **Dogrudan Dagitim**: DMG dosyasini notarize etmeniz onerilir

### Linux

- **Snap Store**: snapcraft.yaml yapilandirmasi gerekir
- **Flathub**: flatpak yapilandirmasi gerekir
- **Dogrudan Dagitim**: AppImage veya deb dosyasini paylasabilirsiniz

## Lisans

Bu proje MIT lisansi altinda lisanslanmistir.
