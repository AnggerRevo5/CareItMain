import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CARE-IT - Tarif BPJS Tepat Layanan Hebat",
  description: "Care It memudahkan dokter memverifikasi tarif tindakan agar sesuai standar BPJS, dengan fitur warning billing sign yang memberi peringatan otomatis saat tarif melebihi batas",
};


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

