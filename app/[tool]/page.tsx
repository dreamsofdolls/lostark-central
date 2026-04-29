import { notFound } from "next/navigation";
import { ToolPage } from "@/components/ToolPage";
import { ChecklistClient } from "@/components/checklist/ChecklistClient";
import { RosterClient } from "@/components/roster/RosterClient";
import { TasksManagerClient } from "@/components/tasks/TasksManagerClient";
import { SettingsClient } from "@/components/settings/SettingsClient";
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

  if (params.tool === "tasks-manager") {
    return <TasksManagerClient />;
  }

  if (params.tool === "settings") {
    return <SettingsClient />;
  }

  const route = toolRoutes.find((item) => item.href === `/${params.tool}`);

  if (!route) {
    notFound();
  }

  return <ToolPage title={route.title} description={route.description} />;
}
