# CareIT Database Views Documentation

## 📋 Overview
Dokumentasi lengkap untuk semua views yang telah ditambahkan ke database CareIT untuk optimasi query dan mempercepat pengaksesan data.

---

## 📊 Daftar Views

### 1. **v_billing_pasien_info**
**Tujuan:** Menampilkan informasi billing pasien dengan data lengkap dan status real-time

**Kolom:**
- `ID_Billing` - ID Billing (PK)
- `ID_Pasien` - ID Pasien (FK)
- `Nama_Pasien` - Nama lengkap pasien
- `Jenis_Kelamin` - Jenis kelamin (Laki-laki/Perempuan)
- `Usia` - Usia pasien
- `Ruangan` - Nama ruangan
- `Kelas` - Kelas perawatan (1, 2, 3)
- `Cara_Bayar` - Metode pembayaran (BPJS/Umum)
- `Tanggal_Masuk` - Tanggal masuk rumah sakit
- `Tanggal_Keluar` - Tanggal keluar (NULL jika masih aktif)
- `Hari_Inap` - Jumlah hari perawatan (calculated)
- `Total_Tarif_RS` - Total tarif RS
- `Total_Klaim` - Total klaim BPJS
- `Billing_Sign` - Status billing (Hijau/Kuning/Merah)
- `Status_Pasien` - Status pasien (Aktif/Selesai)

**Use Case:**
- Dashboard billing pasien
- List view semua pasien
- Filter berdasarkan status atau cara bayar
- Monitoring status pasien aktif

**Query Example:**
```sql
SELECT * FROM v_billing_pasien_info 
WHERE Status_Pasien = 'Aktif' 
ORDER BY Tanggal_Masuk DESC;
```

---

### 2. **v_billing_detail**
**Tujuan:** Menampilkan detail billing dengan informasi dokter dan tindakan

**Kolom:**
- `ID_Billing` - ID Billing
- `ID_Pasien` - ID Pasien
- `Nama_Pasien` - Nama pasien
- `Cara_Bayar` - Metode pembayaran
- `Tanggal_Masuk` - Tanggal masuk
- `Tanggal_Keluar` - Tanggal keluar
- `Dokter` - Daftar dokter yang menangani
- `KSM` - Kelompok Staf Medis yang terlibat
- `Jumlah_Dokter` - Jumlah dokter yang terlibat
- `Jumlah_Tindakan` - Jumlah tindakan yang dilakukan
- `Total_Tarif_RS` - Total tarif RS
- `Total_Klaim` - Total klaim
- `Billing_Sign` - Status billing

**Use Case:**
- Reporting detail billing
- Tracking dokter per pasien
- Analisis jumlah tindakan per billing
- Verifikasi komposisi tim medis

**Query Example:**
```sql
SELECT * FROM v_billing_detail 
WHERE Cara_Bayar = 'BPJS' 
AND Jumlah_Dokter >= 2;
```

---

### 3. **v_billing_diagnosis_procedure**
**Tujuan:** Menampilkan diagnosa dan prosedur medis per billing

**Kolom:**
- `ID_Billing` - ID Billing
- `Nama_Pasien` - Nama pasien
- `Cara_Bayar` - Metode pembayaran
- `Kode_Diagnosa` - Daftar kode ICD10 diagnosa
- `Diagnosa` - Daftar diagnosa lengkap
- `Jumlah_Diagnosa` - Jumlah diagnosa
- `Kode_Prosedur` - Daftar kode ICD9 prosedur
- `Prosedur` - Daftar prosedur lengkap
- `Jumlah_Prosedur` - Jumlah prosedur
- `Tanggal_Masuk` - Tanggal masuk
- `Tanggal_Keluar` - Tanggal keluar

**Use Case:**
- Medical record extraction
- Clinical audit trail
- Diagnosis tracking
- Procedure validation
- Export untuk verifikasi medis

