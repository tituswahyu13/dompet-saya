import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dompet Saya Pro - Platform Kecerdasan Finansial",
  description: "Manajer keuangan pribadi cerdas Anda dengan wawasan berbasis AI, pelacakan anggaran, dan manajemen target finansial",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dompet Saya Pro",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/DompetSayaIcon.svg",
    apple: "/DompetSayaIcon.svg",
  },
};

export const viewport = {
  themeColor: "#f43f5e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
