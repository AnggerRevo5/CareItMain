"use client";

import React, { useState, useEffect } from "react";
import {
  getTarifBPJSRawatInap,
  getTarifBPJSRawatJalan,
  type TarifBPJSRawatInap,
  type TarifBPJSRawatJalan,
} from "@/lib/api-helper";

type TarifType = "rawat_inap" | "rawat_jalan";

const TarifBPJS = () => {
  const [search, setSearch] = useState("");
  const [tarifType, setTarifType] = useState<TarifType>("rawat_inap");
  const [kelas, setKelas] = useState<1 | 2 | 3>(1);
  
  // Data states
  const [dataRawatInap, setDataRawatInap] = useState<TarifBPJSRawatInap[]>([]);
  const [dataRawatJalan, setDataRawatJalan] = useState<TarifBPJSRawatJalan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch data dari backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        if (tarifType === "rawat_inap") {
          const response = await getTarifBPJSRawatInap();
          if (response.error) {
            setError(response.error);
            return;
          }
          if (response.data) {
            setDataRawatInap(response.data);
          }
        } else {
          const response = await getTarifBPJSRawatJalan();
          if (response.error) {
            setError(response.error);
            return;
          }
          if (response.data) {
            setDataRawatJalan(response.data);
          }
        }
      } catch (err) {
        setError("Gagal memuat data tarif BPJS. Pastikan backend server berjalan.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tarifType]);

  // Filter data based on search
  const getFilteredData = () => {
    if (tarifType === "rawat_inap") {
      return dataRawatInap.filter(
        (item) =>
          (item as any).KodeINA?.toLowerCase().includes(search.toLowerCase()) ||
          (item as any).Deskripsi?.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      return dataRawatJalan.filter(
        (item) =>
          (item as any).KodeINA?.toLowerCase().includes(search.toLowerCase()) ||
          (item as any).Deskripsi?.toLowerCase().includes(search.toLowerCase())
      );
    }
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

        {/* Type Selector (Rawat Inap / Rawat Jalan) */}
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5">
          <button
            onClick={() => setTarifType("rawat_inap")}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border transition text-sm sm:text-base font-medium ${
              tarifType === "rawat_inap"
                ? "bg-blue-500 text-white border-blue-500"
                : "text-[#2591D0] border-blue-300 bg-white hover:bg-blue-50"
            }`}
          >
            Rawat Inap
          </button>
          <button
            onClick={() => setTarifType("rawat_jalan")}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full border transition text-sm sm:text-base font-medium ${
              tarifType === "rawat_jalan"
                ? "bg-blue-500 text-white border-blue-500"
                : "text-[#2591D0] border-blue-300 bg-white hover:bg-blue-50"
            }`}
          >
            Rawat Jalan
          </button>
        </div>

        {/* Kelas Selector (only for Rawat Inap) */}
        {tarifType === "rawat_inap" && (
          <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5">
            <span className="text-sm sm:text-base text-[#2591D0] font-medium self-center">
              Kelas:
            </span>
            {[1, 2, 3].map((k) => (
              <button
                key={k}
                onClick={() => setKelas(k as 1 | 2 | 3)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition text-xs sm:text-sm ${
                  kelas === k
                    ? "bg-blue-500 text-white border-blue-500"
                    : "text-[#2591D0] border-blue-300 bg-white hover:bg-blue-50"
                }`}
              >
                Kelas {k}
              </button>
            ))}
          </div>
        )}

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
        <div className="flex-none w-[16.666%]">Kode</div>
        <div className="flex-1 break-words pr-2">Tindakan</div>
        <div className="flex-none w-[16.666%] text-right">
          {tarifType === "rawat_inap" ? `Tarif Kelas ${kelas}` : "Tarif BPJS"}
        </div>
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
                let tarifValue: number = 0;
                
                if (tarifType === "rawat_inap") {
                  const rawatInapItem = item as any;
                  if (kelas === 1) tarifValue = rawatInapItem.Kelas1 || 0;
                  else if (kelas === 2) tarifValue = rawatInapItem.Kelas2 || 0;
                  else tarifValue = rawatInapItem.Kelas3 || 0;
                } else {
                  const rawatJalanItem = item as any;
                  // Backend sends tarif_inacbg (lowercase), but we also check TarifINACBG for compatibility
                  tarifValue = rawatJalanItem.tarif_inacbg || rawatJalanItem.TarifINACBG || 0;
                }

                return (
                  <div
                    key={i}
                    className="grid grid-cols-6 px-3 md:px-4 lg:px-6 py-3 md:py-4 text-sm md:text-base border-b border-blue-100 hover:bg-blue-50 transition-colors"
                  >
                    <div className="col-span-1 text-[#2591D0] font-medium break-words">
                      {tarifType === "rawat_inap"
                        ? (item as any).KodeINA
                        : (item as any).KodeINA}
                    </div>
                    <div className="col-span-4 text-[#2591D0] break-words pr-2">
                      {tarifType === "rawat_inap"
                        ? (item as any).Deskripsi
                        : (item as any).Deskripsi}
                    </div>
                    <div className="col-span-1 text-right text-[#2591D0] font-medium whitespace-nowrap">
                      {formatCurrency(tarifValue)}
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
            <div>Kode</div>
            <div>Tindakan</div>
            <div className="text-right">{tarifType === "rawat_inap" ? `Tarif Kelas ${kelas}` : "Tarif BPJS"}</div>
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
              let tarifValue: number = 0;
              
              if (tarifType === "rawat_inap") {
                const rawatInapItem = item as any;
                if (kelas === 1) tarifValue = rawatInapItem.Kelas1 || 0;
                else if (kelas === 2) tarifValue = rawatInapItem.Kelas2 || 0;
                else tarifValue = rawatInapItem.Kelas3 || 0;
              } else {
                const rawatJalanItem = item as any;
                tarifValue = rawatJalanItem.tarif_inacbg || rawatJalanItem.TarifINACBG || 0;
              }

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
                        {tarifType === "rawat_inap"
                          ? (item as any).KodeINA
                          : (item as any).KodeINA}
                      </span>
                    </div>

                    {/* Deskripsi */}
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Tindakan
                      </span>
                      <span className="text-sm text-[#2591D0] break-words">
                        {tarifType === "rawat_inap"
                          ? (item as any).Deskripsi
                          : (item as any).Deskripsi}
                      </span>
                    </div>

                    {/* Tarif */}
                    <div className="flex items-center justify-between pt-2 border-t border-blue-100">
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {tarifType === "rawat_inap" ? `Tarif Kelas ${kelas}` : "Tarif BPJS"}
                      </span>
                      <span className="text-base font-bold text-[#2591D0]">
                        {formatCurrency(tarifValue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Empty State */}
          {!loading && filteredData.length === 0 && (
            <div className="py-8 text-center text-gray-500 text-sm bg-white border border-blue-200 rounded-lg">
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

export default TarifBPJS;
