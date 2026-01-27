# PANDUAN ELECTRON - CareIt Desktop App

## Persiapan Backend API

1. **Konfigurasi URL Backend**
   
   Buat file `.env.local` di root folder project (jika belum ada):
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8081
   ```
   
   Ganti `http://localhost:8081` dengan URL backend Golang yang sudah di-deploy.
   Contoh:
   - Development: `http://localhost:8081`
   - Production: `https://api-careit.example.com`

## Cara Menjalankan

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode (untuk testing)
```bash
# Terminal 1: Jalankan Next.js dev server
npm run dev

# Terminal 2: Jalankan Electron
npm run electron:dev
```

### 3. Build dan Package untuk Windows EXE

#### Build Aplikasi
```bash
npm run electron:build
```

File `.exe` akan ada di folder `dist/` setelah build selesai.

#### Untuk 32-bit dan 64-bit
```bash
npm run electron:build:all
```

## Struktur File Electron

- `electron.js` - Main process Electron
- `preload.js` - Bridge script untuk security
- `out/` - Next.js static export output
- `dist/` - Folder hasil build Electron (berisi installer .exe)

## Troubleshooting

### Error: "Cannot find module electron"
```bash
npm install
```

### Error: Backend tidak terhubung
- Pastikan file `.env.local` sudah dibuat
- Cek URL backend di `.env.local` sudah benar
- Pastikan backend Golang sudah running

### Icon tidak muncul
- Pastikan ada file `icon.png` di folder `public/`
- Ukuran minimal 256x256 pixels
- Format: PNG dengan transparency

## Distribusi

Setelah build, file installer ada di:
- `dist/CareIt Setup 0.1.0.exe` - Installer untuk Windows

File ini bisa langsung dibagikan ke user lain tanpa perlu install Node.js/npm.

## Catatan Penting

- Aplikasi Electron akan langsung connect ke backend Golang (tidak pakai Next.js API routes)
- Pastikan backend sudah running dan URL di `.env.local` benar
- CORS harus dikonfigurasi di backend agar menerima request dari Electron
