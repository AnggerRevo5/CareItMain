"use client";
import { useState, useEffect } from "react";
import { FaSearch, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { getRuangan } from "@/lib/api-helper";

interface Ruangan {
  id?: number;
  ID_Ruangan?: number;
  nama?: string;
  Nama_Ruangan?: string;
  [key: string]: any;
}

interface AdminRuanganProps {
  onLogout?: () => void;
}

const AdminRuangan = ({ onLogout }: AdminRuanganProps) => {
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Buat fetch ruangan list yak
  useEffect(() => {
    const fetchRuangan = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getRuangan();

        if (response.error) {
          setError(response.error);
          setRuanganList([]);
          return;
        }

        // Extract ruangan data dari response
        const ruanganArray = (response.data as any)?.data || response.data;

        if (ruanganArray && Array.isArray(ruanganArray)) {
          setRuanganList(ruanganArray);
        } else {
          setRuanganList([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading ruangan");
        setRuanganList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRuangan();
  }, []);

  // Filter ruangan by search term
  const filteredRuangan = ruanganList.filter((ruangan) => {
    const nama = (ruangan.nama || ruangan.Nama_Ruangan || "").toString().toLowerCase();
    return nama.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="w-full bg-gray-50 min-h-screen p-4 sm:p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Manajemen Ruangan</h1>
        <p className="text-gray-600">Kelola data ruangan rumah sakit</p>
      </div>

      {/* Search dan Add Button */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Cari ruangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
          <FaPlus />
          Tambah Ruangan
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Ruangan Table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredRuangan.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">No</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama Ruangan</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRuangan.map((ruangan, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-600">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {ruangan.nama || ruangan.Nama_Ruangan || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm flex gap-2">
                        <button className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors">
                          <FaEdit size={16} />
                          <span>Edit</span>
                        </button>
                        <button className="flex items-center gap-1 text-red-500 hover:text-red-700 transition-colors">
                          <FaTrash size={16} />
                          <span>Hapus</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>Tidak ada ruangan ditemukan</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminRuangan;
