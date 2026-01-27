package main

import (
	"fmt"
	"log"
	"os"

	"backendcareit/database"
	"backendcareit/handlers"

	"github.com/joho/godotenv"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	_ = godotenv.Load()

	db, err := database.KonekPG()
	if err != nil {
		log.Fatal("Gagal koneksi database:", err)
	}
	database.DB = db

	r := gin.Default()

	config := cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowCredentials: true,
	}
	r.Use(cors.New(config))

	handlers.RegisterRoutes(r)

	host := os.Getenv("HOST")
	if host == "" {
		host = "0.0.0.0"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	listenAddr := fmt.Sprintf("%s:%s", host, port)
	fmt.Printf("Server berjalan di http://%s\n", listenAddr)
	fmt.Println("Akses dari jaringan lain menggunakan IP lokal komputer + port", port)
	if err := r.Run(listenAddr); err != nil {
		log.Fatal("Gagal menjalankan server:", err)
	}
}
