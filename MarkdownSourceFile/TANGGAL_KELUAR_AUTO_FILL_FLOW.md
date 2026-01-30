# Tanggal Keluar Auto-Fill Flow Documentation

## Overview
Ketika admin/dokter memasukkan kode INACBG, `tanggal_keluar` **TIDAK** otomatis terisi dari field form, tetapi **OTOMATIS DIKIRIM** ke backend menggunakan nilai fallback.

---

## Alur Lengkap

### 1. **INACBG_Admin_Ruangan.tsx** - Ketika Submit (handleSave)
**Location:** [Line 705-715](../frontendcareitv2/src/app/component/INACBG_Admin_Ruangan.tsx#L705-L715)

```typescript
const payload: PostINACBGRequest = {
  id_billing: billingId,
  tipe_inacbg: tipeInacbg,
  kode_inacbg: selectedInacbgCodes,
  total_klaim: deltaKlaim,
  billing_sign: billingSignColor,
  tanggal_keluar: tanggalKeluar || new Date().toISOString().split("T")[0],
};
```

**Logika:**
- `tanggalKeluar` sudah di-load dari API saat page load (dari `billingId`)
- Jika `tanggalKeluar` kosong/undefined, gunakan **hari ini** (`new Date().toISOString().split("T")[0]`)
- Kirim ke `/admin/inacbg` endpoint dengan nilai tanggal (entah dari user edit atau default hari ini)

**Flow yang terjadi:**
1. User memilih kode INACBG → `setSelectedInacbgCodes([...codes])`
2. User klik tombol "Simpan" → `handleSave()` dipanggil
3. Di dalam `handleSave()`:
   - Cek `selectedInacbgCodes.length > 0` (minimal 1 kode harus dipilih)
   - Buat payload dengan `tanggal_keluar: tanggalKeluar || new Date().toISOString().split("T")[0]`
   - POST ke `/admin/inacbg`

---

### 2. **billing-pasien.tsx** - Ketika Create Billing (handleSubmit)
**Location:** [Line 650-655](../frontendcareitv2/src/app/component/billing-pasien.tsx#L650-L655)

```typescript
const billingData: BillingRequest = {
  nama_pasien: namaPasien,
  // ... other fields ...
  tanggal_masuk: convertDateFormat(tanggalMasuk),
  tanggal_keluar: convertDateFormat(tanggalKeluar) || '',
  // ... other fields ...
};
```

**Logika:**
- User opsional mengisi `tanggal_keluar` di billing form
- Jika kosong, kirim string kosong `''`
- Backend akan handle nullable field

**Flow yang terjadi:**
1. User fill form + select tindakan/ICD10
2. User klik "Buat Billing" → `handleSubmit()`
3. Format tanggal dengan `convertDateFormat()` (handle both YYYY-MM-DD dan DD/MM/YYYY)
4. POST ke `/billing` endpoint

---

### 3. **Data Loading - Tanggal Keluar di-Fetch dari API**
**INACBG_Admin_Ruangan.tsx** - [Line 106-245](../frontendcareitv2/src/app/component/INACBG_Admin_Ruangan.tsx#L106-L245)

Ada 3 priority untuk load tanggal_keluar:

```typescript
// PRIORITY 1: From props (jika parent pass data)
if (pasienData) {
  // Fetch dari API /admin/billing/{billingId}
  const response = await apiFetch<any>(`/admin/billing/${billingId}`);
  const tanggalKeluarData = response.data.tanggal_keluar || response.data.Tanggal_keluar || "";
  setTanggalKeluar(tanggalKeluarData);
}

// PRIORITY 2: From localStorage (jika data sudah disimpan sebelumnya)
const storedData = localStorage.getItem('currentBillingData');
if (storedData) {
  // Fetch dari API /admin/billing/{billingId}
  const response = await apiFetch<any>(`/admin/billing/${billingId}`);
  const tanggalKeluarData = response.data.tanggal_keluar || response.data.Tanggal_keluar || "";
  setTanggalKeluar(tanggalKeluarData);
}

// PRIORITY 3: From API direct fetch (jika billingId tersedia)
if (billingId) {
  const response = await apiFetch<any>(`/admin/billing/${billingId}`);
  const tanggalKeluarData = data.tanggal_keluar || data.Tanggal_keluar || "";
  setTanggalKeluar(tanggalKeluarData);
}
```

---

## Form Input untuk Tanggal Keluar

### INACBG_Admin_Ruangan.tsx
**Location:** [Line 1004-1012](../frontendcareitv2/src/app/component/INACBG_Admin_Ruangan.tsx#L1004-L1012)

```typescript
<div className="ml-0 sm:ml-4 mt-2">
  <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">
    Tanggal Keluar (Opsional)
  </label>
  <input
    type="date"
    value={tanggalKeluar}
    onChange={(e) => setTanggalKeluar(e.target.value)}
    className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-0"
  />
</div>
```

**Status:**
- ✅ Input field ada
- ✅ Auto-filled dari API saat page load
- ✅ User bisa edit nilai
- ✅ Kirim ke backend saat submit

---

## Riwayat Billing Aktif - Kolom Tanggal Ditampilkan

### billing-pasien.tsx
**Location:** [Line 1215-1238](../frontendcareitv2/src/app/component/billing-pasien.tsx#L1215-L1238) (Desktop Table)

```typescript
<table className="w-full text-sm md:text-base border-collapse">
  <thead>
    <tr className="bg-blue-100 border-b border-blue-200">
      <th>Tanggal Masuk</th>
      <th>Tanggal Keluar</th>
      <th>Tindakan RS</th>
      <th>ICD 9</th>
      <th>ICD 10</th>
      <th>INACBG</th>
    </tr>
  </thead>
  <tbody>
    {/* Loop untuk show dates dan data */}
    <td>
      {billingHistory.tanggal_masuk
        ? new Date(billingHistory.tanggal_masuk).toLocaleDateString('id-ID', {...})
        : '-'}
    </td>
    <td>
      {billingHistory.tanggal_keluar
        ? new Date(billingHistory.tanggal_keluar).toLocaleDateString('id-ID', {...})
        : '-'}
    </td>
  </tbody>
</table>
```

### INACBG_Admin_Ruangan.tsx
**Location:** [Line 1047-1070](../frontendcareitv2/src/app/component/INACBG_Admin_Ruangan.tsx#L1047-L1070) (Desktop Table)

```typescript
<table className="w-full text-sm md:text-base border-collapse">
  <thead>
    <tr className="bg-blue-100 border-b border-blue-200">
      <th>Tanggal Masuk</th>
      <th>Tanggal Keluar</th>
      <th>ICD 9</th>
      <th>ICD 10</th>
      <th>INACBG</th>
    </tr>
  </thead>
</table>
```

---

## Debugging Logs

Cek browser console (F12) untuk melihat flow:

**INACBG_Admin_Ruangan.tsx:**
```
📥 Tanggal keluar from API: [nilai tanggal atau empty]
📅 Extracted dates from billing history: { tanggalMasuk: ..., tanggalKeluar: ... }
📤 Sending INACBG payload: { tanggal_keluar: ..., ... }
```

**billing-pasien.tsx:**
```
💾 Extracted dates: { tanggalMasuk, tanggalKeluar, billingObj }
💾 Patient data saved to localStorage: { tanggal_masuk, tanggal_keluar }
```

---

## Summary

| Aspek | INACBG Form | Billing Pasien Form |
|-------|-------------|-------------------|
| **Input Field** | ✅ Ada (type=date) | ✅ Ada (type=date) |
| **Auto-fill saat load** | ✅ Dari API | ✅ Dari API |
| **User bisa edit** | ✅ Ya | ✅ Ya |
| **Submit behavior** | Gunakan nilai yang ada atau hari ini | Kirim nilai atau kosong |
| **Riwayat ditampilkan** | ✅ Ya, di table | ✅ Ya, di table |
| **Format tanggal** | ISO format dari backend | YYYY-MM-DD atau DD/MM/YYYY |
