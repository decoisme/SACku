import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./platform.css";

export const metadata: Metadata = {
  title: "SACku — Perjalanan Ibadah, Lebih Tenang",
  description:
    "Temukan perjalanan Haji dan Umrah yang terencana dengan pendampingan, pelayanan, dan informasi yang jelas untuk setiap langkah ibadah Anda.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
