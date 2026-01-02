import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Velolume | AI-Powered Storefronts",
  description: "Transform social videos into stunning storefronts. Powered by AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* Noise texture overlay for editorial feel */}
        <div className="noise-overlay" aria-hidden="true" />

        {/* Main content */}
        {children}
      </body>
    </html>
  );
}
