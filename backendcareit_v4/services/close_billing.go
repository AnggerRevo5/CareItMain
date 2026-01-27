package services

import (
	"errors"
	"fmt"
	"time"

	"backendcareit/database"
	"backendcareit/models"
)

// CloseBilling - Nutup billing dengan set Tanggal_Keluar (selesai dah pasiennya)
func CloseBilling(closeReq models.Close_billing) error {
	// Cari billing berdasarkan ID_Billing
	var billing models.BillingPasien
	if err := database.DB.Where("\"ID_Billing\" = ?", closeReq.ID_Billing).First(&billing).Error; err != nil {
		return fmt.Errorf("billing dengan ID %d tidak ditemukan: %w", closeReq.ID_Billing, err)
	}

	// Parse Tanggal_Keluar dari string ke time.Time
	// Menggunakan multiple layouts seperti di billing_pasien.go
	var keluarTime *time.Time
	if closeReq.Tanggal_Keluar != "" {
		s := closeReq.Tanggal_Keluar
		var parsed time.Time
		var err error
		layouts := []string{time.RFC3339, "2006-01-02 15:04:05", "2006-01-02"}
		for _, layout := range layouts {
			parsed, err = time.Parse(layout, s)
			if err == nil {
				t := parsed
				keluarTime = &t
				break
			}
		}
		if keluarTime == nil {
			return fmt.Errorf("format tanggal_keluar tidak valid: %s", closeReq.Tanggal_Keluar)
		}
	} else {
		return errors.New("tanggal_keluar tidak boleh kosong")
	}

	// Update Tanggal_keluar pada billing
	billing.Tanggal_keluar = keluarTime

	// Simpan perubahan
	if err := database.DB.Save(&billing).Error; err != nil {
		return fmt.Errorf("gagal update billing: %w", err)
	}

	return nil
}
