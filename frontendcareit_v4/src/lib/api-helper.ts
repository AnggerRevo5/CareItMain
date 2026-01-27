// Helper function untuk API calls - langsung ke backend Go tanpa melalui Next.js API routes
// Semua platform (Web, Electron, Mobile) langsung memanggil backend Go

// Detect if running in Electron
const isElectron = typeof window !== 'undefined' && 
  ((window as any).__ELECTRON__ === true ||
   (window as any).electron !== undefined || 
   (window as any).process?.type === 'renderer' ||
   navigator.userAgent.toLowerCase().includes('electron'));

// Detect if running in Capacitor (mobile app)
const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor !== undefined;

// Get API base URL based on platform - selalu ke backend Go langsung
export const getApiBaseUrl = (): string => {
  if (isElectron) {
    // Electron app: direct backend call
    const electronApiUrl = typeof window !== 'undefined' ? (window as any).__API_URL__ : undefined;
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const defaultApiUrl = "http://31.97.109.192:8082";
    const finalUrl = electronApiUrl || envApiUrl || defaultApiUrl;
    // Debug logging
    console.log('🔧 API URL Configuration:', { isElectron, electronApiUrl, envApiUrl, defaultApiUrl, finalUrl });
    return finalUrl;
  } else if (isCapacitor) {
    // Mobile app: direct backend call (Android emulator)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://31.97.109.192:8082";
    console.log('🔧 Mobile API URL:', apiUrl);
    return apiUrl;
  } else {
    // Web browser: direct backend call (tidak lagi melalui Next.js API routes)
    const windowApiUrl = typeof window !== 'undefined' ? (window as any).__API_URL__ : undefined;
    const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
    const defaultApiUrl = "http://localhost:8081";
    const apiUrl = windowApiUrl || envApiUrl || defaultApiUrl;
    // Debug logging
    console.log('🔧 Web API URL Configuration:', { windowApiUrl, envApiUrl, defaultApiUrl, finalUrl: apiUrl });
    return apiUrl;
  }
};

// Export a resolved base URL for consumers that need it
export const API_BASE_URL = getApiBaseUrl();

// Generic fetch function - selalu memanggil backend Go langsung
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const API_BASE = getApiBaseUrl();

  // Build URL - selalu ke backend Go langsung
  // Remove /api prefix jika ada, karena endpoint backend Go tidak menggunakan prefix /api
  const cleanEndpoint = endpoint.startsWith("/api/") 
    ? endpoint.substring(4) 
    : endpoint.startsWith("/") 
      ? endpoint 
      : `/${endpoint}`;

  const url = `${API_BASE}${cleanEndpoint}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          return { error: "Request timeout - Server tidak merespon dalam 30 detik", status: 408 };
        }
        if (fetchError.message.includes("fetch") || fetchError.message.includes("ECONNREFUSED") || fetchError.message.includes("ENOTFOUND") || fetchError.message.includes("CORS")) {
          return { error: `Tidak dapat terhubung ke server backend (${API_BASE}). Pastikan backend server berjalan dan dapat diakses.`, status: 0 };
        }
      }
      return { error: fetchError instanceof Error ? fetchError.message : "Terjadi kesalahan yang tidak diketahui", status: 500 };
    }

    // Handle response
    let data: any;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      try {
        const text = await response.text();
        if (!text || text.trim() === '') {
          return { error: "Empty response from server", status: response.status };
        }
        data = JSON.parse(text);
      } catch (jsonError) {
        const text = await response.text().catch(() => "Unable to read response");
        return { error: `Invalid JSON response: ${text.substring(0, 200)}`, status: response.status };
      }
    } else {
      const text = await response.text().catch(() => "Unable to read response");
      return { error: text || "Request failed", status: response.status };
    }

    if (!response.ok) {
      return { error: data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`, status: response.status };
    }

    return { data, status: response.status };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("fetch") || error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND") || error.message.includes("CORS")) {
        return { error: `Tidak dapat terhubung ke server backend (${API_BASE}). Pastikan backend server berjalan di ${API_BASE} dan dapat diakses.`, status: 0 };
      }
    }
    return { error: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui", status: 500 };
  }
}

// Type definitions
export interface Dokter {
  id: number;
  nama: string;
  email: string;
}

