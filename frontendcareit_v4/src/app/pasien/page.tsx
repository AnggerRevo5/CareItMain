"use client";

import { Suspense } from 'react';
import Pasien from '@/app/component/pasien';

export default function PasienPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="text-lg text-[#2591D0] mb-4">Memuat...</div>
          <div className="animate-spin h-8 w-8 border-4 border-[#2591D0] border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    }>
      <Pasien />
    </Suspense>
  );
}
