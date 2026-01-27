"use client";
import { useState, useEffect } from "react";
import DashboardDokter from "./component/dashboard_Dokter";
import DashboardAdmin from "./component/dashboard_Admin_Ruangan";
import INACBG_Admin_Ruangan from "./component/INACBG_Admin_Ruangan";
import LandingPage from "./component/landingpage";
import Login from "./component/login";
import { getAllBilling } from "@/lib/api-helper";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<"landing" | "login" | "dashboard" | "inacbg">("landing");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<"dokter" | "admin" | "">("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [editingBillingData, setEditingBillingData] = useState<any>(null);
  const [isNavigatingFromPopState, setIsNavigatingFromPopState] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string>("Home");

  // Handle browser back/forward button
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // When user clicks back/forward, restore page from history state
      setIsNavigatingFromPopState(true);
      if (event.state && event.state.page) {
        const page = event.state.page as "landing" | "login" | "dashboard" | "inacbg";
        setCurrentPage(page);

        // Restore authentication state if needed
        if (page === "dashboard" || page === "inacbg") {
          const authStatus = localStorage.getItem("isAuthenticated");
          const role = localStorage.getItem("userRole");
          if (authStatus === "true" && role) {
            setIsAuthenticated(true);
            setUserRole(role as "dokter" | "admin");
          }
        }
      } else {
        // If no state, go back to previous page based on localStorage
        const savedPage = localStorage.getItem("currentPage") as "landing" | "login" | "dashboard" | null;
        if (savedPage) {
          setCurrentPage(savedPage);
        } else {
          setCurrentPage("landing");
        }
      }
      // Reset flag after a short delay to allow useEffect to process
      setTimeout(() => setIsNavigatingFromPopState(false), 0);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Check authentication and restore page state on mount
  // Check authentication and restore page state on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        console.log("Checking auth...");
        const authStatus = localStorage.getItem("isAuthenticated");
        const role = localStorage.getItem("userRole");
        const savedPage = localStorage.getItem("currentPage") as "landing" | "login" | "dashboard" | null;

        // Check if this is first visit in this browser session (using sessionStorage)
        // This ensures that every time user opens URL (copy-paste, new tab, etc), 
        // they see landing page first
        let hasVisitedThisSession = null;
        try {
          hasVisitedThisSession = sessionStorage.getItem("hasVisitedThisSession");
        } catch (e) {
          console.warn("Session storage not available:", e);
        }

        // Always show landing page on first visit in this session, regardless of auth status
        if (!hasVisitedThisSession) {
          // First time access in this session, always show landing page
          setCurrentPage("landing");
          try {
            sessionStorage.setItem("hasVisitedThisSession", "true");
          } catch (e) {
            // Ignore session storage error
          }
          setIsFirstVisit(true);
          // Add to browser history
          window.history.replaceState({ page: "landing" }, "", window.location.href);
          // Don't save landing page to localStorage on first visit - wait for user interaction
          setIsInitialized(true);
          return;
        }

        // After first visit in this session, check authentication
        if (authStatus === "true" && role) {
          // User is authenticated, go to dashboard
          setIsAuthenticated(true);
          setUserRole(role as "dokter" | "admin");
          setCurrentPage("dashboard");
          window.history.replaceState({ page: "dashboard" }, "", window.location.href);
        } else {
          // User is not authenticated
          // Check if there's a saved page (for refresh persistence)
          if (savedPage && savedPage !== "dashboard") {
            // Use saved page (can be landing or login)
            setCurrentPage(savedPage);
            window.history.replaceState({ page: savedPage }, "", window.location.href);
          } else {
            // No saved page, go to login
            setCurrentPage("login");
            window.history.replaceState({ page: "login" }, "", window.location.href);
          }
        }
        setIsInitialized(true);
      } catch (error) {
        console.error("Initial check fail:", error);
        // Fallback if error occurs
        setCurrentPage("landing");
        setIsInitialized(true);
      }
    };

    checkAuth();
  }, []);


  // Save current page to localStorage and browser history whenever it changes
  // This ensures refresh will restore the current page and back button works
  useEffect(() => {
    if (isInitialized && !isNavigatingFromPopState) {
      // Don't save landing page on first visit - wait for user interaction
      // After first visit, always save current page to localStorage
      if (!(isFirstVisit && currentPage === "landing")) {
        localStorage.setItem("currentPage", currentPage);
        // Add to browser history for back button support (only if not from popstate)
        window.history.pushState({ page: currentPage }, "", window.location.href);
      }
      // Clear first visit flag after first interaction
      if (isFirstVisit && currentPage !== "landing") {
        setIsFirstVisit(false);
      }
    }
  }, [currentPage, isInitialized, isFirstVisit, isNavigatingFromPopState]);

  // Handle navigation from landing page to login
  const handleStartNow = () => {
    setCurrentPage("login");
    localStorage.setItem("currentPage", "login");
  };

  // Handle back to landing page
  const handleBackToLanding = () => {
    setCurrentPage("landing");
    localStorage.setItem("currentPage", "landing");
  };

  // Handle login success
  const handleLoginSuccess = (role: string) => {
    setIsAuthenticated(true);
    setUserRole(role as "dokter" | "admin");
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userRole", role);
    setCurrentPage("dashboard");
    localStorage.setItem("currentPage", "dashboard");
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole("");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    localStorage.removeItem("token");
    localStorage.removeItem("dokter");
    // Keep hasVisited so user goes to login, not landing page
    setCurrentPage("login");
    localStorage.setItem("currentPage", "login");
  };

  // Handle edit billing - navigate to INACBG page for both admin and dokter
  const handleEditBilling = async (billingId: number, pasienName?: string) => {
    // Check if user is admin or dokter (from localStorage or current state)
    const currentRole = userRole || localStorage.getItem("userRole");
    console.log("🔍 handleEditBilling called with:", { billingId, pasienName, currentRole });
    
    if (currentRole === "admin" || currentRole === "dokter") {
      try {
        // Fetch billing data to get patient information
        const response = await getAllBilling();
        console.log("📦 getAllBilling response:", response);
        
        if (response.data) {
          let billingArray: any[] = [];

          if (Array.isArray(response.data)) {
            billingArray = response.data;
          } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
            billingArray = (response.data as any).data;
          } else if ((response.data as any).status && (response.data as any).data && Array.isArray((response.data as any).data)) {
            billingArray = (response.data as any).data;
          }

          console.log("📋 billingArray:", billingArray.length, "items");
          
          // Find the billing with matching ID
          const billing = billingArray.find(
            (item) => (item.ID_Billing || item.id_billing) === billingId
          );

          console.log("🎯 Found billing:", billing);
          console.log("🔍 Searching for billingId:", billingId);
          console.log("📊 Item comparison debug:");
          billingArray.slice(0, 3).forEach((item, idx) => {
            console.log(`  Item ${idx}: ID_Billing=${item.ID_Billing}, id_billing=${item.id_billing}`);
          });

          if (billing) {
            // Handle tindakan_rs, icd9, icd10 which might be arrays or strings
            const tindakanRS = Array.isArray(billing.Tindakan_RS || billing.tindakan_rs)
              ? (billing.Tindakan_RS || billing.tindakan_rs).join(", ")
              : (billing.Tindakan_RS || billing.tindakan_rs || "");

            const icd9Array = Array.isArray(billing.ICD9 || billing.icd9)
              ? (billing.ICD9 || billing.icd9)
              : (billing.ICD9 || billing.icd9 ? [billing.ICD9 || billing.icd9] : []);

            const icd10Array = Array.isArray(billing.ICD10 || billing.icd10)
              ? (billing.ICD10 || billing.icd10)
              : (billing.ICD10 || billing.icd10 ? [billing.ICD10 || billing.icd10] : []);

            // Prepare pasien data for INACBG component
            const pasienData = {
              nama: pasienName || billing.Nama_Pasien || billing.nama_pasien || "",
              idPasien: `P.${String(billing.ID_Pasien || billing.id_pasien || 0).padStart(4, "0")}`,
              kelas: billing.Kelas || billing.kelas || "",
              tindakan: tindakanRS,
              totalTarifRS: billing.Total_Tarif_RS || billing.total_tarif_rs || 0,
              icd9: icd9Array,
              icd10: icd10Array,
            };

            console.log("✅ Setting editingBillingData:", { billingId, pasienData });
            
            setEditingBillingData({
              billingId: billingId,
              pasienData: pasienData,
            });

            // Navigate to INACBG page
            console.log("🚀 Setting currentPage to inacbg");
            setCurrentPage("inacbg");
            localStorage.setItem("currentPage", "inacbg");
            localStorage.setItem("editingBillingId", billingId.toString());
          } else {
            console.error("❌ Billing not found with ID:", billingId);
            alert("Data billing tidak ditemukan");
          }
        } else {
          console.error("❌ No data in response:", response);
          alert("Tidak ada data billing yang diterima dari server");
        }
      } catch (error) {
        console.error("❌ Error fetching billing data:", error);
        alert("Gagal memuat data billing: " + (error instanceof Error ? error.message : "Unknown error"));
      }

    }
  };

  // Handle back from INACBG to dashboard
  const handleBackToDashboard = () => {
    // Restore activeMenu from localStorage or set to Ruangan since that's where edit came from
    const savedMenu = localStorage.getItem("activeMenu") || "Ruangan";
    setActiveMenu(savedMenu);
    setCurrentPage("dashboard");
    localStorage.setItem("currentPage", "dashboard");
    setEditingBillingData(null);
  };

  // Don't render until initialized to prevent flash of wrong page
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-[#2591D0]">Memuat...</p>
        </div>
      </div>
    );
  }

  // Render based on current page
  if (currentPage === "landing") {
    return <LandingPage onStartNow={handleStartNow} />;
  }

  if (currentPage === "login") {
    return <Login onLoginSuccess={handleLoginSuccess} onBackToLanding={handleBackToLanding} />;
  }

  // Render INACBG page for both admin and dokter
  if (currentPage === "inacbg") {
    const currentRole = userRole || (typeof window !== "undefined" ? localStorage.getItem("userRole") : null);
    if ((currentRole === "admin" || currentRole === "dokter") && editingBillingData) {
      return (
        <INACBG_Admin_Ruangan
          billingId={editingBillingData.billingId}
          pasienData={editingBillingData.pasienData}
          onLogout={handleLogout}
          onBack={handleBackToDashboard}
        />
      );
    }
    // If no data, redirect to dashboard
    // Use useEffect to handle redirect
    useEffect(() => {
      handleBackToDashboard();
    }, []);
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-[#2591D0]">Memuat...</p>
        </div>
      </div>
    );
  }

  // Render dashboard based on role
  // Both admin and dokter go to dokter dashboard (same UI)
  // Get role from state or localStorage to ensure correct dashboard
  const currentRole = userRole || (typeof window !== "undefined" ? localStorage.getItem("userRole") : null);

  // Both admin and dokter see the same dokter dashboard
  return <DashboardDokter onLogout={handleLogout} onEditBilling={handleEditBilling} onActiveMenuChange={setActiveMenu} initialActiveMenu={activeMenu} />;
}
