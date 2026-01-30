// API Configuration and Utilities
// Auto-detect platform: use Next.js API routes for web, direct backend calls for mobile/Electron

// Detect if running in Capacitor (mobile app)
const isCapacitor = typeof window !== 'undefined' &&
  (window as any).Capacitor !== undefined;

// Detect if running in Electron (desktop app)
const isElectron = typeof window !== 'undefined' &&
  (window as any).electron !== undefined;

// All platforms: use direct backend URL
const getApiBaseUrl = (): string => {
  if (isCapacitor) {
    // Mobile app: direct backend call
    return process.env.NEXT_PUBLIC_API_URL || "http://31.97.109.192:8082";
  } else if (isElectron) {
    // Electron desktop app: direct backend call
    return process.env.NEXT_PUBLIC_API_URL || "http://31.97.109.192:8082";
  } else {
    // Web browser: direct backend call
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
  }
};

const API_BASE_URL = getApiBaseUrl();


interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

// Generic API fetch function
export async function apiRequest<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { timeout = 10000, ...fetchOptions } = options;

  // Build URL based on platform
  let url: string;

  // All platforms use direct backend call
  const cleanEndpoint = endpoint.startsWith("/api/")
    ? endpoint.substring(4) // Remove "/api"
    : endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
  url = `${API_BASE_URL}${cleanEndpoint}`;


  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...fetchOptions.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error:
          errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          error:
            "Request timeout - Server tidak merespon dalam waktu yang ditentukan",
          status: 408,
        };
      }

      // Network errors
      if (error.message.includes("fetch")) {
        return {
          error: `Tidak dapat terhubung ke server (${API_BASE_URL}). Pastikan backend server berjalan.`,
          status: 0,
        };
      }
    }

    return {
      error:
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan yang tidak diketahui",
      status: 500,
    };
  }
}

// Specific API functions for Tarif Rumah Sakit
export interface TarifData {
  KodeRS: string;
  Deskripsi: string;
  Harga: number;
  Kategori: string;
}

export interface TarifQueryParams {
  kategori?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getTarifRumahSakit(
  params: TarifQueryParams = {}
): Promise<ApiResponse<TarifData[]>> {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      queryParams.append(key, value.toString());
    }
  });

  const endpoint = `/api/tarifRS${queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;
  return apiRequest<TarifData[]>(endpoint);
}

export async function createTarifRumahSakit(
  data: TarifData
): Promise<ApiResponse<TarifData>> {
  return apiRequest<TarifData>("/api/tarifRS", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTarifRumahSakit(
  kodeRS: string,
  data: Partial<TarifData>
): Promise<ApiResponse<TarifData>> {
  return apiRequest<TarifData>(`/api/tarifRS/${kodeRS}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTarifRumahSakit(
  kodeRS: string
): Promise<ApiResponse<void>> {
  return apiRequest<void>(`/api/tarifRS/${kodeRS}`, {
    method: "DELETE",
  });
}

// Health check function
export async function checkBackendHealth(): Promise<
  ApiResponse<{ status: string; message: string }>
> {
  // Health check can use any endpoint, using login as it's lightweight
  return apiRequest("/api/login", {
    method: "POST",
    body: JSON.stringify({ email: "healthcheck", password: "healthcheck" }),
    timeout: 3000,
  });
}

// ============ LOGIN API ============
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  token: string;
  dokter: {
    id: number;
    nama: string;
    ksm: string;
    email: string;
  };
}

export async function loginDokter(
  credentials: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  // Validate credentials before sending
  if (!credentials.email || !credentials.password) {
    return {
      error: "Email/username dan password harus diisi",
      status: 400,
    };
  }

  // Ensure credentials are properly formatted
  const payload = {
    email: credentials.email.trim(),
    password: credentials.password.trim(),
  };

  // Ensure body is not empty
  const bodyString = JSON.stringify(payload);
  if (!bodyString || bodyString === "{}") {
    return {
      error: "Payload tidak valid",
      status: 400,
    };
  }

  return apiRequest<LoginResponse>("/api/login", {
    method: "POST",
    body: bodyString,
  });
}

