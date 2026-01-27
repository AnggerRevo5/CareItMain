package services

import (
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"backendcareit/models"

	"gorm.io/gorm"
)

func Post_INACBG_Admin(db *gorm.DB, input models.Post_INACBG_Admin) error {
	// Debug log
	log.Printf("[INACBG] Input received: ID_Billing=%d, Tipe=%s, Kode_count=%d, Total_klaim=%.2f, BillingSign=%s\n",
		input.ID_Billing, input.Tipe_inacbg, len(input.Kode_INACBG), input.Total_klaim, input.Billing_sign)

	tx := db.Begin()
	if tx.Error != nil {
		log.Printf("[INACBG] Error starting transaction: %v\n", tx.Error)
		return tx.Error
	}

	// Ensure rollback on panic / unexpected error
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[INACBG] Panic recovered: %v\n", r)
			tx.Rollback()
		}
	}()

	// Validate input
	if input.Tipe_inacbg != "RI" && input.Tipe_inacbg != "RJ" {
		tx.Rollback()
		err := errors.New("invalid tipe_inacbg: must be 'RI' or 'RJ'")
		log.Printf("[INACBG] Validation error: %v\n", err)
		return err
	}
	if len(input.Kode_INACBG) == 0 {
		tx.Rollback()
		err := errors.New("Kode_INACBG tidak boleh kosong")
		log.Printf("[INACBG] Validation error: %v\n", err)
		return err
	}

	// Ngambil billing dulu buat dapetin total klaim yang lama
	var existingBilling models.BillingPasien
	if err := tx.First(&existingBilling, input.ID_Billing).Error; err != nil {
		tx.Rollback()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = fmt.Errorf("billing dengan ID_Billing=%d tidak ditemukan", input.ID_Billing)
			log.Printf("[INACBG] %v\n", err)
			return err
		}
		log.Printf("[INACBG] Error fetching billing: %v\n", err)
		return fmt.Errorf("gagal mengambil billing: %w", err)
	}

	log.Printf("[INACBG] Found billing: ID=%d, Current_Total_Klaim=%.2f\n", existingBilling.ID_Billing, existingBilling.Total_Klaim)

	// Hitung total klaim yang baru = yang lama + tambahan
	newTotalKlaim := input.Total_klaim
	log.Printf("[INACBG] New total klaim: %.2f + %.2f = %.2f\n", existingBilling.Total_Klaim, input.Total_klaim, newTotalKlaim)

	// Parse Tanggal_Keluar jika diisi oleh admin
	var keluarPtr *time.Time
	if input.Tanggal_keluar != "" && input.Tanggal_keluar != "null" {
		s := input.Tanggal_keluar
		var parsed time.Time
		var err error
		layouts := []string{time.RFC3339, "2006-01-02 15:04:05", "2006-01-02"}
		for _, layout := range layouts {
			parsed, err = time.Parse(layout, s)
			if err == nil {
				t := parsed
				keluarPtr = &t
				log.Printf("[INACBG] Parsed tanggal_keluar: %v\n", t)
				break
			}
		}
		if keluarPtr == nil {
			tx.Rollback()
			err := fmt.Errorf("invalid tanggal_keluar format: %s", input.Tanggal_keluar)
			log.Printf("[INACBG] %v\n", err)
			return err
		}
	}

	// Update total klaim kumulatif sama tanggal keluar (kalo ada yang ngirim)
	updateData := map[string]interface{}{
		"\"Total_Klaim\"": newTotalKlaim,
	}
	if keluarPtr != nil {
		updateData["\"Tanggal_Keluar\""] = keluarPtr
	}

	// Kalo frontend kirim billing_sign, langsung simpen ke kolom Billing_Sign
	if input.Billing_sign != "" {
		updateData["\"Billing_Sign\""] = input.Billing_sign
		log.Printf("[INACBG] Will update Billing_Sign to: %s\n", input.Billing_sign)
	}

	log.Printf("[INACBG] Update data: %v\n", updateData)

	res := tx.Model(&models.BillingPasien{}).
		Where("\"ID_Billing\" = ?", input.ID_Billing).
		Updates(updateData)

	if res.Error != nil {
		tx.Rollback()
		log.Printf("[INACBG] Error updating billing: %v\n", res.Error)
		return fmt.Errorf("gagal update billing: %w", res.Error)
	}

	log.Printf("[INACBG] Updated %d rows in billing_pasien\n", res.RowsAffected)

	// DELETE semua kode INACBG yang lama buat billing ini (biar gak duplikat pas INSERT)
	switch input.Tipe_inacbg {
	case "RI":
		if err := tx.Where("\"ID_Billing\" = ?", input.ID_Billing).Delete(&models.Billing_INACBG_RI{}).Error; err != nil {
			tx.Rollback()
			log.Printf("[INACBG] Error deleting old INACBG RI: %v\n", err)
			return fmt.Errorf("gagal delete INACBG RI lama: %w", err)
		}
		log.Printf("[INACBG] Deleted old INACBG RI records for ID_Billing=%d\n", input.ID_Billing)

	case "RJ":
		if err := tx.Where("\"ID_Billing\" = ?", input.ID_Billing).Delete(&models.Billing_INACBG_RJ{}).Error; err != nil {
			tx.Rollback()
			log.Printf("[INACBG] Error deleting old INACBG RJ: %v\n", err)
			return fmt.Errorf("gagal delete INACBG RJ lama: %w", err)
		}
		log.Printf("[INACBG] Deleted old INACBG RJ records for ID_Billing=%d\n", input.ID_Billing)
	}

	// Bulk insert kode INACBG berdasarkan tipenya (udah dihapus yang lama)
	switch input.Tipe_inacbg {
	case "RI":
		records := make([]models.Billing_INACBG_RI, 0, len(input.Kode_INACBG))
		for _, kode := range input.Kode_INACBG {
			records = append(records, models.Billing_INACBG_RI{
				ID_Billing:  input.ID_Billing,
				Kode_INACBG: kode,
			})
		}
		if err := tx.Create(&records).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("gagal insert INACBG RI: %w", err)
		}

	case "RJ":
		records := make([]models.Billing_INACBG_RJ, 0, len(input.Kode_INACBG))
		for _, kode := range input.Kode_INACBG {
			records = append(records, models.Billing_INACBG_RJ{
				ID_Billing:  input.ID_Billing,
				Kode_INACBG: kode,
			})
		}
		if err := tx.Create(&records).Error; err != nil {
			tx.Rollback()
			return fmt.Errorf("gagal insert INACBG RJ: %w", err)
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("[INACBG] Error committing transaction: %v\n", err)
		return err
	}

	log.Printf("[INACBG] ✅ Successfully saved INACBG for ID_Billing=%d, billing_sign=%s\n", input.ID_Billing, input.Billing_sign)

	// Ngirim email ke dokter kalo billing_sign gak kosong
	if input.Billing_sign != "" && strings.TrimSpace(input.Billing_sign) != "" {
		// Ngirim email asynchronous (kalo gagal, jangan perpengaruh proses utama)
		// Log error tapi jangan return, biar proses utama tetep berhasil
		if err := SendEmailBillingSignToDokter(input.ID_Billing); err != nil {
			// Log error tapi tidak return error agar proses utama tetap berhasil
			// Di production, bisa pake logger yang lebih proper
			fmt.Printf("Warning: Gagal mengirim email ke dokter untuk billing ID %d: %v\n", input.ID_Billing, err)
		}
	}

	return nil
}

