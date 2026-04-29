import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lost Ark Central",
  description: "Next.js migration of Lostark Helper for Vercel deployment."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-100 antialiased">
        <div className="min-h-screen md:grid md:grid-cols-[280px_1fr]">
          <Sidebar />
          <main className="p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
