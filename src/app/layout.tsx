import type { Metadata } from "next";
import { ViewTransition } from "react";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { CartProvider } from "@/context/CartContext";

export const metadata: Metadata = {
  title: "Comunidad Fungi | Cultivo de Hongos en Chile",
  description: "Asociación dedicada al cultivo y abastecimiento de hongos y plantas medicinales.",
  icons: {
    icon: [
      { url: "/logo.jpeg", type: "image/jpeg" },
    ],
    shortcut: "/logo.jpeg",
    apple: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F5ECD7]">
        <CartProvider>
          <Navbar />
          <ViewTransition>
            <main className="flex-1">{children}</main>
          </ViewTransition>
          <Footer />
          <WhatsAppButton />
        </CartProvider>
      </body>
    </html>
  );
}
