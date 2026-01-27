"use client";
import { useState } from "react";
import Image from "next/image";
import { loginDokter, loginAdmin } from "@/lib/api-helper";

// Static imports for Electron compatibility
import logoImage from "../../../public/assets/LOGO_CAREIT.svg";
import medicalIllustration from "../../../public/assets/Login/logindokterbanyak.svg";
import silhouetteImage from "../../../public/assets/Login/siluetLogin.svg";

interface LoginProps {
  onLoginSuccess?: (role: string) => void;
  onBackToLanding?: () => void;
}

const Login = ({ onLoginSuccess, onBackToLanding }: LoginProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validasi input tidak kosong
    if (!email.trim()) {
      setError("Email/username tidak boleh kosong");
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError("Password tidak boleh kosong");
      setLoading(false);
      return;
    }

    try {
      const trimmedInput = email.trim();
      const trimmedPassword = password.trim();

      // Deteksi apakah input adalah email (dokter) atau username (admin)
      // Jika mengandung @, berarti dokter, jika tidak berarti admin
      const isDokter = trimmedInput.includes("@");

      let response;
      let role: string;

      if (isDokter) {
        // Login sebagai dokter
        response = await loginDokter({
          email: trimmedInput,
          password: trimmedPassword,
        });
        role = "dokter";
      } else {
        // Login sebagai admin
        response = await loginAdmin({
          nama_admin: trimmedInput,
          password: trimmedPassword,
        });
        role = "admin";
      }

      if (response.error) {
        setError(response.error);
        setLoading(false);
        return;
      }

      if (response.data) {
        // Store token
        if (response.data.token) {
          localStorage.setItem("token", response.data.token);

          // Store role-specific user info
          if (isDokter && 'dokter' in response.data) {
            localStorage.setItem("dokter", JSON.stringify(response.data.dokter));
          } else if (!isDokter && 'admin' in response.data) {
            localStorage.setItem("admin", JSON.stringify(response.data.admin));
          }
        }

        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userRole", role);

        // Login successful
        if (onLoginSuccess) {
          onLoginSuccess(role);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat login. Pastikan backend server berjalan."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-x-hidden">
      {/* Left Section - White Background */}
      <div className="flex-shrink-0 flex flex-col px-3 sm:px-4 md:px-8 lg:px-24 py-2 sm:py-3 md:py-4 lg:py-12 lg:flex-1 max-h-[45vh] lg:max-h-none">
        {/* Logo */}
        <div className="mb-1 sm:mb-1.5 md:mb-2 lg:mb-6">
          <button
            onClick={onBackToLanding}
            className="cursor-pointer"
          >
            <Image
              src={logoImage}
              alt="CARE-IT Logo"
              width={180}
              height={90}
              className="object-contain w-14 sm:w-16 md:w-20 lg:w-40"
              priority
            />
          </button>
        </div>

        {/* 3D Medical Illustration - Reduced size on mobile */}
        <div className="flex items-center justify-center relative h-[100px] sm:h-[120px] md:h-[140px] lg:flex-1 lg:min-h-[400px] lg:h-auto flex-1">
          <Image
            src={medicalIllustration}
            alt="Medical Professionals Illustration"
            width={800}
            height={667}
            className="object-contain w-full h-full max-w-[150px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-lg xl:max-w-xl"
            priority
          />
        </div>
      </div>

      {/* Right Section - White Background with Silhouette */}
      <div className="flex-1 relative hidden lg:flex items-center justify-center overflow-hidden bg-white">
        {/* Silhouette Decorative Element - Background */}
        <div className="absolute inset-0 flex items-center justify-end overflow-visible">
          <Image
            src={silhouetteImage}
            alt="Login Silhouette"
            width={965}
            height={1024}
            className="object-contain h-full w-auto opacity-30"
            priority
            style={{
              minHeight: '100%',
              maxHeight: '100%',
              filter: 'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(190deg) brightness(0.9) contrast(1.1)'
            }}
          />
        </div>

        {/* Login Form */}
        <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md px-3 sm:px-6">
          {/* Welcome Title */}
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 md:mb-10 lg:mb-12 text-center">
            Welcome
          </h2>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            {/* Email/Username Input */}
            <div>
              <input
                type="text"
                placeholder="Enter Email or Username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-100 text-gray-800 placeholder-gray-500 rounded-full py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[#2591D0] focus:ring-offset-2 focus:ring-offset-transparent"
                required
              />
            </div>

            {/* Password Input */}
            <div>
              <input
                type="password"
                placeholder="Enter Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-100 text-gray-800 placeholder-gray-500 rounded-full py-3 sm:py-4 px-4 sm:px-6 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-[#2591D0] focus:ring-offset-2 focus:ring-offset-transparent"
                required
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-xs sm:text-sm text-center bg-red-100 rounded-full py-2 px-3 sm:px-4">
                {error}
              </div>
            )}

            {/* Login Button */}
            <div className="pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#d4a574] hover:bg-[#c49663] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-full text-base sm:text-lg transition-colors shadow-lg"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile Login Form */}
      <div className="lg:hidden w-full flex items-center justify-center bg-white px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 flex-shrink-0 min-h-[55vh] relative overflow-visible">
        {/* Silhouette Decorative Element - Background Mobile */}
        <div className="absolute inset-0 flex items-center justify-end overflow-visible">
          <Image
            src={silhouetteImage}
            alt="Login Silhouette"
            width={965}
            height={1024}
            className="object-contain h-full w-auto opacity-20"
            priority
            style={{
              minHeight: '100%',
              maxHeight: '100%',
              filter: 'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(190deg) brightness(0.9) contrast(1.1)'
            }}
          />
        </div>
        <div className="w-full max-w-xs sm:max-w-sm relative z-10">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2.5 sm:mb-3 md:mb-4 text-center">
            Welcome
          </h2>
          <form onSubmit={handleLogin} className="space-y-2 sm:space-y-2.5 md:space-y-3">
            <input
              type="text"
              placeholder="Enter Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-100 text-gray-800 placeholder-gray-500 rounded-full py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2591D0]"
              required
            />
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-100 text-gray-800 placeholder-gray-500 rounded-full py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#2591D0]"
              required
            />
            {error && (
              <div className="text-red-600 text-xs text-center bg-red-100 rounded-full py-1.5 px-2 sm:px-3">
                {error}
              </div>
            )}
            <div className="pt-0.5 sm:pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#d4a574] hover:bg-[#c49663] active:bg-[#b88752] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-2.5 sm:py-3 px-4 rounded-full text-sm sm:text-base transition-colors shadow-lg"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

