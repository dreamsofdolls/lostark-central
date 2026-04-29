import { notFound } from "next/navigation";
import { ToolPage } from "@/components/ToolPage";
import { toolRoutes } from "@/lib/routes";

type ToolPageParams = {
  params: {
    tool: string;
  };
};

export function generateStaticParams() {
  return toolRoutes.map((route) => ({
    tool: route.href.replace("/", "")
  }));
}

export default function LostArkToolPage({ params }: ToolPageParams) {
  const route = toolRoutes.find((item) => item.href === `/${params.tool}`);

  if (!route) {
    notFound();
  }

  return <ToolPage title={route.title} description={route.description} />;
}
