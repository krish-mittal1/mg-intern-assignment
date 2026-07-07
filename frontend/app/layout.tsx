import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import Nav from "@/components/Nav";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "SignFlow",
  description: "Upload a PDF, request a signature through Setu, track it to done.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body className="flex min-h-screen flex-col font-sans">
        <Nav />
        <main className="flex-grow">{children}</main>

        <footer className="mt-20 border-t border-line bg-surface">
          <div className="mx-auto flex w-full max-w-[1120px] flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
            <span className="font-serif text-[1.25rem] text-ink">SignFlow</span>
            <span className="text-[0.72rem] uppercase tracking-[0.1em] text-faint">
              Built on Setu · e-sign workflow
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
