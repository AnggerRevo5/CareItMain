"use client";
import Image from "next/image";

// Static imports for assets to ensure they work in Electron build
import logoImage from "../../../public/assets/LOGO_CAREIT.svg";
import circleImage from "../../../public/assets/LandingPage/lingkaranLandingPage.svg";
import doctorImage from "../../../public/assets/LandingPage/dokterLucu.svg";
import stethoscopeImage from "../../../public/assets/LandingPage/stetoskop.svg";
import syringeImage from "../../../public/assets/LandingPage/suntik.svg";

interface LandingPageProps {
  onStartNow?: () => void;
}

const LandingPage = ({ onStartNow }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row overflow-x-hidden">
      {/* Left Section - White Background */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 md:px-12 lg:px-16 xl:px-24 py-8 sm:py-12 lg:py-16">
        {/* Logo */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <Image
            src={logoImage}
            alt="CARE-IT Logo"
            width={180}
            height={90}
            className="object-contain w-28 sm:w-32 md:w-40 lg:w-48"
            priority
          />
        </div>

        {/* Main Heading */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-[#2591D0] leading-tight">
            TARIF BPJS TEPAT
            <br />
            LAYANAN HEBAT
          </h1>
        </div>

        {/* Descriptive Text */}
        <div className="mb-6 sm:mb-8 lg:mb-10 max-w-2xl">
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#2591D0] leading-relaxed">
            Care It memudahkan dokter memverifikasi tarif tindakan agar sesuai standar BPJS,
            dengan fitur warning billing sign yang memberi peringatan otomatis saat tarif melebihi batas,
            sehingga rumah sakit tetap patuh, aman, dan bebas overbilling.
          </p>
        </div>

        {/* Call-to-Action Button */}
        <div>
          <button
            onClick={onStartNow}
            className="bg-[#87CEEB] text-[#2591D0] px-8 sm:px-10 md:px-12 py-3 sm:py-4 md:py-5 rounded-full font-bold text-base sm:text-lg md:text-xl uppercase hover:bg-[#6bb8d8] hover:text-white transition-all duration-300 shadow-lg w-full sm:w-auto"
          >
            START NOW
          </button>
        </div>
      </div>

      {/* Right Section - White Background with Circle Decorative */}
      <div className="flex-1 relative hidden md:block overflow-hidden min-h-[400px] lg:min-h-screen bg-white">
        {/* Circular Decorative Element - Background */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div className="relative" style={{ transform: 'translate(20%, -20%) scale(1.3)' }}>
            <Image
              src={circleImage}
              alt="Decorative Circle"
              width={695}
              height={738}
              className="object-contain w-full h-full opacity-30"
              priority
              style={{ filter: 'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(190deg) brightness(0.9) contrast(1.1)' }}
            />
          </div>
        </div>

        {/* White Curve Overlay - Complex curved shape from right extending to left */}
        <div className="absolute inset-0">
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" style={{ zIndex: 1 }}>
            <path
              d="M 100 0 L 100 100 C 95 95, 85 85, 70 75 C 55 65, 40 55, 25 45 C 15 35, 8 25, 0 15 L 0 0 Z"
              fill="white"
            />
          </svg>
        </div>

        {/* 3D Doctor Illustration - Aligned with logo top and text bottom */}
        <div className="absolute inset-0 z-10" style={{ top: '8rem', bottom: '8rem' }}>
          <div className="relative w-full h-full flex items-center justify-center">
            <div style={{ transform: 'translate(20%, -20%)' }}>
              <Image
                src={doctorImage}
                alt="Doctor Illustration"
                width={480}
                height={576}
                className="object-contain w-full h-full max-w-[24rem] xl:max-w-[26rem] 2xl:max-w-[28rem]"
                priority
              />
            </div>
          </div>
        </div>

        {/* Floating Stethoscope Icon - Upper Left */}
        <div className="absolute top-20 left-12 xl:left-16 z-20">
          <Image
            src={stethoscopeImage}
            alt="Stethoscope"
            width={120}
            height={120}
            className="object-contain w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
          />
        </div>

        {/* Floating Syringe Icon - Lower Right */}
        <div className="absolute bottom-20 right-12 xl:right-16 z-20">
          <Image
            src={syringeImage}
            alt="Syringe"
            width={120}
            height={120}
            className="object-contain w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 lg:w-32 lg:h-32"
          />
        </div>
      </div>

      {/* Mobile View - Show doctor illustration */}
      <div className="lg:hidden w-full bg-white py-8 px-4 flex items-center justify-center relative min-h-[300px] sm:min-h-[350px] overflow-hidden">
        {/* Circular Decorative Element - Background Mobile */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[500px] h-[500px] sm:w-[600px] sm:h-[600px] max-w-none" style={{ transform: 'translate(15%, 10%)' }}>
            <Image
              src={circleImage}
              alt="Decorative Circle"
              width={695}
              height={738}
              className="object-contain w-full h-full opacity-20 sm:opacity-25"
              priority
              style={{ filter: 'brightness(0) saturate(100%) invert(40%) sepia(90%) saturate(2000%) hue-rotate(190deg) brightness(0.9) contrast(1.1)' }}
            />
          </div>
        </div>

        {/* White Curve for Mobile */}
        <div className="absolute inset-0 overflow-hidden">
          <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none">
            <path
              d="M 0 100 L 100 100 L 100 60 C 80 50, 50 40, 0 30 Z"
              fill="white"
            />
          </svg>
        </div>

        {/* Doctor Illustration - Mobile */}
        <div className="relative z-10">
          <Image
            src={doctorImage}
            alt="Doctor Illustration"
            width={260}
            height={347}
            className="object-contain w-full max-w-[13rem]"
            priority
          />
        </div>

        {/* Mobile Icons */}
        <div className="absolute top-8 left-12 z-20">
          <Image
            src={stethoscopeImage}
            alt="Stethoscope"
            width={80}
            height={80}
            className="object-contain w-16 h-16 sm:w-20 sm:h-20"
          />
        </div>

        <div className="absolute bottom-4 right-4 z-20">
          <Image
            src={syringeImage}
            alt="Syringe"
            width={80}
            height={80}
            className="object-contain w-16 h-16 sm:w-20 sm:h-20"
          />
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

