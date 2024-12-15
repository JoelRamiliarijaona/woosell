import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { AuthProvider } from "./components/AuthProvider";
import NavBar from "./components/NavBar";
import Notifications from "./components/Notifications";
import ThemeRegistry from '../theme/ThemeRegistry';
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-roboto-mono',
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
    <html lang="fr" className={`${inter.variable} ${robotoMono.variable}`}>
      <body>
        <ThemeRegistry>
          <AuthProvider>
            <NavBar />
            <main className="container mx-auto px-4">
              {children}
            </main>
            <Notifications />
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
