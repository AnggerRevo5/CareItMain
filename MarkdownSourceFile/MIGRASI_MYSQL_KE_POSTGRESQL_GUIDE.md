# 📋 PANDUAN MIGRASI MYSQL KE POSTGRESQL - STEP BY STEP

## 📌 RINGKASAN KONDISI SAAT INI
- **Backend Framework:** Golang (Gin + GORM)
- **Database Saat Ini:** MySQL (localhost:3306)
- **Database Baru:** PostgreSQL (sudah dibuat di pgAdmin4)
- **Driver Saat Ini:** `github.com/go-sql-driver/mysql` + `gorm.io/driver/mysql`

---

## ✅ TAHAP 1: PERSIAPAN & VERIFIKASI

### Step 1.1: Verifikasi Database PostgreSQL di pgAdmin4
**Lokasi file konfigurasi:**
- File: `backendcareit_v4\.env`
- File koneksi database: `backendcareit_v4\database\db.go`

**Yang perlu dicek:**
- ✓ PostgreSQL sudah berjalan dan bisa diakses dari pgAdmin4
- ✓ Database baru sudah dibuat (catat nama databasenya)
- ✓ User PostgreSQL sudah dibuat (catat username dan passwordnya)
- ✓ Port PostgreSQL (default: 5432)
- ✓ Host PostgreSQL (localhost atau IP address)

**Contoh informasi yang diperlukan:**
```
Hostname/Address: localhost
Port: 5432
Username: (nama user PostgreSQL)
Password: (password user PostgreSQL)
Database Name: (nama database PostgreSQL)
```

---

## ✅ TAHAP 2: MIGRASI DATA DARI MYSQL KE POSTGRESQL

### Step 2.1: Export Data dari MySQL
Gunakan tools berikut untuk export data:

**Option A: Menggunakan MySQL Workbench**
1. Buka MySQL Workbench
2. Koneksi ke MySQL server (localhost:3306)
3. Pilih database: `careit_db`
4. Klik menu **Server** → **Data Export**
5. Pilih tables yang ingin diekspor (semua tables di `careit_db`)
6. Pilih opsi **Dump Structure and Data**
7. Simpan file dengan nama: `careit_backup.sql`

**Option B: Menggunakan Command Line (PowerShell)**
```powershell
# Jalankan command ini di PowerShell
mysqldump -u root -p careit_db > "C:\Users\rengginang\Desktop\CAREIT_V4\careit_backup.sql"
# Akan diminta password MySQL (tekan Enter jika tidak ada password)
```

**Hasil yang diharapkan:**
- File SQL dengan semua struktur tabel dan data: `careit_backup.sql`

---

### Step 2.2: Konversi SQL MySQL ke PostgreSQL
Beberapa perbedaan syntax yang perlu dikonversi:

#### ⚠️ Perbedaan Utama MySQL vs PostgreSQL:

| Aspek | MySQL | PostgreSQL |
|-------|-------|-----------|
| **Type AUTO_INCREMENT** | `INT AUTO_INCREMENT` | `SERIAL` atau `INT GENERATED ALWAYS AS IDENTITY` |
| **Type DATETIME** | `DATETIME` | `TIMESTAMP` |
| **Type TINYINT** | `TINYINT(1)` | `BOOLEAN` atau `SMALLINT` |
| **Constraint Engine** | Bisa diabaikan | Harus ada (ENGINE=InnoDB menjadi tidak relevan) |
| **Charset** | `CHARACTER SET utf8mb4` | `ENCODING 'UTF8'` |
| **Function NOW()** | `NOW()` | `CURRENT_TIMESTAMP` |

#### Step 2.2a: Konversi File SQL Manual
1. Buka file `careit_backup.sql` dengan text editor (VS Code / Notepad++)
2. Lakukan replace berikut:

