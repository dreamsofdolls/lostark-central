"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { routeGroups, toolRoutes } from "@/lib/routes";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-mark">LA</span>
        <span>Lost Ark Central</span>
      </Link>
      <nav className="nav">
        {routeGroups.map((group) => (
          <section key={group}>
            <h2>{group}</h2>
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
                    className={isActive ? "nav-link active" : "nav-link"}
                  >
                    {route.title}
                  </Link>
                );
              })}
          </section>
        ))}
      </nav>
      <div className="sidebar-footer">
        <a href="https://github.com/Supamiu/Lostark-helper" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="https://discord.gg/ZyYSJChpX9" target="_blank" rel="noreferrer">
          Discord
        </a>
      </div>
    </aside>
  );
}
