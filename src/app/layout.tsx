import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: { default: "Soukify — La marketplace du Tchad", template: "%s | Soukify" },
  description: "Achetez et vendez facilement au Tchad. Paiement Mobile Money sécurisé via Airtel et Moov Chad.",
  keywords: ["marketplace", "tchad", "n'djamena", "achat", "vente", "mobile money"],
  authors: [{ name: "Soukify" }],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "fr_TD",
    siteName: "Soukify",
    title: "Soukify — La marketplace du Tchad",
    description: "Achetez et vendez facilement au Tchad.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f766e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: "var(--font-sans)",
              borderRadius: "0.75rem",
              border: "1px solid var(--color-border)",
            },
          }}
        />
      </body>
    </html>
  );
}
