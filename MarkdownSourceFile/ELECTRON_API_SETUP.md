# Konfigurasi API untuk Electron App

## Cara Kerja API di Electron

Di Electron app, API calls **langsung ke backend Go** (tidak melalui Next.js API routes), karena:
- Electron menggunakan static files (tidak ada Next.js server)
- API routes Next.js tidak bisa berjalan di static export
- Solusi: langsung call backend Go

## Konfigurasi API URL

Ada 3 cara untuk set API URL:

### 1. Menggunakan `electron.config.js` (Recommended)

Edit file `electron.config.js`:
```javascript
module.exports = {
  apiUrl: 'http://31.97.109.192:8081', // Ganti dengan URL backend Anda
};
```

### 2. Menggunakan Environment Variable

Set sebelum build atau run:
```powershell
# PowerShell
$env:NEXT_PUBLIC_API_URL = "http://31.97.109.192:8081"
npm run electron:dev

# Atau saat build
$env:NEXT_PUBLIC_API_URL = "http://31.97.109.192:8081"
.\build-electron.ps1
```

### 3. Default (localhost)

Jika tidak di-set, akan menggunakan: `http://localhost:8081`

## Testing API Connection

1. Pastikan backend Go berjalan
2. Test dengan Electron dev mode:
   ```bash
   npm run dev          # Terminal 1: Next.js dev server
   npm run electron:dev # Terminal 2: Electron app
   ```
3. Buka DevTools di Electron (F12) dan cek console untuk melihat API URL yang digunakan

## Build untuk Production

Saat build installer, API URL akan di-inject ke aplikasi:

```powershell
# Set API URL untuk production
$env:NEXT_PUBLIC_API_URL = "http://31.97.109.192:8081"
.\build-electron.ps1
```

Atau edit `electron.config.js` sebelum build.

## CORS Configuration

Pastikan backend Go mengizinkan request dari Electron app. Di backend Go, pastikan CORS config mengizinkan:
- Origin: `file://` (untuk Electron)
- Atau semua origin untuk development

## Troubleshooting

### API tidak connect
1. Cek console di Electron (F12) untuk melihat error
2. Pastikan backend Go berjalan dan bisa diakses
3. Cek API URL yang digunakan (akan di-log di console)
4. Pastikan CORS di backend sudah benar

### API URL tidak ter-update
1. Restart Electron app setelah mengubah config
2. Rebuild aplikasi jika sudah di-build

## Catatan Penting

- API URL di-inject saat runtime, bukan saat build
- Setiap user bisa mengubah `electron.config.js` untuk mengubah API URL
- Untuk production, pertimbangkan hardcode API URL atau gunakan config file yang bisa diubah user



