package services

import (
	"errors"
	"fmt"
	"net/smtp"
	"os"
	"strings"

	"backendcareit/database"
	"backendcareit/models"

	"gorm.io/gorm"
)

// SendEmail - Ngirim email pake SMTP bro
func SendEmail(to, subject, body string) error {
	// Ambil konfigurasi dari env variable dulu, lebih aman
	from := os.Getenv("EMAIL_FROM")
	password := os.Getenv("EMAIL_PASSWORD")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")

	// Kalau env variable gak ada, pake default value (biar kompatibel sama versi lama)
	if from == "" {
		from = "careit565@gmail.com"
	}
	if password == "" {
		password = "gkhz bjax uamw xydf"
	}
	if smtpHost == "" {
		smtpHost = "smtp.gmail.com"
	}
	if smtpPort == "" {
		smtpPort = "587"
	}

	if from == "" || password == "" || smtpHost == "" || smtpPort == "" {
		return fmt.Errorf("konfigurasi email tidak lengkap. Pastikan EMAIL_FROM, EMAIL_PASSWORD, SMTP_HOST, dan SMTP_PORT sudah di-set")
	}

	// Setup authentication
	auth := smtp.PlainAuth("", from, password, smtpHost)

	// Format email message
	msg := []byte(fmt.Sprintf("To: %s\r\n", to) +
		fmt.Sprintf("Subject: %s\r\n", subject) +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" +
		body + "\r\n")

	// Send email
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	err := smtp.SendMail(addr, auth, from, []string{to}, msg)
	if err != nil {
		return fmt.Errorf("gagal mengirim email: %w", err)
	}

	return nil
}

// SendEmailToMultiple - Ngirim email ke banyak orang sekaligus
func SendEmailToMultiple(to []string, subject, body string) error {
	from := os.Getenv("EMAIL_FROM")
	password := os.Getenv("EMAIL_PASSWORD")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")

	if from == "" {
		from = "careit565@gmail.com"
	}
	if password == "" {
		password = "gkhz bjax uamw xydf"
	}
	if smtpHost == "" {
		smtpHost = "smtp.gmail.com"
	}
	if smtpPort == "" {
		smtpPort = "587"
	}

	if from == "" || password == "" || smtpHost == "" || smtpPort == "" {
		return fmt.Errorf("konfigurasi email tidak lengkap")
	}

	if len(to) == 0 {
		return fmt.Errorf("daftar penerima email tidak boleh kosong")
	}

	// Setup authentication
	auth := smtp.PlainAuth("", from, password, smtpHost)

	// Rapihin header To buat semua penerima
	toHeader := strings.Join(to, ", ")

	// Format email message
	msg := []byte(fmt.Sprintf("To: %s\r\n", toHeader) +
		fmt.Sprintf("Subject: %s\r\n", subject) +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" +
		body + "\r\n")

	// Kirim email ke semua orang sekaligus
	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	err := smtp.SendMail(addr, auth, from, to, msg)
	if err != nil {
		return fmt.Errorf("gagal mengirim email: %w", err)
	}

	return nil
}

// SendEmailTest - Cuma buat test kirim email ke teman-teman
func SendEmailTest() error {
	to := []string{"stylohype685@gmail.com", "pasaribumonica2@gmail.com", "yestondehaan607@gmail.com"}
	subject := "Test Email - Sistem Billing Care IT"
	body := `
		<html>
		<head>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
				.container { max-width: 600px; margin: 0 auto; padding: 20px; }
				.header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
				.content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
				.footer { margin-top: 20px; padding: 10px; text-align: center; font-size: 12px; color: #666; }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">
					<h2>Test Email - Sistem Billing Care IT</h2>
				</div>
				<div class="content">
					<p>Halo!</p>
					<p>Ini adalah email test dari sistem billing Care IT.</p>
					<p>Jika Anda menerima email ini, berarti sistem email berfungsi dengan baik.</p>
					<p>Terima kasih!</p>
				</div>
				<div class="footer">
					<p>Sistem Billing Care IT</p>
					<p>Email ini dikirim untuk keperluan testing.</p>
				</div>
			</div>
		</body>
		</html>
	`

	if err := SendEmailToMultiple(to, subject, body); err != nil {
		return fmt.Errorf("gagal mengirim email test: %w", err)
	}

	return nil
}

