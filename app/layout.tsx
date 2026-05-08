import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kim Loong Co. Shdn Bhd",
  description: "Professional retail inventory management with SKU tracking, barcode generation, and bulk printing capabilities.",
  keywords: "inventory management, SKU, barcode, retail, stock management",
  icons: {
    icon: "/KimLoong_logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