// Admin login request/response types
export interface AdminLoginRequest {
  nama_admin: string;
  password: string;
}

export interface AdminLoginResponse {
  status: string;
  token: string;
  admin: {
    id: number;
    nama_admin: string;
    id_ruangan: string;
  };
}

export async function loginAdmin(
  credentials: AdminLoginRequest
): Promise<ApiResponse<AdminLoginResponse>> {
  // Validate credentials before sending
  if (!credentials.nama_admin || !credentials.password) {
    return {
      error: "Username dan password harus diisi",
      status: 400,
    };
  }

  // Ensure credentials are properly formatted
  const payload = {
    Nama_Admin: credentials.nama_admin.trim(),
    Password: credentials.password.trim(),
  };

  // Ensure body is not empty
  const bodyString = JSON.stringify(payload);
  if (!bodyString || bodyString === "{}") {
    return {
      error: "Payload tidak valid",
      status: 400,
    };
  }

  return apiRequest<AdminLoginResponse>("/api/admin/login", {
    method: "POST",
    body: bodyString,
  });
}

// ============ DOKTER API ============
export interface Dokter {
  ID_Dokter: number;
  Nama_Dokter: string;
  KSM: string;
  Email_UB: string;
  Email_Pribadi: string;
  Status: string;
}

export async function getDokter(): Promise<ApiResponse<Dokter[]>> {
  return apiRequest<Dokter[]>("/api/dokter");
}

// ============ RUANGAN API ============
export interface Ruangan {
  ID_Ruangan: string;
  Jenis_Ruangan: string;
  Nama_Ruangan: string;
  Keterangan: string;
  Kategori_ruangan: string;
}

export async function getRuangan(): Promise<ApiResponse<Ruangan[]>> {
  return apiRequest<Ruangan[]>("/api/ruangan");
}

// ============ ICD9 API ============
export interface ICD9 {
  Kode_ICD9: string;
  Prosedur: string;
  Versi: string;
}

export async function getICD9(): Promise<ApiResponse<ICD9[]>> {
  return apiRequest<ICD9[]>("/api/icd9");
}

// ============ ICD10 API ============
export interface ICD10 {
  Kode_ICD10: string;
  Diagnosa: string;
  Versi: string;
}

export async function getICD10(): Promise<ApiResponse<ICD10[]>> {
  return apiRequest<ICD10[]>("/api/icd10");
}

// ============ TARIF BPJS API ============
export interface TarifBPJSRawatInap {
  KodeINA: string;
  Deskripsi: string;
  Kelas1: number;
  Kelas2: number;
  Kelas3: number;
}

export interface TarifBPJSRawatJalan {
  KodeINA: string;
  Deskripsi: string;
  TarifINACBG: number;
  tarif_inacbg?: number; // Backend sends this field name
}

export async function getTarifBPJSRawatInap(): Promise<
  ApiResponse<TarifBPJSRawatInap[]>
> {
  return apiRequest<TarifBPJSRawatInap[]>("/api/tarifBPJSRawatInap");
}

export async function getTarifBPJSRawatInapByKode(
  kode: string
): Promise<ApiResponse<TarifBPJSRawatInap>> {
  return apiRequest<TarifBPJSRawatInap>(`/api/tarifBPJS/${kode}`);
}

export async function getTarifBPJSRawatJalan(): Promise<
  ApiResponse<TarifBPJSRawatJalan[]>
> {
  return apiRequest<TarifBPJSRawatJalan[]>("/api/tarifBPJSRawatJalan");
}

export async function getTarifBPJSRawatJalanByKode(
  kode: string
): Promise<ApiResponse<TarifBPJSRawatJalan>> {
  return apiRequest<TarifBPJSRawatJalan>(`/api/tarifBPJSRawatJalan/${kode}`);
}

