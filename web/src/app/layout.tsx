import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Roll The Dice",
  description: "Roll 10 times, save your game, and climb the leaderboard.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-black/[.08] dark:border-white/[.145]">
            <div className="mx-auto max-w-5xl mobile-container h-14 flex items-center justify-between">
              <Link href="/" className="text-base font-semibold tracking-tight">
                Roll The Dice
              </Link>
              <nav className="hidden sm:flex items-center gap-3">
                <Link className="text-sm hover:underline" href="/leaderboard">Leaderboard</Link>
                <Link className="text-sm hover:underline" href="/stats">Stats</Link>
              </nav>
              <nav className="sm:hidden flex items-center gap-2">
                <Link className="text-sm hover:underline px-2 py-1 rounded" href="/leaderboard">LB</Link>
                <Link className="text-sm hover:underline px-2 py-1 rounded" href="/stats">S</Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
