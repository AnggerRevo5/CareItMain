"use client";
import React, { useState, useEffect, useRef } from 'react';
import { FaTrash, FaPlus, FaChevronDown } from 'react-icons/fa';
import { getRuangan, getTarifRumahSakit, getICD9, getICD10, getApiBaseUrl, type Ruangan, type TarifData, type ICD9, type ICD10 } from '@/lib/api-helper';

interface EditPasienModalProps {
  isOpen: boolean;
  billingId: number;
  currentData: {
    nama_pasien: string;
    usia: number;
    jenis_kelamin: string;
    ruangan: string;
    kelas: string;
    tindakan_rs?: string[];
    icd9?: string[];
    icd10?: string[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

const EditPasienModal: React.FC<EditPasienModalProps> = ({
  isOpen,
  billingId,
  currentData,
  onClose,
  onSuccess,
}) => {
  const [nama, setNama] = useState('');
  const [usia, setUsia] = useState('');
  const [gender, setGender] = useState('');
  const [ruangan, setRuangan] = useState(''); // Store nama_ruangan
  const [ruanganId, setRuanganId] = useState(''); // Store ID_Ruangan
  const [ruanganSearch, setRuanganSearch] = useState('');
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);
  const [ruanganDropdownOpen, setRuanganDropdownOpen] = useState(false);
  const ruanganInputRef = useRef<HTMLInputElement>(null);
  const ruanganDropdownRef = useRef<HTMLDivElement>(null);
  
  const [kelas, setKelas] = useState('');
  const [tindakan, setTindakan] = useState<string[]>([]);
  const [tindakanInput, setTindakanInput] = useState('');
  const [tindakanList, setTindakanList] = useState<TarifData[]>([]);
  const [tindakanSearch, setTindakanSearch] = useState('');
  const [tindakanDropdownOpen, setTindakanDropdownOpen] = useState(false);
  const tindakanInputRef = useRef<HTMLInputElement>(null);
  const tindakanDropdownRef = useRef<HTMLDivElement>(null);
  
  const [icd9, setIcd9] = useState<string[]>([]);
  const [icd9Input, setIcd9Input] = useState('');
  const [icd9List, setIcd9List] = useState<ICD9[]>([]);
  const [icd9Search, setIcd9Search] = useState('');
  const [icd9DropdownOpen, setIcd9DropdownOpen] = useState(false);
  const icd9InputRef = useRef<HTMLInputElement>(null);
  const icd9DropdownRef = useRef<HTMLDivElement>(null);
  
  const [icd10, setIcd10] = useState<string[]>([]);
  const [icd10Input, setIcd10Input] = useState('');
  const [icd10List, setIcd10List] = useState<ICD10[]>([]);
  const [icd10Search, setIcd10Search] = useState('');
  const [icd10DropdownOpen, setIcd10DropdownOpen] = useState(false);
  const icd10InputRef = useRef<HTMLInputElement>(null);
  const icd10DropdownRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [totalTarifRS, setTotalTarifRS] = useState<number>(0);
  const [billingSign, setBillingSign] = useState<string>('');

  // Hitung total tarif pas tindakan berubah (mirip kayak billing pasien)
  useEffect(() => {
    // Hitung tarif dari SEMUA tindakan yang ada di state sekarang
    console.log('🔄 Calculation useEffect triggered');
    console.log('  tindakan length:', tindakan.length);
    console.log('  tindakan array:', tindakan);
    console.log('  tindakanList length:', tindakanList.length);
    
    const total = tindakan.reduce((sum, deskripsi) => {
      const tarif = tindakanList.find(t => (t as any).Deskripsi === deskripsi);
      const harga = (tarif as any)?.Harga || 0;
      console.log(`  Tindakan: ${deskripsi} → Harga: ${harga}`);
      return sum + harga;
    }, 0);
    
    console.log(`📊 Edit Modal Calculation: Total Tarif RS = ${total}`);
    setTotalTarifRS(total);
    
    // Hitung billing sign
    const totalKlaimBPJS = (currentData as any).total_klaim_bpjs || 0;
    const sign = computeBillingSign(total, totalKlaimBPJS);
    console.log(`🎨 Edit Modal Billing Sign: ${sign} (total: ${total}, klaim: ${totalKlaimBPJS})`);
    setBillingSign(sign);
  }, [tindakan, tindakanList, currentData]);

  // Compute billing sign berdasarkan tarif dan klaim
  const computeBillingSign = (tarif: number, totalKlaim: number): string => {
    const totalTarif = tarif || 0;
    const klaim = totalKlaim || 0;

    if (!klaim || klaim === 0) return '';
    const percentage = (totalTarif / klaim) * 100;

    if (percentage <= 25) {
      return "Hijau";
    } else if (percentage <= 50) {
      return "Kuning";
    } else {
      return "Merah";
    }
  };

  const getBillingSignColor = (sign: string) => {
    switch(sign) {
      case 'Hijau':
        return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', dot: 'bg-green-500' };
      case 'Kuning':
        return { bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700', dot: 'bg-yellow-500' };
      case 'Merah':
        return { bg: 'bg-red-100', border: 'border-red-300', text: 'text-red-700', dot: 'bg-red-500' };
      default:
        return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700', dot: 'bg-gray-400' };
    }
  };

  useEffect(() => {
    if (isOpen && currentData) {
      console.log('📋 Modal opened with currentData:', currentData);
      console.log('📋 currentData.tindakan_rs:', currentData.tindakan_rs);
      console.log('📋 currentData.tindakan_rs type:', typeof currentData.tindakan_rs);
      console.log('📋 currentData.tindakan_rs is Array?:', Array.isArray(currentData.tindakan_rs));
      console.log('📋 currentData.tindakan_rs length:', (currentData.tindakan_rs as any)?.length);
      console.log('📋 Full currentData object keys:', Object.keys(currentData));
      
      setNama(currentData.nama_pasien);
      setUsia(currentData.usia.toString());
      setGender(currentData.jenis_kelamin);
      setRuangan(currentData.ruangan);
      setRuanganId(currentData.ruangan);
      setRuanganSearch(currentData.ruangan);
      setKelas(currentData.kelas);
      const tindakanToSet = Array.isArray(currentData.tindakan_rs) ? currentData.tindakan_rs : [];
      setTindakan(tindakanToSet);
      console.log('📋 setTindakan called with:', tindakanToSet);
      setIcd9(currentData.icd9 || []);
      setIcd10(currentData.icd10 || []);
      setError('');
      setSuccess('');
      
      // Fetch dropdown data
      const fetchDropdownData = async () => {
        try {
          const [ruanganRes, tarifRes, icd9Res, icd10Res] = await Promise.all([
            getRuangan(),
            getTarifRumahSakit(),
            getICD9(),
            getICD10(),
          ]);
          
          if (ruanganRes.data) {
            setRuanganList(ruanganRes.data);
            // Find ruangan name by ID or name match
            const foundRuangan = ruanganRes.data.find(r => 
              (r as any).ID_Ruangan?.toString() === currentData.ruangan || 
              (r as any).Nama_Ruangan === currentData.ruangan
            );
            if (foundRuangan) {
              setRuangan((foundRuangan as any).Nama_Ruangan);
              setRuanganId((foundRuangan as any).ID_Ruangan?.toString());
              setRuanganSearch((foundRuangan as any).Nama_Ruangan);
            }
          }
          if (tarifRes.data) {
            console.log('📋 Setting tindakanList with', tarifRes.data.length, 'items');
            setTindakanList(tarifRes.data);
          }
          if (icd9Res.data) setIcd9List(icd9Res.data);
          if (icd10Res.data) setIcd10List(icd10Res.data);
        } catch (err) {
          console.error('Error fetching dropdown data:', err);
        }
      };
      
      fetchDropdownData();
    }
  }, [isOpen, currentData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (ruanganDropdownOpen) {
        const isClickInsideInput = ruanganInputRef.current?.contains(target);
        const isClickInsideDropdown = ruanganDropdownRef.current?.contains(target);
        if (!isClickInsideInput && !isClickInsideDropdown) {
          setRuanganDropdownOpen(false);
        }
      }

      if (tindakanDropdownOpen) {
        const isClickInsideInput = tindakanInputRef.current?.contains(target);
        const isClickInsideDropdown = tindakanDropdownRef.current?.contains(target);
        if (!isClickInsideInput && !isClickInsideDropdown) {
          setTindakanDropdownOpen(false);
        }
      }

      if (icd9DropdownOpen) {
        const isClickInsideInput = icd9InputRef.current?.contains(target);
        const isClickInsideDropdown = icd9DropdownRef.current?.contains(target);
        if (!isClickInsideInput && !isClickInsideDropdown) {
          setIcd9DropdownOpen(false);
        }
      }

      if (icd10DropdownOpen) {
        const isClickInsideInput = icd10InputRef.current?.contains(target);
        const isClickInsideDropdown = icd10DropdownRef.current?.contains(target);
        if (!isClickInsideInput && !isClickInsideDropdown) {
          setIcd10DropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ruanganDropdownOpen, tindakanDropdownOpen, icd9DropdownOpen, icd10DropdownOpen]);

  const addTindakan = (kode?: string) => {
    const tarifData = kode 
      ? tindakanList.find(t => (t as any).KodeRS === kode)
      : tindakanList.find(t => (t as any).Deskripsi === tindakanInput);
    
    if (tarifData) {
      const deskripsi = (tarifData as any).Deskripsi;
      if (!tindakan.includes(deskripsi)) {
        setTindakan([...tindakan, deskripsi]);
        setTindakanInput('');
        setTindakanSearch('');
        setTindakanDropdownOpen(false);
      }
    }
  };

  const removeTindakan = (index: number) => {
    setTindakan(tindakan.filter((_, i) => i !== index));
  };

  const addIcd9 = (kode?: string) => {
    const icdData = kode
      ? icd9List.find(i => (i as any).Kode_ICD9 === kode)
      : icd9List.find(i => (i as any).Prosedur === icd9Input);
    
    if (icdData) {
      const prosedur = (icdData as any).Prosedur;
      if (!icd9.includes(prosedur)) {
        setIcd9([...icd9, prosedur]);
        setIcd9Input('');
        setIcd9Search('');
        setIcd9DropdownOpen(false);
      }
    }
  };

  const removeIcd9 = (index: number) => {
    setIcd9(icd9.filter((_, i) => i !== index));
  };

  const addIcd10 = (kode?: string) => {
    const icdData = kode
      ? icd10List.find(i => (i as any).Kode_ICD10 === kode)
      : icd10List.find(i => (i as any).Diagnosa === icd10Input);
    
    if (icdData) {
      const diagnosa = (icdData as any).Diagnosa;
      if (!icd10.includes(diagnosa)) {
        setIcd10([...icd10, diagnosa]);
        setIcd10Input('');
        setIcd10Search('');
        setIcd10DropdownOpen(false);
      }
    }
  };

  const removeIcd10 = (index: number) => {
    setIcd10(icd10.filter((_, i) => i !== index));
  };

  const handleSelectRuangan = (ruanganId: string, ruanganName: string) => {
    setRuangan(ruanganName); // Store nama ruangan
    setRuanganId(ruanganId);
    setRuanganSearch(ruanganName);
    setRuanganDropdownOpen(false);
  };

  // Tampilkan semua ruangan kalo search kosong atau sama pake selected, else filter
  const filteredRuangan = ruanganSearch === '' || ruanganSearch === ruangan
    ? ruanganList
    : ruanganList.filter(r =>
        (r as any).Nama_Ruangan?.toLowerCase().includes(ruanganSearch.toLowerCase())
      );

  const filteredTindakan = tindakanList.filter(t =>
    (t as any).Deskripsi?.toLowerCase().includes(tindakanSearch.toLowerCase()) ||
    (t as any).KodeRS?.toLowerCase().includes(tindakanSearch.toLowerCase())
  );

  const filteredIcd9 = icd9List.filter(i =>
    (i as any).Prosedur?.toLowerCase().includes(icd9Search.toLowerCase()) ||
    (i as any).Kode_ICD9?.toLowerCase().includes(icd9Search.toLowerCase())
  );

  const filteredIcd10 = icd10List.filter(i =>
    (i as any).Diagnosa?.toLowerCase().includes(icd10Search.toLowerCase()) ||
    (i as any).Kode_ICD10?.toLowerCase().includes(icd10Search.toLowerCase())
  );;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🟢 handleSubmit CALLED - Form submit triggered');
    console.log('  nama:', nama);
    console.log('  usia:', usia);
    console.log('  gender:', gender);
    console.log('  ruangan:', ruangan);
    console.log('  kelas:', kelas);
    
    // Validasi required fields
    if (!nama || !usia || !gender || !ruangan || !kelas) {
      const errorMsg = 'Nama, Usia, Jenis Kelamin, Ruangan, dan Kelas harus diisi';
      console.error('❌ Validation failed:', errorMsg);
      setError(errorMsg);
      return;
    }
    
    // Validasi billingId
    if (!billingId || billingId <= 0) {
      const errorMsg = 'Billing ID tidak valid. Silakan close modal dan coba lagi.';
      console.error('❌ Invalid billingId:', billingId);
      setError(errorMsg);
      return;
    }

    console.log('🟢 All validations passed, starting submission...');
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // Deteksi apakah ada perubahan pada tindakan, icd9, atau icd10
      const tindakanChanged = JSON.stringify(tindakan) !== JSON.stringify(currentData.tindakan_rs || []);
      const icd9Changed = JSON.stringify(icd9) !== JSON.stringify(currentData.icd9 || []);
      const icd10Changed = JSON.stringify(icd10) !== JSON.stringify(currentData.icd10 || []);
      const hasDataChanged = tindakanChanged || icd9Changed || icd10Changed;

      // Base request body - selalu kirim identitas pasien + billing sign
      const requestBody: any = {
        nama_pasien: nama,
        usia: parseInt(usia),
        jenis_kelamin: gender,
        ruangan: ruangan,
        kelas: kelas,
        tindakan_rs: tindakan || [],
        icd9: icd9 || [],
        icd10: icd10 || [],
        total_tarif_rs: Number(totalTarifRS) || 0, // ← Ensure it's a number, not string
      };

      // ALWAYS send billing_sign (tidak peduli ada perubahan atau tidak)
      if (billingSign) {
        requestBody.billing_sign = billingSign;
      }

      // Jika ada perubahan tindakan/icd9/icd10, log details
      if (hasDataChanged) {
        console.log('📤 Update dengan perubahan tindakan/ICD:', {
          tindakanChanged,
          icd9Changed,
          icd10Changed,
          totalTarifRS,
          totalTarifRS_type: typeof totalTarifRS,
          totalTarifRS_asNumber: Number(totalTarifRS),
          billing_sign: billingSign,
          requestBody,
        });
      } else {
        console.log('📤 Update hanya identitas pasien (tanpa perubahan tindakan/ICD)', requestBody);
      }

      const fullUrl = `${getApiBaseUrl()}/billing/${billingId}`;
      const requestBodyJson = JSON.stringify(requestBody);
      
      console.log('� Request Details:');
      console.log('  URL:', fullUrl);
      console.log('  Method: PUT');
      console.log('  billingId:', billingId, 'type:', typeof billingId);
      console.log('  Request Body:', requestBody);
      console.log('  JSON String:', requestBodyJson);
      console.log('  Parsed back:', JSON.parse(requestBodyJson));

      const response = await fetch(fullUrl, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: requestBodyJson,
      });
      
      console.log('✅ Response received. Status:', response.status);

      console.log('📥 Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: {
          contentType: response.headers.get('content-type'),
        }
      });

      // DISPATCH EVENT REGARDLESS OF RESPONSE STATUS (sebelum throw error)
      console.log('🔍 Preparing to dispatch event...');
      if (typeof window !== 'undefined') {
        try {
          console.log('🔍 Starting event dispatch preparation...');
          
          // Hitung tarif value buat pass ke event - HITUNG DARI SEMUA TINDAKAN YANG ADA
          const calculatedTotalTarif = tindakan.reduce((sum, deskripsi) => {
            const tarif = tindakanList.find(t => (t as any).Deskripsi === deskripsi);
            const harga = (tarif as any)?.Harga || 0;
            console.log(`  Dispatch calc - Tindakan: ${deskripsi} → Harga: ${harga}`);
            return sum + harga;
          }, 0);
          
          console.log('💰 Final calculated tarif for dispatch:', calculatedTotalTarif);
          
          const totalKlaimBPJS = (currentData as any).total_klaim_bpjs || 0;
          const calculatedBillingSign = computeBillingSign(calculatedTotalTarif, totalKlaimBPJS);
          
          console.log('📤 ABOUT TO DISPATCH EVENT with calculated values:', {
            calculatedTotalTarif,
            calculatedBillingSign,
            tindakan,
            billingId
          });
          
          // Dispatch custom event dengan data yang sudah di-calculate (jangan perlu fetch ulang)
          window.dispatchEvent(new CustomEvent('billingDataUpdated', { 
            detail: { 
              billingId, 
              timestamp: new Date().getTime(),
              totalTarifRS: calculatedTotalTarif, // ← Pass calculated value
              billingSign: calculatedBillingSign, // ← Pass calculated sign
              tindakan: tindakan,                  // ← Pass updated tindakan list
              icd9: icd9,                          // ← Pass updated ICD9
              icd10: icd10                         // ← Pass updated ICD10
            } 
          }));
          
          console.log('✅ EVENT DISPATCHED SUCCESSFULLY!');
          
          // Clear localStorage cache jika ada
          sessionStorage.removeItem('billingHistory');
          sessionStorage.removeItem('billingAktif');
        } catch (eventError) {
          console.error('❌ Error saat dispatch event:', eventError);
        }
      }

      if (!response.ok) {
        let errData: any = {};
        let errMessage = `HTTP ${response.status}: ${response.statusText}`;
        let rawText = '';
        
        try {
          rawText = await response.text();
          console.log('📥 Raw response body:', rawText); // Log full response
          console.log('📥 Raw response body length:', rawText.length);
          
          if (rawText && rawText.trim()) {
            try {
              errData = JSON.parse(rawText);
              console.log('📥 Parsed JSON error:', errData);
              errMessage = errData?.message || errData?.error || `HTTP ${response.status}`;
            } catch (jsonError) {
              console.warn('Response is not valid JSON:', jsonError);
              // Response mungkin HTML error page atau plain text
              if (rawText.includes('<!DOCTYPE') || rawText.includes('<html')) {
                errMessage = `Server error (${response.status}): HTML response received. Check if endpoint exists.`;
              } else {
                errMessage = rawText.substring(0, 500); // Use raw text as error message
              }
            }
          } else {
            errMessage = `Server returned empty response (HTTP ${response.status})`;
          }
        } catch (e) {
          console.error('❌ Gagal membaca response:', e);
          errMessage = `Failed to read response: ${e instanceof Error ? e.message : String(e)}`;
        }
        
        console.error('❌ Error response from backend:', {
          status: response.status,
          statusText: response.statusText,
          rawBody: rawText.substring(0, 300),
          data: errData,
          message: errMessage
        });
        
        console.error('❌ FINAL ERROR MESSAGE:', errMessage);
        throw new Error(errMessage);
      }

      setSuccess('Data berhasil diupdate!');
      
      // Log success untuk verifikasi
      console.log('✅ SUCCESS! Response status:', response.status);
      console.log('✅ Response OK:', response.ok);
      console.log('✅ Data yang dikirim:', requestBody);
      console.log('✅ Modal akan ditutup dalam 1.5 detik...');
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      console.error('❌ ERROR in handleSubmit:', err);
      console.error('  Error type:', err instanceof Error ? 'Error object' : typeof err);
      if (err instanceof Error) {
        console.error('  Error message:', err.message);
        console.error('  Error stack:', err.stack);
      }
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      console.log('🟢 handleSubmit finally block - setting loading to false');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Blur background - halaman tetap terlihat tapi sedikit blur dan gelap */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-4 sm:my-8">
          {/* Header dengan gradient */}
          <div className="bg-gradient-to-r from-[#2591D0] to-blue-600 p-6 sm:p-8 rounded-t-2xl flex justify-between items-center">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Edit Data Pasien</h2>
              <p className="text-blue-100 text-sm mt-1">Perbarui informasi identitas dan pemeriksaan pasien</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
              type="button"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[calc(100vh-250px)] overflow-y-auto">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg text-sm flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-lg text-sm flex items-start gap-3">
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            {/* Section 1: Data Dasar */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 rounded-xl">
              <h3 className="text-lg font-bold text-[#2591D0] mb-4 flex items-center gap-2">
                <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">👤</span>
                Data Dasar Pasien
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#2591D0] mb-2">Nama Pasien</label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full border-2 border-blue-200 rounded-lg px-4 py-2.5 text-sm text-[#2591D0] bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all"
                    placeholder="Nama lengkap pasien"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2591D0] mb-2">Usia (Tahun)</label>
                  <input
                    type="number"
                    value={usia}
                    onChange={(e) => setUsia(e.target.value)}
                    className="w-full border-2 border-blue-200 rounded-lg px-4 py-2.5 text-sm text-[#2591D0] bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all"
                    placeholder="Contoh: 45"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2591D0] mb-2">Jenis Kelamin</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full border-2 border-blue-200 rounded-lg px-4 py-2.5 text-sm text-[#2591D0] bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all"
                    required
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-Laki">Laki-Laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#2591D0] mb-2">Ruangan</label>
                  <div className="flex items-center gap-2 mb-2 relative">
                    <div className="flex-1 relative">
                      <input
                        ref={ruanganInputRef}
                        type="text"
                        value={ruanganSearch}
                        onChange={(e) => {
                          setRuanganSearch(e.target.value);
                          setRuanganDropdownOpen(true);
                        }}
                        onFocus={() => setRuanganDropdownOpen(true)}
                        className="w-full border-2 border-blue-200 rounded-lg px-4 py-2.5 text-sm text-[#2591D0] bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all"
                        placeholder="Cari ruangan..."
                        required
                      />
                      <FaChevronDown
                        onClick={() => {
                          setRuanganDropdownOpen(!ruanganDropdownOpen);
                          if (!ruanganDropdownOpen) {
                            setRuanganSearch('');
                          }
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 cursor-pointer text-sm hover:text-blue-600"
                      />
                      {ruanganDropdownOpen && (
                        <div
                          ref={ruanganDropdownRef}
                          className="absolute z-50 w-full mt-1 bg-white border border-blue-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {ruanganSearch === ''
                            ? ruanganList.map((r) => (
                                <div
                                  key={(r as any).ID_Ruangan}
                                  onClick={() => {
                                    handleSelectRuangan((r as any).ID_Ruangan.toString(), (r as any).Nama_Ruangan);
                                    setRuanganDropdownOpen(false);
                                  }}
                                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-[#2591D0] border-b border-blue-100 last:border-b-0"
                                >
                                  <div className="font-medium">{(r as any).Nama_Ruangan}</div>
                                </div>
                              ))
                            : ruanganList
                                .filter(r =>
                                  (r as any).Nama_Ruangan?.toLowerCase().includes(ruanganSearch.toLowerCase())
                                )
                                .map((r) => (
                                  <div
                                    key={(r as any).ID_Ruangan}
                                    onClick={() => {
                                      handleSelectRuangan((r as any).ID_Ruangan.toString(), (r as any).Nama_Ruangan);
                                      setRuanganDropdownOpen(false);
                                    }}
                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-[#2591D0] border-b border-blue-100 last:border-b-0"
                                  >
                                    <div className="font-medium">{(r as any).Nama_Ruangan}</div>
                                  </div>
                                )) ||
                          (ruanganSearch && (
                            <div className="px-4 py-2 text-sm text-gray-500 text-center">Tidak ada ruangan ditemukan</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRuanganDropdownOpen(true);
                        setRuanganSearch('');
                      }}
                      className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors flex-shrink-0"
                    >
                      <FaChevronDown className="text-xs" />
                    </button>
                  </div>
                  {/* Selected Ruangan Display */}
                  {ruangan && (
                    <div className="mt-2 inline-flex items-center bg-blue-50 border border-blue-200 text-[#2591D0] rounded-full px-4 py-1.5 text-sm">
                      <span className="font-medium">{ruangan}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRuangan('');
                          setRuanganId('');
                          setRuanganSearch('');
                        }}
                        className="text-red-500 hover:text-red-700 ml-2"
                        aria-label={`Hapus ruangan ${ruangan}`}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#2591D0] mb-2">Kelas</label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    className="w-full border-2 border-blue-200 rounded-lg px-4 py-2.5 text-sm text-[#2591D0] bg-white focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-none transition-all"
                    required
                  >
                    <option value="">Pilih Kelas</option>
                    <option value="1">Kelas 1</option>
                    <option value="2">Kelas 2</option>
                    <option value="3">Kelas 3</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 1.5: Billing Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Total Tarif RS */}
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-orange-600 mb-1">Total Tarif RS</p>
                    <p className="text-2xl font-bold text-orange-700">Rp {totalTarifRS.toLocaleString('id-ID')}</p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>

              {/* Billing Sign Warning */}
              {billingSign && (
                <div className={`bg-gradient-to-br border-2 p-4 rounded-lg flex items-center justify-between ${getBillingSignColor(billingSign).bg} ${getBillingSignColor(billingSign).border}`}>
                  <div>
                    <p className={`text-sm font-semibold mb-1 ${getBillingSignColor(billingSign).text}`}>Status Billing Sign</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${getBillingSignColor(billingSign).dot}`}></div>
                      <p className={`text-2xl font-bold ${getBillingSignColor(billingSign).text}`}>{billingSign}</p>
                    </div>
                  </div>
                  <div className="text-4xl">⚠️</div>
                </div>
              )}
            </div>

            {/* Section 2: Tindakan */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 p-5 rounded-xl">
              <h3 className="text-lg font-bold text-emerald-700 mb-4 flex items-center gap-2">
                <span className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">🔬</span>
                Tindakan & Pemeriksaan Penunjang
              </h3>
              
              <div className="relative mb-4">
                <input
                  ref={tindakanInputRef}
                  type="text"
                  value={tindakanSearch}
                  onChange={(e) => {
                    setTindakanSearch(e.target.value);
                    setTindakanDropdownOpen(true);
                  }}
                  onFocus={() => setTindakanDropdownOpen(true)}
                  className="w-full border-2 border-emerald-300 rounded-lg px-4 py-2.5 text-sm text-emerald-700 bg-white focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 focus:outline-none transition-all placeholder-emerald-400"
                  placeholder="Cari tindakan..."
                />
                <FaChevronDown
                  onClick={() => setTindakanDropdownOpen(!tindakanDropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 cursor-pointer text-xs"
                />
                {tindakanDropdownOpen && (
                  <div
                    ref={tindakanDropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-emerald-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {(tindakanSearch ? filteredTindakan : tindakanList).map((t) => (
                      <div
                        key={(t as any).KodeRS}
                        onClick={() => addTindakan((t as any).KodeRS)}
                        className="px-4 py-2 hover:bg-emerald-50 cursor-pointer text-sm text-emerald-700 border-b border-emerald-100 last:border-b-0"
                      >
                        <div className="font-medium">{(t as any).Deskripsi}</div>
                        <div className="text-xs text-gray-600">{(t as any).KodeRS}</div>
                      </div>
                    ))}
                    {tindakanSearch && filteredTindakan.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500 text-center">Tidak ada tindakan ditemukan</div>
                    )}
                  </div>
                )}
              </div>

              {tindakan.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tindakan.map((t, idx) => (
                    <div key={idx} className="bg-white border-2 border-emerald-300 px-4 py-2 rounded-full flex items-center gap-2 text-sm text-emerald-700 font-medium shadow-sm hover:shadow-md transition-shadow">
                      <span>🏥</span>
                      <span>{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTindakan(idx)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 3: ICD9 */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-5 rounded-xl">
              <h3 className="text-lg font-bold text-amber-700 mb-4 flex items-center gap-2">
                <span className="bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">📋</span>
                ICD 9 (Prosedur)
              </h3>
              
              <div className="relative mb-4">
                <input
                  ref={icd9InputRef}
                  type="text"
                  value={icd9Search}
                  onChange={(e) => {
                    setIcd9Search(e.target.value);
                    setIcd9DropdownOpen(true);
                  }}
                  onFocus={() => setIcd9DropdownOpen(true)}
                  className="w-full border-2 border-amber-300 rounded-lg px-4 py-2.5 text-sm text-amber-700 bg-white focus:ring-2 focus:ring-amber-400 focus:border-amber-400 focus:outline-none transition-all placeholder-amber-400"
                  placeholder="Cari ICD 9..."
                />
                <FaChevronDown
                  onClick={() => setIcd9DropdownOpen(!icd9DropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 cursor-pointer text-xs"
                />
                {icd9DropdownOpen && (
                  <div
                    ref={icd9DropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-amber-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {(icd9Search ? filteredIcd9 : icd9List).map((i) => (
                      <div
                        key={(i as any).Kode_ICD9}
                        onClick={() => addIcd9((i as any).Kode_ICD9)}
                        className="px-4 py-2 hover:bg-amber-50 cursor-pointer text-sm text-amber-700 border-b border-amber-100 last:border-b-0"
                      >
                        <div className="font-medium">{(i as any).Prosedur}</div>
                        <div className="text-xs text-gray-600">{(i as any).Kode_ICD9}</div>
                      </div>
                    ))}
                    {icd9Search && filteredIcd9.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500 text-center">Tidak ada ICD 9 ditemukan</div>
                    )}
                  </div>
                )}
              </div>

              {icd9.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {icd9.map((i, idx) => (
                    <div key={idx} className="bg-white border-2 border-amber-300 px-4 py-2 rounded-full flex items-center gap-2 text-sm text-amber-700 font-medium shadow-sm hover:shadow-md transition-shadow">
                      <span>🔖</span>
                      <span>{i}</span>
                      <button
                        type="button"
                        onClick={() => removeIcd9(idx)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Section 4: ICD10 */}
            <div className="bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200 p-5 rounded-xl">
              <h3 className="text-lg font-bold text-violet-700 mb-4 flex items-center gap-2">
                <span className="bg-violet-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">🏷️</span>
                ICD 10 (Diagnosis)
              </h3>
              
              <div className="relative mb-4">
                <input
                  ref={icd10InputRef}
                  type="text"
                  value={icd10Search}
                  onChange={(e) => {
                    setIcd10Search(e.target.value);
                    setIcd10DropdownOpen(true);
                  }}
                  onFocus={() => setIcd10DropdownOpen(true)}
                  className="w-full border-2 border-violet-300 rounded-lg px-4 py-2.5 text-sm text-violet-700 bg-white focus:ring-2 focus:ring-violet-400 focus:border-violet-400 focus:outline-none transition-all placeholder-violet-400"
                  placeholder="Cari ICD 10..."
                />
                <FaChevronDown
                  onClick={() => setIcd10DropdownOpen(!icd10DropdownOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-violet-400 cursor-pointer text-xs"
                />
                {icd10DropdownOpen && (
                  <div
                    ref={icd10DropdownRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-violet-200 rounded-lg shadow-lg max-h-96 overflow-y-auto"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {(icd10Search ? filteredIcd10 : icd10List).map((i) => (
                      <div
                        key={(i as any).Kode_ICD10}
                        onClick={() => addIcd10((i as any).Kode_ICD10)}
                        className="px-4 py-2 hover:bg-violet-50 cursor-pointer text-sm text-violet-700 border-b border-violet-100 last:border-b-0"
                      >
                        <div className="font-medium">{(i as any).Diagnosa}</div>
                        <div className="text-xs text-gray-600">{(i as any).Kode_ICD10}</div>
                      </div>
                    ))}
                    {icd10Search && filteredIcd10.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500 text-center">Tidak ada ICD 10 ditemukan</div>
                    )}
                  </div>
                )}
              </div>

              {icd10.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {icd10.map((i, idx) => (
                    <div key={idx} className="bg-white border-2 border-violet-300 px-4 py-2 rounded-full flex items-center gap-2 text-sm text-violet-700 font-medium shadow-sm hover:shadow-md transition-shadow">
                      <span>🩺</span>
                      <span>{i}</span>
                      <button
                        type="button"
                        onClick={() => removeIcd10(idx)}
                        className="text-red-500 hover:text-red-700 ml-1"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-[#2591D0] to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? '⏳ Menyimpan...' : '💾 Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditPasienModal;
