"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaTrash, FaPlus, FaChevronDown } from 'react-icons/fa';
import { apiFetch } from '@/lib/api-helper';

interface TarifBPJSRawatInap {
  KodeINA: string;
  Deskripsi: string;
  Kelas1: number;
  Kelas2: number;
  Kelas3: number;
}

interface TarifBPJSRawatJalan {
  KodeINA: string;
  Deskripsi: string;
  TarifINACBG?: number;
  tarif_inacbg?: number;
}

interface EditINACBGModalProps {
  isOpen: boolean;
  billingId: number;
  currentData: {
    kode_inacbg?: string[];
    tipe_inacbg?: "RI" | "RJ";
    kelas?: string;
    total_klaim?: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const EditINACBGModal: React.FC<EditINACBGModalProps> = ({
  isOpen,
  billingId,
  currentData,
  onClose,
  onSuccess,
}) => {
  const [tipeInacbg, setTipeInacbg] = useState<"RI" | "RJ">("RI");
  const [selectedInacbgCodes, setSelectedInacbgCodes] = useState<string[]>([]);
  const [existingInacbgCodes, setExistingInacbgCodes] = useState<string[]>([]);
  const [deletedInacbgCodes, setDeletedInacbgCodes] = useState<string[]>([]);
  const [inacbgSearch, setInacbgSearch] = useState('');
  const [inacbgRIData, setInacbgRIData] = useState<TarifBPJSRawatInap[]>([]);
  const [inacbgRJData, setInacbgRJData] = useState<TarifBPJSRawatJalan[]>([]);
  const [inacbgDropdownOpen, setInacbgDropdownOpen] = useState(false);
  const inacbgInputRef = useRef<HTMLInputElement>(null);
  const inacbgDropdownRef = useRef<HTMLDivElement>(null);

  const [kelas, setKelas] = useState('');
  const [totalKlaimOriginal, setTotalKlaimOriginal] = useState<number>(0);
  const [totalTarifRS, setTotalTarifRS] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [billingSign, setBillingSign] = useState<string>('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // ✅ Track previous billing ID dan codes untuk prevent multiple re-syncs
  const prevBillingIdRef = useRef<number | null>(null);
  const prevCodesJsonRef = useRef<string>('');
  const prevTotalClaimRef = useRef<number>(0);

  // ✅ DERIVED STATE: Calculate total klaim dengan real-time delta
  // Formula: baseKlaim + adjustment (dari deleted codes - dan added codes +)
  // baseKlaim = totalKlaimOriginal (dari DB, yang sudah ada)
  // adjustment = -tarif(deletedCodes) + tarif(newCodes)
  const totalKlaimBPJS = useMemo(() => {
    if (!kelas || (inacbgRIData.length === 0 && inacbgRJData.length === 0)) {
      return totalKlaimOriginal;
    }

    const kelasMatch = kelas.match(/(\d+)/);
    const kelasNumber = kelasMatch ? parseInt(kelasMatch[1]) : 1;

    // ✅ Base klaim = yang sudah ada di DB
    const baseKlaim = totalKlaimOriginal || 0;

    // ✅ Kode yang DIHAPUS dari selection
    const deletedCodes = existingInacbgCodes.filter(c => !selectedInacbgCodes.includes(c));

    // ✅ Kode yang DITAMBAH (baru)
    const newCodes = selectedInacbgCodes.filter(c => !existingInacbgCodes.includes(c));

    // Helper function to get tarif for a code
    const getTarifForCode = (code: string): number => {
      let tarif = 0;

      if (tipeInacbg === 'RI') {
        const riItem = inacbgRIData.find(i => i.KodeINA === code);
        if (riItem) {
          if (kelasNumber === 1) tarif = riItem.Kelas1 || 0;
          else if (kelasNumber === 2) tarif = riItem.Kelas2 || 0;
          else if (kelasNumber === 3) tarif = riItem.Kelas3 || 0;
        }
      } else {
        const rjItem = inacbgRJData.find(i => i.KodeINA === code);
        tarif = rjItem?.TarifINACBG || rjItem?.tarif_inacbg || 0;
      }

      return tarif;
    };

    let adjustment = 0;

    // Kurangi tarif kode yang dihapus
    deletedCodes.forEach(code => {
      const tarif = getTarifForCode(code);
      adjustment -= tarif * 0.75;  // potong 25%
    });

    // Tambah tarif kode baru
    newCodes.forEach(code => {
      const tarif = getTarifForCode(code);
      adjustment += tarif * 0.75;  // potong 25%
    });

    const finalTotal = baseKlaim + adjustment;

    console.log(`💰 Total Klaim Calculation (Real-time Delta):
      - Base (from DB): ${baseKlaim}
      - Deleted codes: ${deletedCodes.length}
      - New codes added: ${newCodes.length}
      - Adjustment: ${adjustment}
      - Final Total: ${finalTotal}`);

    return Math.max(0, finalTotal);
  }, [
    selectedInacbgCodes,
    existingInacbgCodes,
    inacbgRIData,
    inacbgRJData,
    tipeInacbg,
    kelas,
  ]);

  // Debug: log whenever selectedInacbgCodes changes
  useEffect(() => {
    if (isOpen) {
      console.log('🎯 selectedInacbgCodes updated:', selectedInacbgCodes);
      console.log('🎯 selectedInacbgCodes length:', selectedInacbgCodes.length);
      console.log('💰 totalKlaimBPJS (computed):', totalKlaimBPJS);
    }
  }, [selectedInacbgCodes, isOpen, totalKlaimBPJS]);

  // ✅ DERIVED STATE: Calculate billing sign as pure function
  const billingSignComputed = useMemo(() => {
    if (!totalTarifRS || totalTarifRS <= 0 || !totalKlaimBPJS || totalKlaimBPJS <= 0) {
      return '';
    }

    const percentage = (totalTarifRS / totalKlaimBPJS) * 100;
    let sign = '';
    if (percentage <= 25) {
      sign = 'Hijau';
    } else if (percentage <= 50) {
      sign = 'Kuning';
    } else {
      sign = 'Merah';
    }

    console.log(`🎨 Edit INACBG Billing Sign: ${sign} (${percentage.toFixed(2)}%)`);
    return sign;
  }, [totalTarifRS, totalKlaimBPJS]);

  // ✅ Update billingSign state only when computed value changes
  useEffect(() => {
    setBillingSign(billingSignComputed);
  }, [billingSignComputed]);

  // Initialize modal data
  // ✅ PENTING: Initialize jika modal dibuka (isOpen true) untuk billing ID apapun
  // Ini memastikan data reset ketika user membuka modal kembali setelah batal
  useEffect(() => {
    if (isOpen && currentData) {
      // Jika billing ID berubah ATAU modal baru dibuka, reset state
      const isNewBilling = billingId !== prevBillingIdRef.current;
      const shouldInitialize = isNewBilling || (prevBillingIdRef.current !== null && isOpen);
      
      if (shouldInitialize) {
        prevBillingIdRef.current = billingId;
      
        console.log('📋 Edit INACBG Modal opened');
        console.log('📋 currentData received:', JSON.stringify(currentData, null, 2));
        
        let codes = Array.isArray(currentData.kode_inacbg) ? currentData.kode_inacbg : [];
        
        // ✅ PENTING: Remove duplicates dari codes yang diterima dari parent (sorted untuk consistent comparison)
        codes = Array.from(new Set(codes)).sort();
        console.log('📋 De-duplicated codes at init:', codes);
        
        // ✅ Track di ref untuk strict comparison saat sync
        prevCodesJsonRef.current = JSON.stringify(codes);
        prevTotalClaimRef.current = currentData.total_klaim || 0;
        
        // existingInacbgCodes = baseline dari API
        // selectedInacbgCodes = copy dari existing (sama baseline)
        setExistingInacbgCodes(codes);
        setSelectedInacbgCodes(codes);
        setTipeInacbg(currentData.tipe_inacbg || 'RI');
        setKelas(currentData.kelas || '');
        setTotalKlaimOriginal(currentData.total_klaim || 0);
        // ✅ REMOVED: setTotalKlaimBPJS - now computed via useMemo
        setDeletedInacbgCodes([]);
        setError('');
        setSuccess('');

        // Fetch INACBG data
        const fetchInacbgData = async () => {
          try {
            const [riResponse, rjResponse] = await Promise.all([
              apiFetch<TarifBPJSRawatInap[]>("/tarifBPJSRawatInap"),
              apiFetch<TarifBPJSRawatJalan[]>("/tarifBPJSRawatJalan"),
            ]);

            if (riResponse.data) setInacbgRIData(riResponse.data);
            if (rjResponse.data) setInacbgRJData(rjResponse.data);
          } catch (err) {
            console.error('Error fetching INACBG data:', err);
          }
        };

        fetchInacbgData();

        // Fetch tarif RS dari API pake async/await yang proper
        const fetchTarifRS = async () => {
          try {
            console.log('🔄 Fetching Tarif RS for billingId:', billingId);
            const response = await apiFetch<any>(`/admin/billing/${billingId}`);
            console.log('📊 Full response:', response);
            console.log('📊 response.data:', response.data);
            console.log('📊 response.data.data:', response.data?.data);
            
            // Cek semua kemungkinan struktur
            let tarifRS = 0;
            
            // Cek apakah di response.data.total_tarif_rs
            if (response.data?.total_tarif_rs !== undefined) {
              tarifRS = response.data.total_tarif_rs;
              console.log('✅ Found at response.data.total_tarif_rs:', tarifRS);
            }
            // Cek apakah di response.data.data.total_tarif_rs
            else if (response.data?.data?.total_tarif_rs !== undefined) {
              tarifRS = response.data.data.total_tarif_rs;
              console.log('✅ Found at response.data.data.total_tarif_rs:', tarifRS);
            }
            // Cek apakah field punya nama berbeda
            else if (response.data?.data) {
              console.log('📋 Available fields in response.data.data:', Object.keys(response.data.data));
              // Coba cari field yang mengandung "tarif"
              const tarifField = Object.keys(response.data.data).find(key => 
                key.toLowerCase().includes('tarif') && key.toLowerCase().includes('rs')
              );
              if (tarifField) {
                tarifRS = response.data.data[tarifField];
                console.log(`✅ Found at response.data.data.${tarifField}:`, tarifRS);
              }
            }
            
            if (tarifRS > 0 || tarifRS === 0) {
              setTotalTarifRS(tarifRS);
              console.log('✅ TotalTarifRS state set to:', tarifRS);
            }
          } catch (err) {
            console.error('❌ Error fetching tarif RS:', err);
          }
        };

        fetchTarifRS();
      }
    }
  }, [isOpen, billingId, currentData]);

  // ✅ UPDATE: Handle parent update dengan currentData baru (setelah save)
  // Detect parent refresh dan sync dengan fresh baseline
  useEffect(() => {
    if (isOpen && currentData && billingId === prevBillingIdRef.current) {
      // Modal sudah terbuka untuk billing yang sama
      const incomingCodes = Array.isArray(currentData.kode_inacbg)
        ? Array.from(new Set(currentData.kode_inacbg)).sort()  // ✅ De-dup dan sort
        : [];

      const incomingCodesJson = JSON.stringify(incomingCodes);
      const incomingTotalClaim = currentData.total_klaim || 0;

      // ✅ Strict comparison: hanya sync jika benar2 berbeda
      const codesChanged = incomingCodesJson !== prevCodesJsonRef.current;
      const totalChanged = incomingTotalClaim !== prevTotalClaimRef.current;

      if (codesChanged || totalChanged) {
        console.log('🔄 Parent refresh detected, syncing...');
        console.log('  Old codes:', prevCodesJsonRef.current);
        console.log('  New codes:', incomingCodesJson);

        // ✅ Update refs FIRST untuk prevent re-trigger
        prevCodesJsonRef.current = incomingCodesJson;
        prevTotalClaimRef.current = incomingTotalClaim;

        // ✅ Reset BOTH ke baseline fresh dari API
        setExistingInacbgCodes(incomingCodes);
        setSelectedInacbgCodes(incomingCodes);
        setTotalKlaimOriginal(incomingTotalClaim);
        setDeletedInacbgCodes([]);

        console.log('✅ Synced: existing + selected reset to fresh baseline');
      }
    }
  }, [isOpen, billingId, currentData.total_klaim]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (inacbgDropdownOpen) {
        const isClickInsideInput = inacbgInputRef.current?.contains(target);
        const isClickInsideDropdown = inacbgDropdownRef.current?.contains(target);
        if (!isClickInsideInput && !isClickInsideDropdown) {
          setInacbgDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [inacbgDropdownOpen]);

  const filteredInacbgCodes = () => {
    const kelasMatch = kelas.match(/(\d+)/);
    const kelasNumber = kelasMatch ? parseInt(kelasMatch[1]) : 1;

    const data =
      tipeInacbg === "RI"
        ? inacbgRIData.map((item) => {
            let tarifValue = item.Kelas1;
            if (kelasNumber === 1) tarifValue = item.Kelas1;
            else if (kelasNumber === 2) tarifValue = item.Kelas2;
            else if (kelasNumber === 3) tarifValue = item.Kelas3;

            return {
              code: item.KodeINA,
              description: item.Deskripsi,
              tarif: tarifValue,
            };
          })
        : inacbgRJData.map((item) => ({
            code: item.KodeINA,
            description: item.Deskripsi,
            tarif: item.TarifINACBG || item.tarif_inacbg || 0,
          }));

    if (!inacbgSearch) return data;

    return data.filter(
      (item) =>
        item.code.toLowerCase().includes(inacbgSearch.toLowerCase()) ||
        item.description.toLowerCase().includes(inacbgSearch.toLowerCase())
    );
  };

  const getInacbgTarifRaw = (code: string): number | null => {
    if (!code) return null;

    const kelasMatch = kelas.match(/(\d+)/);
    const kelasNumber = kelasMatch ? parseInt(kelasMatch[1]) : 1;

    const riItem = inacbgRIData.find((item) => item.KodeINA === code);
    if (riItem) {
      if (kelasNumber === 1) return riItem.Kelas1 || 0;
      if (kelasNumber === 2) return riItem.Kelas2 || 0;
      if (kelasNumber === 3) return riItem.Kelas3 || 0;
      return riItem.Kelas1 || 0;
    }

    const rjItem = inacbgRJData.find((item) => item.KodeINA === code);
    if (rjItem) return rjItem.TarifINACBG || rjItem.tarif_inacbg || 0;

    return null;
  };

  const handleAddInacbg = (code?: string) => {
    const filtered = filteredInacbgCodes();
    const codeToAdd = code || filtered[0]?.code;

    if (!codeToAdd) {
      setError("Pilih kode INA CBG terlebih dahulu");
      return;
    }

    if (selectedInacbgCodes.includes(codeToAdd)) {
      setError("Kode INA CBG sudah ditambahkan");
      return;
    }

    setSelectedInacbgCodes((prev) => {
      const next = Array.from(new Set([...prev, codeToAdd]));
      // Recompute deleted codes deterministically (existing - current)
      const recomputedDeleted = existingInacbgCodes.filter(c => !next.includes(c));
      setDeletedInacbgCodes(recomputedDeleted);
      return next;
    });
    setInacbgSearch("");
    setInacbgDropdownOpen(false);
    setError("");
  };

  const handleRemoveInacbg = (idx: number) => {
    // Hapus berdasarkan index, bukan code (agar duplikat tidak semua terhapus)
    const codeToDelete = selectedInacbgCodes[idx];
    const newCodes = selectedInacbgCodes.filter((_, i) => i !== idx);
    const uniqueNewCodes = Array.from(new Set(newCodes));
    setSelectedInacbgCodes(uniqueNewCodes);

    // Recompute deleted codes deterministically as existing - current
    const recomputedDeleted = existingInacbgCodes.filter(code => !uniqueNewCodes.includes(code));
    setDeletedInacbgCodes(recomputedDeleted);

    console.log(`✅ INACBG code removed from list: ${codeToDelete}`);
    console.log(`📋 recomputed deletedInacbgCodes:`, recomputedDeleted);
  };

  const handleSave = async () => {
    // Cek apakah ada perubahan
    const hasChanges = JSON.stringify(selectedInacbgCodes.sort()) !== JSON.stringify(existingInacbgCodes.sort());
    
    if (!hasChanges) {
      setError("Tidak ada perubahan yang dilakukan");
      return;
    }
    
    // Buka confirm modal terlebih dahulu
    setIsConfirmModalOpen(true);
  };

  const confirmSubmit = async () => {
    setIsConfirmModalOpen(false);
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Hapus duplikat dari selectedInacbgCodes sebelum kirim
      const uniqueSelectedCodes = Array.from(new Set(selectedInacbgCodes));

      // Hitung kode yang akan Ditambah: hanya yang baru (selected - existing)
      const codesToAdd = uniqueSelectedCodes.filter(code => !existingInacbgCodes.includes(code));

      // Hitung kode yang akan Dihapus: existing - selected
      const actualDeletedCodes = existingInacbgCodes.filter(code => !uniqueSelectedCodes.includes(code));

      // Jika tidak ada kode yang tersisa (kosong), total klaim baru = 0
      const totalKlaimBaru = uniqueSelectedCodes.length === 0 ? 0 : totalKlaimBPJS;

      const payload = {
        id_billing: billingId,
        tipe_inacbg: tipeInacbg,
        kode_inacbg: codesToAdd,        // Kode yang harus ditambahkan (prevent duplicate append)
        kode_delete: actualDeletedCodes, // Kode yang dihapus
        total_klaim: totalKlaimBaru,
        billing_sign: billingSign,
      };

      console.log("📤 Sending EDIT INACBG payload:", payload);
      console.log("📋 actualDeletedCodes:", actualDeletedCodes);

      const response = await apiFetch<{ status: string; message: string }>(
        "/admin/inacbg",
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );

      if (response.error) {
        setError(response.error);
        return;
      }

      setSuccess("Data INA CBG berhasil diperbarui");

      // Dispatch event untuk notify parent component
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('billingDataUpdated', {
            detail: {
              billingId,
              timestamp: new Date().getTime(),
              selectedInacbgCodes: uniqueSelectedCodes,
              totalKlaimBPJS,
              billingSign,
            },
          })
        );
      }

      // ✅ PENTING: Reset deletedInacbgCodes setelah save sukses
      setDeletedInacbgCodes([]);

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data"
      );
    } finally {
      setLoading(false);
    }
  };

  const getBillingSignColor = (sign: string) => {
    switch (sign) {
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

  if (!isOpen) return null;

  const signColor = getBillingSignColor(billingSign);
  const maxWidth = 'max-w-2xl';
  const fullWidth = 'w-full';

  return (
    <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
      <div className={`${maxWidth} ${fullWidth} bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 border-b border-blue-200 z-10">
          <h2 className="text-lg sm:text-2xl font-bold text-[#2591D0] flex items-center gap-2">
            ✏️ Edit INA CBG
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            Ubah kode INA CBG dan lihat perhitungan klaim secara real-time
          </p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Tipe INA CBG */}
          <div>
            <label className="block text-sm font-bold text-[#2591D0] mb-2">
              Tipe INA CBG
            </label>
            <div className="relative">
              <select
                value={tipeInacbg}
                onChange={(e) => {
                  setTipeInacbg(e.target.value as "RI" | "RJ");
                  setSelectedInacbgCodes([]);
                }}
                className="w-full border border-blue-200 rounded-lg py-2 px-3 text-[#2591D0] focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none bg-white"
              >
                <option value="RI">Rawat Inap (RI)</option>
                <option value="RJ">Rawat Jalan (RJ)</option>
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none text-sm" />
            </div>
          </div>

          {/* INA CBG Selection */}
          <div>
            <label className="block text-sm font-bold text-[#2591D0] mb-2">
              Kode INA CBG
            </label>
            <div className="flex items-center gap-2 mb-2 relative">
              <div className="flex-1 relative">
                <input
                  ref={inacbgInputRef}
                  type="text"
                  placeholder="Cari kode INA CBG..."
                  value={inacbgSearch}
                  onChange={(e) => {
                    setInacbgSearch(e.target.value);
                    setInacbgDropdownOpen(true);
                  }}
                  onFocus={() => setInacbgDropdownOpen(true)}
                  className="w-full border border-blue-200 rounded-lg py-2 px-3 text-sm text-[#2591D0] placeholder-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
                <FaChevronDown
                  onClick={(e) => {
                    e.stopPropagation();
                    setInacbgDropdownOpen(!inacbgDropdownOpen);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 cursor-pointer hover:text-blue-600 text-sm pointer-events-auto z-10"
                />
                
                {inacbgDropdownOpen && (
                  <div
                    ref={inacbgDropdownRef}
                    className="absolute top-full left-0 right-0 bg-white border border-blue-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto z-20"
                  >
                    {filteredInacbgCodes().length > 0 ? (
                      filteredInacbgCodes().map((item) => (
                        <div
                          key={item.code}
                          onClick={() => {
                            handleAddInacbg(item.code);
                          }}
                          className="px-3 py-2 text-sm hover:bg-blue-100 cursor-pointer border-b border-blue-100 last:border-b-0"
                        >
                          <div className="font-semibold text-[#2591D0]">{item.code}</div>
                          <div className="text-xs text-gray-600">{item.description}</div>
                          <div className="text-xs text-gray-500">
                            Tarif: Rp {item.tarif.toLocaleString('id-ID')}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        Tidak ada hasil
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                type="button"
                className="w-8 h-8 bg-[#2591D0] rounded-full flex items-center justify-center text-white hover:bg-[#1e7ba8] transition-colors flex-shrink-0"
                onClick={() => {
                  if (filteredInacbgCodes().length > 0) {
                    handleAddInacbg(filteredInacbgCodes()[0].code);
                  }
                }}
              >
                <FaPlus className="text-xs" />
              </button>
            </div>

            {/* Selected Codes */}
            {selectedInacbgCodes.length > 0 ? (
              <div className="mt-3 space-y-2">
                {selectedInacbgCodes.map((code, idx) => {
                  const tarif = getInacbgTarifRaw(code);
                  const isNew = !existingInacbgCodes.includes(code);
                  return (
                    <div
                      key={`${code}-${idx}`}
                      className={`flex items-center justify-between p-2 rounded-lg border ${
                        isNew
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-[#2591D0]">{code}</div>
                        <div className="text-xs text-gray-600">
                          Tarif: Rp {(tarif || 0).toLocaleString('id-ID')}
                          {isNew && <span className="ml-2 text-green-600">(Baru)</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveInacbg(idx)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-sm text-gray-500">
                Belum ada kode INA CBG yang dipilih
              </div>
            )}
          </div>

          {/* Total Klaim Display */}
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600">Total Klaim Original</p>
                <p className="text-sm sm:text-base font-bold text-[#2591D0]">
                  Rp {totalKlaimOriginal.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Klaim (Real-time)</p>
                <p className="text-sm sm:text-base font-bold text-green-600">
                  Rp {totalKlaimBPJS.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Total Tarif RS</p>
                <p className="text-sm sm:text-base font-bold text-[#2591D0]">
                  Rp {totalTarifRS.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Delta Klaim</p>
                <p className={`text-sm sm:text-base font-bold ${(totalKlaimBPJS - totalKlaimOriginal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {(totalKlaimBPJS - totalKlaimOriginal) >= 0 ? '+' : ''}Rp {(totalKlaimBPJS - totalKlaimOriginal).toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          {/* Billing Sign Indicator */}
          {billingSign && (
            <div className={`p-3 sm:p-4 rounded-lg border-2 ${signColor.bg} ${signColor.border}`}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${signColor.dot}`}></div>
                <span className={`text-sm font-semibold ${signColor.text}`}>
                  Status: {billingSign}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Submit Modal */}
        {isConfirmModalOpen && (
          <div className="fixed inset-0 bg-white/30 backdrop-blur-sm flex items-center justify-center z-[300] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold text-[#2591D0] mb-4 flex items-center gap-2">
                  <span>❓</span> Konfirmasi Perubahan
                </h3>
                <p className="text-gray-700 mb-6">
                  Apakah anda yakin mengubah kode inacbg?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setIsConfirmModalOpen(false)}
                    className="px-4 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium text-sm"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmSubmit}
                    disabled={loading}
                    className="px-4 py-2 rounded-full bg-[#2591D0] text-white hover:bg-[#1e7ba8] disabled:bg-gray-400 transition-colors font-medium text-sm"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-4 sm:p-6 border-t border-gray-200 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 sm:px-6 py-2 rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={loading || JSON.stringify(selectedInacbgCodes.sort()) === JSON.stringify(existingInacbgCodes.sort())}
            className="px-4 sm:px-6 py-2 rounded-full bg-[#2591D0] text-white hover:bg-[#1e7ba8] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base"
          >
            {loading ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditINACBGModal;
