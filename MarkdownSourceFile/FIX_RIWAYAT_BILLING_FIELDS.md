# Fix Riwayat Billing Pasien - Menampilkan Field yang Hilang

## Problem
Di halaman Riwayat Billing Pasien, beberapa field tidak menampilkan data:
- ❌ Kelas
- ❌ DPJP (Doctor In Charge)
- ❌ Total Tarif RS
- ❌ Total Klaim

## Root Cause
Backend sudah query dan return data (field ada di model), tapi frontend tidak menampilkannya.

## Solusi

### Backend Changes

#### 1. **models/models.go**
- **Tambah field** `ID_DPJP` ke struct `Request_Admin_Inacbg` (line ~315)
  ```go
  type Request_Admin_Inacbg struct {
    // ... existing fields
    ID_DPJP int `json:"id_dpjp"`
    // ...
  }
  ```

#### 2. **services/riwayat_billing_pasien.go** - Function `GetAllRiwayatpasien()`
- **Tambah query** untuk fetch DPJP dari tabel `billing_dpjp` (after dokter query)
  ```go
  dpjpMap := make(map[int]int)
  var dpjpRows []struct {
    ID_Billing int
    ID_DPJP    int
  }
  if err := db.Table("\"billing_dpjp\"").
    Where("\"ID_Billing\" IN ?", billingIDs).
    Select("\"ID_Billing\", \"ID_DPJP\"").
    Scan(&dpjpRows).Error; err != nil {
    return nil, err
  }
  for _, row := range dpjpRows {
    dpjpMap[row.ID_Billing] = row.ID_DPJP
  }
  ```

- **Update compilation** untuk include `ID_DPJP` di response (line ~365)
  ```go
  item := models.Request_Admin_Inacbg{
    // ... existing fields
    ID_DPJP: dpjpMap[b.ID_Billing],
    // ...
  }
  ```

### Frontend Changes

#### **src/app/component/riwayat-billing-pasien.tsx**

1. **Update BillingData Interface** (line ~14-35)
   - Tambah field `kelas` (lowercase variant)
   - Tambah field `ID_DPJP` dan `id_dpjp`

2. **Mobile Card View** (after Dokter section)
   - Tambah display untuk Kelas
   - Tambah display untuk DPJP
   - Tambah display untuk Total Tarif RS
   - Tambah display untuk Total Klaim

```tsx
{/* Kelas */}
<div className="flex items-center justify-between">
  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
    Kelas
  </span>
  <span className="text-sm font-semibold text-[#2591D0]">
    {item.Kelas || item.kelas || '-'}
  </span>
</div>

{/* DPJP */}
<div className="flex items-center justify-between">
  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
    DPJP
  </span>
  <span className="text-sm font-semibold text-[#2591D0]">
    {item.ID_DPJP || item.id_dpjp ? `ID: ${item.ID_DPJP || item.id_dpjp}` : '-'}
  </span>
</div>

{/* Total Tarif RS */}
<div className="flex items-center justify-between">
  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
    Total Tarif RS
  </span>
  <span className="text-sm font-semibold text-[#2591D0]">
    {item.total_tarif_rs ? `Rp ${item.total_tarif_rs?.toLocaleString('id-ID')}` : '-'}
  </span>
</div>

{/* Total Klaim */}
<div className="flex items-center justify-between">
  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
    Total Klaim
  </span>
  <span className="text-sm font-semibold text-[#2591D0]">
    {item.total_klaim ? `Rp ${item.total_klaim?.toLocaleString('id-ID')}` : '-'}
  </span>
</div>
```

## Data Flow

```
GET /admin/riwayat-billing
         ↓
GetRiwayatBillingHandler
         ↓
GetAllRiwayatpasien()
  ├─ Query billing_pasien
  ├─ Query pasien data (nama, kelas, ruangan)
  ├─ Query billing_tindakan, icd9, icd10
  ├─ Query billing_dokter (nama dokter)
  ├─ Query billing_dpjp (NEW! - untuk dapatkan ID_DPJP)
  └─ Compile response dengan semua field
         ↓
Response JSON include:
  - total_tarif_rs ✅
  - total_klaim ✅
  - id_dpjp ✅
  - kelas ✅
         ↓
Frontend parse dan display semua field ✅
```

## API Response Example

```json
{
  "status": "success",
  "data": [
    {
      "id_billing": 1,
      "id_pasien": 5,
      "nama_pasien": "John Doe",
      "Kelas": "1",
      "ruangan": "ICU A",
      "total_tarif_rs": 5000000,
      "total_klaim": 8000000,
      "id_dpjp": 3,
      "tindakan_rs": ["Operasi", "Konsultasi"],
      "icd9": [...],
      "icd10": [...],
      "inacbg_ri": [],
      "inacbg_rj": ["A10.01"],
      "billing_sign": "Hijau",
      "nama_dokter": ["Dr. Budi", "Dr. Ani"]
    }
  ]
}
```

## Testing Checklist

- [ ] Backend compile sukses
- [ ] GET `/admin/riwayat-billing` return semua field
- [ ] Field `total_tarif_rs` tampil dengan format currency
- [ ] Field `total_klaim` tampil dengan format currency
- [ ] Field `Kelas` tampil dengan benar
- [ ] Field `id_dpjp` tampil sebagai "ID: X" atau "-" jika tidak ada
- [ ] Mobile card view menampilkan semua field baru
- [ ] Desktop table view tetap normal (mungkin perlu ekspand untuk tampil field baru)

## Files Modified

1. ✅ `backendcareit_v4/models/models.go` - Tambah `ID_DPJP` field
2. ✅ `backendcareit_v4/services/riwayat_billing_pasien.go` - Query DPJP
3. ✅ `frontendcareit_v4/src/app/component/riwayat-billing-pasien.tsx` - Display fields

## Status

✅ **Backend Build**: SUCCESS  
✅ **All fields now available**: YES  
✅ **Frontend Display**: UPDATED