func GetAllBilling(db *gorm.DB) ([]models.Request_Admin_Inacbg, error) {
	var billings []models.BillingPasien

	// Ngambil semua billing yang belum ditutup (Tanggal_Keluar masih kosong)
	if err := db.Where("\"Tanggal_Keluar\" IS NULL").Find(&billings).Error; err != nil {
		return nil, err
	}

	// Kumpulin dulu semua ID_Billing sama ID_Pasien
	var billingIDs []int
	var pasienIDs []int

	for _, b := range billings {
		billingIDs = append(billingIDs, b.ID_Billing)
		pasienIDs = append(pasienIDs, b.ID_Pasien)
	}

	// Ambil pasien yang ada di billing aja
	pasienMap := make(map[int]models.Pasien)
	var pasienList []models.Pasien

	if err := db.Where("\"ID_Pasien\" IN ?", pasienIDs).Find(&pasienList).Error; err != nil {
		return nil, err
	}

	log.Printf("[DEBUG] Loaded %d pasien from database\n", len(pasienList))
	for _, p := range pasienList {
		pasienMap[p.ID_Pasien] = p
		log.Printf("[DEBUG] Pasien %d: Nama=%s, Ruangan=%s\n", p.ID_Pasien, p.Nama_Pasien, p.Ruangan)
	}

	// Ambil tindakan yang berkaitan sama billing-billing ini
	tindakanMap := make(map[int][]string)
	var tindakanRows []struct {
		ID_Billing int
		Kode       string
	}

	if err := db.Table("\"billing_tindakan\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Select("\"ID_Billing\", \"ID_Tarif_RS\" as \"Kode\"").
		Scan(&tindakanRows).Error; err != nil {
		return nil, err
	}

	for _, t := range tindakanRows {
		tindakanMap[t.ID_Billing] = append(tindakanMap[t.ID_Billing], t.Kode)
	}

	// Ngambil semua ICD9 yang ada
	icd9Map := make(map[int][]string)
	var icd9Rows []struct {
		ID_Billing int
		Kode       string
	}

	if err := db.Table("\"billing_icd9\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Select("\"ID_Billing\", \"ID_ICD9\" as \"Kode\"").
		Scan(&icd9Rows).Error; err != nil {
		return nil, err
	}

	for _, row := range icd9Rows {
		icd9Map[row.ID_Billing] = append(icd9Map[row.ID_Billing], row.Kode)
	}

	// Ngambil semua ICD10 yang ada
	icd10Map := make(map[int][]string)
	var icd10Rows []struct {
		ID_Billing int
		Kode       string
	}

	if err := db.Table("\"billing_icd10\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Select("\"ID_Billing\", \"ID_ICD10\" as \"Kode\"").
		Scan(&icd10Rows).Error; err != nil {
		return nil, err
	}

	for _, row := range icd10Rows {
		icd10Map[row.ID_Billing] = append(icd10Map[row.ID_Billing], row.Kode)
	}

	// Ngambil INACBG RI
	inacbgRIMap := make(map[int][]string)
	var inacbgRIRows []struct {
		ID_Billing int
		Kode       string
	}
	if err := db.Table("\"billing_inacbg_ri\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Select("\"ID_Billing\", \"ID_INACBG_RI\" as \"Kode\"").
		Scan(&inacbgRIRows).Error; err != nil {
		return nil, err
	}
	for _, row := range inacbgRIRows {
		inacbgRIMap[row.ID_Billing] = append(inacbgRIMap[row.ID_Billing], row.Kode)
	}

	// Ngambil INACBG RJ
	inacbgRJMap := make(map[int][]string)
	var inacbgRJRows []struct {
		ID_Billing int
		Kode       string
	}
	if err := db.Table("\"billing_inacbg_rj\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Select("\"ID_Billing\", \"ID_INACBG_RJ\" as \"Kode\"").
		Scan(&inacbgRJRows).Error; err != nil {
		return nil, err
	}
	for _, row := range inacbgRJRows {
		inacbgRJMap[row.ID_Billing] = append(inacbgRJMap[row.ID_Billing], row.Kode)
	}

	// Ambil dokter dari tabel billing_dokter, diurutkan berdasarkan tanggal
	dokterMap := make(map[int][]string)
	var dokterRows []struct {
		ID_Billing int
		Nama       string
		Tanggal    time.Time
	}
	if err := db.Table("\"billing_dokter\"").
		Select("\"ID_Billing\", \"Nama_Dokter\" as \"Nama\", \"tanggal\"").
		Joins("JOIN \"dokter\" ON \"billing_dokter\".\"ID_Dokter\" = \"dokter\".\"ID_Dokter\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Order("\"tanggal\" ASC").
		Scan(&dokterRows).Error; err != nil {
		return nil, err
	}
	for _, row := range dokterRows {
		dokterMap[row.ID_Billing] = append(dokterMap[row.ID_Billing], row.Nama)
	}

	// Ambil nama ruangan buat di-mapping dari ID jadi Nama
	ruanganNameMap := make(map[string]string)
	var ruanganRows []struct {
		ID_Ruangan   string
		Nama_Ruangan string
	}
	if err := db.Table("\"ruangan\"").
		Select("\"ID_Ruangan\", \"Nama_Ruangan\"").
		Scan(&ruanganRows).Error; err != nil {
		log.Printf("[WARNING] Gagal ngambil ruangan: %v\\n", err)
		// Lanjutin aja, ID jadi fallback
	} else {
		for _, row := range ruanganRows {
			ruanganNameMap[row.ID_Ruangan] = row.Nama_Ruangan
		}
		log.Printf("[DEBUG] Loaded %d ruangan mappings\n", len(ruanganNameMap))
	}

	// Rapihin semua data jadi response yang bagus
	var result []models.Request_Admin_Inacbg

	for _, b := range billings {
		pasien := pasienMap[b.ID_Pasien]

		// ruangan bisa jadi udah nama, bukan ID, langsung pake aja
		ruanganDisplay := pasien.Ruangan

		// Tapi kalo mirip ID dan ada mapping, pake nama yang sudah dimapping
		if mappedName, exists := ruanganNameMap[pasien.Ruangan]; exists && mappedName != "" {
			ruanganDisplay = mappedName
		}

		item := models.Request_Admin_Inacbg{
			ID_Billing:     b.ID_Billing,
			Nama_pasien:    pasien.Nama_Pasien,
			ID_Pasien:      b.ID_Pasien,
			Kelas:          pasien.Kelas,
			Ruangan:        ruanganDisplay, // ← Use name directly if available, or mapped name
			Total_Tarif_RS: b.Total_Tarif_RS,
			Total_Klaim:    b.Total_Klaim,
			Tindakan_RS:    tindakanMap[b.ID_Billing],
			ICD9:           icd9Map[b.ID_Billing],
			ICD10:          icd10Map[b.ID_Billing],
			INACBG_RI:      inacbgRIMap[b.ID_Billing],
			INACBG_RJ:      inacbgRJMap[b.ID_Billing],
			Billing_sign:   b.Billing_sign,
			Nama_Dokter:    dokterMap[b.ID_Billing],
		}

		result = append(result, item)
	}

	return result, nil
}

// GetBillingByID - Get specific billing data by ID
func GetBillingByID(db *gorm.DB, id string) (map[string]interface{}, error) {
	var billing models.BillingPasien

	if err := db.Where("\"ID_Billing\" = ?", id).First(&billing).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("billing dengan ID=%s tidak ditemukan", id)
		}
		return nil, fmt.Errorf("gagal mengambil billing: %w", err)
	}

	result := map[string]interface{}{
		"id_billing":     billing.ID_Billing,
		"id_pasien":      billing.ID_Pasien,
		"cara_bayar":     billing.Cara_Bayar,
		"tanggal_masuk":  billing.Tanggal_masuk,
		"tanggal_keluar": billing.Tanggal_keluar,
		"total_tarif_rs": billing.Total_Tarif_RS,
		"total_klaim":    billing.Total_Klaim,
		"billing_sign":   billing.Billing_sign,
	}

	return result, nil
}
