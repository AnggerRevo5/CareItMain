package services

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"backendcareit/database"
	"backendcareit/models"

	"gorm.io/gorm"
)

// Ambil ID_tarif_RS dari nama Tindakan_RS
func GetTarifRSByTindakan(tindakans []string) ([]models.TarifRS, error) {
	var tarifList []models.TarifRS

	if err := database.DB.
		Where("\"Tindakan_RS\" IN ?", tindakans).
		Find(&tarifList).Error; err != nil {
		return nil, err
	}

	return tarifList, nil
}

// GetPasienByID - Cari pasien berdasarkan ID nya
func GetPasienByID(id int) (*models.Pasien, error) {
	var pasien models.Pasien

	if err := database.DB.Where("\"ID_Pasien\" = ?", id).First(&pasien).Error; err != nil {
		return nil, err
	}

	return &pasien, nil
}

// GetPasienByNama - Cari pasien berdasarkan nama mereka
func GetPasienByNama(nama string) (*models.Pasien, error) {
	var pasien models.Pasien

	if err := database.DB.Where("\"Nama_Pasien\" = ?", nama).First(&pasien).Error; err != nil {
		return nil, err
	}

	return &pasien, nil
}

// SearchPasienByNama - Pencarian pasien pake nama (bisa partial)
func SearchPasienByNama(nama string) ([]models.Pasien, error) {
	var pasien []models.Pasien

	err := database.DB.
		Where("\"Nama_Pasien\" LIKE ?", "%"+nama+"%").
		Find(&pasien).Error

	if err != nil {
		return nil, err
	}

	return pasien, nil
}

