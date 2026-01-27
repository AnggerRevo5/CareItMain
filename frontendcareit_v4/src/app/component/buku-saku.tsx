"use client";

const BukuSaku = () => {
  return (
    <div className="p-3 sm:p-4 md:p-6 bg-white min-h-screen">
      <h1 className="text-xl sm:text-2xl font-semibold text-[#2591D0] mb-3 sm:mb-4">
        Buku Saku
      </h1>

      <div className="w-full h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] md:h-[calc(100vh-140px)] rounded-lg overflow-hidden border border-blue-200">
        <iframe
          src="./assets/PDF/BUKU SAKU PENGISIAN RESUME MEDIS IKPK REVISI (1).pdf"
          className="w-full h-full"
          title="Buku Saku PDF"
        />
      </div>
    </div>
  );
};

export default BukuSaku;
