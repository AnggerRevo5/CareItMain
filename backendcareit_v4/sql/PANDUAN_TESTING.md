# Panduan Testing Billing API

## 1. Pastikan Server Berjalan

Jalankan server Go terlebih dahulu:
```bash
go run main.go
```

Server akan berjalan di: `http://localhost:8081`

## 2. Testing di Postman

### Setup Request

1. **Method:** `POST`
2. **URL:** `http://localhost:8081/billing`
3. **Headers:**
   - Key: `Content-Type`
   - Value: `application/json`

### Body (Raw JSON)

Buka tab **Body** → pilih **raw** → pilih **JSON** dari dropdown, lalu paste JSON berikut:

```json
{
  "nama_dokter": "dr. Hajeng Wulandari, Sp.A, Mbiomed",
  "nama_pasien": "Budi Santoso",
  "jenis_kelamin": "Laki-laki",
  "usia": 45,
  "ruangan": "R001",
  "kelas": "1",
  "tindakan_rs": "T001",
  "icd9": "ICD9-001",
  "icd10": "ICD10-001",
  "cara_bayar": "BPJS",
  "total_tarif_rs": 500000
}
```

**Catatan:** 
- Pastikan `nama_dokter` sesuai dengan data yang ada di database
- Untuk melihat daftar dokter, gunakan: `GET http://localhost:8081/dokter`

## 3. Response yang Diharapkan

### Success (200 OK)
```json
{
  "status": "success",
  "message": "Billing berhasil dibuat",
  "data": {
    "billing": {
      "ID_Billing": 1,
      "ID_Pasien": 1,
      "Cara_Bayar": "BPJS",
      "Tanggal_masuk": "2024-01-15T10:30:00Z",
      "Tanggal_keluar": null,
      "ID_Dokter": 2,
      "Total_Tarif_RS": 500000,
      "Total_Tarif_BPJS": 0,
      "Billing_sign": "created"
    },
    "pasien": {
      "ID_Pasien": 1,
      "Nama_Pasien": "Budi Santoso",
      "Jenis_Kelamin": "Laki-laki",
      "Usia": 45,
      "Ruangan": "R001",
      "Kelas": "1"
    }
  }
}
```

### Error - Dokter Tidak Ditemukan (500)
```json
{
  "status": "error",
  "message": "Gagal membuat billing",
  "error": "dokter dengan nama Dr. Ahmad Wijaya tidak ditemukan"
}
```

### Error - Validasi Gagal (400)
```json
{
  "status": "error",
  "message": "Data tidak valid",
  "error": "Key: 'BillingRequest.Nama_Dokter' Error:Field validation for 'Nama_Dokter' failed on the 'required' tag"
}
```

## 4. Testing Skenario

### Skenario 1: Pasien Baru
- Kirim request dengan `nama_pasien` yang belum ada di database
- Sistem akan membuat pasien baru dengan ID auto-increment
- Billing akan dibuat dengan ID_Pasien dari pasien baru

### Skenario 2: Pasien Sudah Ada
- Kirim request dengan `nama_pasien` yang sudah ada di database
- Sistem akan menggunakan data pasien yang sudah ada
- Billing akan dibuat dengan ID_Pasien dari pasien yang sudah ada

### Skenario 3: Dokter Tidak Ditemukan
- Kirim request dengan `nama_dokter` yang tidak ada di database
- Sistem akan mengembalikan error

## 5. Endpoint Lain untuk Testing

### Get Daftar Dokter
```
GET http://localhost:8081/dokter
```

### Get Pasien by ID
```
GET http://localhost:8081/pasien/1
```

### Health Check
```
GET http://localhost:8081/
```

## 6. Checklist Sebelum Testing

- [ ] Server Go sudah berjalan di port 8081
- [ ] Database sudah terkoneksi
- [ ] Header `Content-Type: application/json` sudah diset
- [ ] Body menggunakan raw JSON (bukan form-data)
- [ ] Nama dokter sesuai dengan data di database
- [ ] Semua field required sudah terisi

## 7. Troubleshooting

### Error: "Content-Type harus application/json"
**Solusi:** Pastikan di tab Headers ada:
- Key: `Content-Type`
- Value: `application/json`

### Error: "dokter dengan nama ... tidak ditemukan"
**Solusi:** 
1. Cek daftar dokter dengan `GET /dokter`
2. Gunakan nama dokter yang sesuai dengan data di database

### Error: "Data tidak valid"
**Solusi:**
1. Pastikan semua field required terisi
2. Pastikan format JSON benar (kurung kurawal lengkap)
3. Pastikan field names menggunakan lowercase dengan underscore (snake_case)

