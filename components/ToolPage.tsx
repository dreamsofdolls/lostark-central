type ToolPageProps = {
  title: string;
  description: string;
};

export function ToolPage({ title, description }: ToolPageProps) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="mt-2 text-zinc-300">{description}</p>
      <p className="mt-2 text-zinc-400">
        Trang nay da duoc migrate sang Next.js o muc khung. Logic chi tiet se tiep tuc duoc port
        tu Angular trong phase tiep theo.
      </p>
    </article>
  );
}
