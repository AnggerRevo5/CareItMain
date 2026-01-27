"use client";

import Image from "next/image";
import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

// Static import for logo
import logoImage from "../../../public/assets/LOGO_CAREIT.svg";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeMenu: string;
  setActiveMenu: React.Dispatch<React.SetStateAction<string>>;
  menuItems?: {
    name: string;
    icon: string;
  }[];
  userRole?: "dokter" | "admin" | "";
}

const Sidebar = ({
  isSidebarOpen,
  setIsSidebarOpen,
  activeMenu,
  setActiveMenu,
  menuItems,
  userRole,
}: SidebarProps) => {
  const [informasiDropdownOpen, setInformasiDropdownOpen] = useState(false);
  const [warningDropdownOpen, setWarningDropdownOpen] = useState(false);
  const [ruanganDropdownOpen, setRuanganDropdownOpen] = useState(false);

  // Handler buat item di dalam dropdown (tetap buka dropdown)
  const handleDropdownItemClick = (menuName: string) => {
    setActiveMenu(menuName);
    setIsSidebarOpen(false);
    // Dropdown tetap terbuka
  };

  // Handler buat menu tanpa dropdown (Home, Ruangan) - tutup semua dropdown
  const handleMenuClick = (menuName: string) => {
    setActiveMenu(menuName);
    setIsSidebarOpen(false);
    // Tutup semua dropdown saat klik menu item tanpa dropdown
    setInformasiDropdownOpen(false);
    setWarningDropdownOpen(false);
    setRuanganDropdownOpen(false);
  };

  const informasiItems = [
    { name: "Tarif Rumah Sakit", icon: "💰" },
    { name: "Tarif BPJS", icon: "🏥" },
    { name: "Fornas", icon: "📋" },
    { name: "Buku Saku", icon: "📚" },
  ];

  const billingItems = [
    { name: "Billing Pasien", icon: "📝" },
    { name: "Riwayat Billing Pasien", icon: "📊" },
  ];

  const ruanganItems = [
    { name: "Ruangan", icon: "🏢" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`
          fixed top-0 left-0
          w-48 sm:w-56 md:w-64 lg:w-72 h-screen
          bg-[#ECF6FB] rounded-r-2xl sm:rounded-r-3xl shadow-lg
          transition-all duration-300 z-50
          overflow-y-auto

          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:rounded-r-none lg:rounded-l-3xl lg:shadow-none
        `}
      >
        {/* LOGO */}
        <div className="p-3 sm:p-5 flex justify-center border-b border-blue-100">
          <Image
            src={logoImage}
            alt="Care It Logo"
            width={140}
            height={70}
            className="object-contain w-24 sm:w-32 md:w-36"
          />
        </div>

        {/* MENU */}
        <nav className="mt-4 sm:mt-6 space-y-1 sm:space-y-2 px-2 sm:px-4">
          {/* Home */}
          <button
            onClick={() => handleMenuClick("Home")}
            className={`
              w-full flex items-center gap-2 sm:gap-3 py-2 sm:py-3 px-2 sm:px-4
              rounded-lg sm:rounded-xl text-left transition-all
              ${activeMenu === "Home"
                ? "bg-white text-blue-600 border-l-4 border-blue-500 shadow-sm"
                : "text-gray-400 hover:bg-white"
              }
            `}
          >
            <span className={`text-base sm:text-lg ${activeMenu === "Home" ? "text-blue-500" : ""}`}>
              🏠
            </span>
            <span className="text-xs sm:text-sm font-medium">Home</span>
          </button>

          {/* Informasi Umum Dropdown */}
          <div>
            <button
              onClick={() => {
                // Jika dropdown sedang terbuka, tutup; jika tertutup, buka dan tutup yang lain
                if (informasiDropdownOpen) {
                  setInformasiDropdownOpen(false);
                } else {
                  setInformasiDropdownOpen(true);
                  setWarningDropdownOpen(false);
                  setRuanganDropdownOpen(false);
                }
              }}
              className={`
                w-full flex items-center justify-between gap-2 sm:gap-3 py-2 sm:py-3 px-2 sm:px-4
                rounded-lg sm:rounded-xl text-left transition-all
                ${informasiItems.some((item) => activeMenu === item.name)
                  ? "bg-white text-blue-600 border-l-4 border-blue-500 shadow-sm"
                  : "text-gray-400 hover:bg-white"
                }
              `}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className={`text-base sm:text-lg ${informasiItems.some((item) => activeMenu === item.name) ? "text-blue-500" : ""
                  }`}>
                  ℹ️
                </span>
                <span className="text-xs sm:text-sm font-medium">Informasi Umum</span>
              </div>
              <FaChevronDown
                className={`text-xs transition-transform ${informasiDropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {/* Informasi Dropdown Items */}
            {informasiDropdownOpen && (
              <div className="mt-1 ml-2 space-y-1 border-l-2 border-blue-200 pl-2 sm:pl-4">
                {informasiItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDropdownItemClick(item.name)}
                    className={`
                      w-full flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3
                      rounded-lg text-left text-xs sm:text-sm transition-all
                      ${activeMenu === item.name
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:bg-blue-100"
                      }
                    `}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Warning Billing Sign Dropdown */}
          <div>
            <button
              onClick={() => {
                // Jika dropdown sedang terbuka, tutup; jika tertutup, buka dan tutup yang lain
                if (warningDropdownOpen) {
                  setWarningDropdownOpen(false);
                } else {
                  setWarningDropdownOpen(true);
                  setInformasiDropdownOpen(false);
                  setRuanganDropdownOpen(false);
                }
              }}
              className={`
                w-full flex items-center justify-between gap-2 sm:gap-3 py-2 sm:py-3 px-2 sm:px-4
                rounded-lg sm:rounded-xl text-left transition-all
                ${billingItems.some((item) => activeMenu === item.name)
                  ? "bg-white text-blue-600 border-l-4 border-blue-500 shadow-sm"
                  : "text-gray-400 hover:bg-white"
                }
              `}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <span className={`text-base sm:text-lg ${billingItems.some((item) => activeMenu === item.name) ? "text-blue-500" : ""
                  }`}>
                  ⚠️
                </span>
                <span className="text-xs sm:text-sm font-medium">Warning Billing Sign</span>
              </div>
              <FaChevronDown
                className={`text-xs transition-transform ${warningDropdownOpen ? "rotate-180" : ""
                  }`}
              />
            </button>

            {/* Warning Dropdown Items */}
            {warningDropdownOpen && (
              <div className="mt-1 ml-2 space-y-1 border-l-2 border-blue-200 pl-2 sm:pl-4">
                {billingItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDropdownItemClick(item.name)}
                    className={`
                      w-full flex items-center gap-2 sm:gap-3 py-2 px-2 sm:px-3
                      rounded-lg text-left text-xs sm:text-sm transition-all
                      ${activeMenu === item.name
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:bg-blue-100"
                      }
                    `}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Ruangan Menu - Available for both Admin and Dokter */}
          <button
            onClick={() => handleMenuClick("Ruangan")}
            className={`
              w-full flex items-center gap-2 sm:gap-3 py-2 sm:py-3 px-2 sm:px-4
              rounded-lg sm:rounded-xl text-left transition-all
              ${activeMenu === "Ruangan"
                ? "bg-white text-blue-600 border-l-4 border-blue-500 shadow-sm"
                : "text-gray-400 hover:bg-white"
              }
            `}
          >
            <span className={`text-base sm:text-lg ${activeMenu === "Ruangan" ? "text-blue-500" : ""}`}>
              🏢
            </span>
            <span className="text-xs sm:text-sm font-medium">Ruangan</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
