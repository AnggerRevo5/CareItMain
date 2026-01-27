# Cara Menambahkan Data Dummy Admin

File ini berisi instruksi untuk menambahkan data dummy admin ke database.

## Data Admin
- **Username**: `admin`
- **Password**: `admin123`

## Cara 1: Menggunakan File SQL (Recommended)

1. Buka MySQL client atau phpMyAdmin
2. Pilih database `care_it_data`
3. Jalankan file SQL:
   ```sql
   -- Hapus data admin jika sudah ada
   DELETE FROM `admin_ruangan` WHERE `Nama_Admin` = 'admin';
   
   -- Insert data admin baru
   INSERT INTO `admin_ruangan` (`Nama_Admin`, `Password`, `ID_Ruangan`) 
   VALUES ('admin', 'admin123', NULL);
   ```

Atau jalankan file SQL langsung:
```bash
mysql -u root -p care_it_data < sql/insert_admin_dummy.sql
```

## Cara 2: Menggunakan Script Go

1. Pastikan Anda berada di direktori `Backend_CareIt`
2. Jalankan script:
   ```bash
   go run scripts/insert_admin.go
   ```

Script akan otomatis:
- Menghapus admin lama jika sudah ada
- Menambahkan admin baru dengan username `admin` dan password `admin123`

## Cara 3: Menggunakan MySQL Command Line

```bash
mysql -u root -p care_it_data
```

Kemudian jalankan:
```sql
DELETE FROM `admin_ruangan` WHERE `Nama_Admin` = 'admin';
INSERT INTO `admin_ruangan` (`Nama_Admin`, `Password`, `ID_Ruangan`) 
VALUES ('admin', 'admin123', NULL);
```

## Verifikasi

### Cara 1: Menggunakan Script Go (Recommended)
```bash
cd Backend_CareIt
go run scripts/check_admin.go
```

Script ini akan menampilkan:
- Semua data admin di database
- Test query untuk memastikan data bisa diakses
- Informasi detail tentang setiap admin

### Cara 2: Menggunakan MySQL Query
```sql
SELECT * FROM admin_ruangan WHERE Nama_Admin = 'admin';
```

Anda seharusnya melihat data admin dengan:
- `ID_Admin`: (auto increment)
- `Nama_Admin`: admin
- `Password`: admin123
- `ID_Ruangan`: NULL

## Login

Setelah data ditambahkan, Anda bisa login dengan:
- **User Type**: Admin (pilih radio button "Admin")
- **Username**: `admin`
- **Password**: `admin123`

## Troubleshooting

### Masalah: "Payload login tidak valid"
1. Pastikan semua field terisi (username dan password tidak kosong)
2. Pastikan backend sudah di-compile ulang setelah perubahan
3. Restart backend server

### Masalah: "Username atau password salah"
1. Verifikasi data admin ada di database:
   ```bash
   go run scripts/check_admin.go
   ```
2. Pastikan username dan password sesuai (case-sensitive untuk password)
3. Pastikan tidak ada whitespace di username/password
4. Cek log backend untuk error detail

### Masalah: Admin masuk ke dashboard dokter
1. Pastikan memilih radio button "Admin" sebelum login
2. Clear browser cache dan localStorage
3. Pastikan `userRole` di localStorage adalah "admin"

### Masalah: Data admin tidak ditemukan
1. Jalankan script insert admin lagi:
   ```bash
   go run scripts/insert_admin.go
   ```
2. Verifikasi dengan check script:
   ```bash
   go run scripts/check_admin.go
   ```
3. Pastikan koneksi database benar di `database/db.go`

