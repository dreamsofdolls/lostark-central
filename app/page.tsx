import Link from "next/link";
import { toolRoutes } from "@/lib/routes";

export default function HomePage() {
  return (
    <>
      <div className="header">
        <h1>Lost Ark Central</h1>
        <span>Next.js migration - phase 2</span>
      </div>
      <section className="card">
        <p>
          Du an da duoc chuyen sang Next.js voi day du route chinh tu Lostark Helper de deploy len
          Vercel. Cac logic chi tiet se duoc migrate tiep theo tung trang.
        </p>
      </section>
      <div style={{ height: 16 }} />
      <section className="card-grid">
        {toolRoutes.map((route) => (
          <Link key={route.href} href={route.href}>
            <strong>{route.title}</strong>
            <p>{route.description}</p>
          </Link>
        ))}
      </section>
    </>
  );
}
