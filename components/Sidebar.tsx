"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routeGroups, toolRoutes } from "@/lib/routes";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col gap-5 border-r border-zinc-800 bg-zinc-900/80 p-4 backdrop-blur-sm md:min-h-screen">
      <Link href="/" className="flex items-center gap-2.5 text-base font-bold tracking-wide">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-sm">LA</span>
        <span>Lost Ark Central</span>
      </Link>
      <nav className="space-y-4">
        {routeGroups.map((group) => (
          <section key={group}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">{group}</h2>
            {toolRoutes
              .filter((route) => route.group === group)
              .map((route) => {
                const isActive =
                  pathname === route.href ||
                  (route.href !== "/" && pathname.startsWith(route.href));
                return (
                  <Link
                    key={route.href}
                    href={route.href}
                    className={`mb-1 block rounded-lg px-3 py-2 text-sm transition ${
                      isActive ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                  >
                    {route.title}
                  </Link>
                );
              })}
          </section>
        ))}
      </nav>
      <div className="mt-auto flex gap-3 text-sm text-zinc-400">
        <a href="https://github.com/Supamiu/Lostark-helper" target="_blank" rel="noreferrer" className="hover:text-zinc-200">
          GitHub
        </a>
        <a href="https://discord.gg/ZyYSJChpX9" target="_blank" rel="noreferrer" className="hover:text-zinc-200">
          Discord
        </a>
      </div>
    </aside>
  );
}
