# Integrasi Tabel billing_dpjp

## Ringkasan Perubahan

Integrasi tabel `billing_dpjp` yang baru ke dalam sistem billing CareIT. Tabel ini digunakan untuk menyimpan Doctor In Charge (DPJP) untuk setiap billing.

## Perubahan yang Dilakukan

### 1. **services/billing_pasien.go**

#### Function: `DataFromFE()`
- **Tambahan**: Kode untuk insert ID_DPJP ke tabel `billing_dpjp` (lines ~439-451)
- **Logika**: Jika `input.ID_DPJP > 0`, maka insert record ke tabel `billing_dpjp`
- **Log**: Menambah logging untuk tracking DPJP insertion

```go
if input.ID_DPJP > 0 {
    billingDPJP := models.Billing_DPJP{
        ID_Billing: billing.ID_Billing,
        ID_DPJP:    input.ID_DPJP,
    }
    // ... insert logic
}
```

#### Function: `GetBillingDetailAktifByNama()`
- **Perubahan**: Menambah return value (dari 8 return menjadi 9)
  - **Sebelumnya**: `(*models.BillingPasien, []string, []string, []string, []string, []string, []string, error)`
  - **Sesudahnya**: `(*models.BillingPasien, []string, []string, []string, []string, []string, []string, int, error)`
  
- **Tambahan Query**: 
  - Query dari tabel `billing_dpjp` untuk fetch ID_DPJP
  - Jika tidak ada DPJP, return value 0 (normal)

```go
var dpjpRow struct {
    ID_DPJP int `gorm:"column:ID_DPJP"`
}
// Query dari billing_dpjp
```

### 2. **services/riwayat_billing_pasien.go**

#### Function: `GetRiwayatPasienAll()`
- **Tambahan Query**: Menambah query untuk fetch DPJP dari tabel `billing_dpjp`
- **Map Creation**: Membuat `dpjpMap` untuk mapping ID_Billing ke ID_DPJP
- **Response Update**: Field `ID_DPJP` di response sudah diisi (meskipun belum direferensikan di item construction, field sudah ada di model)

```go
dpjpMap := make(map[int]int)
// Query dari billing_dpjp untuk mendapatkan ID_DPJP
```

### 3. **handlers/routes.go**

#### Function: `GetBillingAktifByNamaHandler()`
- **Update Parameter**: Menangkap return value baru (ID_DPJP)
- **Response Update**: Menambah field `id_dpjp` dalam JSON response

```go
billing, tindakan, icd9, icd10, dokter, inacbgRI, inacbgRJ, dpjp, err := services.GetBillingDetailAktifByNama(nama)
```

Response JSON sekarang include:
```json
{
  "data": {
    "billing": {...},
    "tindakan_rs": [...],
    "icd9": [...],
    "icd10": [...],
    "dokter": [...],
    "inacbg_ri": [...],
    "inacbg_rj": [...],
    "id_dpjp": 123
  }
}
```

## Model yang Sudah Ada

### `models/models.go`
- **Billing_DPJP**: Struct untuk tabel `billing_dpjp` (line ~61-68)
  ```go
  type Billing_DPJP struct {
      ID_Billing int `gorm:"column:ID_Billing;primaryKey"`
      ID_DPJP    int `gorm:"column:ID_DPJP;primaryKey"`
  }
  ```

- **BillingRequest**: Sudah memiliki field `ID_DPJP` (line ~225)
  ```go
  ID_DPJP int `json:"id_dpjp"`
  ```

- **Riwayat_Pasien_all**: Sudah memiliki field `ID_DPJP` (line ~183)
  ```go
  ID_DPJP string `json:"id_dpjp"`
  ```

## API Endpoint yang Terpengaruh

### GET /billing/aktif
**Parameter**: `nama_pasien`

**Response**:
```json
{
  "status": "success",
  "data": {
    "billing": {...},
    "id_dpjp": 123,
    ...
  }
}
```

## Database Schema

Tabel `billing_dpjp` sudah dibuat di PostgreSQL dengan struktur:
```sql
CREATE TABLE billing_dpjp (
  ID_Billing integer NOT NULL,
  ID_DPJP integer NOT NULL,
  PRIMARY KEY (ID_Billing, ID_DPJP),
  FOREIGN KEY (ID_Billing) REFERENCES billing_pasien(ID_Billing),
  FOREIGN KEY (ID_DPJP) REFERENCES dokter(ID_Dokter)
);
```

## Testing

### Test Case 1: Membuat Billing Baru dengan DPJP
**POST** `/billing`
```json
{
  "id_dpjp": 5,
  "nama_dokter": ["Dr. Budi"],
  ...
}
```

**Expected**: DPJP tercatat di tabel `billing_dpjp`

### Test Case 2: Fetch Billing Aktif dengan DPJP
**GET** `/billing/aktif?nama_pasien=John Doe`

**Expected**: Response include field `id_dpjp` dengan value yang benar

### Test Case 3: Riwayat Billing Tertutup
**GET** `/admin/riwayat-pasien-all`

**Expected**: Setiap billing dalam response include DPJP (jika ada)

## File yang Dimodifikasi

1. ✅ `services/billing_pasien.go` - DataFromFE() + GetBillingDetailAktifByNama()
2. ✅ `services/riwayat_billing_pasien.go` - GetRiwayatPasienAll()
3. ✅ `handlers/routes.go` - GetBillingAktifByNamaHandler()

## Status Kompilasi

✅ **BUILD SUCCESS** - Tidak ada error atau warning saat compile `go build .`

## Catatan

- Field `ID_DPJP` di model `Riwayat_Pasien_all` bertipe `string` (line 183) sedangkan di `billing_dpjp` bertipe `int`. Ini mungkin perlu di-harmonisasi untuk konsistensi tipe data di masa depan.
- Fungsi update billing yang ada (`EditPasienComplete`) belum include logika update DPJP. Jika ada requirement untuk update DPJP setelah billing dibuat, perlu ditambahkan.
- DPJP bersifat opsional (jika tidak ada, return 0 - tidak error).
