import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth/user";
import { AppHeader } from "@/components/AppHeader";

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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-zinc-50 text-zinc-900 antialiased`}
      >
        <Script id="theme-init" strategy="beforeInteractive">{`
          (function () {
            try {
              var key = 'theme';
              var saved = window.localStorage.getItem(key);
              var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              var next = (saved === 'dark' || saved === 'light') ? saved : (systemDark ? 'dark' : 'light');
              var el = document.documentElement;
              if (next === 'dark') { el.classList.add('dark'); el.classList.remove('light'); }
              else { el.classList.add('light'); el.classList.remove('dark'); }
            } catch (e) {}
          })();
        `}</Script>
        <AppHeader user={user ? { id: user.id, display_name: user.display_name } : null} />
        <main className="w-full">{children}</main>
      </body>
    </html>
  );
}