export interface Ruangan {
  id: number;
  nama: string;
}

export interface ICD9 {
  kode: string;
  deskripsi: string;
}

export interface ICD10 {
  kode: string;
  deskripsi: string;
}

export interface TarifData {
  kode: string;
  deskripsi: string;
  harga: number;
}

export interface TarifBPJSRawatInap {
  kode: string;
  deskripsi: string;
  tarif: number;
}

export interface TarifBPJSRawatJalan {
  kode: string;
  deskripsi: string;
  tarif: number;
}

export interface BillingRequest {
  nama_pasien: string;
  id_pasien?: number;
  jenis_kelamin: string;
  usia: number;
  ruangan: string;
  kelas: string;
  nama_dokter: string[];
  tindakan_rs: string[];
  billing_sign: string;
  tanggal_masuk: string;
  tanggal_keluar: string;
  icd9: string[];
  icd10: string[];
  cara_bayar: string;
  total_tarif_rs: number;
  total_klaim_bpjs?: number; // ← Added: Baseline BPJS claim from FE
  id_dpjp?: number; // ← Added: Doctor In Charge (DPJP) ID
}

export interface LoginResponse {
  token: string;
  dokter?: Dokter;
  admin?: { id: number; nama_admin: string };
}

export interface CloseBilling{
  id_billing: number;
  tanggal_keluar: string;
}

// API Functions
export async function getDokter() {
  return apiFetch<Dokter[]>("/dokter", { method: "GET" });
}

export async function CloseBilling() {
  return apiFetch<CloseBilling[]>("/billing/close", { method: "post" });
  
}
export async function getRuangan() {
  return apiFetch<Ruangan[]>("/ruangan", { method: "GET" });
}

export async function getICD9() {
  return apiFetch<ICD9[]>("/icd9", { method: "GET" });
}

export async function getICD10() {
  return apiFetch<ICD10[]>("/icd10", { method: "GET" });
}

export async function getTarifRumahSakit() {
  return apiFetch<TarifData[]>("/tarifRS", { method: "GET" });
}

export async function getTarifBPJSRawatInap() {
  return apiFetch<TarifBPJSRawatInap[]>("/tarifBPJSRawatInap", { method: "GET" });
}

export async function getTarifBPJSRawatJalan() {
  return apiFetch<TarifBPJSRawatJalan[]>("/tarifBPJSRawatJalan", { method: "GET" });
}

export async function getTarifBPJSInacbgRI() {
  return apiFetch<TarifBPJSRawatInap[]>("/tarifBPJSRawatInap", { method: "GET" });
}

export async function getTarifBPJSInacbgRJ() {
  return apiFetch<TarifBPJSRawatJalan[]>("/tarifBPJSRawatJalan", { method: "GET" });
}

export async function searchPasien(nama: string) {
  return apiFetch(`/pasien/search?nama=${encodeURIComponent(nama)}`, { method: "GET" });
}

export async function createBilling(billingData: BillingRequest) {
  return apiFetch("/billing", { 
    method: "POST", 
    body: JSON.stringify(billingData) 
  });
}

export async function getAllBilling() {
  return apiFetch("/admin/billing", { method: "GET" });
}

export async function getRiwayatBilling() {
  return apiFetch("/admin/riwayat-pasien-all", { method: "GET" }); // return apiFetch("/admin/riwayat-billing", { method: "GET" });
}

export async function editINACBG(id: number) {
  return apiFetch(`/admin/inacbg`, { method: "PUT" });
}

export async function getallbilingaktif() {
  return apiFetch("/billing/aktif/all", { method: "GET" });
}

export async function getBillingAktifByNama(nama: string) {
  return apiFetch(`/billing/aktif?nama_pasien=${encodeURIComponent(nama)}`, { method: "GET" });
}

export async function loginDokter(credentials: { email: string; password: string }) {
  return apiFetch<LoginResponse>("/login", { 
    method: "POST", 
    body: JSON.stringify(credentials) 
  });
}

export async function loginAdmin(credentials: { nama_admin: string; password: string }) {
  return apiFetch<LoginResponse>("/admin/login", { 
    method: "POST", 
    body: JSON.stringify(credentials) 
  });
}

