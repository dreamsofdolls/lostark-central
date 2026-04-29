type ToolPageProps = {
  title: string;
  description: string;
};

export function ToolPage({ title, description }: ToolPageProps) {
  return (
    <article className="card">
      <h1>{title}</h1>
      <p>{description}</p>
      <p>
        Trang nay da duoc migrate sang Next.js o muc khung. Logic chi tiet se tiep tuc duoc port
        tu Angular trong phase tiep theo.
      </p>
    </article>
  );
}