// GetBillingDetailAktifByNama - Ambil data billing lengkap (billing, tindakan, ICD, dokter, INACBG, DPJP) buat satu pasien dari nama
// Return: billing, tindakan, icd9, icd10, dokter, inacbgRI, inacbgRJ, dpjp, error
func GetBillingDetailAktifByNama(namaPasien string) (*models.BillingPasien, []string, []string, []string, []string, []string, []string, int, error) {
	// Cari pasien dulu
	var pasien models.Pasien
	if err := database.DB.Where("\"Nama_Pasien\" = ?", namaPasien).First(&pasien).Error; err != nil {
		return nil, nil, nil, nil, nil, nil, nil, 0, err
	}

	// Cari billing aktif terakhir pasien ini (yang belum ditutup, Tanggal_Keluar IS NULL)
	var billing models.BillingPasien
	if err := database.DB.
		Where("\"ID_Pasien\" = ? AND \"Tanggal_Keluar\" IS NULL", pasien.ID_Pasien).
		Order("\"ID_Billing\" DESC").
		First(&billing).Error; err != nil {
		return nil, nil, nil, nil, nil, nil, nil, 0, err
	}

	// Ambil semua tindakan (join billing_tindakan -> tarif_rs)
	var tindakanJoin []struct {
		Nama string `gorm:"column:Tindakan_RS"`
	}
	if err := database.DB.
		Table("\"billing_tindakan\" bt").
		Select("tr.\"Tindakan_RS\"").
		Joins("JOIN \"tarif_rs\" tr ON bt.\"ID_Tarif_RS\" = tr.\"ID_Tarif_RS\"").
		Where("bt.\"ID_Billing\" = ?", billing.ID_Billing).
		Scan(&tindakanJoin).Error; err != nil {
		return nil, nil, nil, nil, nil, nil, nil, 0, err
	}
	tindakanNames := make([]string, 0, len(tindakanJoin))
	for _, t := range tindakanJoin {
		tindakanNames = append(tindakanNames, t.Nama)
	}

	// Ambil semua ICD9
	var icd9Join []struct {
		Prosedur string `gorm:"column:Prosedur"`
	}
	if err := database.DB.
		Table("\"billing_icd9\" bi").
		Select("i.\"Prosedur\"").
		Joins("JOIN \"icd9\" i ON bi.\"ID_ICD9\" = i.\"ID_ICD9\"").
		Where("bi.\"ID_Billing\" = ?", billing.ID_Billing).
		Scan(&icd9Join).Error; err != nil {
		return nil, nil, nil, nil, nil, nil, nil, 0, err
	}
	icd9Names := make([]string, 0, len(icd9Join))
	for _, i := range icd9Join {
		icd9Names = append(icd9Names, i.Prosedur)
	}

	// Ambil semua ICD10
	var icd10Join []struct {
		Diagnosa string `gorm:"column:Diagnosa"`
	}
	if err := database.DB.
		Table("\"billing_icd10\" bi").
		Select("i.\"Diagnosa\"").
		Joins("JOIN \"icd10\" i ON bi.\"ID_ICD10\" = i.\"ID_ICD10\"").
		Where("bi.\"ID_Billing\" = ?", billing.ID_Billing).
		Scan(&icd10Join).Error; err != nil {
		return nil, nil, nil, nil, nil, nil, nil, 0, err
	}
	icd10Names := make([]string, 0, len(icd10Join))
	for _, i := range icd10Join {
		icd10Names = append(icd10Names, i.Diagnosa)
	}

	// Ambil semua dokter dari billing_dokter dengan tanggal
	var dokterJoin []struct {
		Nama    string     `gorm:"column:Nama_Dokter"`
		Tanggal *time.Time `gorm:"column:Tanggal"`
	}
	if err := database.DB.
		Table("\"billing_dokter\"").
		Select("\"Nama_Dokter\", \"tanggal\"").
		Joins("JOIN \"dokter\" ON \"billing_dokter\".\"ID_Dokter\" = \"dokter\".\"ID_Dokter\"").
		Where("\"billing_dokter\".\"ID_Billing\" = ?", billing.ID_Billing).
		Order("tanggal ASC").
		Scan(&dokterJoin).Error; err != nil {
		return nil, nil, nil, nil, nil, nil, nil, 0, err
	}
	dokterNames := make([]string, 0, len(dokterJoin))
	for _, d := range dokterJoin {
		dokterNames = append(dokterNames, d.Nama)
	}

	// Ambil semua INACBG RI
	var inacbgRIJoin []struct {
		Kode string `gorm:"column:ID_INACBG_RI"`
	}
	if err := database.DB.
		Table("\"billing_inacbg_ri\"").
		Select("\"ID_INACBG_RI\"").
		Where("\"ID_Billing\" = ?", billing.ID_Billing).
		Scan(&inacbgRIJoin).Error; err != nil {
		return nil, nil, nil, nil, nil, nil, nil, 0, err
	}
	inacbgRINames := make([]string, 0, len(inacbgRIJoin))
	for _, row := range inacbgRIJoin {
		inacbgRINames = append(inacbgRINames, row.Kode)
	}

	// Ambil semua INACBG RJ
	var inacbgRJJoin []struct {
		Kode string `gorm:"column:ID_INACBG_RJ"`
	}
	if err := database.DB.
		Table("\"billing_inacbg_rj\"").
		Select("\"ID_INACBG_RJ\"").
		Where("\"ID_Billing\" = ?", billing.ID_Billing).
		Scan(&inacbgRJJoin).Error; err != nil {
		return nil, nil, nil, nil, nil, nil, nil, 0, err
	}
	inacbgRJNames := make([]string, 0, len(inacbgRJJoin))
	for _, row := range inacbgRJJoin {
		inacbgRJNames = append(inacbgRJNames, row.Kode)
	}

	// Ambil DPJP (Doctor In Charge) dari billing_dpjp
	var dpjpRow struct {
		ID_DPJP int `gorm:"column:ID_DPJP"`
	}
	var idDPJP int
	if err := database.DB.
		Table("\"billing_dpjp\"").
		Select("\"ID_DPJP\"").
		Where("\"ID_Billing\" = ?", billing.ID_Billing).
		First(&dpjpRow).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, nil, nil, nil, nil, nil, 0, err
		}
		// Jika tidak ada DPJP, idDPJP = 0 (normal, boleh tidak ada)
		idDPJP = 0
	} else {
		idDPJP = dpjpRow.ID_DPJP
	}

	return &billing, tindakanNames, icd9Names, icd10Names, dokterNames, inacbgRINames, inacbgRJNames, idDPJP, nil
}

