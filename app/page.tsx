import Link from "next/link";
import { toolRoutes } from "@/lib/routes";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Lost Ark Central</h1>
        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300">
          Next.js migration - phase 3
        </span>
      </div>
      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
        <p className="text-zinc-300">
          Du an da duoc chuyen sang Next.js voi day du route chinh tu Lostark Helper de deploy len
          Vercel. Cac logic chi tiet se duoc migrate tiep theo tung trang.
        </p>
      </section>
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {toolRoutes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 transition hover:border-blue-500/60 hover:bg-zinc-900"
          >
            <strong className="block text-zinc-100">{route.title}</strong>
            <p className="mt-1 text-sm text-zinc-400">{route.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
