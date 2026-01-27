package services

import (
	"errors"
	"fmt"
	"log"
	"time"

	"backendcareit/database"
	"backendcareit/models"

	"gorm.io/gorm"
)

// EditPasienComplete - Update data identitas pasien dalam billing (nama, umur, ruangan, dll) terus dengan lookup kode
func EditPasienComplete(billingId int, namaPasien string, usia int, jeniKelamin string, ruangan string, kelas string, tindakan []string, icd9 []string, icd10 []string, billingSign *string, totalTarifRS *float64) error {
	log.Printf("[EditPasien] START - billingId:%d, nama:%s, tindakan_count:%d, icd9_count:%d, icd10_count:%d\n", billingId, namaPasien, len(tindakan), len(icd9), len(icd10))

	// Get billing
	var billing models.BillingPasien
	if err := database.DB.Where("\"ID_Billing\" = ?", billingId).First(&billing).Error; err != nil {
		log.Printf("[EditPasien] ERROR - billing not found: %v\n", err)
		return errors.New("billing tidak ditemukan")
	}
	log.Printf("[EditPasien] ✓ Billing found - ID_Pasien: %d\n", billing.ID_Pasien)

	// Start transaction
	tx := database.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Update pasien data
	if err := tx.Model(&models.Pasien{}).
		Where("\"ID_Pasien\" = ?", billing.ID_Pasien).
		Updates(map[string]interface{}{
			"Nama_Pasien":   namaPasien,
			"Usia":          usia,
			"Jenis_Kelamin": jeniKelamin,
			"Ruangan":       ruangan,
			"Kelas":         kelas,
		}).Error; err != nil {
		tx.Rollback()
		return errors.New("gagal update data pasien: " + err.Error())
	}

	// Delete existing tindakan
	if err := tx.Where("\"ID_Billing\" = ?", billingId).Delete(&models.Billing_Tindakan{}).Error; err != nil {
		tx.Rollback()
		return errors.New("gagal delete tindakan: " + err.Error())
	}

	// Insert new tindakan dengan lookup berdasarkan nama tindakan
	now := time.Now()
	for _, tindakanNama := range tindakan {
		if tindakanNama != "" {
			log.Printf("[EditPasien] Looking up tindakan: '%s'\n", tindakanNama)
			// Lookup tarif by deskripsi (nama tindakan) - use quoted column name for PostgreSQL
			var tarif models.TarifRS
			if err := tx.Where("\"Tindakan_RS\" = ?", tindakanNama).First(&tarif).Error; err != nil {
				log.Printf("[EditPasien] ERROR - tindakan lookup failed: %v\n", err)
				if errors.Is(err, gorm.ErrRecordNotFound) {
					tx.Rollback()
					log.Printf("[EditPasien] ERROR - tindakan '%s' not found in tarif_rs\n", tindakanNama)
					return fmt.Errorf("tindakan '%s' tidak ditemukan", tindakanNama)
				}
				tx.Rollback()
				return errors.New("gagal lookup tindakan: " + err.Error())
			}
			log.Printf("[EditPasien] ✓ Tindakan found - ID: %s, Harga: %d\n", tarif.KodeRS, tarif.Harga)

			newTindakan := models.Billing_Tindakan{
				ID_Billing:       billingId,
				ID_Tarif_RS:      tarif.KodeRS,
				Tanggal_Tindakan: &now,
			}
			if err := tx.Create(&newTindakan).Error; err != nil {
				tx.Rollback()
				return errors.New("gagal insert tindakan: " + err.Error())
			}
		}
	}

	// Delete existing ICD9
	if err := tx.Where("\"ID_Billing\" = ?", billingId).Delete(&models.Billing_ICD9{}).Error; err != nil {
		tx.Rollback()
		return errors.New("gagal delete ICD9: " + err.Error())
	}

	// Insert new ICD9 dengan lookup berdasarkan nama prosedur
	for _, icd9Nama := range icd9 {
		if icd9Nama != "" {
			// Lookup ICD9 by prosedur name
			var icd9Data models.ICD9
			if err := tx.Where("\"Prosedur\" = ?", icd9Nama).First(&icd9Data).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					tx.Rollback()
					return fmt.Errorf("ICD9 '%s' tidak ditemukan", icd9Nama)
				}
				tx.Rollback()
				return errors.New("gagal lookup ICD9: " + err.Error())
			}

			newICD9 := models.Billing_ICD9{
				ID_Billing: billingId,
				ID_ICD9:    icd9Data.Kode_ICD9,
			}
			if err := tx.Create(&newICD9).Error; err != nil {
				tx.Rollback()
				return errors.New("gagal insert ICD9: " + err.Error())
			}
		}
	}

	// Delete existing ICD10
	if err := tx.Where("\"ID_Billing\" = ?", billingId).Delete(&models.Billing_ICD10{}).Error; err != nil {
		tx.Rollback()
		return errors.New("gagal delete ICD10: " + err.Error())
	}

	// Insert new ICD10 dengan lookup berdasarkan nama diagnosa
	for _, icd10Nama := range icd10 {
		if icd10Nama != "" {
			// Lookup ICD10 by diagnosa name
			var icd10Data models.ICD10
			if err := tx.Where("\"Diagnosa\" = ?", icd10Nama).First(&icd10Data).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					tx.Rollback()
					return fmt.Errorf("ICD10 '%s' tidak ditemukan", icd10Nama)
				}
				tx.Rollback()
				return errors.New("gagal lookup ICD10: " + err.Error())
			}

			newICD10 := models.Billing_ICD10{
				ID_Billing: billingId,
				ID_ICD10:   icd10Data.Kode_ICD10,
			}
			if err := tx.Create(&newICD10).Error; err != nil {
				tx.Rollback()
				return errors.New("gagal insert ICD10: " + err.Error())
			}
		}
	}

	// Update billing_sign jika dikirimkan dari FE
	if billingSign != nil {
		if err := tx.Model(&models.BillingPasien{}).
			Where("\"ID_Billing\" = ?", billingId).
			Update("Billing_Sign", *billingSign).Error; err != nil {
			tx.Rollback()
			return errors.New("gagal update billing_sign: " + err.Error())
		}
	}
	// Update total_tarif_rs jika dikirimkan dari FE
	if totalTarifRS != nil {
		if err := tx.Model(&models.BillingPasien{}).
			Where("\"ID_Billing\" = ?", billingId).
			Update("Total_Tarif_RS", *totalTarifRS).Error; err != nil {
			tx.Rollback()
			return errors.New("gagal update total_tarif_rs: " + err.Error())
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return errors.New("gagal commit transaction: " + err.Error())
	}

	return nil
}
