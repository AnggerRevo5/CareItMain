package scripts

import (
	"fmt"
	"log"

	"backendcareit/database"
)

func CheckAdmin() {
	// Nyambungin ke database
	db, err := database.KonekDB()
	if err != nil {
		log.Fatalf("Gagal koneksi database: %v", err)
	}

	// Set koneksi database
	database.DB = db

	// Cek data admin
	type AdminRuangan struct {
		ID_Admin   int    `gorm:"column:ID_Admin"`
		Nama_Admin string `gorm:"column:Nama_Admin"`
		Password   string `gorm:"column:Password"`
		ID_Ruangan *int   `gorm:"column:ID_Ruangan"`
	}
	var admins []AdminRuangan

	// Ambil semua admin
	result := db.Table("admin_ruangan").Find(&admins)
	if result.Error != nil {
		log.Fatalf("Gagal query admin: %v", result.Error)
	}

	fmt.Printf("Total admin ditemukan: %d\n\n", len(admins))

	if len(admins) == 0 {
		fmt.Println("⚠️  Tidak ada data admin di database!")
		fmt.Println("\nJalankan script insert_admin.go untuk menambahkan data admin:")
		fmt.Println("  go run scripts/insert_admin.go")
		return
	}

	// Tampilin semua admin
	for i, admin := range admins {
		fmt.Printf("Admin #%d:\n", i+1)
		fmt.Printf("  ID_Admin: %d\n", admin.ID_Admin)
		fmt.Printf("  Nama_Admin: '%s'\n", admin.Nama_Admin)
		fmt.Printf("  Password: '%s' (length: %d)\n", admin.Password, len(admin.Password))
		if admin.ID_Ruangan != nil {
			fmt.Printf("  ID_Ruangan: %d\n", *admin.ID_Ruangan)
		} else {
			fmt.Printf("  ID_Ruangan: NULL\n")
		}
		fmt.Println()
	}

	// Test query buat username 'admin'
	var admin AdminRuangan
	err = db.Table("admin_ruangan").
		Where("Nama_Admin = ?", "admin").
		First(&admin).Error

	if err != nil {
		fmt.Println("❌ Query dengan Nama_Admin = 'admin' GAGAL")
		fmt.Printf("   Error: %v\n", err)
	} else {
		fmt.Println("✅ Query dengan Nama_Admin = 'admin' BERHASIL")
		fmt.Printf("   ID_Admin: %d\n", admin.ID_Admin)
		fmt.Printf("   Nama_Admin: '%s'\n", admin.Nama_Admin)
		fmt.Printf("   Password: '%s'\n", admin.Password)
	}

	// Test query case-insensitive
	err = db.Table("admin_ruangan").
		Where("LOWER(Nama_Admin) = LOWER(?)", "admin").
		First(&admin).Error

	if err != nil {
		fmt.Println("❌ Query case-insensitive GAGAL")
		fmt.Printf("   Error: %v\n", err)
	} else {
		fmt.Println("✅ Query case-insensitive BERHASIL")
		fmt.Printf("   ID_Admin: %d\n", admin.ID_Admin)
		fmt.Printf("   Nama_Admin: '%s'\n", admin.Nama_Admin)
	}
}
