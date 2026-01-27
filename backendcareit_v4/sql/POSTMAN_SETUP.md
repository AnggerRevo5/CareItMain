# Setup Postman untuk Testing Billing API

## Endpoint
**Method:** `POST`  
**URL:** `http://localhost:8080/billing`  
*(Sesuaikan dengan port server Anda)*

## Headers (PENTING!)
Pastikan header berikut sudah diset:
```
Content-Type: application/json
```

## Body (Raw JSON)
Pilih tab **Body** → pilih **raw** → pilih **JSON** dari dropdown

Kemudian paste JSON berikut:

```json
{
  "nama_dokter": "Dr. Ahmad Wijaya",
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

## Field yang Required (Wajib Diisi)
- `nama_dokter` (string)
- `nama_pasien` (string)
- `jenis_kelamin` (string) - "Laki-laki" atau "Perempuan"
- `usia` (integer)
- `ruangan` (string)
- `kelas` (string) - "1", "2", atau "3"
- `tindakan_rs` (string)
- `icd9` (string)
- `icd10` (string)
- `cara_bayar` (string) - "BPJS" atau "UMUM"
- `total_tarif_rs` (integer) - optional

## Response Success (200 OK)
```json
{
  "status": "success",
  "message": "Billing berhasil dibuat",
  "data": {
    "billing": {
      "ID_Billing": "BILL-...",
      "ID_Pasien": "PAS-...",
      "Cara_Bayar": "BPJS",
      "Tanggal_masuk": "2024-01-15T10:30:00Z",
      "Tanggal_keluar": null,
      "ID_Dokter": "DOK-001",
      "Total_Tarif_RS": 500000,
      "Total_Tarif_BPJS": 0,
      "Billing_sign": "created"
    },
    "pasien": {
      "ID_Pasien": "PAS-...",
      "Nama_Pasien": "Budi Santoso",
      "Jenis_Kelamin": "Laki-laki",
      "Usia": 45,
      "Ruangan": "R001",
      "Kelas": "1"
    }
  }
}
```

## Troubleshooting

### Error: "Content-Type harus application/json"
**Solusi:** Pastikan di tab Headers, ada header:
- Key: `Content-Type`
- Value: `application/json`

### Error: "Data tidak valid" dengan semua field required
**Kemungkinan penyebab:**
1. Body tidak dikirim sebagai JSON (mungkin masih form-data atau x-www-form-urlencoded)
2. Format JSON salah (kurung kurawal tidak lengkap, koma salah, dll)
3. Field names tidak sesuai (harus lowercase dengan underscore)

**Solusi:**
1. Pastikan di tab Body, pilih **raw** dan dropdown menunjukkan **JSON**
2. Copy-paste ulang JSON dari contoh di atas
3. Pastikan semua field required terisi

### Error: "dokter dengan nama ... tidak ditemukan"
**Solusi:** Pastikan nama dokter yang dikirim sudah ada di database. Cek dengan GET `/dokter` terlebih dahulu.

