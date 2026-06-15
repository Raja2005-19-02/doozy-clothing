import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { AuthProvider } from "@/context/AuthContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { Toaster } from "react-hot-toast";
import Preloader from "@/components/Preloader";

export const metadata: Metadata = {
  title: "DOOZY — Luxury Streetwear",
  description:
    "Luxury streetwear engineered for the bold. Shop the new season drop.",
  icons: { icon: "/logo.jpg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap"
        />
      </head>
      <body>
        <SettingsProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>
                <Preloader />
                {children}
                <Toaster
                  position="bottom-center"
                  toastOptions={{
                    duration: 2400,
                    style: {
                      background: "#0a0a0a",
                      color: "#fafafa",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 0,
                      fontSize: 12,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      padding: "14px 20px",
                    },
                  }}
                />
              </CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
