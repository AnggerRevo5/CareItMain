package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"backendcareit/database"
	"backendcareit/middleware"
	"backendcareit/models"
	"backendcareit/services"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(r *gin.Engine) {
	// Routes get dokter
	r.GET("/dokter", listDokterHandler)
	// Routes get ruangan
	r.GET("/ruangan", listRuanganHandler)
	// Routes get icd9 icd10
	r.GET("/icd10", listICD10Handler)
	r.GET("/icd9", listICD9Handler)
	// Health check
	r.GET("/", healthHandler)
	// Routes tarif
	r.GET("/tarifBPJSRawatInap", listTarifBPJSRawatInapHandler)
	r.GET("/tarifBPJS/:kode", detailTarifBPJSRawatInapHandler)
	r.GET("/tarifBPJSRawatJalan", listTarifBPJSRawatJalanHandler)
	r.GET("/tarifBPJSRawatJalan/:kode", detailTarifBPJSRawatJalanHandler)
	r.GET("/tarifRS", listTarifRSHandler)
	r.GET("/tarifRS/:kode", detailTarifRSHandler)
	r.GET("/tarifRSByKategori/:kategori", listTarifRSByKategoriHandler)
	// Routes pasien & billing
	r.GET("/pasien/search", SearchPasienHandler)
	r.GET("/pasien/:id", GetPasien)
	r.POST("/billing", CreateBillingHandler)
	r.GET("/billing/aktif", GetBillingAktifByNamaHandler)
	r.PUT("/billing/:id", UpdateBillingHandler)

	//close billing
	r.POST("/billing/close", CloseBillingHandler)

	//get all billing aktif
	r.GET("/billing/aktif/all", GetAllBillingaktifhandler)

	//admin edit inacbg
	r.PUT("/admin/inacbg", EditINACBGAdminHandler)
	// Admin: get all billing
	r.GET("/admin/billing", GetAllBillingHandler)
	// Admin: get riwayat billing (sudah ditutup)
	r.GET("/admin/riwayat-billing", GetRiwayatBillingHandler)
	// Admin: get riwayat billing with all patient data
	r.GET("/admin/riwayat-pasien-all", GetRiwayatPasienAllHandler)
	// Admin: get billing by ID
	r.GET("/admin/billing/:id", GetBillingByIDHandler)
	// Admin: post INACBG
	r.POST("/admin/inacbg", PostINACBGAdminHandler)
	// Admin: get ruangan dengan pasien
	r.GET("/admin/ruangan-dengan-pasien", GetRuanganWithPasienHandler)
	// Login dokter
	r.POST("/login", LoginDokterHandler(database.DB))
	// login admin
	r.POST("/admin/login", LoginAdminHandler(database.DB))
}

// Coba tes koneksi dulu ya

func healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":  "ok",
		"message": "Server berjalan",
	})
}

//Handler buat /admin/billing

func GetAllBillingHandler(c *gin.Context) {

	data, err := services.GetAllBilling(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   data,
	})
}

// Handler buat /admin/billing/:id
func GetBillingByIDHandler(c *gin.Context) {
	id := c.Param("id")

	data, err := services.GetBillingByID(database.DB, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   data,
	})
}

// edit inacbg admin
func EditINACBGAdminHandler(c *gin.Context) {
	var input models.Edit_INACBG_Request

	// Ensure JSON
	if c.GetHeader("Content-Type") != "application/json" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Content-Type harus application/json",
		})
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Data tidak valid",
			"error":   err.Error(),
		})
		return
	}

	if err := services.Edit_INACBG_Admin(database.DB, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengedit INACBG",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "INACBG berhasil diupdate",
	})
}

// Post INACBG from admin
func PostINACBGAdminHandler(c *gin.Context) {
	var input models.Post_INACBG_Admin

	// Ensure JSON
	if c.GetHeader("Content-Type") != "application/json" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Content-Type harus application/json",
		})
		return
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Data tidak valid",
			"error":   err.Error(),
		})
		return
	}

	if err := services.Post_INACBG_Admin(database.DB, input); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal memproses INACBG",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "INACBG berhasil disimpan",
	})
}

// List tarif BPJS Rawat Inap
func listTarifBPJSRawatInapHandler(c *gin.Context) {
	data, err := services.GetTarifBPJSRawatInap()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}

	c.JSON(http.StatusOK, data)
}

