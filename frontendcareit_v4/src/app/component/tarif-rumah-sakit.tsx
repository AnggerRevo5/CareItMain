"use client";

import React, { useState, useEffect } from "react";
import { getTarifRumahSakit, type TarifData } from "@/lib/api-helper";

type FilterType = "Semua" | "Rawat Darurat" | "Rawat Inap" | "Rawat Jalan";

const TarifRumahSakit = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("Semua");
  
  // Data states
  const [allData, setAllData] = useState<TarifData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch data dari backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getTarifRumahSakit();
        if (response.error) {
          setError(response.error);
          return;
        }
        if (response.data) {
          setAllData(response.data);
        }
      } catch (err) {
        setError("Gagal memuat data tarif rumah sakit. Pastikan backend server berjalan.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter data based on search and filter type
  const getFilteredData = () => {
    let filtered = [...allData];

    // Apply category filter
    if (filterType !== "Semua") {
      filtered = filtered.filter((item) => {
        const kategori = (item as any).Kategori || "";
        if (filterType === "Rawat Darurat") {
          return kategori.toLowerCase().includes("darurat");
        } else if (filterType === "Rawat Inap") {
          return kategori.toLowerCase().includes("inap");
        } else if (filterType === "Rawat Jalan") {
          return kategori.toLowerCase().includes("jalan");
        }
        return true;
      });
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          (item as any).KodeRS?.toLowerCase().includes(searchLower) ||
          (item as any).Deskripsi?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  const filteredData = getFilteredData();

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header Section - Sticky */}
      <div className="sticky top-0 z-40 bg-white border-b border-blue-100 p-3 sm:p-4 md:p-6">
        {/* Tanggal */}
        <div className="text-xs sm:text-sm text-[#2591D0] mb-2 sm:mb-3">
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Filter Type Selector */}
        <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-5">
          {(["Semua", "Rawat Darurat", "Rawat Inap", "Rawat Jalan"] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-2.5 rounded-full border transition text-xs sm:text-sm md:text-base font-medium whitespace-nowrap ${
                filterType === filter
                  ? "bg-blue-500 text-white border-blue-500 shadow-md"
                  : "text-[#2591D0] border-blue-300 bg-white hover:bg-blue-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari tindakan disini"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-blue-200 rounded-lg py-2 sm:py-3 pl-3 sm:pl-4 pr-8 sm:pr-10 text-sm sm:text-base text-blue-400 focus:ring-2 focus:ring-blue-400"
          />
          <div className="absolute right-2 sm:right-3 top-2 sm:top-3.5 text-blue-400">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Table Header - Desktop Sticky */}
      <div className="hidden md:flex sticky top-0 z-30 bg-blue-50 border-b border-blue-200 border-t text-[#2591D0] font-semibold text-sm md:text-base mt-4 sm:mt-5 px-3 md:px-4 lg:px-6 py-3 md:py-4 gap-0">
        <div className="flex-none w-[16.666%]">Kode RS</div>
        <div className="flex-1 break-words pr-2">Tindakan</div>
        <div className="flex-none w-[16.666%] text-right">Harga</div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6">
        {/* Table - Desktop View */}
        <div className="hidden md:block border border-blue-200 rounded-lg md:rounded-xl shadow-sm mt-0">
          <div className="min-w-full">

          {/* Loading State */}
          {loading && (
            <div className="py-12 md:py-16 text-center text-[#2591D0] text-base md:text-lg">
              Memuat data...
            </div>
          )}

          {/* Rows */}
          {!loading &&
            filteredData.map((item, i) => {
              return (
                <div
                  key={i}
                  className="grid grid-cols-6 px-3 md:px-4 lg:px-6 py-3 md:py-4 text-sm md:text-base border-b border-blue-100 hover:bg-blue-50 transition-colors"
                >
                  <div className="col-span-1 text-[#2591D0] font-medium break-words">
                    {(item as any).KodeRS}
                  </div>
                  <div className="col-span-4 text-[#2591D0] break-words pr-2">
                    {(item as any).Deskripsi}
                  </div>
                  <div className="col-span-1 text-right text-[#2591D0] font-medium whitespace-nowrap">
                    {formatCurrency((item as any).Harga)}
                  </div>
                </div>
              );
            })}


          {/* Empty State */}
          {!loading && filteredData.length === 0 && (
            <div className="py-8 md:py-12 text-center text-gray-500 text-sm md:text-base">
              {search
                ? "Tidak ada data yang sesuai dengan pencarian"
                : "Tidak ada data ditemukan"}
            </div>
          )}
        </div>
      </div>

        {/* Mobile/Tablet Card View */}
        <div className="md:hidden space-y-3 mt-4 sm:mt-5 pb-6">
          {/* Mobile Header - Sticky */}
          <div className="sticky top-0 z-30 grid grid-cols-3 bg-blue-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-3 text-[#2591D0] font-semibold text-xs sm:text-sm">
            <div>Kode RS</div>
            <div>Tindakan</div>
            <div className="text-right">Harga</div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center text-[#2591D0] text-base">
              Memuat data...
            </div>
          )}

          {/* Cards */}
          {!loading &&
            filteredData.map((item, i) => {
              return (
                <div
                  key={i}
                  className="bg-white border border-blue-200 rounded-lg shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col space-y-2">
                    {/* Kode */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Kode
                      </span>
                      <span className="text-sm font-semibold text-[#2591D0]">
                        {(item as any).KodeRS}
                      </span>
                    </div>

                    {/* Deskripsi */}
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Tindakan
                      </span>
                      <span className="text-sm text-[#2591D0] break-words">
                        {(item as any).Deskripsi}
                      </span>
                    </div>

                    {/* Kategori */}
                    {(item as any).Kategori && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Kategori:
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-[#2591D0] rounded-full">
                          {(item as any).Kategori}
                        </span>
                      </div>
                    )}

                    {/* Harga */}
                    <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Harga
                      </span>
                      <span className="text-base font-bold text-[#2591D0]">
                        {formatCurrency((item as any).Harga)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Empty State */}
          {!loading && filteredData.length === 0 && (
            <div className="py-12 text-center text-gray-500 text-sm bg-white border border-blue-200 rounded-lg">
              {search
                ? "Tidak ada data yang sesuai dengan pencarian"
                : "Tidak ada data ditemukan"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TarifRumahSakit;
