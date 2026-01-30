{
  "nama_dokter": "dr. Fadilah Muttaqin, Spp.A,MBiomed",
  "nama_pasien": "Budi Hartono",
  "jenis_kelamin": "Laki-laki",
  "usia": 40,
  "ruangan": "ICU",
  "kelas": "1",
  "tindakan_rs": [
    "ASUHAN KEFARMASIAN SELAMA PERAWATAN - RAWAT INAP",
    "BERCAK DARAH KERING"
  ],
  "icd9": [
    "Therapeutic ultrasound",
    "Therapeutic ultrasound of vessels of head and neck"
  ],
  "icd10": [
    "Cholera",
    "Cholera due to vibrio cholerae 01, biovar eltor"
  ],
  "cara_bayar": "UMUM",
  "total_tarif_rs": 250000
}
FE harus kirim gini


data untuk admin  dari be:
{
    "data": [
        {
            "nama_pasien": "mahdi Jamaludin",
            "id_pasien": 1,
            "Kelas": "2",
            "ruangan": "R. Nusa Dua",
            "total_tarif_rs": 150000,
            "tindakan_rs": [
                "DAR.001",
                "DAR.002"
            ],
            "icd9": [
                "00.0",
                "00"
            ],
            "icd10": [
                "A00",
                "A00.0"
            ]
        }
    ],
    "status": "success"
}


		if strings.TrimSpace(dokter.Password) == "" || dokter.Password != req.Password {
			c.JSON(http.StatusUnauthorized, gin.H{
				"status":  "error",
				"message": "Email atau password salah",
			})
			return
		}

    {
    "dokter": {
        "email": "hajengwulandari.fk@ub.ac.id",
        "id": 2,
        "ksm": "Anak",
        "nama": "dr. Hajeng Wulandari, Sp.A, Mbiomed"
    },
    "status": "success",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhamVuZ3d1bGFuZGFyaS5ma0B1Yi5hYy5pZCIsImV4cCI6MTc2NDc1NzIxMCwiaWF0IjoxNzY0NjcwODEwLCJpZCI6Miwia3NtIjoiQW5hayIsIm5hbWEiOiJkci4gSGFqZW5nIFd1bGFuZGFyaSwgU3AuQSwgTWJpb21lZCJ9.X1PyxjbC1Ht3DFbvi4svqXY4hsNIS_nmYMROkRaK-Ko"
}
jadi data yang dihitung cuma yang rawat inap nanti yang isi tanggal keluar berarti admin billing dan nanti total tarif dan total klaim nanti di tampilin juga ketika datanya di tampilin sama kaya tindakan dan tarif rs nanti di admin billing juga bisa liat data tindakan lama dan icd lama dan tindakan baru dan icd bari dan inacbg lama dan inacbg baru plus total tarif yang lama di tambah yang barui dan total klaim lama nanti setelah dimasukan ditambah lagi sama total klaim baru baru dihitung billing sign baru paham gak