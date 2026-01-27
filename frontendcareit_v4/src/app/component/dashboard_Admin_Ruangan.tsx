"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { FaSearch, FaExternalLinkAlt, FaEdit } from 'react-icons/fa';
import BillingAktif from "./billing_aktif";
import { getAllBilling } from "@/lib/api-helper";

// Static logo import
import logoImage from "../../../public/assets/LOGO_CAREIT.svg";

interface DashboardAdminProps {
  onLogout?: () => void;
  onEditBilling?: (billingId: number) => void;
}

interface BillingData {
  ID_Billing?: number;
  ID_Pasien?: number;
  Nama_pasien?: string;
  ruangan?: string;
  Ruangan?: string;
  [key: string]: any;
}

const DashboardAdmin = ({ onLogout, onEditBilling }: DashboardAdminProps) => {
  const [activeRuangan, setActiveRuangan] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  interface RuanganItem {
    name: string;
    unsignedCount: number;
  }
  const [ruanganItems, setRuanganItems] = useState<RuanganItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch ruangan dari billing/pasien data
  useEffect(() => {
    const fetchRuangan = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAllBilling();

        if (response.error) {
          setError(response.error);
          setRuanganItems([]);
          return;
        }

        // Extract data dari response - bisa response.data atau response.data.data
        const billingArray = (response.data as any)?.data || (response.data as any);

        if (billingArray && Array.isArray(billingArray)) {
          // Build a map of ruangan -> count of unsigned billing_sign
          const ruanganMap = new Map<string, { total: number; unsigned: number }>();

          billingArray.forEach((item: BillingData) => {
            // Backend now returns ruangan with name (not ID), so use directly
            const ruangan = (item.ruangan || item.Ruangan || "").toString().trim();
            if (!ruangan) return;

            const prev = ruanganMap.get(ruangan) || { total: 0, unsigned: 0 };
            prev.total += 1;

            // Determine whether this billing is unsigned. Treat falsy/empty/"0"/"null" as unsigned.
            const sign = item.billing_sign as any;
            const isUnsigned = !sign || sign === "0" || sign === "null" || (typeof sign === "string" && sign.trim() === "");
            if (isUnsigned) prev.unsigned += 1;

            ruanganMap.set(ruangan, prev);
          });

          // Convert map to array of RuanganItem sorted by name
          const ruanganArray: RuanganItem[] = Array.from(ruanganMap.entries())
            .map(([name, counts]) => ({ name, unsignedCount: counts.unsigned }))
            .sort((a, b) => a.name.localeCompare(b.name));

          setRuanganItems(ruanganArray);

          // Set active ruangan ke yang pertama kalo ada
          if (ruanganArray.length > 0) {
            setActiveRuangan(ruanganArray[0].name);
          }
        } else {
          setRuanganItems([]);
          setActiveRuangan(null);
        }
      } catch (err) {
        console.error("Error fetching ruangan:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Gagal mengambil data ruangan"
        );
        setRuanganItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRuangan();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F5FAFD]">
      {/* Hamburger Menu Button - Mobile Only */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden bg-[#2591D0] text-white p-2 rounded-lg shadow-lg hover:bg-[#1e7ba8] transition-colors"
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

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`
          fixed top-0 left-0
          w-56 sm:w-60 md:w-64 h-screen
          bg-[#ECF6FB] rounded-r-2xl sm:rounded-r-3xl shadow-lg
          transition-transform duration-300 z-50
          overflow-y-auto

          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:relative lg:rounded-r-none lg:rounded-l-3xl
        `}
      >
        {/* Logo */}
        <div className="p-3 sm:p-5 flex justify-center border-b border-blue-100">
          <Image
            src={logoImage}
            alt="CARE-IT Logo"
            width={140}
            height={70}
            className="object-contain w-24 sm:w-32 md:w-36"
          />
        </div>

        {/* Navigation Menu */}
        <nav className="mt-4 sm:mt-6 space-y-1 px-2 sm:px-4">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2591D0]"></div>
              <span className="ml-2 text-xs text-gray-500">Loading...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600">
              {error}
            </div>
          ) : ruanganItems.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-xs text-gray-500">Tidak ada data ruangan</p>
            </div>
          ) : (
            ruanganItems.map((ruanganItem, index) => {
              const ruanganName = ruanganItem.name;
              const isActive = activeRuangan === ruanganName;

              return (
                <button
                  key={index}
                  onClick={() => {
                    setActiveRuangan(ruanganName);
                    setIsSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between py-2 sm:py-3 px-2 sm:px-4
                    rounded-lg text-left transition-all
                    ${isActive
                      ? "bg-white text-[#2591D0] border-l-4 border-[#2591D0] font-medium"
                      : "text-gray-400 hover:bg-white hover:text-gray-600"
                    }
                  `}
                >
                  <span className="text-xs sm:text-sm">{ruanganName}</span>
                  {ruanganItem.unsignedCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center bg-red-500 text-white text-[10px] font-semibold h-5 px-2 rounded-full">
                      {ruanganItem.unsignedCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full lg:w-auto lg:ml-0">
        <BillingAktif
          onLogout={handleLogout}
          userRole="admin"
          onEdit={onEditBilling}
          selectedRuangan={activeRuangan}
        />
      </div>
    </div>
  );
};

export default DashboardAdmin;

