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
    description: "Theo doi cong viec daily/weekly cho roster.",
    group: "Helpers"
  },
  {
    href: "/friends",
    title: "Friends",
    description: "Theo doi ban be va tinh trang invite.",
    group: "Party Helpers"
  },
  {
    href: "/roster",
    title: "Roster",
    description: "Quan ly danh sach character trong account.",
    group: "Configuration"
  },
  {
    href: "/tasks-manager",
    title: "Tasks Manager",
    description: "Tuy chinh bo task va cau hinh checklist.",
    group: "Configuration"
  },
  {
    href: "/settings",
    title: "Settings",
    description: "Cau hinh app, vung va thong tin nguoi dung.",
    group: "Configuration"
  }
];

export const routeGroups: ToolRoute["group"][] = [
  "Helpers",
  "Party Helpers",
  "Configuration"
];
