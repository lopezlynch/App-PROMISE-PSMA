import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PROMISE-PSMA · Estadificación miTNM",
  description:
    "Herramienta educativa para generar el código de estadificación miTNM (PROMISE V2) a partir de un PET/CT con PSMA. Todo el procesamiento ocurre en el navegador.",
  applicationName: "PROMISE-PSMA",
  authors: [{ name: "PROMISE-PSMA" }],
  keywords: ["PROMISE", "PSMA", "miTNM", "PET", "cáncer de próstata", "estadificación"],
};

export const viewport: Viewport = {
  themeColor: "#0e7490",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
