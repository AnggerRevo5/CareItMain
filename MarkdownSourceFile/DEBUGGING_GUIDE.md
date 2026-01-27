# Debugging Guide: Warning Billing Sign Not Updating

## Langkah-Langkah Debug:

### 1. Buka Console Browser (F12)
- Tekan `F12` → Tab **Console**
- Pastikan console kosong (tidak ada error merah)

### 2. Test Flow:
1. Buka halaman **Billing Pasien**
2. **Cari pasien** yang sudah punya billing history
3. **Buka Edit Modal** (klik tombol edit)
4. **Ubah tindakan** (tambah atau hapus)
5. **Klik Simpan Perubahan**
6. **Tunggu** dan lihat console logs

### 3. Baca Console Logs Dalam Order:

#### A. Pada saat klik Simpan:
Cari logs dengan pattern:
```
🚀 Mengirim request ke backend:
```
**Verify:**
- URL benar: `/billing/{id}`
- Method: PUT
- `total_tarif_rs_value` ada dan tidak undefined
- Value-nya angka (bukan 0 jika ada tindakan)

#### B. Setelah Simpan Berhasil:
Cari logs dengan pattern:
```
📢 Billing data updated event received:
```
**Ini menandakan:** Event berhasil di-dispatch dari modal

Kemudian cari:
```
🔄 Triggering loadBillingAktifHistory for:
```
**Ini menandakan:** Event listener di-trigger

#### C. API Response Check:
Cari logs dengan pattern:
```
📡 Full API Response:
```
**Ini menunjukkan:** Response dari GET /billing/aktif

**Buka detail:** Expand object dan cari:
- `data.billing.total_tarif_rs` - harus nilai baru (bukan 0)
- `data.billing.total_klaim` - total BPJS

#### D. Tarif Extraction:
Cari logs dengan pattern:
```
🔍 Tarif Extraction Debug:
```
**Verify:**
- `storedTotalTarif` - apakah value dari API terambil?
- `calculatedTotalTarif` - berapa nilai calculated-nya?
- `finalTotalTarif` - mana yang dipakai (stored atau calculated)?

#### E. State Update:
Cari logs dengan pattern:
```
💾 Setting TotalTarifRS:
💾 Setting BillingHistory with:
```
**Verify:**
- Value yang di-set berapa?
- Apakah nilai yang di-set berbeda dari nilai sebelumnya?

#### F. Live Values:
Cari logs dengan pattern:
```
📈 Live Values Changed:
```
**Verify:**
- `totalTarifRS` - apakah berubah dari sebelumnya?
- `totalKlaimBPJSLive` - berapa nilainya?
- `liveBillingSign` - berapa hasilnya (Hijau/Kuning/Merah)?

### 4. Jika Ada Error:
Cari logs merah (error) atau orange (warning). Catat isi-nya persis.

### 5. Screenshot/Copy Console Output:
Setelah test selesai:
1. Right-click di console → "Save as..." 
2. Atau screenshot dari Browser DevTools
3. Share dengan informasi:
   - Nama pasien yang di-test
   - Tindakan apa yang di-ubah
   - Console log output lengkap

## Possible Issues & Solutions:

### Issue 1: Event tidak ter-trigger
**Log yang terlihat:** Tidak ada `📢 Billing data updated event received:`
**Penyebab:** 
- Modal tidak dispatch event
- Event listener tidak register
**Fix:** Check di modal if `window.dispatchEvent` di-execute

### Issue 2: API Response tidak punya total_tarif_rs baru
**Log yang terlihat:** `📡 Full API Response` menunjukkan `total_tarif_rs` = 0 atau nilai lama
**Penyebab:** 
- Backend tidak menerima `total_tarif_rs` di request
- Backend tidak update ke database
**Fix:** Check apakah request PUT ke backend include `total_tarif_rs`

### Issue 3: State tidak update walaupun API response benar
**Log yang terlihat:** `finalTotalTarif` benar tapi `💾 Setting TotalTarifRS` tidak ada
**Penyebab:** 
- Exception di loadBillingAktifHistory
- setState tidak execute
**Fix:** Check console untuk error messages

### Issue 4: State update tapi UI tidak berubah
**Log yang terlihat:** `📈 Live Values Changed` menunjukkan nilai baru tapi card masih lama
**Penyebab:** 
- Component tidak re-render
- UI logic salah
**Fix:** Check React DevTools untuk component state

---

## Copy-Paste Template untuk Report:

```
## Test Result:
- Pasien: [nama pasien yang di-test]
- Tindakan yang di-ubah: [apa yang di-ubah]

### Console Logs:
[Paste semua console log output di sini]

### Observations:
1. Event triggered? [Ya/Tidak]
2. API response punya total_tarif_rs baru? [Ya/Tidak, value: ...]
3. State terupdate? [Ya/Tidak, value: ...]
4. UI berubah? [Ya/Tidak]

### Error Messages (jika ada):
[Paste error message di sini]
```
