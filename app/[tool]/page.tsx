import { notFound } from "next/navigation";
import { ToolPage } from "@/components/ToolPage";
import { ChecklistClient } from "@/components/checklist/ChecklistClient";
import { RosterClient } from "@/components/roster/RosterClient";
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
  if (params.tool === "checklist") {
    return <ChecklistClient />;
  }

  if (params.tool === "roster") {
    return <RosterClient />;
  }

  const route = toolRoutes.find((item) => item.href === `/${params.tool}`);

  if (!route) {
    notFound();
  }

  return <ToolPage title={route.title} description={route.description} />;
}
