import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans"
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "Limon Masa Ops",
  description: "Restoran rezervasyon ve operasyon yönetimi paneli"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${manrope.variable} ${fraunces.variable}`}>
      <body className="font-[family-name:var(--font-sans)] text-ink">{children}</body>
    </html>
  );
}
