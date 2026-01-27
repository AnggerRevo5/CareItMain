"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaEdit, FaChevronDown } from 'react-icons/fa';
import { getRiwayatBilling} from '@/lib/api-helper';

interface RiwayatBillingPasienProps {
  onLogout?: () => void;
  userRole?: "dokter" | "admin";
  onEdit?: (billingId: number, pasienName?: string) => void;
  selectedRuangan?: string | null;
}

interface BillingData {
  ID_Billing?: number;
  ID_Pasien?: number;
  Nama_Pasien?: string;
  Billing_Sign?: string;
  // Backend sends lowercase field names
  id_billing?: number;
  id_pasien?: number;
  nama_pasien?: string;
  billing_sign?: string;
  // Additional fields from backend
  Kelas?: string;
  kelas?: string;
  ruangan?: string;
  Ruangan?: string;
  total_tarif_rs?: number;
  total_klaim?: number;
  ID_DPJP?: number;
  id_dpjp?: number;
  // Add tanggal fields to interface
  Tanggal_Masuk?: string;
  tanggal_masuk?: string;
  Tanggal_Keluar?: string;
  tanggal_keluar?: string;
  // Add dokter fields to interface
  Nama_Dokter?: string;
  nama_dokter?: string;
}

const RiwayatBillingPasien = ({ onLogout, userRole, onEdit, selectedRuangan }: RiwayatBillingPasienProps) => {
  const router = useRouter();
  const [billingData, setBillingData] = useState<BillingData[]>([]);
  const [filteredData, setFilteredData] = useState<BillingData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loggedInDokterId, setLoggedInDokterId] = useState<number | null>(null);
  const [loggedInDokterName, setLoggedInDokterName] = useState<string>('');
  const [ruangan, setRuangan] = useState<string>('');
  const [ruanganSearch, setRuanganSearch] = useState<string>('');
  const [ruanganDropdownOpen, setRuanganDropdownOpen] = useState<boolean>(false);
  const [selectedTanggal, setSelectedTanggal] = useState<string>('');
  const [availableTanggal, setAvailableTanggal] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<'bulan' | 'masuk' | 'keluar' | ''>(''); // Combined filter type
  const [filterByMonth, setFilterByMonth] = useState<string>(''); // Format: MM (01-12)
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterSingleDate, setFilterSingleDate] = useState<string>(''); // For Tanggal Keluar

  // Ambil info dokter yang login
  useEffect(() => {
    const dokterData = localStorage.getItem("dokter");
    if (dokterData) {
      try {
        const dokter = JSON.parse(dokterData);
        if (dokter.id) {
          setLoggedInDokterId(dokter.id);
        }
        if (dokter.nama) {
          setLoggedInDokterName(dokter.nama);
        }
      } catch (err) {
        console.error('Error parsing dokter data:', err);
      }
    }
  }, []);

  // Fetch billing data
  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await getRiwayatBilling();

        if (response.error) {
          setError(response.error);
          return;
        }

        // Handle berbagai struktur response
        if (response.data) {
          let dataArray: BillingData[] = [];
          
          // Cek kalo response.data udah array langsung
          if (Array.isArray(response.data)) {
            dataArray = response.data;
          } 
          // Cek kalo response.data punya property data
          else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
            dataArray = (response.data as any).data;
          }
          // Cek kalo response.data punya status sama property data
          else if ((response.data as any).status && (response.data as any).data && Array.isArray((response.data as any).data)) {
            dataArray = (response.data as any).data;
          } else {
            console.error('Unexpected response structure:', response.data);
            setError('Format data tidak dikenali');
            return;
          }
          
          // Log untuk debugging
          console.log('Billing data loaded:', dataArray.length, 'items');
          if (dataArray.length > 0) {
            console.log('Sample item:', dataArray[0]);
            console.log('Sample tanggal_masuk:', dataArray[0].Tanggal_Masuk || dataArray[0].tanggal_masuk);
            console.log('Available fields in item:', Object.keys(dataArray[0]));
          }
          
          // Tidak filter berdasarkan dokter - ambil semua data dari database
          setBillingData(dataArray);
          setFilteredData(dataArray);
          
          // Generate available tanggal from all data
          const tanggalSet = new Set<string>();
          
          dataArray.forEach((item) => {
            const tanggalMasuk = item.Tanggal_Masuk || item.tanggal_masuk;
            console.log('Processing item - tanggalMasuk:', tanggalMasuk);
            if (tanggalMasuk) {
              const dateStr = tanggalMasuk.substring(0, 10); // Extract YYYY-MM-DD
              tanggalSet.add(dateStr);
            }
          });
          
          const tanggalList = Array.from(tanggalSet).sort().reverse(); // Sort latest first
          console.log('✅ Available tanggal list:', tanggalList);
          setAvailableTanggal(tanggalList);
          
          // Set default selected tanggal ke yang pertama (paling baru)
          if (tanggalList.length > 0) {
            setSelectedTanggal(tanggalList[0]);
            console.log('✅ Selected default tanggal:', tanggalList[0]);
          } else {
            console.warn('⚠️ No tanggal found in data');
          }
        } else {
          console.error('No data in response:', response);
          setError('Tidak ada data yang diterima dari server');
        }
      } catch (err) {
        setError('Gagal memuat data billing. Pastikan backend server berjalan.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    // Always fetch data regardless of login status
    fetchBillingData();
  }, []);

  // Filter data based on search term, ruangan, tanggal, dan month
  useEffect(() => {
    let filtered = billingData;

    // Filter 1: By filter type (bulan, tanggal masuk, atau tanggal keluar)
    if (filterType === 'bulan' && filterByMonth) {
      // filterByMonth is MM (01-12)
      filtered = filtered.filter((item) => {
        const tanggalMasuk = item.Tanggal_Masuk || item.tanggal_masuk || '';
        const tanggalKeluar = item.Tanggal_Keluar || item.tanggal_keluar || '';
        
        const monthFromMasuk = tanggalMasuk.substring(5, 7); // Extract MM from YYYY-MM-DD
        const monthFromKeluar = tanggalKeluar.substring(5, 7); // Extract MM from YYYY-MM-DD
        
        // Match either tanggal_masuk or tanggal_keluar month
        return monthFromMasuk === filterByMonth || monthFromKeluar === filterByMonth;
      });
    } else if (filterType === 'masuk' && (filterStartDate || filterEndDate)) {
      // Filter by date range for Tanggal Masuk
      filtered = filtered.filter((item) => {
        const tanggalMasuk = item.Tanggal_Masuk || item.tanggal_masuk || '';
        if (!tanggalMasuk) return false;
        
        const dateStr = tanggalMasuk.substring(0, 10); // Extract YYYY-MM-DD
        
        // If only start date is provided
        if (filterStartDate && !filterEndDate) {
          return dateStr >= filterStartDate;
        }
        
        // If only end date is provided
        if (!filterStartDate && filterEndDate) {
          return dateStr <= filterEndDate;
        }
        
        // If both dates are provided (range filter)
        if (filterStartDate && filterEndDate) {
          return dateStr >= filterStartDate && dateStr <= filterEndDate;
        }
        
        return false;
      });
    } else if (filterType === 'keluar' && filterSingleDate) {
      // Filter by single date for Tanggal Keluar
      filtered = filtered.filter((item) => {
        const tanggalKeluar = item.Tanggal_Keluar || item.tanggal_keluar || '';
        if (!tanggalKeluar) return false;
        
        const dateStr = tanggalKeluar.substring(0, 10); // Extract YYYY-MM-DD
        return dateStr === filterSingleDate;
      });
    }

    // Filter 2: By ruangan (if selectedRuangan provided)
    if (selectedRuangan) {
      filtered = filtered.filter((item) => {
        const itemRuangan = item.ruangan || item.Ruangan || '';
        return itemRuangan.trim() === selectedRuangan.trim();
      });
    }

    // Filter 3: By search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (item) => {
          const namaPasien = item.Nama_Pasien || item.nama_pasien || '';
          const idPasien = item.ID_Pasien || item.id_pasien || 0;
          const idBilling = item.ID_Billing || item.id_billing || 0;
          return (
            namaPasien.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
            idPasien.toString().includes(searchTerm) ||
            idBilling.toString().includes(searchTerm)
          );
        }
      );
    }
    
    setFilteredData(filtered);
  }, [searchTerm, billingData, selectedRuangan, filterType, filterStartDate, filterEndDate, filterByMonth, filterSingleDate]);

  const getStatusColor = (billingSign: string) => {
    // Map billing sign to color
    if (!billingSign) return "bg-gray-400";
    
    const sign = billingSign.toLowerCase();
    
    // Map Indonesian enum values from database
    if (sign === "hijau" || sign === "green") {
      return "bg-green-500"; // Tarif RS <=25% dari BPJS
    } else if (sign === "kuning" || sign === "yellow") {
      return "bg-yellow-500"; // 26%-50%
    } else if (sign === "merah" || sign === "red" || sign === "orange") {
      return "bg-red-500"; // >50%
    }
    
    // Legacy mappings (for backward compatibility)
    if (sign === "selesai" || sign === "completed" || sign === "1") {
      return "bg-green-500";
    } else if (sign === "pending" || sign === "proses" || sign === "0") {
      return "bg-yellow-500";
    } else {
      return "bg-gray-400";
    }
  };

  // Hitung warning sign secara dinamis berdasarkan current tarif RS vs existing klaim
  // This ensures warning updates even if INACBG hasn't been input yet
  const calculateDynamicWarningSign = (totalTarifRS: number | undefined, totalKlaim: number | undefined): string => {
    if (!totalTarifRS || !totalKlaim || totalTarifRS <= 0 || totalKlaim <= 0) {
      return ""; // No data to calculate
    }

    const percentage = (totalTarifRS / totalKlaim) * 100;
    
    if (percentage <= 25) {
      return "Hijau"; // Safe
    } else if (percentage <= 50) {
      return "Kuning"; // Warning
    } else {
      return "Merah"; // Alert
    }
  };

  const handleSelectRuangan = (idRuangan: string, namaRuangan: string) => {
    setRuangan(namaRuangan);  // ✅ SIMPAN NAMA RUANGAN!
    setRuanganSearch(namaRuangan);
    setRuanganDropdownOpen(false);
};

  return (
    <div className="bg-white flex flex-col h-screen">
      {/* Fixed Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100">
        {/* Tanggal */}
        <div className="p-3 sm:p-4 md:p-6 pb-2 sm:pb-3">
          <div className="text-xs sm:text-sm text-[#2591D0]">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari billing pasien disini"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border text-sm border-blue-200 rounded-full py-2 sm:py-3 pl-3 sm:pl-4 pr-10 sm:pr-12 text-[#2591D0] placeholder-blue-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 focus:outline-0"
            />
            <FaSearch className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-[#2591D0] cursor-pointer text-sm sm:text-base" />
          </div>
        </div>

        {/* Combined Filter Section */}
        <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
          {/* Dropdown: Filter Type (Bulan, Tanggal Masuk, Tanggal Keluar) */}
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm font-semibold text-[#2591D0]">Filter:</label>
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={filterType}
                onChange={(e) => {
                  const value = e.target.value as 'bulan' | 'masuk' | 'keluar' | '';
                  setFilterType(value);
                  // Reset values when changing filter type
                  setFilterByMonth('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                }}
                className="w-full sm:w-48 border border-blue-200 rounded-lg py-2 px-3 text-sm text-[#2591D0] bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none"
              >
                <option value="" disabled hidden>Pilih Filter</option>
                <option value="bulan">Bulan</option>
                <option value="masuk">Tanggal Masuk</option>
                <option value="keluar">Tanggal Keluar</option>
              </select>
              <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none text-sm" />
            </div>
            {filterType && (
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterByMonth('');
                  setFilterStartDate('');
                  setFilterEndDate('');
                  setFilterSingleDate('');
                }}
                className="px-4 py-2 text-sm bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition whitespace-nowrap"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Month Picker - Show only when "Bulan" is selected */}
          {filterType === 'bulan' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex-1 sm:flex-initial">
                <label className="block text-xs font-semibold text-[#2591D0] mb-1">Pilih Bulan:</label>
                <select
                  value={filterByMonth}
                  onChange={(e) => setFilterByMonth(e.target.value)}
                  className="w-full sm:w-48 border border-blue-200 rounded-lg py-2 px-3 text-sm text-[#2591D0] bg-white focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none"
                >
                  <option value="">Pilih Bulan</option>
                  <option value="01">Januari</option>
                  <option value="02">Februari</option>
                  <option value="03">Maret</option>
                  <option value="04">April</option>
                  <option value="05">Mei</option>
                  <option value="06">Juni</option>
                  <option value="07">Juli</option>
                  <option value="08">Agustus</option>
                  <option value="09">September</option>
                  <option value="10">Oktober</option>
                  <option value="11">November</option>
                  <option value="12">Desember</option>
                </select>
              </div>
            </div>
          )}

          {/* Date Range Picker - Show only when "Tanggal Masuk" is selected */}
          {filterType === 'masuk' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex-1 sm:flex-initial">
                <label className="block text-xs font-semibold text-[#2591D0] mb-1">Dari Tanggal:</label>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => {
                    setFilterStartDate(e.target.value);
                    setFilterType('masuk');
                  }}
                  className="w-full sm:w-40 border border-blue-200 rounded-lg py-2 px-3 text-sm text-[#2591D0] focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
              <div className="flex-1 sm:flex-initial">
                <label className="block text-xs font-semibold text-[#2591D0] mb-1">Sampai Tanggal:</label>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => {
                    setFilterEndDate(e.target.value);
                    if (!filterType) {
                      setFilterType('masuk');
                    }
                  }}
                  className="w-full sm:w-40 border border-blue-200 rounded-lg py-2 px-3 text-sm text-[#2591D0] focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Single Date Picker - Show only when "Tanggal Keluar" is selected */}
          {filterType === 'keluar' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex-1 sm:flex-initial">
                <label className="block text-xs font-semibold text-[#2591D0] mb-1">Pilih Tanggal Keluar:</label>
                <input
                  type="date"
                  value={filterSingleDate}
                  onChange={(e) => setFilterSingleDate(e.target.value)}
                  className="w-full sm:w-40 border border-blue-200 rounded-lg py-2 px-3 text-sm text-[#2591D0] focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Filter Info Display */}
          {filterType === 'bulan' && filterByMonth && (
            <p className="text-xs text-[#2591D0] mt-2">📅 Filter: {new Date(2025, parseInt(filterByMonth) - 1).toLocaleDateString('id-ID', { month: 'long' })}</p>
          )}
          {filterType === 'masuk' && filterStartDate && filterEndDate && (
            <p className="text-xs text-[#2591D0] mt-2">📅 Filter Tanggal Masuk: {filterStartDate} sampai {filterEndDate}</p>
          )}
          {filterType === 'masuk' && filterStartDate && !filterEndDate && (
            <p className="text-xs text-[#2591D0] mt-2">📅 Filter Tanggal Masuk: Dari {filterStartDate}</p>
          )}
          {filterType === 'masuk' && !filterStartDate && filterEndDate && (
            <p className="text-xs text-[#2591D0] mt-2">📅 Filter Tanggal Masuk: Hingga {filterEndDate}</p>
          )}
          {filterType === 'keluar' && filterSingleDate && (
            <p className="text-xs text-[#2591D0] mt-2">📅 Filter Tanggal Keluar: {filterSingleDate}</p>
          )}
        </div>

        {/* Table Header - Desktop Only */}
        <div className="hidden md:block border-t border-blue-200">
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#87CEEB]">
                <tr className="bg-[#87CEEB]">
                  <th className="px-4 md:px-6 lg:px-15 py-3 md:py-4 text-left text-sm md:text-base font-bold text-white w-24">
                    ID Pasien
                  </th>
                  <th className="px-4 md:px-6 lg:px-8 py-3 md:py-4 text-left text-sm md:text-base font-bold text-white flex-1">
                    Nama
                  </th>
                  <th className="px-4 md:px-6 lg:px-8 py-3 md:py-4 text-left text-sm md:text-base font-bold text-white flex-1">
                    Dokter
                  </th>
                  <th className="px-4 md:px-6 lg:px-30 py-3 md:py-4 text-right text-sm md:text-base font-bold text-white w-28">
                    Billing Sign
                  </th>
                </tr>
              </thead>
            </table>
          </div>
        </div>
      </div>

      {/* Fixed Logout Button - Top Right */}
      {onLogout && (
        <button
          onClick={onLogout}
          className="fixed top-4 right-4 z-50 flex items-center space-x-1 sm:space-x-2 bg-white sm:bg-transparent px-2 sm:px-0 py-1.5 sm:py-0 rounded-lg sm:rounded-none shadow-md sm:shadow-none text-blue-500 hover:text-red-500 transition text-xs sm:text-sm font-medium"
          title="Logout"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 sm:h-5 sm:w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
            />
          </svg>
          <span className="hidden sm:inline text-xs sm:text-sm font-medium">Logout</span>
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-3 sm:mx-4 md:mx-6 mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto">

      {/* Table - Desktop View */}
      <div className="hidden md:block border border-blue-200 border-t-0 m-3 sm:m-4 md:m-6 mt-0 overflow-x-auto">
        <table className="w-full">
          <thead style={{display: 'none'}}>
            <tr>
              <th className="w-24">ID Pasien</th>
              <th className="flex-1">Nama</th>
              <th className="flex-1">Dokter</th>
              <th className="w-28">Billing Sign</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 md:px-6 lg:px-8 py-12 text-center text-[#2591D0] text-base md:text-lg">
                  Memuat data...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 md:px-6 lg:px-8 py-12 text-center text-[#2591D0] text-base md:text-lg">
                  {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data billing'}
                </td>
              </tr>
            ) : (
              filteredData.map((item, index) => {
                // Support both PascalCase and lowercase field names from backend
                const idBilling = item.ID_Billing || item.id_billing || 0;
                const idPasien = item.ID_Pasien || item.id_pasien || 0;
                const namaPasien = item.Nama_Pasien || item.nama_pasien || 'N/A';
                const billingSign = item.Billing_Sign || item.billing_sign || '';
                // Ambil nama dokter dari backend response - bisa kosong kalo belum ada di database
                const namaDokter = item.Nama_Dokter || item.nama_dokter || '';
                
                return (
                  <tr
                    key={idBilling || index}
                    onClick={() => router.push(`/pasien?billingId=${idBilling}&namaPasien=${encodeURIComponent(namaPasien)}`)}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50 transition-colors cursor-pointer`}
                  >
                    <td className="px-4 md:px-6 lg:px-8 py-3 md:py-4 text-sm md:text-base text-[#2591D0] w-24">
                      P.{idPasien.toString().padStart(4, '0')}
                    </td>
                    <td className="px-4 md:px-6 lg:px-8 py-3 md:py-4 text-sm md:text-base text-[#2591D0] break-words flex-1">
                      {namaPasien}
                    </td>
                    <td className="px-4 md:px-6 lg:px-8 py-3 md:py-4 text-sm md:text-base text-[#2591D0] break-words flex-1">
                      {namaDokter || '-'}
                    </td>
                    <td className="px-4 md:px-6 lg:px-8 py-3 md:py-4 w-28">
                      <div className="flex items-center gap-3 md:gap-4 justify-between group relative">
                        {(() => {
                          // Hitung dynamic warning sign kalo data tarif ada
                          const dynamicSign = calculateDynamicWarningSign(item.total_tarif_rs, item.total_klaim);
                          const displaySign = dynamicSign || billingSign; // Use dynamic if available, fallback to DB sign
                          
                          return (
                            <>
                              <span
                                className={`${getStatusColor(
                                  displaySign
                                )} w-16 md:w-20 lg:w-24 h-5 md:h-6 lg:h-7 rounded-full flex-shrink-0 cursor-help`}
                                title={item.total_tarif_rs && item.total_klaim ? 
                                  `Tarif RS: Rp ${item.total_tarif_rs?.toLocaleString('id-ID')} | BPJS: Rp ${item.total_klaim?.toLocaleString('id-ID')}` 
                                  : ''}
                              ></span>
                              
                              {/* Hover Tooltip */}
                              {item.total_tarif_rs && item.total_klaim && (
                                <div className="hidden group-hover:block absolute left-0 bottom-full mb-2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap z-10">
                                  Tarif RS: Rp {item.total_tarif_rs?.toLocaleString('id-ID')} | BPJS: Rp {item.total_klaim?.toLocaleString('id-ID')}
                                </div>
                              )}
                            </>
                          );
                        })()}
                        
                        {userRole === "admin" && (
                          <FaEdit 
                            onClick={() => {
                              console.log("🖱️ FaEdit clicked! onEdit exists?", !!onEdit, "idBilling:", idBilling, "namaPasien:", namaPasien);
                              if (onEdit && idBilling) {
                                console.log("✅ Calling onEdit with:", idBilling, namaPasien);
                                onEdit(idBilling, namaPasien);
                              } else {
                                console.error("❌ Cannot call onEdit - onEdit exists?", !!onEdit, "idBilling exists?", !!idBilling);
                              }
                            }}
                            className="text-[#2591D0] cursor-pointer hover:text-[#1e7ba8] text-base md:text-lg flex-shrink-0 ml-auto" 
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="md:hidden space-y-3 p-3 sm:p-4 md:p-6">
        {loading ? (
          <div className="py-12 text-center text-[#2591D0] text-base">
            Memuat data...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="py-12 text-center text-[#2591D0] text-base bg-white border border-blue-200 rounded-lg">
            {searchTerm ? 'Tidak ada data yang sesuai dengan pencarian' : 'Tidak ada data billing'}
          </div>
        ) : (
          filteredData.map((item, index) => {
            const idBilling = item.ID_Billing || item.id_billing || 0;
            const idPasien = item.ID_Pasien || item.id_pasien || 0;
            const namaPasien = item.Nama_Pasien || item.nama_pasien || 'N/A';
            const billingSign = item.Billing_Sign || item.billing_sign || '';
            const namaDokter = item.Nama_Dokter || item.nama_dokter || '';
            
            return (
              <div
                key={idBilling || index}
                onClick={() => router.push(`/pasien?billingId=${idBilling}&namaPasien=${encodeURIComponent(namaPasien)}`)}
                className="bg-white border border-blue-200 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="space-y-3">
                  {/* ID Pasien */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      ID Pasien
                    </span>
                    <span className="text-sm font-semibold text-[#2591D0]">
                      P.{idPasien.toString().padStart(4, '0')}
                    </span>
                  </div>

                  {/* Nama */}
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Nama
                    </span>
                    <span className="text-sm text-[#2591D0] break-words">
                      {namaPasien}
                    </span>
                  </div>

                  {/* Dokter */}
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Dokter
                    </span>
                    <span className="text-sm text-[#2591D0] break-words">
                      {namaDokter || '-'}
                    </span>
                  </div>

                  {/* Kelas */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Kelas
                    </span>
                    <span className="text-sm font-semibold text-[#2591D0]">
                      {item.Kelas || item.kelas || '-'}
                    </span>
                  </div>

                  {/* DPJP */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      DPJP
                    </span>
                    <span className="text-sm font-semibold text-[#2591D0]">
                      {item.ID_DPJP || item.id_dpjp ? `ID: ${item.ID_DPJP || item.id_dpjp}` : '-'}
                    </span>
                  </div>

                  {/* Total Tarif RS */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total Tarif RS
                    </span>
                    <span className="text-sm font-semibold text-[#2591D0]">
                      {item.total_tarif_rs ? `Rp ${item.total_tarif_rs?.toLocaleString('id-ID')}` : '-'}
                    </span>
                  </div>

                  {/* Total Klaim */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total Klaim
                    </span>
                    <span className="text-sm font-semibold text-[#2591D0]">
                      {item.total_klaim ? `Rp ${item.total_klaim?.toLocaleString('id-ID')}` : '-'}
                    </span>
                  </div>

                  {/* Billing Sign */}
                  <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Billing Sign
                    </span>
                    <div className="flex items-center gap-2">
                      {(() => {
                        // Calculate dynamic warning sign if tarif data exists
                        const dynamicSign = calculateDynamicWarningSign(item.total_tarif_rs, item.total_klaim);
                        const displaySign = dynamicSign || billingSign; // Use dynamic if available, fallback to DB sign
                        
                        return (
                          <span
                            className={`${getStatusColor(displaySign)} w-16 h-5 rounded-full flex-shrink-0`}
                          ></span>
                        );
                      })()}
                      {userRole === "admin" && (
                        <FaEdit 
                          onClick={() => {
                            console.log("🖱️ FaEdit (mobile) clicked! onEdit exists?", !!onEdit, "idBilling:", idBilling, "namaPasien:", namaPasien);
                            if (onEdit && idBilling) {
                              console.log("✅ Calling onEdit (mobile) with:", idBilling, namaPasien);
                              onEdit(idBilling, namaPasien);
                            } else {
                              console.error("❌ Cannot call onEdit (mobile) - onEdit exists?", !!onEdit, "idBilling exists?", !!idBilling);
                            }
                          }}
                          className="text-[#2591D0] cursor-pointer hover:text-[#1e7ba8] text-lg flex-shrink-0" 
                        />
                      )}
                    </div>
                  </div>

                  {/* Warning Info */}
                  {item.total_tarif_rs && item.total_klaim && (() => {
                    // Calculate dynamic warning sign
                    const dynamicSign = calculateDynamicWarningSign(item.total_tarif_rs, item.total_klaim);
                    const displaySign = dynamicSign || billingSign;
                    
                    return (
                      <div className="mt-3 p-2 rounded-lg" style={{
                        backgroundColor: displaySign === 'Merah' ? '#fee2e2' : displaySign === 'Kuning' ? '#fef3c7' : '#ecfdf5',
                        borderLeft: `4px solid ${displaySign === 'Merah' ? '#dc2626' : displaySign === 'Kuning' ? '#f59e0b' : '#10b981'}`
                      }}>
                        <p className="text-xs font-semibold" style={{
                          color: displaySign === 'Merah' ? '#7f1d1d' : displaySign === 'Kuning' ? '#92400e' : '#065f46'
                        }}>
                          {displaySign === 'Merah' ? '⚠️ Tarif RS Melebihi' : displaySign === 'Kuning' ? '⚠️ Mendekati Batas' : '✅ Aman'}
                        </p>
                        <p className="text-xs mt-1" style={{
                          color: displaySign === 'Merah' ? '#991b1b' : displaySign === 'Kuning' ? '#b45309' : '#047857'
                        }}>
                          RS: Rp {item.total_tarif_rs?.toLocaleString('id-ID')} | BPJS: Rp {item.total_klaim?.toLocaleString('id-ID')}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })
        )}
      </div>
      </div>
    </div>
  );
};

export default RiwayatBillingPasien;
