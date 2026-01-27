package database

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func KonekPG() (*gorm.DB, error) {
	dsn := os.Getenv("DB_DSN")

	if dsn == "" {
		user := envOrDefaultPG("DB_USER", "postgres")
		pass := envOrDefaultPG("DB_PASSWORD", "gakbikinkembung25")
		host := envOrDefaultPG("DB_HOST", "localhost")
		port := envOrDefaultPG("DB_PORT", "5432")
		name := envOrDefaultPG("DB_NAME", "careit_db")

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
	} else {
		fmt.Println("Koneksi ke database PostgreSQL berhasil!")
	}

	return db, nil
}

func envOrDefaultPG(key, fallback string) string {
	val := os.Getenv(key)
	if val == "" {
		return fallback
	}
	return val
}