**Query Example:**
```sql
SELECT * FROM v_billing_diagnosis_procedure 
WHERE Diagnosa LIKE '%A00%';
```

---

### 4. **v_billing_inacbg_code**
**Tujuan:** Menampilkan INACBG code (RI dan RJ) untuk BPJS claim processing

**Kolom:**
- `ID_Billing` - ID Billing
- `Nama_Pasien` - Nama pasien
- `Cara_Bayar` - Metode pembayaran
- `Tipe_Perawatan` - Tipe perawatan (RI=Rawat Inap, RJ=Rawat Jalan)
- `Kode_INACBG_RI` - Daftar kode INACBG RI
- `Kode_INACBG_RJ` - Daftar kode INACBG RJ
- `Jumlah_INACBG_RI` - Jumlah kode RI
- `Jumlah_INACBG_RJ` - Jumlah kode RJ
- `Total_Klaim` - Total klaim
- `Billing_Sign` - Status billing

**Use Case:**
- BPJS claim submission
- INACBG code verification
- Claim tracking
- DRG mapping validation
- Financial reconciliation

**Query Example:**
```sql
SELECT * FROM v_billing_inacbg_code 
WHERE Cara_Bayar = 'BPJS' 
AND Billing_Sign IN ('Kuning', 'Merah');
```

---

### 5. **v_ruangan_pasien_aktif**
**Tujuan:** Dashboard ruangan dengan occupancy rate dan distribusi pasien per kelas

**Kolom:**
- `ID_Ruangan` - ID Ruangan (PK)
- `Nama_Ruangan` - Nama ruangan
- `Jenis_Ruangan` - Jenis ruangan
- `Kategori_ruangan` - Kategori ruangan
- `Jumlah_Pasien_Aktif` - Total pasien aktif di ruangan
- `Pasien_Kelas_1` - Jumlah pasien kelas 1
- `Pasien_Kelas_2` - Jumlah pasien kelas 2
- `Pasien_Kelas_3` - Jumlah pasien kelas 3
- `Nama_Pasien` - Daftar nama pasien aktif

**Use Case:**
- Real-time occupancy dashboard
- Room management
- Patient distribution analysis
- Capacity planning
- Class-based tracking

**Query Example:**
```sql
SELECT * FROM v_ruangan_pasien_aktif 
WHERE Jumlah_Pasien_Aktif > 0 
ORDER BY Jumlah_Pasien_Aktif DESC;
```

---

### 6. **v_dokter_billing_stat**
**Tujuan:** Statistik kinerja dokter dengan tracking billing dan klaim

**Kolom:**
- `ID_Dokter` - ID Dokter (PK)
- `Nama_Dokter` - Nama dokter
- `Status` - Status (DPJP/PPDS)
- `KSM` - Kelompok Staf Medis
- `Jumlah_Billing` - Jumlah billing yang ditangani
- `Jumlah_Pasien` - Jumlah pasien unik
- `Total_Klaim` - Total klaim dari semua billing
- `Tanggal_Pasien_Terakhir` - Tanggal pasien terakhir ditangani
- `Tipe_Pasien` - Tipe pasien yang ditangani (BPJS/Umum)

**Use Case:**
- Dokter performance dashboard
- Workload analysis
- Billing tracking per dokter
- KSM comparative analysis
- Productivity metrics

**Query Example:**
```sql
SELECT * FROM v_dokter_billing_stat 
WHERE Jumlah_Billing > 5 
ORDER BY Total_Klaim DESC;
```

---

### 7. **v_pasien_billing_history**
**Tujuan:** Riwayat lengkap pasien dengan semua billing dan klaim