func detailTarifBPJSRawatInapHandler(c *gin.Context) {
	kode := c.Param("kode")
	data, err := services.GetTarifBPJSRawatInapByKode(kode)
	if err != nil {
		if services.IsNotFound(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "not_found",
				"message": "Kode tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}

	c.JSON(http.StatusOK, data)
}

// List tarif BPJS Rawat Jalan
func listTarifBPJSRawatJalanHandler(c *gin.Context) {
	data, err := services.GetTarifBPJSRawatJalan()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}

	c.JSON(http.StatusOK, data)
}

func detailTarifBPJSRawatJalanHandler(c *gin.Context) {
	kode := c.Param("kode")
	data, err := services.GetTarifBPJSRawatJalanByKode(kode)
	if err != nil {
		if services.IsNotFound(err) {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "not_found",
				"message": "Kode tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}

	c.JSON(http.StatusOK, data)
}

// List tarif RS
func listTarifRSHandler(c *gin.Context) {
	data, err := services.GetTarifRS()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}

	c.JSON(http.StatusOK, data)
}

func detailTarifRSHandler(c *gin.Context) {
	kode := c.Param("kode")
	data, err := services.GetTarifRSByKode(kode)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}

	c.JSON(http.StatusOK, data)
}

func listTarifRSByKategoriHandler(c *gin.Context) {
	kategori := c.Param("kategori")
	data, err := services.GetTarifRSByKategori(kategori)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}

	c.JSON(http.StatusOK, data)
}

// ICD9
func listICD9Handler(c *gin.Context) {
	data, err := services.GetICD9()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}
	c.JSON(http.StatusOK, data)
}

// ICD10
func listICD10Handler(c *gin.Context) {
	data, err := services.GetICD10()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}
	c.JSON(http.StatusOK, data)
}

// ruangan
func listRuanganHandler(c *gin.Context) {
	data, err := services.GetRuangan()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}
	c.JSON(http.StatusOK, data)
}

// GetRuanganWithPasienHandler - Ambil ruangan yang punya pasien
func GetRuanganWithPasienHandler(c *gin.Context) {
	data, err := services.GetRuanganWithPasien(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}
	c.JSON(http.StatusOK, data)
}

// dokter
func listDokterHandler(c *gin.Context) {
	data, err := services.GetDokter()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data",
		})
		return
	}
	c.JSON(http.StatusOK, data)
}

//Liat pasien sudah atau belum

func GetPasien(c *gin.Context) {
	idStr := c.Param("id")

	// Konversi string ke int
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(400, gin.H{
			"message": "ID pasien harus berupa angka",
		})
		return
	}

	pasien, err := services.GetPasienByID(id)
	if err != nil {
		c.JSON(404, gin.H{
			"message": "Pasien tidak ditemukan",
		})
		return
	}

	c.JSON(200, gin.H{
		"message": "Data pasien ditemukan",
		"data":    pasien,
	})
}

//add pasien baru

// CreateBillingHandler handler untuk membuat billing baru dari data frontend
func CreateBillingHandler(c *gin.Context) {
	// Pastikan JSON
	contentType := c.GetHeader("Content-Type")
	if contentType != "application/json" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Content-Type harus application/json",
			"error":   "Content-Type yang diterima: " + contentType,
		})
		return
	}

	// Gunakan map untuk menerima JSON fleksibel (bisa string atau array untuk nama_dokter)
	var rawData map[string]interface{}
	if err := c.ShouldBindJSON(&rawData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Data tidak valid",
			"error":   err.Error(),
		})
		return
	}

	// Konversi nama_dokter dari string ke array jika perlu
	if namaDokterRaw, ok := rawData["nama_dokter"]; ok {
		switch v := namaDokterRaw.(type) {
		case string:
			// Jika string, konversi ke array dengan 1 elemen
			if v != "" {
				rawData["nama_dokter"] = []string{v}
			} else {
				rawData["nama_dokter"] = []string{}
			}
		case []interface{}:
			// Jika sudah array, konversi ke []string
			namaDokterArray := make([]string, 0, len(v))
			for _, item := range v {
				if str, ok := item.(string); ok && str != "" {
					namaDokterArray = append(namaDokterArray, str)
				}
			}
			rawData["nama_dokter"] = namaDokterArray
		case []string:
			// Sudah dalam format yang benar
			rawData["nama_dokter"] = v
		default:
			rawData["nama_dokter"] = []string{}
		}
	}

	// Konversi map ke BillingRequest
	var input models.BillingRequest
	// Marshal dan unmarshal untuk konversi yang aman
	jsonData, err := json.Marshal(rawData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Gagal memproses data",
			"error":   err.Error(),
		})
		return
	}

	if err := json.Unmarshal(jsonData, &input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Data tidak valid",
			"error":   err.Error(),
		})
		return
	}

	// Panggil service → return 5 data
	billing, pasien, tindakanList, icd9List, icd10List, err :=
		services.DataFromFE(input)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal membuat billing",
			"error":   err.Error(),
		})
		return
	}

	// Response lengkap ke FE
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Billing berhasil dibuat",
		"data": gin.H{
			"pasien":      pasien,
			"billing":     billing,
			"tindakan_rs": tindakanList,
			"icd9":        icd9List,
			"icd10":       icd10List,
		},
	})

}

