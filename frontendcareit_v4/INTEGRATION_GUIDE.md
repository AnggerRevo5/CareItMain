# Panduan Integrasi Frontend dengan Backend

Dokumen ini menjelaskan bagaimana frontend Next.js terintegrasi dengan backend Go.

## Konfigurasi

### Backend URL
Backend berjalan di `http://localhost:8081` secara default. Untuk mengubah URL backend:

1. Buat file `.env.local` di folder `Frontend_CareIt/` (jika belum ada)
2. Tambahkan:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8081
   ```
   Atau ganti dengan IP address backend Anda jika berbeda.

### CORS
Backend sudah dikonfigurasi dengan CORS default yang mengizinkan semua origin. Untuk production, sebaiknya dikonfigurasi lebih spesifik.

## API Functions

Semua fungsi API tersedia di `src/lib/api.ts`. Fungsi-fungsi utama:

### Authentication
- `loginDokter(credentials)` - Login dokter dengan email dan password

### Data Master
- `getDokter()` - Ambil daftar dokter
- `getRuangan()` - Ambil daftar ruangan
- `getICD9()` - Ambil daftar ICD9
- `getICD10()` - Ambil daftar ICD10
- `getTarifRumahSakit(params)` - Ambil tarif rumah sakit
- `getTarifBPJSRawatInap()` - Ambil tarif BPJS rawat inap
- `getTarifBPJSRawatJalan()` - Ambil tarif BPJS rawat jalan

### Pasien
- `getPasienById(id)` - Ambil data pasien by ID
- `searchPasien(nama)` - Cari pasien by nama

### Billing
- `createBilling(data)` - Buat billing baru
- `getBillingAktifByNama(namaPasien)` - Ambil billing aktif by nama pasien
- `getAllBilling()` - Ambil semua billing (untuk admin)

### Admin
- `postINACBGAdmin(data)` - Post INACBG dari admin

## Komponen yang Sudah Terintegrasi

### 1. Login (`login.tsx`)
- Menggunakan API `loginDokter` untuk autentikasi
- Menyimpan token dan data dokter di localStorage
- Menampilkan error jika login gagal

### 2. Billing Pasien (`billing-pasien.tsx`)
- Fetch data dropdown (dokter, ruangan, ICD9, ICD10, tarif RS) dari backend
- Search pasien menggunakan API
- Create billing dengan API `createBilling`
- Auto-calculate total tarif RS berdasarkan tindakan yang dipilih

### 3. Riwayat Billing Pasien (`riwayat-billing-pasien.tsx`)
- Fetch semua billing dari API `getAllBilling`
- Search/filter billing berdasarkan nama atau ID
- Menampilkan status billing dengan color coding

## Cara Menggunakan

### 1. Menjalankan Backend
```bash
cd Backend_CareIt
go run main.go
```
Backend akan berjalan di `http://localhost:8081`

### 2. Menjalankan Frontend
```bash
cd Frontend_CareIt
npm run dev
```
Frontend akan berjalan di `http://localhost:3000`

### 3. Testing
1. Buka browser ke `http://localhost:3000`
2. Login menggunakan email dan password dokter yang ada di database
3. Test fitur billing pasien
4. Test dashboard admin untuk melihat riwayat billing

## Troubleshooting

### Error: "Tidak dapat terhubung ke server"
- Pastikan backend server berjalan di port 8081
- Cek apakah URL di `.env.local` sudah benar
- Cek firewall atau network settings

### Error: "CORS error"
- Backend sudah dikonfigurasi dengan CORS default
- Jika masih error, pastikan backend menggunakan `cors.Default()` atau konfigurasi CORS yang sesuai

### Error: "Data tidak ditemukan"
- Pastikan database sudah terisi dengan data
- Cek endpoint API di backend apakah sudah benar

## Catatan Penting

1. **Token Management**: Token login disimpan di localStorage. Untuk production, pertimbangkan menggunakan httpOnly cookies atau session management yang lebih aman.

2. **Error Handling**: Semua API calls sudah memiliki error handling. Error akan ditampilkan di UI.

3. **Loading States**: Komponen yang fetch data akan menampilkan loading state saat mengambil data.

4. **Data Validation**: Form validation dilakukan di frontend sebelum submit ke backend.

## Endpoint Backend yang Tersedia

- `GET /` - Health check
- `GET /dokter` - List dokter
- `GET /ruangan` - List ruangan
- `GET /icd9` - List ICD9
- `GET /icd10` - List ICD10
- `GET /tarifRS` - List tarif rumah sakit
- `GET /tarifBPJSRawatInap` - List tarif BPJS rawat inap
- `GET /tarifBPJSRawatJalan` - List tarif BPJS rawat jalan
- `GET /pasien/:id` - Get pasien by ID
- `GET /pasien/search?nama=...` - Search pasien
- `POST /login` - Login dokter
- `POST /billing` - Create billing
- `GET /billing/aktif?nama_pasien=...` - Get billing aktif
- `GET /admin/billing` - Get all billing (admin)
- `POST /admin/inacbg` - Post INACBG (admin)

## Next Steps

1. Update komponen tarif-bpjs untuk menggunakan API real
2. Implementasi authentication middleware untuk protected routes
3. Add refresh token mechanism
4. Improve error handling dan user feedback
5. Add loading skeletons untuk better UX

