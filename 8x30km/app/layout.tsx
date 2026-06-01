import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "8×30km",
  description: "8 days, ~30km a day — three running adventures across Europe",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