// GetBillingAktifByNamaHandler - Ambil billing aktif berdasarkan nama
// Endpoint: GET /billing/aktif?nama_pasien=...
// Mengembalikan billing aktif + semua tindakan & ICD & dokter & INACBG & DPJP
func GetBillingAktifByNamaHandler(c *gin.Context) {
	nama := c.Query("nama_pasien")
	if strings.TrimSpace(nama) == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "nama_pasien wajib diisi",
		})
		return
	}

	billing, tindakan, icd9, icd10, dokter, inacbgRI, inacbgRJ, dpjp, err := services.GetBillingDetailAktifByNama(nama)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{
				"status":  "not_found",
				"message": "Billing aktif untuk pasien tersebut tidak ditemukan",
			})
			return
		}

		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data billing",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Billing aktif ditemukan",
		"data": gin.H{
			"billing":     billing,
			"tindakan_rs": tindakan,
			"icd9":        icd9,
			"icd10":       icd10,
			"dokter":      dokter,
			"inacbg_ri":   inacbgRI,
			"inacbg_rj":   inacbgRJ,
			"id_dpjp":     dpjp,
		},
	})
}

//search pasien by nama handler

func SearchPasienHandler(c *gin.Context) {
	nama := c.Query("nama")

	pasien, err := services.SearchPasienByNama(nama)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengambil data pasien",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   pasien,
	})
}

// Login dokter
func LoginDokterHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req models.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"status":  "error",
				"message": "Payload login tidak valid",
				"error":   err.Error(),
			})
			return
		}

		email := strings.TrimSpace(strings.ToLower(req.Email))

		var dokter models.Dokter
		if err := db.Where("LOWER(\"Email_UB\") = ? OR LOWER(\"Email_Pribadi\") = ?", email, email).
			First(&dokter).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				c.JSON(http.StatusUnauthorized, gin.H{
					"status":  "error",
					"message": "Email atau password salah",
				})
				return
			}

			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal memproses login",
				"error":   err.Error(),
			})
			return
		}

		// Password check — skip if password column is empty
		if dokter.Password != "" && dokter.Password != req.Password {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Email atau password salah",
			})
			return
		}

		token, err := middleware.GenerateToken(dokter, email)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"status":  "error",
				"message": "Gagal membuat token",
				"error":   err.Error(),
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"token":  token,
			"dokter": gin.H{
				"id":    dokter.ID_Dokter,
				"nama":  dokter.Nama_Dokter,
				"ksm":   dokter.KSM,
				"email": email,
			},
		})
	}
}

// SendEmailTestHandler handler untuk test email
func SendEmailTestHandler(c *gin.Context) {
	if err := services.SendEmailTest(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal mengirim email test",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Email test berhasil dikirim ke stylohype685@gmail.com dan pasaribumonica2@gmail.com",
	})
}

