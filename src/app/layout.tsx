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
  description: "Restoran rezervasyon ve operasyon yönetimi paneli",
  other: {
    "facebook-domain-verification": "IhoiI3nq0z7a6kc1t1dwqg72cv2w0y"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${manrope.variable} ${fraunces.variable}`}>
      <head>
        <meta name="facebook-domain-verification" content="IhoiI3nq0z7a6kc1t1dwqg72cv2w0y" />
      </head>
      <body className="font-[family-name:var(--font-sans)] text-ink">{children}</body>
    </html>
  );
}
