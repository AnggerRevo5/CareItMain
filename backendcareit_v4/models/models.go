package models

import "time"

// Tarif Models - Data struktur buat tarif dari berbagai sumber

type TarifBPJSRawatInap struct {
	KodeINA   string  `gorm:"column:ID_INACBG_RI"`
	Deskripsi string  `gorm:"column:Tindakan_RI"`
	Kelas1    float64 `gorm:"column:Tarif_Kelas_1"`
	Kelas2    float64 `gorm:"column:Tarif_Kelas_2"`
	Kelas3    float64 `gorm:"column:Tarif_Kelas_3"`
}

type TarifBPJSRawatJalan struct {
	KodeINA     string  `gorm:"column:ID_INACBG_RJ"`
	Deskripsi   string  `gorm:"column:Tindakan_RJ"`
	TarifINACBG float64 `gorm:"column:Tarif_RJ" json:"tarif_inacbg"`
}

type TarifRS struct {
	KodeRS    string `gorm:"column:ID_Tarif_RS"`
	Deskripsi string `gorm:"column:Tindakan_RS"`
	Harga     int    `gorm:"column:Tarif_RS"`
	Kategori  string `gorm:"column:Kategori_RS"`
}

func (TarifBPJSRawatJalan) TableName() string {
	return "ina_cbg_rawatjalan"
}

func (TarifBPJSRawatInap) TableName() string {
	return "ina_cbg_rawatinap"
}

func (TarifRS) TableName() string {
	return "tarif_rs"
}

// billing_inacbg_RI
type Billing_INACBG_RI struct {
	ID_Billing  int    `gorm:"column:ID_Billing"`
	Kode_INACBG string `gorm:"column:ID_INACBG_RI"`
}

func (Billing_INACBG_RI) TableName() string {
	return "billing_inacbg_ri"
}

// billing_inacbg_RJ
type Billing_INACBG_RJ struct {
	ID_Billing  int    `gorm:"column:ID_Billing"`
	Kode_INACBG string `gorm:"column:ID_INACBG_RJ"`
}

func (Billing_INACBG_RJ) TableName() string {
	return "billing_inacbg_rj"
}

type Billing_DPJP struct {
	ID_Billing int `gorm:"column:ID_Billing;primaryKey"`
	ID_DPJP    int `gorm:"column:ID_DPJP;primaryKey"`
}

func (Billing_DPJP) TableName() string {
	return "billing_dpjp"
}

// ICD9

type ICD9 struct {
	Kode_ICD9 string `gorm:"column:ID_ICD9"`
	Prosedur  string `gorm:"column:Prosedur"`
	Versi     string `gorm:"column:Versi_ICD9"`
}

func (ICD9) TableName() string {
	return "icd9"
}

// ICD10
type ICD10 struct {
	Kode_ICD10 string `gorm:"column:ID_ICD10"`
	Diagnosa   string `gorm:"column:Diagnosa"`
	Versi      string `gorm:"column:Versi_ICD10"`
}

func (ICD10) TableName() string {
	return "icd10"
}

// ruangan
type Ruangan struct {
	ID_Ruangan       string `gorm:"column:ID_Ruangan"`
	Jenis_Ruangan    string `gorm:"column:Jenis_Ruangan"`
	Nama_Ruangan     string `gorm:"column:Nama_Ruangan"`
	Keterangan       string `gorm:"column:keterangan"`
	Kategori_ruangan string `gorm:"column:kategori_ruangan"`
}

func (Ruangan) TableName() string {
	return "ruangan"
}

// dokter
type Dokter struct {
	ID_Dokter     int    `gorm:"column:ID_Dokter;primaryKey"`
	Nama_Dokter   string `gorm:"column:Nama_Dokter"`
	Password      string `gorm:"column:Password"`
	Status        string `gorm:"column:Status"`
	KSM           string `gorm:"column:KSM"`
	Email_UB      string `gorm:"column:Email_UB"`
	Email_Pribadi string `gorm:"column:Email_Pribadi"`
}

func (Dokter) TableName() string {
	return "dokter"
}

// PASIEN
type Pasien struct {
	ID_Pasien     int    `gorm:"column:ID_Pasien;primaryKey;autoIncrement"`
	Nama_Pasien   string `gorm:"column:Nama_Pasien"`
	Jenis_Kelamin string `gorm:"column:Jenis_Kelamin"`
	Usia          int    `gorm:"column:Usia"`
	Ruangan       string `gorm:"column:Ruangan"`
	Kelas         string `gorm:"column:Kelas"`
}

type Kelas string

const (
	Kelas_1 Kelas = "1"
	Kelas_2 Kelas = "2"
	Kelas_3 Kelas = "3"
)

