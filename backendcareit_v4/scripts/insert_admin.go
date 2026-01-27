package scripts

import (
	"fmt"
	"log"

	"backendcareit/database"
)

func main() {
	// Nyambungin ke database
	db, err := database.KonekDB()
	if err != nil {
		log.Fatalf("Gagal koneksi database: %v", err)
	}

	// Set koneksi database
	database.DB = db

	// Cek admin udah ada atau belum
	var count int64
	db.Table("admin_ruangan").Where("Nama_Admin = ?", "admin").Count(&count)

	if count > 0 {
		fmt.Println("Admin dengan username 'admin' sudah ada di database.")
		fmt.Println("Ngapus admin yang lama...")
		db.Table("admin_ruangan").Where("Nama_Admin = ?", "admin").Delete(nil)
	}

	// Masukin admin yang baru
	result := db.Exec(`
		INSERT INTO admin_ruangan (Nama_Admin, Password, ID_Ruangan) 
		VALUES (?, ?, ?)
	`, "admin", "admin123", nil)

	if result.Error != nil {
		log.Fatalf("Gagal insert admin: %v", result.Error)
	}

	if result.RowsAffected > 0 {
		fmt.Println("✓ Data admin berhasil ditambahkan!")
		fmt.Println("  Username: admin")
		fmt.Println("  Password: admin123")
	} else {
		fmt.Println("Tidak ada data yang ditambahkan.")
	}
}
