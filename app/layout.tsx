import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farm2Market Uganda",
  description: "Controlled, negotiation-driven agricultural trading platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