// SendEmailBillingSignToDokter mengirim email ke semua dokter yang menangani pasien tentang billing sign
func SendEmailBillingSignToDokter(idBilling int) error {
	// 1. Ambil billing berdasarkan ID_Billing
	var billing models.BillingPasien
	if err := database.DB.First(&billing, idBilling).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("billing dengan ID_Billing=%d tidak ditemukan", idBilling)
		}
		return fmt.Errorf("gagal mengambil billing: %w", err)
	}

	// 2. Ambil semua dokter dari billing_dokter
	var dokterList []models.Dokter
	if err := database.DB.
		Table("\"billing_dokter\" bd").
		Select("d.*").
		Joins("JOIN \"dokter\" d ON bd.\"ID_Dokter\" = d.\"ID_Dokter\"").
		Where("bd.\"ID_Billing\" = ?", idBilling).
		Find(&dokterList).Error; err != nil {
		return fmt.Errorf("gagal mengambil dokter: %w", err)
	}

	if len(dokterList) == 0 {
		return fmt.Errorf("tidak ada dokter yang terkait dengan billing ID_Billing=%d", idBilling)
	}

	// 3. Ambil data pasien untuk informasi lengkap
	var pasien models.Pasien
	if err := database.DB.Where("\"ID_Pasien\" = ?", billing.ID_Pasien).First(&pasien).Error; err != nil {
		return fmt.Errorf("gagal mengambil data pasien: %w", err)
	}

	// 4. Format billing sign untuk ditampilkan
	billingSignDisplay := strings.ToUpper(billing.Billing_sign)
	if billingSignDisplay == "" {
		billingSignDisplay = "Belum ditentukan"
	}

	// Untuk pengiriman ke dokter: kirim personalisasi per dokter (salam pakai nama dokter)
	// Kumpulkan alamat per dokter dan jalankan pengiriman secara async (goroutine)
	anyEmail := false
	subject := fmt.Sprintf("Notifikasi Billing Sign - Pasien: %s", pasien.Nama_Pasien)

	for _, dokter := range dokterList {
		// kumpulkan alamat untuk dokter ini
		addrs := make([]string, 0, 2)
		if e := strings.TrimSpace(dokter.Email_UB); e != "" {
			addrs = append(addrs, e)
		}
		if e := strings.TrimSpace(dokter.Email_Pribadi); e != "" {
			// hindari duplikat antara UB dan pribadi
			if len(addrs) == 0 || addrs[0] != e {
				addrs = append(addrs, e)
			}
		}

		if len(addrs) == 0 {
			continue
		}
		anyEmail = true

		// buat body yang dipersonalisasi untuk dokter ini
		doctorName := dokter.Nama_Dokter
		if doctorName == "" {
			doctorName = "Dokter"
		}

		bodyForDokter := fmt.Sprintf(`
			<html>
			<head>
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
					.content { background-color: #f9f9f9; padding: 20px; margin-top: 20px; }
					.info-row { margin: 10px 0; }
					.label { font-weight: bold; }
					.billing-sign { font-size: 18px; font-weight: bold; padding: 10px; text-align: center; margin: 20px 0; }
					.sign-hijau { background-color: #4CAF50; color: white; }
					.sign-kuning { background-color: #FFC107; color: #333; }
					.sign-orange { background-color: #FF9800; color: white; }
					.sign-merah { background-color: #F44336; color: white; }
					.footer { margin-top: 20px; padding: 10px; text-align: center; font-size: 12px; color: #666; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h2>Notifikasi Billing Sign</h2>
					</div>
					<div class="content">
						<p>Yth. Dr. %s,</p>
						<p>Berikut adalah informasi billing sign untuk pasien yang Anda tangani:</p>
						<div class="info-row"><span class="label">Nama Pasien:</span> %s</div>
						<div class="info-row"><span class="label">ID Billing:</span> %d</div>
						<div class="info-row"><span class="label">Ruangan:</span> %s</div>
						<div class="info-row"><span class="label">Kelas:</span> %s</div>
						<div class="info-row"><span class="label">Cara Bayar:</span> %s</div>
						<div class="info-row"><span class="label">Total Tarif RS:</span> Rp %.2f</div>
						<div class="info-row"><span class="label">Total Klaim BPJS:</span> Rp %.2f</div>
						<div class="billing-sign sign-%s">Billing Sign: %s</div>
						<p>Terima kasih atas perhatiannya.</p>
					</div>
					<div class="footer"><p>Sistem Billing Care IT</p><p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p></div>
				</div>
			</body>
			</html>
		`, doctorName, pasien.Nama_Pasien, billing.ID_Billing, pasien.Ruangan, pasien.Kelas,
			billing.Cara_Bayar, billing.Total_Tarif_RS, billing.Total_Klaim,
			strings.ToLower(billing.Billing_sign), billingSignDisplay)

		// kirim async ke alamat dokter ini
		go func(addrs []string, subj, body string, id int) {
			if err := SendEmailToMultiple(addrs, subj, body); err != nil {
				fmt.Printf("Warning: Gagal mengirim email ke %v untuk billing %d: %v\n", addrs, id, err)
			} else {
				fmt.Printf("Info: Email notifikasi terkirim ke %v untuk billing %d\n", addrs, id)
			}
		}(addrs, subject, bodyForDokter, billing.ID_Billing)
	}

	if !anyEmail {
		return fmt.Errorf("tidak ada dokter dengan email yang terdaftar untuk billing ID_Billing=%d", idBilling)
	}

	// Return immediately; actual sending berjalan di goroutine
	return nil
}