// ============ TARIF RS API (already exists, but adding detail function) ============
export async function getTarifRSByKode(
  kode: string
): Promise<ApiResponse<TarifData>> {
  return apiRequest<TarifData>(`/api/tarifRS/${kode}`);
}

export async function getTarifRSByKategori(
  kategori: string
): Promise<ApiResponse<TarifData[]>> {
  // Backend uses path parameter: /tarifRSByKategori/:kategori
  return apiRequest<TarifData[]>(`/api/tarifRSByKategori/${encodeURIComponent(kategori)}`);
}

// ============ PASIEN API ============
export interface Pasien {
  ID_Pasien: number;
  Nama_Pasien: string;
  Jenis_Kelamin: string;
  Usia: number;
  Ruangan: string;
  Kelas: string;
}

export async function getPasienById(
  id: number
): Promise<ApiResponse<{ message: string; data: Pasien }>> {
  return apiRequest<{ message: string; data: Pasien }>(`/api/pasien/${id}`);
}

export async function searchPasien(
  nama: string
): Promise<ApiResponse<{ status: string; data: Pasien[] }>> {
  return apiRequest<{ status: string; data: Pasien[] }>(
    `/api/pasien/search?nama=${encodeURIComponent(nama)}`
  );
}

// ============ BILLING API ============
export interface BillingRequest {
  nama_dokter: string[];
  nama_pasien: string;
  id_pasien?: number;
  jenis_kelamin: string;
  usia: number;
  ruangan: string;
  kelas: string;
  tindakan_rs: string[];
  billing_sign?: string | null;
  tanggal_masuk?: string;
  tanggal_keluar?: string;
  icd9: string[];
  icd10: string[];
  cara_bayar: string;
  total_tarif_rs: number;
  total_klaim_bpjs?: number; // ← Added: Baseline BPJS claim amount from FE
}

export interface BillingResponse {
  status: string;
  message: string;
  data: {
    pasien: Pasien;
    billing: {
      ID_Billing: number;
      ID_Pasien: number;
      Total_Tarif_RS: number;
      [key: string]: any;
    };
    tindakan_rs: any[];
    icd9: any[];
    icd10: any[];
  };
}

export async function createBilling(
  data: BillingRequest
): Promise<ApiResponse<BillingResponse>> {
  return apiRequest<BillingResponse>("/api/billing", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface BillingAktifResponse {
  status: string;
  message: string;
  data: {
    billing: any;
    tindakan_rs: any[];
    icd9: any[];
    icd10: any[];
  };
}

export async function getBillingAktifByNama(
  namaPasien: string
): Promise<ApiResponse<BillingAktifResponse>> {
  return apiRequest<BillingAktifResponse>(
    `/api/billing/aktif?nama_pasien=${encodeURIComponent(namaPasien)}`
  );
}

// ============ ADMIN BILLING API ============
export async function getAllBilling(): Promise<
  ApiResponse<{ status: string; data: any[] }>
> {
  return apiRequest<{ status: string; data: any[] }>("/api/admin/billing");
}

export async function getBillingById(
  id: number
): Promise<ApiResponse<any>> {
  return apiRequest<any>(`/api/admin/billing/${id}`);
}

export async function getRuanganDenganPasien(): Promise<
  ApiResponse<any[]>
> {
  return apiRequest<any[]>("/api/admin/ruangan-dengan-pasien");
}

export interface PostINACBGRequest {
  id_billing: number;
  tipe_inacbg: string;
  kode_inacbg: string[];
  total_klaim: number;
  billing_sign: string;
  tanggal_keluar: string;
}

export async function postINACBGAdmin(
  data: PostINACBGRequest
): Promise<ApiResponse<{ status: string; message: string }>> {
  return apiRequest<{ status: string; message: string }>("/api/admin/inacbg", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// API_BASE_URL is now "/api" for Next.js API routes
export { API_BASE_URL };
