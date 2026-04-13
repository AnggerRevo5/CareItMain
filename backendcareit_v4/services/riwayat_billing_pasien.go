package services

import (
	"backendcareit/models"
	"time"

	"gorm.io/gorm"
)

func GetRiwayatPasienAll(db *gorm.DB) ([]models.Riwayat_Pasien_all, error) {
	var billings []models.BillingPasien

	// Ngambil semua billing yang udah ditutup (Tanggal_Keluar udah ada)
	if err := db.Where("\"Tanggal_Keluar\" IS NOT NULL").Find(&billings).Error; err != nil {
		return nil, err
	}

	// Kumpulkan semua ID_Billing dan ID_Pasien
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

	// Ambil tindakan hanya untuk billing terkait
	tindakanMap := make(map[int][]string)
	var tindakanRows []struct {
		ID_Billing int
		Kode       string
	}

	if err := db.Table("\"billing_tindakan\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Select("\"ID_Billing\", \"ID_Tarif_RS\" as \"Kode\"").
		Order("\"ID_Billing\" ASC, \"tanggal_tindakan\" ASC").
		Scan(&tindakanRows).Error; err != nil {
		return nil, err
	}

	for _, t := range tindakanRows {
		tindakanMap[t.ID_Billing] = append(tindakanMap[t.ID_Billing], t.Kode)
	}

	// Ambil tanggal tindakan dari tabel billing_tindakan (ambil yang pertama aja per billing supaya konsisten)
	tindakanDateMap := make(map[int]*time.Time)
	var tindakanDateRows []struct {
		ID_Billing       int
		Tanggal_Tindakan *time.Time
	}

	if err := db.Table("\"billing_tindakan\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Select("\"ID_Billing\", \"tanggal_tindakan\"").
		Order("\"ID_Billing\" ASC, \"tanggal_tindakan\" ASC").
		Scan(&tindakanDateRows).Error; err != nil {
		return nil, err
	}

	for _, t := range tindakanDateRows {
		if t.Tanggal_Tindakan != nil && tindakanDateMap[t.ID_Billing] == nil {
			tindakanDateMap[t.ID_Billing] = t.Tanggal_Tindakan
		}
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

	// Ambil INACBG - yang RI dikasih prioritas duluan
	inacbgMap := make(map[int]string)
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
		inacbgMap[row.ID_Billing] = row.Kode
	}

	// Kalo gada RI, ambil dari RJ aja
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
		if _, exists := inacbgMap[row.ID_Billing]; !exists {
			inacbgMap[row.ID_Billing] = row.Kode
		}
	}

	// Ambil DPJP (Doctor In Charge) dari billing_dpjp
	dpjpMap := make(map[int]int)
	var dpjpRows []struct {
		ID_Billing int
		ID_DPJP    int
	}
	if err := db.Table("\"billing_dpjp\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Select("\"ID_Billing\", \"ID_DPJP\"").
		Scan(&dpjpRows).Error; err != nil {
		return nil, err
	}
	for _, row := range dpjpRows {
		dpjpMap[row.ID_Billing] = row.ID_DPJP
	}

	// nama dokter susai dpjp ya gais
	dpjpNameMap := make(map[int]string)
	var dpjpNameRows []struct {
		ID_Dokter   int
		Nama_Dokter string
	}
	if err := db.Table("\"dokter\"").
		Select("\"ID_Dokter\", \"Nama_Dokter\"").
		Scan(&dpjpNameRows).Error; err != nil {
		return nil, err
	}
	for _, row := range dpjpNameRows {
		dpjpNameMap[row.ID_Dokter] = row.Nama_Dokter
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
		return nil, err
	}
	for _, row := range ruanganRows {
		ruanganNameMap[row.ID_Ruangan] = row.Nama_Ruangan
	}

	// Rapihin semua data jadi response yang bagus
	var result []models.Riwayat_Pasien_all

	for _, b := range billings {
		pasien := pasienMap[b.ID_Pasien]

		item := models.Riwayat_Pasien_all{
			ID_Billing:       b.ID_Billing,
			ID_Pasien:        pasien.ID_Pasien,
			Nama_Pasien:      pasien.Nama_Pasien,
			Jenis_Kelamin:    pasien.Jenis_Kelamin,
			Usia:             pasien.Usia,
			Ruangan:          pasien.Ruangan,
			Nama_Ruangan:     ruanganNameMap[pasien.Ruangan],
			Kelas:            pasien.Kelas,
			ID_DPJP:          dpjpMap[b.ID_Billing],
			Nama_DPJP:        dpjpNameMap[dpjpMap[b.ID_Billing]],
			Tanggal_Keluar:   b.Tanggal_keluar.Format("2006-01-02"),
			Tanggal_Masuk:    b.Tanggal_masuk.Format("2006-01-02"), //b.Tanggal_masuk,
			Tanggal_Tindakan: tindakanDateMap[b.ID_Billing],
			Tindakan_RS:      tindakanMap[b.ID_Billing],
			ICD9:             icd9Map[b.ID_Billing],
			ICD10:            icd10Map[b.ID_Billing],
			Kode_INACBG:      inacbgMap[b.ID_Billing],
			Total_Tarif_RS:   b.Total_Tarif_RS,
			Total_Klaim:      b.Total_Klaim,
		}

		result = append(result, item)
	}

	return result, nil
}