// GetDokterByNama - Cari dokter berdasarkan nama mereka
func GetDokterByNama(nama string) (*models.Dokter, error) {
	var dokter models.Dokter

	if err := database.DB.Where("\"Nama_Dokter\" = ?", nama).First(&dokter).Error; err != nil {
		return nil, err
	}

	return &dokter, nil
}

func DataFromFE(input models.BillingRequest) (
	*models.BillingPasien,
	*models.Pasien,
	[]models.Billing_Tindakan,
	[]models.Billing_ICD9,
	[]models.Billing_ICD10,
	error,
) {

	tx := database.DB.Begin()
	if tx.Error != nil {
		return nil, nil, nil, nil, nil, tx.Error
	}

	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// ===========================
	// 1. CARI ATAU BUAT PASIEN
	// ===========================
	var pasien models.Pasien
	result := tx.Where("\"Nama_Pasien\" = ?", input.Nama_Pasien).First(&pasien)

	// Jika pasien sudah ada, update data jika ada perubahan (usia, ruangan, kelas, jenis_kelamin)
	if result.Error == nil {
		updated := false
		if pasien.Usia != input.Usia {
			pasien.Usia = input.Usia
			updated = true
		}
		if pasien.Ruangan != input.Ruangan {
			pasien.Ruangan = input.Ruangan
			updated = true
		}
		if pasien.Kelas != input.Kelas {
			pasien.Kelas = input.Kelas
			updated = true
		}
		if pasien.Jenis_Kelamin != input.Jenis_Kelamin {
			pasien.Jenis_Kelamin = input.Jenis_Kelamin
			updated = true
		}
		if updated {
			if err := tx.Save(&pasien).Error; err != nil {
				tx.Rollback()
				return nil, nil, nil, nil, nil,
					fmt.Errorf("gagal update data pasien: %s", err.Error())
			}
		}
	}

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {

			pasien = models.Pasien{
				Nama_Pasien:   input.Nama_Pasien,
				Jenis_Kelamin: input.Jenis_Kelamin,
				Usia:          input.Usia,
				Ruangan:       input.Ruangan,
				Kelas:         input.Kelas,
			}

			if err := tx.Create(&pasien).Error; err != nil {
				tx.Rollback()
				return nil, nil, nil, nil, nil,
					fmt.Errorf("gagal membuat pasien baru: %s", err.Error())
			}
		} else {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("gagal mencari pasien: %s", result.Error.Error())
		}
	}

	if pasien.ID_Pasien == 0 {
		tx.Rollback()
		return nil, nil, nil, nil, nil, fmt.Errorf("ID_Pasien tidak valid")
	}

	// ===========================
	// 2. CARI SEMUA DOKTER
	// ===========================
	var dokterList []models.Dokter
	for _, namaDokter := range input.Nama_Dokter {
		var dokter models.Dokter
		if err := tx.Where("\"Nama_Dokter\" = ?", namaDokter).First(&dokter).Error; err != nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("dokter '%s' tidak ditemukan", namaDokter)
		}
		dokterList = append(dokterList, dokter)
	}

	now := time.Now()

	// Parse Tanggal_Masuk - accept multiple formats
	var masukPtr *time.Time
	if input.Tanggal_Masuk != "" && input.Tanggal_Masuk != "null" {
		s := input.Tanggal_Masuk
		var parsed time.Time
		var err error
		layouts := []string{time.RFC3339, "2006-01-02 15:04:05", "2006-01-02"}
		for _, layout := range layouts {
			parsed, err = time.Parse(layout, s)
			if err == nil {
				t := parsed
				masukPtr = &t
				break
			}
		}
		if masukPtr == nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil, fmt.Errorf("invalid tanggal_masuk format: %s", input.Tanggal_Masuk)
		}
	} else {
		// Jika tidak ada input, default ke hari ini
		masukPtr = &now
	}

	// Parse Tanggal_Keluar (frontend sends string). Accept multiple formats.
	var keluarPtr *time.Time
	if input.Tanggal_Keluar != "" && input.Tanggal_Keluar != "null" {
		s := input.Tanggal_Keluar
		// Try several common layouts
		var parsed time.Time
		var err error
		layouts := []string{time.RFC3339, "2006-01-02 15:04:05", "2006-01-02"}
		for _, layout := range layouts {
			parsed, err = time.Parse(layout, s)
			if err == nil {
				t := parsed
				keluarPtr = &t
				break
			}
		}
		if keluarPtr == nil {
			// If parsing failed, return error
			tx.Rollback()
			return nil, nil, nil, nil, nil, fmt.Errorf("invalid tanggal_keluar format: %s", input.Tanggal_Keluar)
		}
	}

	// ===========================
	// 3. CARI / BUAT BILLING
	// ===========================
	// Catatan:
	// - Kita anggap "billing aktif" = billing yang belum ditutup (Tanggal_Keluar IS NULL) untuk pasien ini.
	// - Jika ada billing aktif, update; jika tidak, buat billing baru.
	var billing models.BillingPasien
	billingResult := tx.
		Where("\"ID_Pasien\" = ? AND \"Tanggal_Keluar\" IS NULL", pasien.ID_Pasien).
		Order("\"ID_Billing\" DESC").
		First(&billing)

	if billingResult.Error != nil {
		if errors.Is(billingResult.Error, gorm.ErrRecordNotFound) {
			// Belum ada billing aktif → buat billing baru
			billing = models.BillingPasien{
				ID_Pasien:      pasien.ID_Pasien,
				Cara_Bayar:     input.Cara_Bayar,
				Tanggal_masuk:  masukPtr,
				Tanggal_keluar: keluarPtr,
				Total_Tarif_RS: input.Total_Tarif_RS,
				Total_Klaim:    input.Total_Klaim_BPJS, // ← Changed: Use input value instead of hardcoded 0
			}

			// jika frontend mengirim billing_sign, gunakan itu, kalau tidak gunakan default ""
			if input.Billing_sign != "" {
				billing.Billing_sign = input.Billing_sign
			} else {
				billing.Billing_sign = ""
			}

			if err := tx.Create(&billing).Error; err != nil {
				tx.Rollback()
				return nil, nil, nil, nil, nil,
					fmt.Errorf("gagal membuat billing: %s", err.Error())
			}
		} else {
			// Error lain saat cari billing
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("gagal mencari billing pasien: %s", billingResult.Error.Error())
		}
	} else {
		// Sudah ada billing aktif → update data billing lama, tambahkan tindakan / ICD baru
		billing.Cara_Bayar = input.Cara_Bayar
		if keluarPtr != nil {
			billing.Tanggal_keluar = keluarPtr
		}
		// Tambahkan total tarif dari request baru
		billing.Total_Tarif_RS += input.Total_Tarif_RS
		// Update Total_Tarif_BPJS if:
		// 1. Not yet set (== 0), OR
		// 2. Input value is higher (more accurate baseline from FE)
		// This ensures we always have the correct baseline, not accumulated value from INACBG
		if input.Total_Klaim_BPJS > 0 && (billing.Total_Klaim == 0 || input.Total_Klaim_BPJS > billing.Total_Klaim) {
			billing.Total_Klaim = input.Total_Klaim_BPJS
			log.Printf("[Billing] Updated Total_Tarif_BPJS to %.2f\n", input.Total_Klaim_BPJS)
		}

		// Log input billing_sign untuk debug
		log.Printf("[Billing Update] Received input.Billing_sign: '%s' (empty=%v)\n", input.Billing_sign, input.Billing_sign == "")

		// Jika frontend mengirim Billing_sign, gunakan; jika tidak, hitung di backend
		if input.Billing_sign != "" {
			billing.Billing_sign = input.Billing_sign
			log.Printf("[Billing Update] Updated Billing_sign to: %s\n", input.Billing_sign)
		}

		if err := tx.Save(&billing).Error; err != nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("gagal update billing pasien: %s", err.Error())
		}

		// Jika frontend mengirim Billing_sign pada update, kirim notifikasi email ke dokter secara async

	}

	// ===========================
	// 4. SIMPAN DOKTER KE BILLING_DOKTER DENGAN TANGGAL
	// ===========================
	// Tidak menghapus dokter lama, hanya menambahkan dokter baru dengan tanggal hari ini
	// Ini memungkinkan tracking dokter yang berbeda setiap hari
	tanggalHariIni := time.Now()

	// Insert semua dokter baru ke billing_dokter dengan tanggal hari ini
	// Cek dulu apakah dokter dengan tanggal yang sama sudah ada (untuk menghindari duplikasi)
	var billingDokterList []models.Billing_Dokter
	for _, dokter := range dokterList {
		// Cek apakah dokter ini sudah ada di billing dengan tanggal yang sama
		var existing models.Billing_Dokter
		result := tx.Where("\"ID_Billing\" = ? AND \"ID_Dokter\" = ? AND DATE(tanggal) = DATE(?)",
			billing.ID_Billing, dokter.ID_Dokter, tanggalHariIni).First(&existing)

		// Jika belum ada, tambahkan
		if result.Error != nil && errors.Is(result.Error, gorm.ErrRecordNotFound) {
			billingDokter := models.Billing_Dokter{
				ID_Billing: billing.ID_Billing,
				ID_Dokter:  dokter.ID_Dokter,
				Tanggal:    &tanggalHariIni,
			}
			billingDokterList = append(billingDokterList, billingDokter)
		}
		// Jika sudah ada, skip (tidak perlu insert lagi)
	}

	if len(billingDokterList) > 0 {
		if err := tx.Create(&billingDokterList).Error; err != nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("gagal insert billing dokter: %s", err.Error())
		}
	}

	// ===========================
	// 4.5 SIMPAN DPJP KE BILLING_DPJP
	// ===========================
	// Insert DPJP (Doctor In Charge) ke tabel billing_dpjp jika ID_DPJP disediakan
	if input.ID_DPJP > 0 {
		billingDPJP := models.Billing_DPJP{
			ID_Billing: billing.ID_Billing,
			ID_DPJP:    input.ID_DPJP,
		}

		if err := tx.Create(&billingDPJP).Error; err != nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("gagal insert billing DPJP: %s", err.Error())
		}

		log.Printf("[Billing DPJP] Inserted billing %d with DPJP %d\n", billing.ID_Billing, input.ID_DPJP)
	}

	var billingTindakanList []models.Billing_Tindakan
	var billingICD9List []models.Billing_ICD9
	var billingICD10List []models.Billing_ICD10

	for _, tindakan := range input.Tindakan_RS {
		var tarif models.TarifRS

		if err := tx.Where("\"Tindakan_RS\" = ?", tindakan).First(&tarif).Error; err != nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("tindakan '%s' tidak ditemukan", tindakan)
		}

		billTindakan := models.Billing_Tindakan{
			ID_Billing:       billing.ID_Billing,
			ID_Tarif_RS:      tarif.KodeRS,
			Tanggal_Tindakan: &tanggalHariIni,
		}

		if err := tx.Create(&billTindakan).Error; err != nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("gagal insert billing tindakan: %s", err.Error())
		}

		billingTindakanList = append(billingTindakanList, billTindakan)
	}

	for _, icd := range input.ICD9 {
		var icd9 models.ICD9

		if err := tx.Where("\"Prosedur\" = ?", icd).First(&icd9).Error; err != nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("ICD9 '%s' tidak ditemukan", icd)
		}

		billICD9 := models.Billing_ICD9{
			ID_Billing: billing.ID_Billing,
			ID_ICD9:    icd9.Kode_ICD9,
		}

		if err := tx.Create(&billICD9).Error; err != nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("gagal insert billing ICD9: %s", err.Error())
		}

		billingICD9List = append(billingICD9List, billICD9)
	}

	for _, icd := range input.ICD10 {
		var icd10 models.ICD10

		if err := tx.Where("\"Diagnosa\" = ?", icd).First(&icd10).Error; err != nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("ICD10 '%s' tidak ditemukan", icd)
		}

		billICD10 := models.Billing_ICD10{
			ID_Billing: billing.ID_Billing,
			ID_ICD10:   icd10.Kode_ICD10,
		}

		if err := tx.Create(&billICD10).Error; err != nil {
			tx.Rollback()
			return nil, nil, nil, nil, nil,
				fmt.Errorf("gagal insert billing ICD10: %s", err.Error())
		}

		billingICD10List = append(billingICD10List, billICD10)
	}

	if err := tx.Commit().Error; err != nil {
		return nil, nil, nil, nil, nil, err
	}
	if input.Billing_sign != "" && strings.TrimSpace(input.Billing_sign) != "" {
		go func(id int) {
			if err := SendEmailBillingSignToDokter(id); err != nil {
				fmt.Printf("Warning: Gagal mengirim email ke dokter untuk billing ID %d: %v\n", id, err)
			}
		}(billing.ID_Billing)
	}

	return &billing, &pasien, billingTindakanList, billingICD9List, billingICD10List, nil
}

