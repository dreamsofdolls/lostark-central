export type ToolRoute = {
  href: string;
  title: string;
  description: string;
  group: "Helpers" | "Party Helpers" | "Configuration";
};

export const toolRoutes: ToolRoute[] = [
  {
    href: "/checklist",
    title: "Checklist",
    description: "Theo dõi công việc daily/weekly cho roster.",
    group: "Helpers"
  },
  {
    href: "/friends",
    title: "Friends",
    description: "Theo dõi bạn bè và tình trạng invite.",
    group: "Party Helpers"
  },
  {
    href: "/roster",
    title: "Roster",
    description: "Quản lý danh sách character trong account.",
    group: "Configuration"
  },
  {
    href: "/tasks-manager",
    title: "Tasks Manager",
    description: "Setup bộ task và cấu hình checklist.",
    group: "Configuration"
  },
  {
    href: "/settings",
    title: "Settings",
    description: "Setup task tracking và các tùy chọn khác.",
    group: "Configuration"
  }
];

export const routeGroups: ToolRoute["group"][] = [
  "Helpers",
  "Party Helpers",
  "Configuration"
];
