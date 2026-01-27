"use client";

import { useState, useEffect } from 'react';
import { FaArrowLeft, FaCalendarAlt, FaUser, FaBuilding, FaChevronDown } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-helper';

interface PasienDetail {
  id_billing: number;
  id_pasien: number;
  nama_pasien: string;
  jenis_kelamin: string;
  usia: number;
  ruangan: string;
  nama_ruangan?: string;
  kelas: string; // ← Changed to lowercase to match API
  tanggal_keluar: string;
  tanggal_masuk: string | null;
  tanggal_tindakan: string | null;
  tindakan_rs: string[];
  icd9: string[];
  icd10: string[]; 
  kode_inacbg: string;
  total_tarif_rs?: number;
  total_klaim?: number;
  id_dpjp?: number;
  nama_dpjp?: string;
  [key: string]: any;
}

interface TindakanWithDate {
  deskripsi: string;
  tanggal: string;
}

interface TarifData {
  KodeINA?: string;
  Deskripsi?: string;
  [key: string]: any;
}

interface PasienProps {
  billingId?: number;
  pasienName?: string;
  onBack?: () => void;
}

const Pasien = ({ billingId, pasienName, onBack }: PasienProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pasienData, setPasienData] = useState<PasienDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tindakanWithDates, setTindakanWithDates] = useState<TindakanWithDate[]>([]);
  const [selectedTanggal, setSelectedTanggal] = useState<string>('');
  const [availableTanggal, setAvailableTanggal] = useState<string[]>([]);
  const [tarifCache, setTarifCache] = useState<{[key: string]: string}>({});

  // Ambil billingId dari query params kalo gak ada di prop
  const queryBillingId = searchParams.get('billingId');
  const queryPasienName = searchParams.get('namaPasien');
  const finalBillingId = billingId || (queryBillingId ? parseInt(queryBillingId) : undefined);
  const finalPasienName = pasienName || queryPasienName || undefined;

  // Fetch detail data pasien dari billing yang udah closed
  useEffect(() => {
    const fetchPasienData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch riwayat pasien lengkap dari backend
        const response = await apiFetch("/admin/riwayat-pasien-all", { method: "GET" });
        
        if (response.error) {
          setError('Gagal memuat data riwayat pasien');
          setLoading(false);
          return;
        }

        // Extract data array dari response
        let billingDataArray: any[] = [];
        const responseData = response as any;
        if (Array.isArray(responseData.data)) {
          billingDataArray = responseData.data;
        } else if (responseData.data && Array.isArray(responseData.data.data)) {
          billingDataArray = responseData.data.data;
        }

        console.log('📊 Full Response:', responseData);
        console.log('📋 Billing Data Array:', billingDataArray);

        // Cari billing dengan ID yang sesuai
        const targetBillingId = parseInt(queryBillingId as string);
        const foundBilling = billingDataArray.find((item) => {
          return item.id_billing === targetBillingId;
        });

        console.log('🎯 Target Billing ID:', targetBillingId);
        console.log('✅ Found Billing:', foundBilling);

        if (foundBilling) {
          console.log('📦 Setting PasienData:', foundBilling);
          setPasienData(foundBilling);
          // Initialize tindakan with dates dari response
          const tindakanList = foundBilling.tindakan_rs || [];
          console.log('📋 Tindakan List:', tindakanList);
          const tindakanDates: TindakanWithDate[] = tindakanList.map((item: any) => {
            const desc = typeof item === 'string' ? item : item.deskripsi || '-';
            const tanggal = foundBilling.tanggal_tindakan ? formatDateForInput(foundBilling.tanggal_tindakan) : formatDateForInput(foundBilling.tanggal_masuk);
            console.log('📅 Tindakan item:', { desc, tanggal });
            return { deskripsi: desc, tanggal };
          });
          setTindakanWithDates(tindakanDates);
          
          // Generate available tanggal (dari tanggal_masuk sampai tanggal_keluar)
          const tanggalList = generateDateRange(foundBilling.tanggal_masuk, foundBilling.tanggal_keluar);
          console.log('📅 Available tanggal:', tanggalList);
          setAvailableTanggal(tanggalList);
          
          // Set default selected tanggal ke yang pertama
          if (tanggalList.length > 0) {
            setSelectedTanggal(tanggalList[0]);
            console.log('✅ Default selected tanggal:', tanggalList[0]);
          }

          // Fetch tarif data buat mapping kode -> deskripsi
          console.log('🔄 Fetching tarif data...');
          await fetchTarifData();
          console.log('✅ Tarif data fetch complete');
        } else {
          setError('Data pasien dengan billing ID tersebut tidak ditemukan dalam riwayat pasien');
        }
      } catch (err) {
        setError('Gagal memuat data pasien');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (queryBillingId) {
      fetchPasienData();
    }
  }, [queryBillingId]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  // Generate date range dari tanggal_masuk sampai tanggal_keluar
  const generateDateRange = (startDate: string | null, endDate: string | null): string[] => {
    if (!startDate || !endDate) return [];
    
    const dates: string[] = [];
    const current = new Date(startDate);
    const end = new Date(endDate);
    
    while (current <= end) {
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  // Fetch tarif data untuk mapping kode -> deskripsi
  const fetchTarifData = async () => {
    try {
      console.log('🔄 Starting fetchTarifData...');
      const [riResponse, rjResponse, tarifRSResponse, icd9Response, icd10Response] = await Promise.all([
        apiFetch("/tarifBPJSRawatInap", { method: "GET" }),
        apiFetch("/tarifBPJSRawatJalan", { method: "GET" }),
        apiFetch("/tarifRS", { method: "GET" }),
        apiFetch("/icd9", { method: "GET" }),
        apiFetch("/icd10", { method: "GET" }),
      ]);

      const cache: {[key: string]: string} = {};
      
      // Map RI data (INACBG)
      console.log('📋 riResponse:', riResponse);
      if (riResponse?.data && Array.isArray(riResponse.data)) {
        console.log('✅ RI Data is array, length:', riResponse.data.length);
        (riResponse.data as TarifData[]).forEach((item) => {
          if (item.KodeINA && item.Deskripsi) {
            cache[item.KodeINA] = item.Deskripsi;
          }
        });
      } else {
        console.log('⚠️ RI Data is not array or empty:', riResponse?.data);
      }
      
      // Map RJ data (INACBG)
      console.log('📋 rjResponse:', rjResponse);
      if (rjResponse?.data && Array.isArray(rjResponse.data)) {
        console.log('✅ RJ Data is array, length:', rjResponse.data.length);
        (rjResponse.data as TarifData[]).forEach((item) => {
          if (item.KodeINA && item.Deskripsi) {
            cache[item.KodeINA] = item.Deskripsi;
          }
        });
      } else {
        console.log('⚠️ RJ Data is not array or empty:', rjResponse?.data);
      }

      // Map Tarif RS data (Tindakan)
      console.log('📋 tarifRSResponse:', tarifRSResponse);
      if (tarifRSResponse?.data && Array.isArray(tarifRSResponse.data)) {
        console.log('✅ Tarif RS Data is array, length:', tarifRSResponse.data.length);
        (tarifRSResponse.data as TarifData[]).forEach((item) => {
          if (item.KodeINA && item.Deskripsi) {
            cache[item.KodeINA] = item.Deskripsi;
          }
        });
      } else {
        console.log('⚠️ Tarif RS Data is not array or empty:', tarifRSResponse?.data);
        console.log('📋 Checking first item structure:', (tarifRSResponse?.data as any)?.[0]);
      }

      // Map ICD9 data
      console.log('📋 icd9Response:', icd9Response);
      if (icd9Response?.data && Array.isArray(icd9Response.data)) {
        console.log('✅ ICD9 Data is array, length:', icd9Response.data.length);
        (icd9Response.data as TarifData[]).forEach((item) => {
          if (item.KodeINA && item.Deskripsi) {
            cache[item.KodeINA] = item.Deskripsi;
          }
        });
      } else {
        console.log('⚠️ ICD9 Data is not array or empty:', icd9Response?.data);
        console.log('📋 Checking first item structure:', (icd9Response?.data as any)?.[0]);
      }

      // Map ICD10 data
      console.log('📋 icd10Response:', icd10Response);
      if (icd10Response?.data && Array.isArray(icd10Response.data)) {
        console.log('✅ ICD10 Data is array, length:', icd10Response.data.length);
        (icd10Response.data as TarifData[]).forEach((item) => {
          if (item.KodeINA && item.Deskripsi) {
            cache[item.KodeINA] = item.Deskripsi;
          }
        });
      } else {
        console.log('⚠️ ICD10 Data is not array or empty:', icd10Response?.data);
        console.log('📋 Checking first item structure:', (icd10Response?.data as any)?.[0]);
      }

      console.log('✅ Final Tarif cache created with keys:', Object.keys(cache).length, 'items');
      console.log('📋 Cache content:', cache);
      setTarifCache(cache);
    } catch (err) {
      console.error('❌ Error fetching tarif data:', err);
    }
  };

  // Ambil deskripsi dari kode
  const getKodeDeskripsi = (kode: string): string => {
    if (!kode || kode === '-') return '-';
    
    const deskripsi = tarifCache[kode];
    console.log(`🔍 Looking for kode: "${kode}", found:`, deskripsi, 'cache keys:', Object.keys(tarifCache).slice(0, 5));
    
    if (deskripsi) {
      return `${kode} - ${deskripsi}`;
    }
    
    // Fallback: jika tidak ada di cache, tampilkan kode saja
    return kode;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return date;
    }
  };

  const formatDateForInput = (date: string | null | undefined) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const handleTindakanDateChange = (idx: number, newDate: string) => {
    const updated = [...tindakanWithDates];
    updated[idx].tanggal = newDate;
    setTindakanWithDates(updated);
  };

  // Ambil tindakan buat tanggal yang dipilih
  const getTindakanByDate = () => {
    if (!selectedTanggal) return [];
    const filtered = tindakanWithDates.filter(item => item.tanggal === selectedTanggal);
    console.log(`🔍 getTindakanByDate - selectedTanggal: ${selectedTanggal}, filtered:`, filtered);
    return filtered;
  };

  // Bikin combined data buat unified table
  const getCombinedTableData = () => {
    const icd9Array = (pasienData?.icd9 || []) as string[];
    const icd10Array = (pasienData?.icd10 || []) as string[];
    const inacbgCode = pasienData?.kode_inacbg || '';
    const tindakanByDate = getTindakanByDate();
    
    console.log('📊 getCombinedTableData called:');
    console.log('  - icd9Array:', icd9Array);
    console.log('  - icd10Array:', icd10Array);
    console.log('  - inacbgCode:', inacbgCode);
    console.log('  - tindakanByDate:', tindakanByDate);
    
    const maxRows = Math.max(
      tindakanByDate.length,
      icd9Array.length,
      icd10Array.length,
      inacbgCode ? 1 : 0
    );

    const data: Array<{tindakan: string; icd9: string; icd10: string; inacbg: string}> = [];
    for (let i = 0; i < maxRows; i++) {
      // Ambil ICD9 - BE kirim kode, tampilkan pake deskripsi
      const icd9Code = icd9Array[i] || '';
      const icd9Display = getKodeDeskripsi(icd9Code);

      // Ambil ICD10 - BE kirim kode, tampilkan pake deskripsi
      const icd10Code = icd10Array[i] || '';
      const icd10Display = getKodeDeskripsi(icd10Code);

      // Ambil INACBG - BE kirim kode tunggal (cuma di baris pertama), tampilkan pake deskripsi
      const inacbgDisplay = i === 0 ? getKodeDeskripsi(inacbgCode) : '';

      // Ambil Tindakan - BE kirim kode, tampilkan pake deskripsi
      const tindakanDesc = tindakanByDate[i]?.deskripsi || '';
      const tindakanDisplay = getKodeDeskripsi(tindakanDesc);

      console.log(`📝 Row ${i}:`, { tindakanDisplay, icd10Display, icd9Display, inacbgDisplay });

      data.push({
        tindakan: tindakanDisplay,
        icd9: icd9Display,
        icd10: icd10Display,
        inacbg: inacbgDisplay,
      });
    }
    console.log('✅ Final combined data:', data);
    return data;
  };

  const getNamaPasien = () => pasienData?.nama_pasien || pasienName || 'N/A';
  const getUsia = () => pasienData?.usia?.toString() || '-';
  const getGender = () => pasienData?.jenis_kelamin || '-';
  const getRuangan = () => pasienData?.nama_ruangan || '-';
  const getKelas = () => pasienData?.kelas || '-'; // ← Changed to lowercase
  const getTanggalMasuk = () => formatDate(pasienData?.tanggal_masuk);
  const getTanggalKeluar = () => formatDate(pasienData?.tanggal_keluar);
  const getTanggalMasukForInput = () => formatDateForInput(pasienData?.tanggal_masuk);
  const getTanggalKeluarForInput = () => formatDateForInput(pasienData?.tanggal_keluar);
  const getDPJP = () => pasienData?.nama_dpjp ? pasienData.nama_dpjp : '-';
  const getTotalTarifRS = () => {
    const total = pasienData?.total_tarif_rs;
    if (typeof total === 'number') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(total);
    }
    return '-';
  };
  const getTotalKlaim = () => {
    const total = pasienData?.total_klaim;
    if (typeof total === 'number') {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(total);
    }
    return '-';
  };
  const getTindakan = () => pasienData?.tindakan_rs || [];
  const getICD9 = () => pasienData?.icd9 || [];
  const getICD10 = () => pasienData?.icd10 || [];
  const getINACBG = () => pasienData?.kode_inacbg ? [pasienData.kode_inacbg] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="text-lg text-[#2591D0] mb-4">Memuat data pasien...</div>
          <div className="animate-spin h-8 w-8 border-4 border-[#2591D0] border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 bg-white w-full max-w-full min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#2591D0] hover:text-[#1e7ba8] transition font-semibold text-sm sm:text-base"
        >
          <FaArrowLeft className="text-sm sm:text-base" />
        </button>
      </div>

      {/* Date */}
      <div className="mb-2 sm:mb-3">
        <div className="text-xs sm:text-sm text-[#2591D0]">
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Title */}
      <div className="text-lg sm:text-xl text-[#2591D0] mb-3 sm:mb-6 font-bold">Detail Pasien</div>

      {/* Error Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Content */}
      {!pasienData ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada data pasien yang ditemukan
        </div>
      ) : (
        <div className="w-full max-w-full space-y-4 sm:space-y-6">
          {/* Informasi Pasien - Key Details */}
          <div className="w-full max-w-full">
            {/* Nama Lengkap */}
            <div className="ml-0 sm:ml-4 mb-3 sm:mb-4">
              <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={getNamaPasien()}
                disabled
                className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* ID Pasien, Kelas, Usia - Three Columns */}
            <div className="ml-0 sm:ml-4 mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-6 sm:gap-y-3 md:gap-y-4 w-full max-w-full">
              <div>
                <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">ID Pasien</label>
                <input
                  type="text"
                  value={pasienData?.id_pasien || '-'}
                  disabled
                  className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">Kelas</label>
                <input
                  type="text"
                  value={getKelas()}
                  disabled
                  className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">Usia</label>
                <input
                  type="text"
                  value={`${getUsia()} tahun`}
                  disabled
                  className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Ruangan, Jenis Kelamin - Two Columns */}
            <div className="ml-0 sm:ml-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-6 sm:gap-y-3 md:gap-y-4 w-full max-w-full">
              <div>
                <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">Ruangan</label>
                <input
                  type="text"
                  value={getRuangan()}
                  disabled
                  className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">Jenis Kelamin</label>
                <input
                  type="text"
                  value={getGender()}
                  disabled
                  className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Tanggal Masuk, Tanggal Keluar - Two Columns */}
            <div className="ml-0 sm:ml-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-6 sm:gap-y-3 md:gap-y-4 w-full max-w-full">
              <div>
                <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">Tanggal Masuk</label>
                <input
                  type="text"
                  value={getTanggalMasuk()}
                  disabled
                  className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">Tanggal Keluar</label>
                <input
                  type="text"
                  value={getTanggalKeluar()}
                  disabled
                  className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* DPJP */}
            <div className="ml-0 sm:ml-4 mt-2">
              <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">DPJP</label>
              <input
                type="text"
                value={getDPJP()}
                disabled
                className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Total Tarif RS dan Total Klaim - Two Columns */}
            <div className="ml-0 sm:ml-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-x-3 md:gap-x-4 lg:gap-x-6 sm:gap-y-3 md:gap-y-4 w-full max-w-full">
              <div>
                <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">Total Tarif RS</label>
                <input
                  type="text"
                  value={getTotalTarifRS()}
                  disabled
                  className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm sm:text-md text-[#2591D0] mb-1 sm:mb-2 font-bold">Total Klaim</label>
                <input
                  type="text"
                  value={getTotalKlaim()}
                  disabled
                  className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-[#2591D0] bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Detail Tindakan & Diagnosa Table */}
          <div className="w-full max-w-full">
            <div className="ml-0 sm:ml-4 text-sm sm:text-md text-[#2591D0] mb-2 sm:mb-3 font-bold">
              <p className="mb-2 sm:mb-3">Detail Tindakan & Diagnosa</p>
            </div>

            {/* Date Selector Dropdown */}
            {availableTanggal.length > 0 && (
              <div className="ml-0 sm:ml-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <label className="text-sm font-semibold text-[#2591D0]">Pilih Tanggal Tindakan:</label>
                <div className="relative w-full sm:w-auto">
                  <select
                    value={selectedTanggal}
                    onChange={(e) => setSelectedTanggal(e.target.value)}
                    className="w-full sm:w-64 border border-blue-200 rounded-lg py-2 px-3 text-sm text-[#2591D0] bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none"
                  >
                    {availableTanggal.map((tanggal) => (
                      <option key={tanggal} value={tanggal}>
                        {new Date(tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </option>
                    ))}
                  </select>
                  <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none text-sm" />
                </div>
              </div>
            )}

            {getCombinedTableData().length > 0 ? (
              <div className="overflow-x-auto border border-blue-200 rounded-lg">
                <table className="w-full border-collapse text-xs sm:text-sm md:text-base">
                  <thead>
                    <tr className="bg-blue-100 border-b border-blue-200">
                      <th className="border border-blue-200 p-3 md:p-4 text-left font-semibold text-[#2591D0] min-w-[200px]">Tindakan</th>
                      <th className="border border-blue-200 p-3 md:p-4 text-left font-semibold text-[#2591D0] min-w-[200px]">ICD 10</th>
                      <th className="border border-blue-200 p-3 md:p-4 text-left font-semibold text-[#2591D0] min-w-[200px]">ICD 9</th>
                      <th className="border border-blue-200 p-3 md:p-4 text-left font-semibold text-[#2591D0] min-w-[160px]">INACBG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCombinedTableData().map((row, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                        <td className="border border-blue-200 p-3 md:p-4 text-[#2591D0] break-words font-medium">
                          {row.tindakan || '-'}
                        </td>
                        <td className="border border-blue-200 p-3 md:p-4 text-[#2591D0] break-words">
                          {row.icd10 || '-'}
                        </td>
                        <td className="border border-blue-200 p-3 md:p-4 text-[#2591D0] break-words">
                          {row.icd9 || '-'}
                        </td>
                        <td className="border border-blue-200 p-3 md:p-4 text-[#2591D0] break-words font-medium">
                          {row.inacbg || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500 text-sm">
                Tidak ada data yang tercatat untuk tanggal yang dipilih
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Pasien;
