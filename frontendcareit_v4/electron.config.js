// Electron Configuration
// API URL untuk backend Go
// Bisa diubah sesuai kebutuhan (local, production, dll)

module.exports = {
  // Production API URL - untuk distribusi aplikasi
  apiUrl: 'http://31.97.109.192:8081',
  
  // Untuk local development, uncomment baris di bawah dan comment baris di atas:
  // apiUrl: 'http://localhost:8081',
  
  // Atau gunakan environment variable (akan override config ini):
  // apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://31.97.109.192:8081',
};