**Replace Pattern List:**
```
1. Ganti: `AUTO_INCREMENT` → `GENERATED ALWAYS AS IDENTITY`
   Contoh:
   DARI:   `ID_Tarif_RS` int NOT NULL AUTO_INCREMENT,
   KE:     `ID_Tarif_RS` SERIAL PRIMARY KEY,

2. Ganti: `CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci` → (hapus)
   Contoh:
   DARI:   CREATE TABLE `tarif_rs` (...) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
   KE:     CREATE TABLE `tarif_rs` (...);

3. Ganti: `ENGINE=InnoDB` → (hapus)

4. Ganti: `DATETIME` → `TIMESTAMP`
   Contoh:
   DARI:   `Tanggal_Dibuat` datetime DEFAULT CURRENT_TIMESTAMP,
   KE:     `Tanggal_Dibuat` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

5. Ganti: backtick (`) → double quote (")
   Contoh:
   DARI:   CREATE TABLE `users` (
   KE:     CREATE TABLE "users" (

6. Ganti function names:
   - `NOW()` tetap bisa dipakai
   - `CURDATE()` tetap bisa dipakai
```

#### Step 2.2b: Gunakan Online Tool (Opsional)
Alternatif menggunakan online converter:
- Kunjungi: https://www.pgloader.io/ 
- Atau gunakan tool: https://www.vertabelo.com/

---

### Step 2.3: Import Data ke PostgreSQL

**Option A: Menggunakan pgAdmin4**
1. Buka pgAdmin4 di browser (default: http://localhost:5050)
2. Login dengan credentials pgAdmin4
3. Di sebelah kiri, klik database yang sudah dibuat
4. Klik menu **Tools** → **Query Tool**
5. Copy isi file SQL yang sudah dikonversi
6. Paste ke Query Tool
7. Klik tombol **Execute** (atau tekan F5)
8. Tunggu sampai selesai (jika ada error, perbaiki)

**Option B: Menggunakan psql Command Line**
```powershell
# Jalankan di PowerShell
# Pastikan PostgreSQL sudah di PATH
psql -U <username> -d <database_name> -f "C:\Users\rengginang\Desktop\CAREIT_V4\careit_backup.sql"

# Contoh:
psql -U postgres -d careit_db -f "C:\Users\rengginang\Desktop\CAREIT_V4\careit_backup.sql"
```

**Hasil yang diharapkan:**
- ✓ Semua tabel sudah ter-import di PostgreSQL
- ✓ Data sudah ter-copy ke PostgreSQL
- ✓ Tidak ada error messages

---

## ✅ TAHAP 3: UPDATE BACKEND GOLANG

### Step 3.1: Update Go Modules (Dependencies)

**File yang perlu diubah:** `backendcareit_v4\go.mod`

**Perubahan:**
```
Dari:  github.com/go-sql-driver/mysql v1.9.3
Dari:  gorm.io/driver/mysql v1.6.0

Ke:    github.com/lib/pq v1.10.9          (PostgreSQL driver)
Ke:    gorm.io/driver/postgres v1.5.9      (GORM PostgreSQL driver)
```

**Di Command Line / PowerShell:**
```powershell
cd "c:\Users\rengginang\Desktop\CAREIT_V4\backendcareit_v4"

# Hapus dependency MySQL lama
go get -d -u

# Tambah PostgreSQL driver
go get github.com/lib/pq
go get gorm.io/driver/postgres

# Atau jalankan:
go get -u
go mod tidy
```

---

### Step 3.2: Update File Koneksi Database

**File yang perlu diubah:** `backendcareit_v4\database\db.go`

**Current Code (MySQL):**
```go
import (
	"fmt"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func KonekDB() (*gorm.DB, error) {
	dsn := os.Getenv("DB_DSN")

	if dsn == "" {
		user := envOrDefault("DB_USER", "root")
		pass := envOrDefault("DB_PASSWORD", "")
		host := envOrDefault("DB_HOST", "localhost")
		port := envOrDefault("DB_PORT", "3306")
		name := envOrDefault("DB_NAME", "care_it_data")

		dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, pass, host, port, name)
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("gagal membuka koneksi database: %w", err)
	}

	return db, nil
}
```

**New Code (PostgreSQL):**
```go
import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func KonekDB() (*gorm.DB, error) {
	dsn := os.Getenv("DB_DSN")

	if dsn == "" {
		user := envOrDefault("DB_USER", "postgres")
		pass := envOrDefault("DB_PASSWORD", "")
		host := envOrDefault("DB_HOST", "localhost")
		port := envOrDefault("DB_PORT", "5432")
		name := envOrDefault("DB_NAME", "careit_db")

		fmt.Println("DB_USER:", os.Getenv("DB_USER"))
		fmt.Println("DB_PASSWORD:", os.Getenv("DB_PASSWORD"))
		fmt.Println("DB_HOST:", os.Getenv("DB_HOST"))
		fmt.Println("DB_PORT:", os.Getenv("DB_PORT"))
		fmt.Println("DB_NAME:", os.Getenv("DB_NAME"))
		fmt.Println("HOST:", os.Getenv("HOST"))
		fmt.Println("PORT:", os.Getenv("PORT"))

		dsn = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port, user, pass, name)
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("gagal membuka koneksi database: %w", err)
	}

	return db, nil
}

func envOrDefault(key, fallback string) string {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	return val
}
```

**Penjelasan Perubahan:**
- Import berubah dari `gorm.io/driver/mysql` → `gorm.io/driver/postgres`
- DSN format berubah dari: `user:pass@tcp(host:port)/dbname?charset=...`
- DSN format baru: `host=... port=... user=... password=... dbname=... sslmode=disable`
- Port default berubah dari 3306 → 5432
- Default user berubah dari root → postgres

---

### Step 3.3: Update File Environment Variables

**File yang perlu diubah:** `backendcareit_v4\.env`

**Current (MySQL):**
```
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
DB_NAME=careit_db
```

**New (PostgreSQL):**
```
DB_USER=<username_postgresql>
DB_PASSWORD=<password_postgresql>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=<nama_database_postgresql>
```

**Contoh:**
```
DB_USER=postgres
DB_PASSWORD=password123
DB_HOST=localhost
DB_PORT=5432
DB_NAME=careit_db
```

---

## ✅ TAHAP 4: TESTING & VERIFIKASI

### Step 4.1: Test Koneksi Database
```powershell
cd "c:\Users\rengginang\Desktop\CAREIT_V4\backendcareit_v4"

# Jalankan backend
go run main.go
```

**Expected Output:**
```
DB_USER: postgres
DB_PASSWORD: ****
DB_HOST: localhost
DB_PORT: 5432
DB_NAME: careit_db
HOST: 0.0.0.0
PORT: 8081
Server berjalan di http://0.0.0.0:8081
Akses dari jaringan lain menggunakan IP lokal komputer + port 8081
```

✓ Jika tidak ada error, koneksi berhasil!

### Step 4.2: Test API Endpoints
Gunakan Postman atau curl untuk test:

```powershell
# Contoh test GET
curl http://localhost:8081/api/endpoint-yang-ada

# Test POST dengan data
curl -X POST http://localhost:8081/api/endpoint-yang-ada `
  -H "Content-Type: application/json" `
  -d '{"key":"value"}'
```

### Step 4.3: Verifikasi Data di PostgreSQL
Buka pgAdmin4 dan cek:
1. Database → careit_db → Schemas → Tables
2. Klik kanan table → View/Edit Data
3. Verifikasi bahwa data sudah ter-copy dengan benar

---

## ⚠️ TAHAP 5: HAL-HAL YANG PERLU DIPERHATIKAN

### 5.1: Case Sensitivity
- **MySQL:** Case-insensitive untuk nama table dan column
- **PostgreSQL:** Case-sensitive untuk nama table dan column
  
**Solusi:** Pastikan nama table dan column di models.go sesuai dengan database

### 5.2: Sequences (AUTO_INCREMENT equivalent)
PostgreSQL menggunakan SEQUENCES untuk AUTO_INCREMENT

**Jika ada issue dengan ID generation:**
```sql
-- Di PostgreSQL Query Tool, jalankan:
SELECT * FROM pg_sequences;
-- Jika sequence tidak ada, buat manual:
CREATE SEQUENCE table_name_id_seq;
```

### 5.3: Type Casting
Beberapa operasi math di Go mungkin perlu disesuaikan:
- MySQL: TINYINT(1) → Boolean
- PostgreSQL: BOOLEAN atau SMALLINT

### 5.4: Time Zone
PostgreSQL dan MySQL menangani timezone berbeda:
- Pastikan environment variable untuk timezone sudah benar
- Di DSN PostgreSQL: bisa tambah `TimeZone=Asia/Jakarta` jika perlu

---

## 📝 CHECKLIST PERSIAPAN MIGRASI

Sebelum melakukan perubahan, pastikan:

- [ ] PostgreSQL sudah terinstall dan berjalan
- [ ] Database baru sudah dibuat di PostgreSQL (catat nama, user, password, port)
- [ ] pgAdmin4 bisa mengakses PostgreSQL
- [ ] Data MySQL sudah di-backup (file .sql sudah tersimpan)
- [ ] SQL dari MySQL sudah dikonversi ke PostgreSQL format
- [ ] Data sudah ter-import ke PostgreSQL
- [ ] File `go.mod` sudah ter-update dengan PostgreSQL driver
- [ ] File `database/db.go` sudah siap untuk diubah
- [ ] File `.env` sudah siap dengan info PostgreSQL baru

---

## 📌 FILE-FILE YANG AKAN DIUBAH

1. **`backendcareit_v4\go.mod`** - Tambah/ganti dependencies
2. **`backendcareit_v4\database\db.go`** - Update koneksi database
3. **`backendcareit_v4\.env`** - Update kredensial database

**File-file yang TIDAK berubah:**
- Semua models (file di folder `models/`)
- Semua handlers (file di folder `handlers/`)
- Semua services (file di folder `services/`)
- Frontend code

---

## ⏭️ LANGKAH SELANJUTNYA

Setelah Anda:
1. ✓ Verifikasi Database PostgreSQL
2. ✓ Export data dari MySQL
3. ✓ Konversi SQL format
4. ✓ Import data ke PostgreSQL

**BARU SAAT ITU** kita akan:
1. Update `go.mod` dengan PostgreSQL driver
2. Update `database/db.go` dengan koneksi PostgreSQL
3. Update `.env` dengan kredensial PostgreSQL
4. Test seluruh aplikasi

---

## 📞 NOTES PENTING

- **Jangan ubah code dulu** sampai Anda confirm sudah siap
- **Backup data MySQL** sebelum proses migrasi
- **Test di environment lokal** dulu sebelum production
- **Dokumentasikan setiap step** untuk reference ke depan

---

**Created:** January 19, 2026
**Status:** SIAP UNTUK MIGRASI
**Last Updated:** Awaiting User Confirmation