// SendEmailCustomHandler - kirim email tes ke daftar penerima yang diberikan
func SendEmailCustomHandler(c *gin.Context) {
	var req struct {
		To      []string `json:"to" binding:"required,min=1"`
		Subject string   `json:"subject"`
		Body    string   `json:"body"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"status": "error", "message": "Request harus JSON dengan field 'to' sebagai array email"})
		return
	}

	subject := req.Subject
	if strings.TrimSpace(subject) == "" {
		subject = "Test Email - Sistem Billing Care IT"
	}

	body := req.Body
	if strings.TrimSpace(body) == "" {
		body = "<p>Ini adalah email test dari sistem billing Care IT.</p>"
	}

	if err := services.SendEmailToMultiple(req.To, subject, body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"status": "error", "message": "Gagal mengirim email", "error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "success", "message": "Email test berhasil dikirim"})
}

func LoginAdminHandler(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			Nama_Admin string `json:"Nama_Admin" binding:"required"`
			Password   string `json:"Password" binding:"required"`
		}

		// Bind & validate
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Nama_Admin dan Password harus diisi",
			})
			return
		}

		// Trim dan normalize input
		namaAdmin := strings.TrimSpace(req.Nama_Admin)
		if namaAdmin == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Nama_Admin tidak boleh kosong",
			})
			return
		}

		// Query admin_ruangan dengan case-insensitive
		var admin models.Admin_Ruangan //Admin_Ruangan
		if err := db.Where("LOWER(\"Nama_Admin\") = ?", strings.ToLower(namaAdmin)).First(&admin).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Admin tidak ditemukan",
			})
			return
		}

		// Check password
		if admin.Password != req.Password {
			c.JSON(http.StatusUnauthorized, gin.H{
				"error": "Password salah",
			})
			return
		}

		// Generate token & return
		token, err := middleware.GenerateTokenAdmin(admin, req.Nama_Admin)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error": "Gagal membuat token",
			})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"status": "success",
			"token":  token,
			"admin": gin.H{
				"id":         admin.ID_Admin,
				"nama_admin": admin.Nama_Admin,
				"id_ruangan": admin.ID_Ruangan,
			},
		})
	}
}

// UpdateBillingHandler - update identitas pasien dalam billing
func UpdateBillingHandler(c *gin.Context) {
	idStr := c.Param("id")
	billingId, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "ID billing tidak valid",
			"error":   err.Error(),
		})
		return
	}

	// Parse request body
	var updateReq struct {
		Nama_Pasien    string   `json:"nama_pasien"`
		Usia           int      `json:"usia"`
		Jenis_Kelamin  string   `json:"jenis_kelamin"`
		Ruangan        string   `json:"ruangan"`
		Kelas          string   `json:"kelas"`
		Tindakan_Rs    []string `json:"tindakan_rs"`
		ICD9           []string `json:"icd9"`
		ICD10          []string `json:"icd10"`
		Billing_sign   *string  `json:"billing_sign"`   // Optional: jika dikirimkan akan diupdate
		Total_Tarif_RS *float64 `json:"total_tarif_rs"` // Optional: jika dikirimkan akan diupdate
	}

	if err := c.ShouldBindJSON(&updateReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Data tidak valid",
			"error":   err.Error(),
		})
		return
	}

	// Panggil service untuk update dengan lookup kode
	if err := services.EditPasienComplete(billingId, updateReq.Nama_Pasien, updateReq.Usia, updateReq.Jenis_Kelamin, updateReq.Ruangan, updateReq.Kelas, updateReq.Tindakan_Rs, updateReq.ICD9, updateReq.ICD10, updateReq.Billing_sign, updateReq.Total_Tarif_RS); err != nil {
		log.Printf("[EDIT_HANDLER] ERROR - Service returned error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal update data billing",
			"error":   err.Error(),
			"details": err.Error(), // Add details untuk debugging
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Data billing berhasil diupdate",
	})
}

// CloseBillingHandler - handler untuk menutup billing
func CloseBillingHandler(c *gin.Context) {
	var closeReq models.Close_billing

	// Pastikan JSON
	if c.GetHeader("Content-Type") != "application/json" {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Content-Type harus application/json",
		})
		return
	}

	if err := c.ShouldBindJSON(&closeReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"status":  "error",
			"message": "Data tidak valid",
			"error":   err.Error(),
		})
		return
	}

	if err := services.CloseBilling(closeReq); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": "Gagal menutup billing",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Billing berhasil ditutup",
	})
}

// GetRiwayatBillingHandler - Handler buat ngambil riwayat billing yang udah ditutup
func GetRiwayatBillingHandler(c *gin.Context) {
	data, err := services.GetAllRiwayatpasien(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   data,
	})
}

func GetAllBillingaktifhandler(c *gin.Context) {
	data, err := services.GetAllBillingaktif(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   data,
	})
}

// GetRiwayatPasienAllHandler - Handler buat ngambil riwayat pasien lengkap
func GetRiwayatPasienAllHandler(c *gin.Context) {
	data, err := services.GetRiwayatPasienAll(database.DB)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "error",
			"message": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   data,
	})
}
