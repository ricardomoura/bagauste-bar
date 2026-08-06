import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Menu Digital",
  description: "Menu digital.",
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
