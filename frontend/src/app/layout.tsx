import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/features/auth/AuthContext";
import { CartProvider } from "@/features/cart/CartContext";
import { SocketProvider } from "@/features/realtime/SocketContext";

export const metadata: Metadata = {
  title: "Afrigari - Marché d'Excellence Africaine",
  description: "La plateforme d'agro-alimentaire premium pour le Gari, Tapioca et produits dérivés.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
