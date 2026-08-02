import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bagaúste Bar — Douro Valley",
  description: "Menu digital do Bagaúste Bar, no coração do Vale do Douro.",
  icons: {
    icon: "/logo.jpeg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
