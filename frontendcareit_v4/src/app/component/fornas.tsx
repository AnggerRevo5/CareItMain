"use client";

const Fornas = () => {
  return (
    <div className="p-3 sm:p-4 md:p-6 bg-white min-h-screen">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#2591D0] mb-3 sm:mb-4">
        FORNAS
      </h1>

      <div className="w-full h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] rounded-lg overflow-hidden border border-blue-200">
        <iframe
          src="./assets/PDF/FORNAS_2023.pdf"
          className="w-full h-full"
          title="FORNAS PDF"
        />
      </div>
    </div>
  );
};

export default Fornas;