**Kolom:**
- `ID_Pasien` - ID Pasien (PK)
- `Nama_Pasien` - Nama lengkap pasien
- `Jenis_Kelamin` - Jenis kelamin
- `Usia` - Usia pasien
- `Ruangan` - Ruangan tempat dirawat
- `Jumlah_Billing` - Total billing sepanjang waktu
- `Jumlah_Billing_Aktif` - Billing yang masih aktif
- `Jumlah_Billing_Selesai` - Billing yang sudah selesai
- `Total_Klaim_Keseluruhan` - Total klaim keseluruhan
- `Tanggal_Masuk_Terakhir` - Tanggal masuk terakhir
- `Tanggal_Keluar_Terakhir` - Tanggal keluar terakhir
- `Riwayat_Cara_Bayar` - Riwayat cara pembayaran

**Use Case:**
- Patient medical history
- Complete patient profile
- Historical billing analysis
- Treatment continuity tracking
- Patient lifetime value analysis

**Query Example:**
```sql
SELECT * FROM v_pasien_billing_history 
WHERE Jumlah_Billing > 1 
ORDER BY Total_Klaim_Keseluruhan DESC;
```

---

### 8. **v_billing_summary_harian**
**Tujuan:** Summary harian billing untuk operational dashboard

**Kolom:**
- `Tanggal` - Tanggal (DATE)
- `Jumlah_Billing_Masuk` - Jumlah billing masuk hari tersebut
- `Billing_Keluar_Hari_Sama` - Billing keluar di hari yang sama
- `Billing_Aktif` - Billing yang masih aktif (tidak keluar)
- `Status_Hijau` - Jumlah billing dengan status Hijau
- `Status_Kuning` - Jumlah billing dengan status Kuning
- `Status_Merah` - Jumlah billing dengan status Merah
- `Total_Tarif_RS_Harian` - Total tarif RS harian
- `Total_Klaim_Harian` - Total klaim harian
- `Tipe_Pasien_Masuk` - Tipe pasien yang masuk (BPJS/Umum)

**Use Case:**
- Daily operational report
- Real-time monitoring dashboard
- Hospital KPI tracking
- Revenue analysis
- Status distribution monitoring

**Query Example:**
```sql
SELECT * FROM v_billing_summary_harian 
WHERE Tanggal BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND CURDATE()
ORDER BY Tanggal DESC;
```

---

### 9. **v_billing_tarif_analysis**
**Tujuan:** Analisis detail tarif dan klaim untuk financial validation

**Kolom:**
- `ID_Billing` - ID Billing
- `Nama_Pasien` - Nama pasien
- `Cara_Bayar` - Metode pembayaran
- `Total_Tarif_RS` - Total tarif RS
- `Total_Klaim` - Total klaim
- `Selisih_Tarif_Klaim` - Selisih tarif dan klaim
- `Persentase_Klaim` - Persentase klaim terhadap tarif (%)
- `Billing_Sign` - Status billing
- `Jumlah_Tindakan` - Jumlah tindakan
- `Jumlah_Kode_INACBG` - Jumlah kode INACBG

**Use Case:**
- Financial audit
- Tarif vs claim analysis
- Billing accuracy validation
- Revenue reconciliation
- Claim percentage tracking

**Query Example:**
```sql
SELECT * FROM v_billing_tarif_analysis 
WHERE Persentase_Klaim < 50 
AND Billing_Sign = 'Merah';
```

---

### 10. **v_ksm_performance**
**Tujuan:** Performance metrics per KSM (Kelompok Staf Medis)

**Kolom:**
- `KSM` - Nama KSM (PK)
- `Jumlah_Dokter` - Jumlah dokter di KSM
- `Jumlah_Billing_Ditangani` - Total billing yang ditangani
- `Avg_Billing_Per_Dokter` - Rata-rata billing per dokter
- `Total_Klaim_KSM` - Total klaim keseluruhan KSM
- `Billing_Sign_Hijau` - Jumlah billing status Hijau
- `Billing_Sign_Kuning` - Jumlah billing status Kuning
- `Billing_Sign_Merah` - Jumlah billing status Merah

**Use Case:**
- Departmental performance analysis
- Comparative KSM metrics
- Resource allocation planning
- Quality metrics tracking
- Financial performance by department