type Jenis_kelamin string

const (
	Jenis_Kelamin_Laki_laki Jenis_kelamin = "Laki-laki"
	Jenis_Kelamin_Perempuan Jenis_kelamin = "Perempuan"
)

func (Pasien) TableName() string {
	return "pasien"
}

// login dokter
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

//edit inacbg admin

type Edit_INACBG_Request struct {
	ID_Billing   int      `json:"id_billing"`
	Tipe_inacbg  string   `json:"tipe_inacbg"`
	Kode_inacbg  []string `json:"kode_inacbg"`
	Kode_Delete  []string `json:"kode_delete"`
	Total_Klaim  float64  `json:"total_klaim"`
	Billing_Sign string   `json:"billing_sign"`
}

//close billing

type Close_billing struct {
	ID_Billing     int    `json:"id_billing"`
	Tanggal_Keluar string `json:"tanggal_keluar"`
}

//riwayat billing pasien

type Riwayat_Pasien_all struct {
	ID_Billing       int        `json:"id_billing"`
	ID_Pasien        int        `json:"id_pasien"`
	Nama_Pasien      string     `json:"nama_pasien"`
	Jenis_Kelamin    string     `json:"jenis_kelamin"`
	Usia             int        `json:"usia"`
	Ruangan          string     `json:"ruangan"`
	Nama_Ruangan     string     `json:"nama_ruangan"` // ← Added: Ruangan name for display
	Kelas            string     `json:"kelas"`
	ID_DPJP          int        `json:"id_dpjp"` // ← Added: Doctor in charge
	Nama_DPJP        string     `json:"nama_dpjp"`
	Tanggal_Keluar   string     `json:"tanggal_keluar"`
	Tanggal_Masuk    string     `json:"tanggal_masuk"` // Tanggal_Masuk    *time.Time `json:"tanggal_masuk"`
	Tanggal_Tindakan *time.Time `json:"tanggal_tindakan"`
	Tindakan_RS      []string   `json:"tindakan_rs"`
	ICD9             []string   `json:"icd9"`
	ICD10            []string   `json:"icd10"`
	Kode_INACBG      string     `json:"kode_inacbg"`
	Total_Tarif_RS   float64    `json:"total_tarif_rs"` // ← Added: Hospital tariff
	Total_Klaim      float64    `json:"total_klaim"`    // ← Added: BPJS claim
}

//billing pasien

type BillingPasien struct {
	ID_Billing     int        `gorm:"column:ID_Billing;primaryKey;autoIncrement" json:"id_billing"`
	ID_Pasien      int        `gorm:"column:ID_Pasien" json:"id_pasien"`
	Cara_Bayar     string     `gorm:"column:Cara_Bayar" json:"cara_bayar"`
	Tanggal_masuk  *time.Time `gorm:"column:Tanggal_Masuk" json:"tanggal_masuk"`
	Tanggal_keluar *time.Time `gorm:"column:Tanggal_Keluar" json:"tanggal_keluar"`
	Total_Tarif_RS float64    `gorm:"column:Total_Tarif_RS" json:"total_tarif_rs"`
	Total_Klaim    float64    `gorm:"column:Total_Klaim" json:"total_klaim"`
	Billing_sign   string     `gorm:"column:Billing_Sign" json:"billing_sign"`
}

type Cara_bayar string

const (
	Cara_Bayar_BPJS Cara_bayar = "BPJS"
	Cara_Bayar_UMUM Cara_bayar = "UMUM"
)

func (BillingPasien) TableName() string {
	return "billing_pasien"
}

// BillingRequest untuk menerima data dari frontend
type BillingRequest struct {
	Nama_Dokter      []string `json:"nama_dokter" binding:"required"` // Array untuk multiple doctors
	Nama_Pasien      string   `json:"nama_pasien" binding:"required"`
	Jenis_Kelamin    string   `json:"jenis_kelamin" binding:"required"`
	Usia             int      `json:"usia" binding:"required"`
	ID_DPJP          int      `json:"id_dpjp"`
	Ruangan          string   `json:"ruangan" binding:"required"`
	Kelas            string   `json:"kelas" binding:"required"`
	Tindakan_RS      []string `json:"tindakan_rs" binding:"required"`
	Tanggal_Masuk    string   `json:"tanggal_masuk"` // ← Added: Tanggal masuk dari frontend (format: YYYY-MM-DD)
	Tanggal_Keluar   string   `json:"tanggal_keluar"`
	Billing_sign     string   `json:"billing_sign"`
	ICD9             []string `json:"icd9"`
	ICD10            []string `json:"icd10" binding:"required"`
	Cara_Bayar       string   `json:"cara_bayar" binding:"required"`
	Total_Tarif_RS   float64  `json:"total_tarif_rs"`
	Total_Klaim_BPJS float64  `json:"total_klaim_bpjs"` // ← Added: Baseline BPJS claim from FE
}