func GetAllRiwayatpasien(db *gorm.DB) ([]models.Request_Admin_Inacbg, error) {
	var billings []models.BillingPasien

	// Ngambil semua billing yang udah ditutup (Tanggal_Keluar ada isinya)
	if err := db.Where("\"Tanggal_Keluar\" IS NOT NULL").Find(&billings).Error; err != nil {
		return nil, err
	}

	// Kumpulkan semua ID_Billing dan ID_Pasien
	var billingIDs []int
	var pasienIDs []int

	for _, b := range billings {
		billingIDs = append(billingIDs, b.ID_Billing)
		pasienIDs = append(pasienIDs, b.ID_Pasien)
	}

	// Ambil pasien yang ada di billing aja
	pasienMap := make(map[int]models.Pasien)
	var pasienList []models.Pasien

	if err := db.Where("\"ID_Pasien\" IN ? ", pasienIDs).Find(&pasienList).Error; err != nil {
		return nil, err
	}

	for _, p := range pasienList {
		pasienMap[p.ID_Pasien] = p
	}

	// Ambil tindakan hanya untuk billing terkait
	tindakanMap := make(map[int][]string)
	var tindakanRows []struct {
		ID_Billing int
		Kode       string
	}

	if err := db.Table("\"billing_tindakan\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Select("\"ID_Billing\", \"ID_Tarif_RS\" as \"Kode\"").
		Order("\"ID_Billing\" ASC, \"tanggal_tindakan\" ASC").
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

	// Ambil DPJP (Doctor In Charge) dari billing_dpjp
	dpjpMap := make(map[int]int)
	var dpjpRows []struct {
		ID_Billing int
		ID_DPJP    int
	}
	if err := db.Table("\"billing_dpjp\"").
		Where("\"ID_Billing\" IN ?", billingIDs).
		Select("\"ID_Billing\", \"ID_DPJP\"").
		Scan(&dpjpRows).Error; err != nil {
		return nil, err
	}
	for _, row := range dpjpRows {
		dpjpMap[row.ID_Billing] = row.ID_DPJP
	}

	// Rapihin semua data jadi response yang bagus
	var result []models.Request_Admin_Inacbg

	for _, b := range billings {
		pasien := pasienMap[b.ID_Pasien]

		item := models.Request_Admin_Inacbg{
			ID_Billing:     b.ID_Billing,
			Nama_pasien:    pasien.Nama_Pasien,
			ID_Pasien:      pasien.ID_Pasien,
			Kelas:          pasien.Kelas,
			Ruangan:        pasien.Ruangan,
			Total_Tarif_RS: b.Total_Tarif_RS,
			Total_Klaim:    b.Total_Klaim,
			ID_DPJP:        dpjpMap[b.ID_Billing],
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
