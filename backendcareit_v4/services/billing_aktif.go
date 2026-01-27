package services

import (
	"backendcareit/models"

	"gorm.io/gorm"
)

func GetAllBillingaktif(db *gorm.DB) ([]models.Request_Admin_Inacbg, error) {
	var billings []models.BillingPasien

	// Ambil semua billing yang masih aktif (belum ditutup, Tanggal_Keluar masih kosong)
	if err := db.Where("\"Tanggal_Keluar\" IS NULL").Find(&billings).Error; err != nil {
		return nil, err
	}

	// Kumpulin dulu semua ID_Billing dan ID_Pasien buat di-query
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

	for _, p := range pasienList {
		pasienMap[p.ID_Pasien] = p
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

	// Ambil ICD9
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

	// Ambil ICD10
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

	// Ambil INACBG RI
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

	// Ambil INACBG RJ
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

	// Ambil dokter dari billing_dokter dengan urutan tanggal
	dokterMap := make(map[int][]string)
	var dokterRows []struct {
		ID_Billing int
		Nama       string
	}
	if err := db.Table("\"billing_dokter\"").
		Select("\"ID_Billing\", \"Nama_Dokter\" as \"Nama\"").
		Joins("JOIN \"dokter\" ON \"billing_dokter\".\"ID_Dokter\" = \"dokter\".\"ID_Dokter\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Order("tanggal ASC").
		Scan(&dokterRows).Error; err != nil {
		return nil, err
	}
	for _, row := range dokterRows {
		dokterMap[row.ID_Billing] = append(dokterMap[row.ID_Billing], row.Nama)
	}

	// Rapihin semua data jadi response yang keren
	var result []models.Request_Admin_Inacbg

	for _, b := range billings {
		pasien := pasienMap[b.ID_Pasien]

		item := models.Request_Admin_Inacbg{
			ID_Billing:     b.ID_Billing,
			Nama_pasien:    pasien.Nama_Pasien,
			ID_Pasien:      b.ID_Pasien,
			Kelas:          pasien.Kelas,
			Ruangan:        pasien.Ruangan,
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
