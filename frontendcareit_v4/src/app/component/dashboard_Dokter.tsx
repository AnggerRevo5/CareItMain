"use client";

import React, { useState, useEffect } from "react";
import TarifRumahSakit from "./tarif-rumah-sakit";
import Image from "next/image";
import Sidebar from "./sidebar";
import TarifBPJS from "./tarif-bpjs";
import BillingPasien from "./billing-pasien";
import RiwayatBillingPasien from "./riwayat-billing-pasien";
import BukuSaku from "./buku-saku";
import Fornas from "./fornas";
import AdminRuangan from "./admin-ruangan";
import DashboardAdmin from "./dashboard_Admin_Ruangan";
import { getAllBilling } from "@/lib/api-helper";

// Static imports
import header1Image from "../../../public/assets/dashboard_dokter/header1.svg";
import header2Image from "../../../public/assets/dashboard_dokter/header2.svg";
import warningGreen from "../../../public/assets/dashboard_dokter/warning-green.svg";
import warningYellow from "../../../public/assets/dashboard_dokter/warning-yellow.svg";
import warningRed from "../../../public/assets/dashboard_dokter/warning-red.svg";

interface DashboardProps {
  onLogout?: () => void;
  onEditBilling?: (billingId: number) => void;
  onActiveMenuChange?: (menu: string) => void;
  initialActiveMenu?: string;
}

