# 🔍 ANALISIS ERROR: Column "tanggal_keluar" does not exist

## 📌 ERROR YANG TERJADI

```
ERROR: column "tanggal_keluar" does not exist (SQLSTATE 42703)
```

Muncul di halaman: **Riwayat Billing Pasien**

---

## 🎯 AKAR PENYEBAB MASALAH (ROOT CAUSE)

### ✅ Yang sudah diperiksa:

1. **File SQL PostgreSQL** - Tabel `billing_pasien` sudah benar:
   - Column ada dengan nama: `"Tanggal_Keluar"` (dengan capital K)
   - Struktur table di [postgreSQL_CareIt.sql](postgreSQL_CareIt.sql#L129-L140)

2. **Models Golang** - BillingPasien struct benar:
   - Field: `Tanggal_keluar *time.Time` dengan mapping column: `Tanggal_Keluar`
   - Lokasi: [models.go](backendcareit_v4/models/models.go#L189)

3. **Service File** - Query yang menggunakan column ini:
   - File: [riwayat_billing_pasien.go](backendcareit_v4/services/riwayat_billing_pasien.go#L13-L14)
   - File: [billing_aktif.go](backendcareit_v4/services/billing_aktif.go#L12-L13)

### ❌ MASALAH YANG DITEMUKAN:

**Ada perbedaan case sensitivity antara query dan column name di PostgreSQL!**

```
Query di Golang:    "Tanggal_Keluar IS NOT NULL"
Column di Database: "Tanggal_Keluar" (dengan double quotes)
```

Ini adalah **karakteristik PostgreSQL yang CASE SENSITIVE**:

```
✗ SALAH: Tanggal_Keluar          (tanpa quotes → dianggap lowercase)
✓ BENAR: "Tanggal_Keluar"        (dengan quotes → exactly matching)
```

---

## 📍 TEMPAT ERROR TERJADI

**File:** [backendcareit_v4/services/riwayat_billing_pasien.go](backendcareit_v4/services/riwayat_billing_pasien.go)

**Line 13-14:**
```go
// ❌ SALAH - Query tanpa quotes:
if err := db.Where("Tanggal_Keluar IS NOT NULL").Find(&billings).Error; err != nil {
    return nil, err
}
```

**Line 179:**
```go
// ❌ SALAH - Query tanpa quotes:
if err := db.Where("Tanggal_Keluar IS NOT NULL").Find(&billings).Error; err != nil {
    return nil, err
}
```

**File:** [backendcareit_v4/services/billing_aktif.go](backendcareit_v4/services/billing_aktif.go)

**Line 13:**
```go
// ❌ SALAH - Query tanpa quotes:
if err := db.Where("Tanggal_Keluar IS NULL").Find(&billings).Error; err != nil {
    return nil, err
}
```

---

## 🔧 SOLUSI

### Opsi A: Update Query dengan Double Quotes (RECOMMENDED)

Ganti semua query tanpa quotes menjadi:
```go
✓ db.Where(`"Tanggal_Keluar" IS NOT NULL`)
✓ db.Where(`"Tanggal_Keluar" IS NULL`)
```

### Opsi B: Update Column Names di PostgreSQL

Ubah PostgreSQL column dari quoted names menjadi lowercase:
```sql
ALTER TABLE billing_pasien RENAME COLUMN "Tanggal_Keluar" TO tanggal_keluar;
```

---

## 📋 SUMMARY

| Aspek | Status |
|-------|--------|
| Database PostgreSQL | ✅ Sudah ada column dengan benar |
| File SQL Import | ✅ Struktur sudah benar |
| Models Golang | ✅ Mapping sudah benar |
| Query di Services | ❌ MISSING QUOTES untuk PostgreSQL |

**Penyebab utama:** PostgreSQL require double quotes untuk identifier yang case-sensitive, sementara query saat ini tidak menggunakannya.

---

## 📌 NEXT STEP

Setelah Anda confirm, saya akan melakukan FIX dengan:

1. Update semua query di `billing_aktif.go` (1 tempat)
2. Update semua query di `riwayat_billing_pasien.go` (2 tempat)
3. Test ulang aplikasi

**File yang akan diubah:**
- `backendcareit_v4/services/billing_aktif.go`
- `backendcareit_v4/services/riwayat_billing_pasien.go`

---

**Status:** ⏳ Menunggu konfirmasi dari Anda sebelum melakukan perubahan
