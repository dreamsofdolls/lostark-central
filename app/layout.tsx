import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lost Ark Central",
  description: "Next.js migration of Lostark Helper for Vercel deployment."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-[oklch(0.18_0.01_260)] text-[oklch(0.95_0_0)] antialiased">
        <header className="fixed inset-x-0 top-0 z-50 border-b border-[oklch(0.38_0.02_260)] bg-[oklch(0.23_0.015_260)]/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 font-bold">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[oklch(0.75_0.18_330)] text-[oklch(0.18_0.01_260)]">
                  LA
                </span>
                <span>Lost Ark Central</span>
              </Link>
              <nav className="hidden items-center gap-1 text-sm md:flex">
                <Link href="/" className="rounded-lg px-3 py-2 text-[oklch(0.7_0_0)] transition hover:bg-white/5 hover:text-white">
                  Home
                </Link>
                <Link
                  href="/checklist"
                  className="rounded-lg px-3 py-2 text-[oklch(0.7_0_0)] transition hover:bg-white/5 hover:text-white"
                >
                  Checklist
                </Link>
                <Link
                  href="/friends"
                  className="rounded-lg px-3 py-2 text-[oklch(0.7_0_0)] transition hover:bg-white/5 hover:text-white"
                >
                  Friends
                </Link>
                <Link
                  href="/roster"
                  className="rounded-lg px-3 py-2 text-[oklch(0.7_0_0)] transition hover:bg-white/5 hover:text-white"
                >
                  Manage Roster
                </Link>
                <Link
                  href="/settings"
                  className="rounded-lg px-3 py-2 text-[oklch(0.7_0_0)] transition hover:bg-white/5 hover:text-white"
                >
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-lg border border-[oklch(0.38_0.02_260)] text-[oklch(0.7_0_0)] transition hover:bg-white/5 hover:text-white"
                aria-label="Notifications"
              >
                🔔
              </button>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full bg-[oklch(0.75_0.18_330)] font-semibold text-[oklch(0.18_0.01_260)]"
                aria-label="User profile"
              >
                U
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto min-h-screen max-w-[1600px] px-4 pb-8 pt-20 md:px-6">{children}</main>
      </body>
    </html>
  );
}
