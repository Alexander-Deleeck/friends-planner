import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/user";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Friends Planner",
  description: "Coordinate availability and events with friends",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 text-zinc-900 antialiased`}
      >
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold">
              Friends Planner
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              {user && (
                <>
                  <Link href="/availability" className="text-zinc-700 hover:text-black">
                    Availability
                  </Link>
                </>
              )}
              <Link href="/login" className="text-zinc-700 hover:text-black">
                {user ? `Signed in as ${user.display_name}` : "Login"}
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-6">{children}</main>
      </body>
    </html>
  );
}