const Dashboard = ({ onLogout, onEditBilling, onActiveMenuChange, initialActiveMenu }: DashboardProps) => {
  const [activeMenu, setActiveMenu] = useState(initialActiveMenu || "Home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [namaDokter, setNamaDokter] = useState("Dokter");
  const [userRole, setUserRole] = useState<"dokter" | "admin" | "">("");
  const [namaUser, setNamaUser] = useState("Pengguna");
  const [totalBilling, setTotalBilling] = useState(0);
  const [exceededBilling, setExceededBilling] = useState(0);
  const [warningBilling, setWarningBilling] = useState(0);
  const [normalBilling, setNormalBilling] = useState(0);

  // Ambil nama dokter/admin dari localStorage sama user role
  useEffect(() => {
    const role = localStorage.getItem("userRole") as "dokter" | "admin" | "";
    setUserRole(role || "");
    
    // Try to get dokter/admin data from localStorage
    const dokterData = localStorage.getItem("dokter");
    const adminData = localStorage.getItem("admin");
    
    if (role === "admin" && adminData) {
      try {
        const admin = JSON.parse(adminData);
        // Backend returns nama_admin field for admin
        if (admin.nama_admin) {
          setNamaUser(admin.nama_admin);
          setNamaDokter(admin.nama_admin); // Keep for backward compatibility
        }
      } catch (e) {
        console.error("Error parsing admin data:", e);
      }
    } else if (dokterData) {
      try {
        const dokter = JSON.parse(dokterData);
        if (dokter.nama) {
          setNamaUser(dokter.nama);
          setNamaDokter(dokter.nama);
        }
      } catch (e) {
        console.error("Error parsing dokter data:", e);
      }
    }
  }, []);

  // Track activeMenu changes and notify parent
  useEffect(() => {
    if (onActiveMenuChange) {
      onActiveMenuChange(activeMenu);
      localStorage.setItem("activeMenu", activeMenu);
    }
  }, [activeMenu, onActiveMenuChange]);

  // Fetch billing data buat pie chart
  useEffect(() => {
    const fetchBillingStats = async () => {
      try {
        const response = await getAllBilling();
        
        if (response.data) {
          let billingArray: any[] = [];

          // Handle berbagai struktur response
          if (Array.isArray(response.data)) {
            billingArray = response.data;
          } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
            billingArray = (response.data as any).data;
          } else if ((response.data as any).status && (response.data as any).data && Array.isArray((response.data as any).data)) {
            billingArray = (response.data as any).data;
          }

          // Count by billing sign: merah (exceeded), kuning (warning), hijau (normal)
          const total = billingArray.length;
          let exceeded = 0;
          let warning = 0;
          let normal = 0;

          console.log('📊 Total billing items:', total);
          console.log('📋 Billing data sample:', billingArray.slice(0, 3));

          billingArray.forEach((item, index) => {
            const sign = (item.Billing_Sign || item.billing_sign || "").toLowerCase().trim();
            console.log(`Item ${index} - Billing_Sign: "${item.Billing_Sign}", billing_sign: "${item.billing_sign}", normalized: "${sign}"`);
            
            if (sign === "merah" || sign === "red" || sign === "orange") {
              exceeded++;
              console.log(`  ✓ Counted as MERAH (exceeded)`);
            } else if (sign === "kuning" || sign === "yellow") {
              warning++;
              console.log(`  ✓ Counted as KUNING (warning)`);
            } else if (sign === "hijau" || sign === "green") {
              normal++;
              console.log(`  ✓ Counted as HIJAU (normal)`);
            } else {
              console.log(`  ⚠️ Not counted - sign: "${sign}"`);
            }
          });

          console.log('📈 Final counts - Normal:', normal, 'Warning:', warning, 'Exceeded:', exceeded);

          setTotalBilling(total);
          setExceededBilling(exceeded);
          setWarningBilling(warning);
          setNormalBilling(normal);
        }
      } catch (err) {
        console.error("Error fetching billing stats:", err);
        // Use fallback values
        setTotalBilling(10);
        setExceededBilling(2);
        setWarningBilling(3);
        setNormalBilling(5);
      }
    };

    fetchBillingStats();
  }, []);

  const handleLogout = () => {
    // Clear authentication
    localStorage.removeItem("isAuthenticated");
    // Call parent logout handler
    if (onLogout) {
      onLogout();
    }
  };

  const menuItems = [
    { name: "Home", icon: "🏠" },
    { name: "Tarif Rumah Sakit", icon: "🏥" },
    { name: "Tarif BPJS", icon: "💳" },
    { name: "Billing Pasien", icon: "📊" },
    { name: "Riwayat Billing Pasien", icon: "🕒" },
    { name: "Buku Saku", icon: "📚" },
    { name: "Fornas", icon: "⚙️" },
  ];

  const warningItems = [
    {
      message: "Billing mencapai 50% dari Tarif INA-CBG",
      icon: warningGreen,
    },
    {
      message: "Billing mencapai 80% dari Tarif INA-CBG",
      icon: warningYellow,
    },
    {
      message: "Billing melebihi dari Tarif INA-CBG",
      icon: warningRed,
    },
  ];


  return (
    <div className="flex min-h-screen bg-[#F5FAFD] overflow-hidden w-full">
      {/* Hamburger Menu Button - Mobile Only */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-safe left-4 z-50 lg:hidden bg-[#2591D0] text-white p-2.5 sm:p-3 rounded-lg shadow-lg hover:bg-[#1e7ba8] transition-colors"
        aria-label="Toggle sidebar"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isSidebarOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        userRole={userRole}
      />

      {/* Main Content - Offset by sidebar width on lg+ */}
      <div className="flex-1 w-full max-w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6 overflow-y-auto ml-0 lg:ml-72">
        {/* Render content based on active menu */}

        {activeMenu === "Tarif Rumah Sakit" && <TarifRumahSakit />}
        {activeMenu === "Tarif BPJS" && <TarifBPJS />}
        {activeMenu === "Billing Pasien" && <BillingPasien onEditBilling={onEditBilling} />}
        {activeMenu === "Riwayat Billing Pasien" && (
          <RiwayatBillingPasien
            userRole={localStorage.getItem("userRole") === "admin" ? "admin" : "dokter"}
            onEdit={onEditBilling}
          />
        )}
        {activeMenu === "Buku Saku" && <BukuSaku />}
        {activeMenu === "Fornas" && <Fornas />}
        {activeMenu === "Ruangan" && (
          <DashboardAdmin onLogout={onLogout} onEditBilling={onEditBilling} />
        )}
        {activeMenu === "Home" && (
          <>

            {/* Top Header */}


            {/* Content Area */}
            <div className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto">
              {/* Greeting Card */}
              <div className="mb-4 sm:mb-6">

                {/* DATE + LOGOUT */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                  <p className="text-blue-500 text-xs sm:text-sm">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>

                {/* Fixed Logout Button - Top Right - Only show on Home page */}
                {activeMenu === "Home" && (
                  <button
                    onClick={handleLogout}
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


                {/* MAIN CARD */}
                <div className="relative bg-gradient-to-r from-[#7CC3EA] to-[#5BAFE2] rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-10 text-white overflow-hidden">

                  {/* ORNAMENT CIRCLES */}
                  <span className="absolute top-4 sm:top-6 left-1/3 w-3 h-3 sm:w-4 sm:h-4 border-2 sm:border-4 border-yellow-400 rounded-full opacity-70"></span>
                  <span className="absolute bottom-6 sm:bottom-10 right-1/3 w-3 h-3 sm:w-4 sm:h-4 border-2 sm:border-4 border-yellow-400 rounded-full opacity-70"></span>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">

                    {/* LEFT IMAGE */}
                    <div className="w-24 sm:w-32 md:w-36 flex-shrink-0">
                      <Image
                        src={header2Image}
                        alt="Medicine"
                        width={144}
                        height={144}
                        className="w-full object-contain"
                      />
                    </div>

                    {/* TEXT CENTER */}
                    <div className="text-center sm:text-left max-w-lg flex-1">
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-2 sm:mb-3">
                        Halo, {namaUser}
                      </h2>

                      <p className="text-xs sm:text-sm md:text-base text-blue-50 leading-relaxed">
                        Care It memudahkan dokter memverifikasi tarif tindakan agar sesuai standar BPJS, dengan fitur warning billing sign yang memberi peringatan otomatis saat tarif melebihi batas, sehingga rumah sakit tetap patuh, aman, dan bebas overbilling.
                      </p>
                    </div>

                    {/* RIGHT IMAGE */}
                    <div className="w-20 sm:w-28 md:w-32 flex-shrink-0">
                      <Image
                        src={header1Image}
                        alt="Clipboard"
                        width={128}
                        height={128}
                        className="w-full object-contain"
                      />
                    </div>

                  </div>
                </div>
              </div>

              {/* Warning Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                <div>
                  <h4 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                    Warning Billing Sign
                  </h4>
                  <div className="space-y-2 sm:space-y-3 md:space-y-4">
                    {warningItems.map((warning, index) => (
                      <div
                        key={index}
                        className="bg-[#EAF6FF] rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 flex items-center space-x-3 sm:space-x-4"
                      >
                        {/* ICON IMAGE */}
                        <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0">
                          <Image
                            src={warning.icon}
                            alt="warning icon"
                            width={64}
                            height={64}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* TEXT */}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm md:text-lg font-medium text-[#1E88E5] break-words">
                            {warning.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Right Side - Additional Content */}
                <div className="bg-[#D8EEF9] rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center min-h-[200px] sm:min-h-[280px]">
                  {/* Pie Chart */}
                  <div className="flex flex-col items-center gap-4 sm:gap-6 w-full">
                    {/* SVG Pie Chart */}
                    <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56">
                      <svg viewBox="0 0 120 120" className="w-full h-full drop-shadow-lg">
                        {/* Background circle */}
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#E0E0E0" strokeWidth="2" />
                        
                        {/* Pie segments - calculate angles based on data */}
                        {totalBilling > 0 && (
                          <>
                            {/* Exceeded segment (red) - starts at top (0°) */}
                            {exceededBilling > 0 && (
                              <path
                                d={(() => {
                                  const angle1 = (exceededBilling / totalBilling) * 360;
                                  const rad1 = (angle1 * Math.PI) / 180;
                                  const x1 = 60 + 50 * Math.sin(rad1);
                                  const y1 = 60 - 50 * Math.cos(rad1);
                                  const largeArc = angle1 > 180 ? 1 : 0;
                                  return `M 60 10 A 50 50 0 ${largeArc} 1 ${x1} ${y1} L 60 60 Z`;
                                })()}
                                fill="#FF5252"
                                stroke="white"
                                strokeWidth="2"
                              />
                            )}
                            
                            {/* Warning segment (yellow) */}
                            {warningBilling > 0 && (
                              <path
                                d={(() => {
                                  const angle1 = (exceededBilling / totalBilling) * 360;
                                  const angle2 = ((exceededBilling + warningBilling) / totalBilling) * 360;
                                  const rad1 = (angle1 * Math.PI) / 180;
                                  const rad2 = (angle2 * Math.PI) / 180;
                                  const x1 = 60 + 50 * Math.sin(rad1);
                                  const y1 = 60 - 50 * Math.cos(rad1);
                                  const x2 = 60 + 50 * Math.sin(rad2);
                                  const y2 = 60 - 50 * Math.cos(rad2);
                                  const largeArc = (angle2 - angle1) > 180 ? 1 : 0;
                                  return `M ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} L 60 60 Z`;
                                })()}
                                fill="#FFC107"
                                stroke="white"
                                strokeWidth="2"
                              />
                            )}
                            
                            {/* Normal segment (green) */}
                            {normalBilling > 0 && (
                              <path
                                d={(() => {
                                  const angle2 = ((exceededBilling + warningBilling) / totalBilling) * 360;
                                  const angle3 = 360;
                                  const rad2 = (angle2 * Math.PI) / 180;
                                  const x2 = 60 + 50 * Math.sin(rad2);
                                  const y2 = 60 - 50 * Math.cos(rad2);
                                  const largeArc = (angle3 - angle2) > 180 ? 1 : 0;
                                  return `M ${x2} ${y2} A 50 50 0 ${largeArc} 1 60 10 L 60 60 Z`;
                                })()}
                                fill="#4CAF50"
                                stroke="white"
                                strokeWidth="2"
                              />
                            )}
                          </>
                        )}
                      </svg>
                    </div>

                    {/* Legend */}
                    <div className="flex gap-4 sm:gap-6 justify-center flex-wrap">
                      {exceededBilling > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#FF5252] rounded-sm"></div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">Melebihi ({exceededBilling})</span>
                        </div>
                      )}
                      {warningBilling > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#FFC107] rounded-sm"></div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">Peringatan ({warningBilling})</span>
                        </div>
                      )}
                      {normalBilling > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#4CAF50] rounded-sm"></div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">Normal ({normalBilling})</span>
                        </div>
                      )}
                    </div>

                    {/* Text */}
                    <div className="text-center">
                      <p className="text-center text-lg sm:text-xl md:text-2xl font-bold">
                        <span className="text-[#FF5252]">{exceededBilling}</span>
                        <span className="text-gray-700"> dari </span>
                        <span className="text-[#2591D0]">{totalBilling}</span>
                        <span className="text-gray-700"> Pasien</span>
                      </p>
                      <p className="text-center text-sm sm:text-base text-[#2591D0] font-semibold mt-2">
                        melebihi klaim BPJS
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
