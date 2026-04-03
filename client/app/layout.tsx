import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata: Metadata = {
  title: "VERITY - Truth Lives in Language",
  description: "Forensic linguistic deception analysis. VERITY analyzes linguistic patterns to detect deception using 9 analysis layers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Navbar />
        <main className="pt-[100px] mb-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
