-- Insert data dummy untuk admin ruangan
-- Username: admin
-- Password: admin123

-- Hapus data admin jika sudah ada (untuk testing)
DELETE FROM `admin_ruangan` WHERE `Nama_Admin` = 'admin';

-- Insert data admin baru
INSERT INTO `admin_ruangan` (`ID_Admin`, `Nama_Admin`, `Password`, `ID_Ruangan`) 
VALUES (1, 'admin', 'admin123', NULL);

-- Jika ID_Admin sudah ada, gunakan ID yang lebih tinggi
-- Atau biarkan AUTO_INCREMENT yang mengatur
-- INSERT INTO `admin_ruangan` (`Nama_Admin`, `Password`, `ID_Ruangan`) 
-- VALUES ('admin', 'admin123', NULL);