**Query Example:**
```sql
SELECT * FROM v_ksm_performance 
ORDER BY Total_Klaim_KSM DESC;
```

---

## 🔍 Index Recommendation

Untuk optimasi lebih lanjut, recommend untuk membuat index pada kolom yang sering digunakan:

```sql
-- Index untuk v_billing_pasien_info
CREATE INDEX idx_billing_pasien_status ON billing_pasien(Tanggal_Keluar, Billing_Sign);
CREATE INDEX idx_billing_pasien_cara_bayar ON billing_pasien(Cara_Bayar);
CREATE INDEX idx_pasien_ruangan ON pasien(Ruangan);

-- Index untuk v_billing_detail
CREATE INDEX idx_billing_dokter_id ON billing_dokter(ID_Billing, ID_Dokter);
CREATE INDEX idx_dokter_ksm ON dokter(KSM);

-- Index untuk v_billing_diagnosis_procedure
CREATE INDEX idx_billing_icd10 ON billing_icd10(ID_Billing);
CREATE INDEX idx_billing_icd9 ON billing_icd9(ID_Billing);

-- Index untuk v_billing_inacbg_code
CREATE INDEX idx_billing_inacbg_ri ON billing_inacbg_ri(ID_Billing);
CREATE INDEX idx_billing_inacbg_rj ON billing_inacbg_rj(ID_Billing);

-- Index untuk tanggal
CREATE INDEX idx_billing_tanggal_masuk ON billing_pasien(Tanggal_Masuk);
CREATE INDEX idx_billing_tanggal_keluar ON billing_pasien(Tanggal_Keluar);
```

---

## 📝 Notes & Best Practices

### ✅ Kelebihan menggunakan Views:

1. **Performa Lebih Cepat** - Query sudah pre-compiled
2. **Konsistensi Data** - Logika aggregation terpusat
3. **Kemudahan Maintenance** - Perubahan logic hanya di satu tempat
4. **Security** - Bisa membatasi akses ke kolom tertentu
5. **Abstraksi** - Frontend tidak perlu tahu struktur table kompleks

### ⚠️ Perhatian:

1. Views adalah **read-only** (SELECT only) di versi MariaDB ini
2. Performa depends pada database size - gunakan index yang tepat
3. Aggregate functions (COUNT, SUM, etc) bisa lambat untuk dataset besar
4. Refresh view dengan menjalankan EXPLAIN untuk cek query plan

### 🚀 Tips Optimasi:

1. Gunakan WHERE clause untuk filter sebanyak mungkin
2. Limit hasil jika tidak perlu semua data
3. Cache hasil di aplikasi jika data tidak berubah sering
4. Monitor query performance dengan EXPLAIN
5. Update index statistics secara berkala

---

## 📊 Contoh Penggunaan di Backend

### Go Example (menggunakan GORM):

```go
// Model untuk View
type BillingPasienInfo struct {
    IDBilling       int     `gorm:"column:ID_Billing"`
    IDPasien        int     `gorm:"column:ID_Pasien"`
    NamaPasien      string  `gorm:"column:Nama_Pasien"`
    CaraBayar       string  `gorm:"column:Cara_Bayar"`
    HariInap        int     `gorm:"column:Hari_Inap"`
    StatusPasien    string  `gorm:"column:Status_Pasien"`
}

func (BillingPasienInfo) TableName() string {
    return "v_billing_pasien_info"
}

// Usage dalam handler
func GetBillingAktif(db *gorm.DB, c *gin.Context) {
    var billings []BillingPasienInfo
    db.Where("Status_Pasien = ?", "Aktif").
        Order("Tanggal_Masuk DESC").
        Find(&billings)
    
    c.JSON(200, billings)
}
```

---

## 🔄 Update & Maintenance

Views akan **secara otomatis** updated ketika data di table yang di-reference berubah. Tidak perlu maintenance manual.

---

**Dokumentasi dibuat: 23 Desember 2025**
**Database: CareIT v2**
**Version: 1.0**
