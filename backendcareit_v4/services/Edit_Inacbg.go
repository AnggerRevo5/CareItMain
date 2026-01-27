package services

import (
	"backendcareit/models"
	"fmt"
	"log"

	"gorm.io/gorm"
)

func Edit_INACBG_Admin(db *gorm.DB, input models.Edit_INACBG_Request) error {
	log.Printf("[Edit INACBG] Received ID_Billing=%d, Tipe=%s, Kode_count=%d, Delete_count=%d, Total_Klaim=%.2f, Billing_Sign=%s\n",
		input.ID_Billing, input.Tipe_inacbg, len(input.Kode_inacbg), len(input.Kode_Delete), input.Total_Klaim, input.Billing_Sign)

	tx := db.Begin()
	if tx.Error != nil {
		return tx.Error
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1. Hapus kode yang udah dipilih untuk dihapus
	if len(input.Kode_Delete) > 0 {
		switch input.Tipe_inacbg {
		case "RI":
			if err := tx.Where("\"ID_Billing\" = ? AND \"ID_INACBG_RI\" IN ?", input.ID_Billing, input.Kode_Delete).Delete(&models.Billing_INACBG_RI{}).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("gagal delete INACBG RI: %w", err)
			}
		case "RJ":
			if err := tx.Where("\"ID_Billing\" = ? AND \"ID_INACBG_RJ\" IN ?", input.ID_Billing, input.Kode_Delete).Delete(&models.Billing_INACBG_RJ{}).Error; err != nil {
				tx.Rollback()
				return fmt.Errorf("gagal delete INACBG RJ: %w", err)
			}
		default:
			tx.Rollback()
			return fmt.Errorf("invalid tipe_inacbg: %s", input.Tipe_inacbg)
		}
	}

	// 2. Tambahin kode INACBG yang baru
	if len(input.Kode_inacbg) > 0 {
		switch input.Tipe_inacbg {
		case "RI":
			for _, kode := range input.Kode_inacbg {
				inacbgRI := models.Billing_INACBG_RI{
					ID_Billing:  input.ID_Billing,
					Kode_INACBG: kode,
				}
				if err := tx.Create(&inacbgRI).Error; err != nil {
					tx.Rollback()
					return fmt.Errorf("gagal insert INACBG RI kode %s: %w", kode, err)
				}
			}
		case "RJ":
			for _, kode := range input.Kode_inacbg {
				inacbgRJ := models.Billing_INACBG_RJ{
					ID_Billing:  input.ID_Billing,
					Kode_INACBG: kode,
				}
				if err := tx.Create(&inacbgRJ).Error; err != nil {
					tx.Rollback()
					return fmt.Errorf("gagal insert INACBG RJ kode %s: %w", kode, err)
				}
			}
		}
	}

	// 3. Update data di tabel billing_pasien
	updateData := map[string]interface{}{
		"Total_Klaim":  input.Total_Klaim,
		"Billing_Sign": input.Billing_Sign,
	}

	if err := tx.Model(&models.BillingPasien{}).Where("\"ID_Billing\" = ?", input.ID_Billing).Updates(updateData).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("gagal update billing_pasien: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	// 4. Ngirim email kalo billing_sign gak kosong
	go func(id int) {
		if err := SendEmailBillingSignToDokter(id); err != nil {
			log.Printf("Warning: Gagal mengirim email ke dokter untuk billing ID %d: %v\n", id, err)
		}
	}(input.ID_Billing)

	return nil
}