// admin ruangan //Admin_Ruangan

type Admin_Ruangan struct {
	ID_Admin   int    `gorm:"column:ID_Admin"`
	Nama_Admin string `gorm:"column:Nama_Admin"`
	Password   string `gorm:"column:Password"`
	ID_Ruangan string `gorm:"column:ID_Ruangan"`
}

func (Admin_Ruangan) TableName() string {
	return "admin_ruangan"
}

// billing_Tidakan

type Billing_Tindakan struct {
	ID_Billing       int        `gorm:"column:ID_Billing;primaryKey;not null"`
	ID_Tarif_RS      string     `gorm:"column:ID_Tarif_RS;primaryKey;not null"`
	Tanggal_Tindakan *time.Time `gorm:"column:tanggal_tindakan"`
}

func (Billing_Tindakan) TableName() string {
	return "billing_tindakan"
}

// billing_ICD9 dan ICD10

type Billing_ICD9 struct {
	ID_Billing int    `gorm:"column:ID_Billing;primaryKey;not null"`
	ID_ICD9    string `gorm:"column:ID_ICD9;primaryKey;not null"`
}

type Billing_ICD10 struct {
	ID_Billing int    `gorm:"column:ID_Billing;primaryKey;not null"`
	ID_ICD10   string `gorm:"column:ID_ICD10;primaryKey;not null"`
}

func (Billing_ICD9) TableName() string {
	return "billing_icd9"
}
func (Billing_ICD10) TableName() string {
	return "billing_icd10"
}

// billing_Dokter - relasi many-to-many antara billing dan dokter dengan tracking tanggal
type Billing_Dokter struct {
	ID_Billing int        `gorm:"column:ID_Billing"`
	ID_Dokter  int        `gorm:"column:ID_Dokter"`
	Tanggal    *time.Time `gorm:"column:tanggal"` // Tanggal kapan dokter menangani pasien
}

func (Billing_Dokter) TableName() string {
	return "billing_dokter"
}

// riwayat pasien
type Riwayat_Pasien struct {
	ID_Billing     int      `json:"id_billing"`
	Nama_pasien    string   `json:"nama_pasien"`
	ID_Pasien      int      `json:"id_pasien"`
	Kelas          string   `json:"Kelas"`
	Ruangan        string   `json:"ruangan"`
	Total_Tarif_RS float64  `json:"total_tarif_rs"`
	Total_Klaim    float64  `json:"total_klaim"`
	Tindakan_RS    []string `json:"tindakan_rs"`
	ICD9           []string `json:"icd9"`
	ICD10          []string `json:"icd10"`
	INACBG_RI      []string `json:"inacbg_ri"`
	INACBG_RJ      []string `json:"inacbg_rj"`
	Billing_sign   string   `json:"billing_sign"`
	Nama_Dokter    []string `json:"nama_dokter"`
}

// Request untuk tampilan data Admin ( pengisian inacbg)
type Request_Admin_Inacbg struct {
	ID_Billing     int      `json:"id_billing"`
	Nama_pasien    string   `json:"nama_pasien"`
	ID_Pasien      int      `json:"id_pasien"`
	Kelas          string   `json:"Kelas"`
	Ruangan        string   `json:"ruangan"`
	Total_Tarif_RS float64  `json:"total_tarif_rs"`
	Total_Klaim    float64  `json:"total_klaim"`
	ID_DPJP        int      `json:"id_dpjp"`
	Tindakan_RS    []string `json:"tindakan_rs"`
	ICD9           []string `json:"icd9"`
	ICD10          []string `json:"icd10"`
	INACBG_RI      []string `json:"inacbg_ri"`
	INACBG_RJ      []string `json:"inacbg_rj"`
	Billing_sign   string   `json:"billing_sign"`
	Nama_Dokter    []string `json:"nama_dokter"`
}

// post ke data base
type Post_INACBG_Admin struct {
	ID_Billing     int      `json:"id_billing"`
	Tipe_inacbg    string   `json:"tipe_inacbg"`
	Kode_INACBG    []string `json:"kode_inacbg"`
	Total_klaim    float64  `json:"total_klaim"`
	Billing_sign   string   `json:"billing_sign"`
	Tanggal_keluar string   `json:"tanggal_keluar"` // Diisi oleh admin billing
}

// login dokter
type loginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (loginRequest) TableName() string {
	return "dokter"
}

// getpasienwithallicd9andicd10,andtindakanrs
