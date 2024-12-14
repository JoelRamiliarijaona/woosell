import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import NavBar from "./components/NavBar";
import ThemeRegistry from '../theme/ThemeRegistry';
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
  title: "WooSell - Gestionnaire de Sites E-commerce",
  description: "Plateforme de gestion de sites e-commerce WooCommerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeRegistry>
          <AuthProvider>
            <NavBar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </main>
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
