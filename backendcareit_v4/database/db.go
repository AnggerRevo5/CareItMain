package database

import (
	"fmt"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func KonekDB() (*gorm.DB, error) {
	dsn := os.Getenv("DB_DSN")

	if dsn == "" {
		user := envOrDefault("DB_USER", "root")
		pass := envOrDefault("DB_PASSWORD", "")
		host := envOrDefault("DB_HOST", "localhost")
		port := envOrDefault("DB_PORT", "3306")
		name := envOrDefault("DB_NAME", "care_it_data")

		fmt.Println("DB_USER:", os.Getenv("DB_USER"))
		fmt.Println("DB_PASSWORD:", os.Getenv("DB_PASSWORD"))
		fmt.Println("DB_HOST:", os.Getenv("DB_HOST"))
		fmt.Println("DB_PORT:", os.Getenv("DB_PORT"))
		fmt.Println("DB_NAME:", os.Getenv("DB_NAME"))
		fmt.Println("HOST:", os.Getenv("HOST"))
		fmt.Println("PORT:", os.Getenv("PORT"))

		dsn = fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, pass, host, port, name)
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
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