// GetLastBillingByNama - Ambil billing terakhir pasien (buat dapetin baseline total_klaim pas billing baru dibuat)
func GetLastBillingByNama(namaPasien string) (*models.BillingPasien, error) {
	// Cari pasien dulu
	var pasien models.Pasien
	if err := database.DB.Where("\"Nama_Pasien\" = ?", namaPasien).First(&pasien).Error; err != nil {
		return nil, err
	}

	// Cari billing terakhir pasien ini (paling baru berdasarkan ID_Billing)
	var billing models.BillingPasien
	if err := database.DB.
		Where("\"ID_Pasien\" = ?", pasien.ID_Pasien).
		Order("\"ID_Billing\" DESC").
		First(&billing).Error; err != nil {
		return nil, err
	}

	return &billing, nil
}

// UpdateBillingIdentitas - update data identitas pasien dalam billing
func UpdateBillingIdentitas(billingId int, namaPasien string, usia int, jeniKelamin string, ruangan string, kelas string, tindakan []string, icd9 []string, icd10 []string) error {
	// Get billing
	var billing models.BillingPasien
	if err := database.DB.Where("\"ID_Billing\" = ?", billingId).First(&billing).Error; err != nil {
		return errors.New("billing tidak ditemukan")
	}

	// Start transaction
	tx := database.DB.Begin()

	// Update pasien data
	pasien := models.Pasien{}
	if err := tx.Model(&pasien).
		Where("\"ID_Pasien\" = ?", billing.ID_Pasien).
		Updates(map[string]interface{}{
			"\"Nama_Pasien\"":   namaPasien,
			"\"Usia\"":          usia,
			"\"Jenis_Kelamin\"": jeniKelamin,
			"\"Ruangan\"":       ruangan,
			"\"Kelas\"":         kelas,
		}).Error; err != nil {
		tx.Rollback()
		return errors.New("gagal update data pasien: " + err.Error())
	}

	// Delete existing tindakan
	if err := tx.Where("\"ID_Billing\" = ?", billingId).Delete(&models.Billing_Tindakan{}).Error; err != nil {
		tx.Rollback()
		return errors.New("gagal delete tindakan: " + err.Error())
	}

	// Insert new tindakan
	for _, t := range tindakan {
		if t != "" {
			newTindakan := models.Billing_Tindakan{
				ID_Billing:  billingId,
				ID_Tarif_RS: t,
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

	// Insert new ICD9
	for _, i := range icd9 {
		if i != "" {
			newICD9 := models.Billing_ICD9{
				ID_Billing: billingId,
				ID_ICD9:    i,
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

	// Insert new ICD10
	for _, i := range icd10 {
		if i != "" {
			newICD10 := models.Billing_ICD10{
				ID_Billing: billingId,
				ID_ICD10:   i,
			}
			if err := tx.Create(&newICD10).Error; err != nil {
				tx.Rollback()
				return errors.New("gagal insert ICD10: " + err.Error())
			}
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		return errors.New("gagal commit transaction: " + err.Error())
	}

	return nil
}
