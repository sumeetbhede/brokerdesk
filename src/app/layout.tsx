import type { Metadata, Viewport } from "next";
import {
  Noto_Sans_Bengali,
  Noto_Sans_Gujarati,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Kannada,
  Noto_Sans_Malayalam,
  Noto_Sans_Oriya,
  Noto_Sans_Tamil,
  Noto_Sans_Telugu,
  Poppins,
} from "next/font/google";
import "./globals.css";

// Poppins covers Latin and Devanagari (Hindi, Marathi). Weights 400 and 500 only.
const poppins = Poppins({ weight: ["400", "500"], subsets: ["latin", "devanagari"], variable: "--font-poppins" });

// Other regional scripts fall back to Noto Sans. Not preloaded: the browser fetches one only when a page uses that script.
const notoBengali = Noto_Sans_Bengali({ weight: ["400", "500"], subsets: ["bengali"], variable: "--font-noto-bengali", preload: false, display: "swap" });
const notoGujarati = Noto_Sans_Gujarati({ weight: ["400", "500"], subsets: ["gujarati"], variable: "--font-noto-gujarati", preload: false, display: "swap" });
const notoGurmukhi = Noto_Sans_Gurmukhi({ weight: ["400", "500"], subsets: ["gurmukhi"], variable: "--font-noto-gurmukhi", preload: false, display: "swap" });
const notoKannada = Noto_Sans_Kannada({ weight: ["400", "500"], subsets: ["kannada"], variable: "--font-noto-kannada", preload: false, display: "swap" });
const notoMalayalam = Noto_Sans_Malayalam({ weight: ["400", "500"], subsets: ["malayalam"], variable: "--font-noto-malayalam", preload: false, display: "swap" });
const notoOriya = Noto_Sans_Oriya({ weight: ["400", "500"], subsets: ["oriya"], variable: "--font-noto-oriya", preload: false, display: "swap" });
const notoTamil = Noto_Sans_Tamil({ weight: ["400", "500"], subsets: ["tamil"], variable: "--font-noto-tamil", preload: false, display: "swap" });
const notoTelugu = Noto_Sans_Telugu({ weight: ["400", "500"], subsets: ["telugu"], variable: "--font-noto-telugu", preload: false, display: "swap" });
const fontVariables = [poppins, notoBengali, notoGujarati, notoGurmukhi, notoKannada, notoMalayalam, notoOriya, notoTamil, notoTelugu].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: "EstatePal",
  description: "Everything your property business needs",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "EstatePal", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f1" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
