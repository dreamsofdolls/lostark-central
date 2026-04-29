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
    href: "/gold-planner",
    title: "Gold Planner",
    description: "Quy hoach nguon gold tu tat ca hoat dong.",
    group: "Helpers"
  },
  {
    href: "/mari-optimizer",
    title: "Mari Optimizer",
    description: "So sanh gia tri voi Mari's Secret Shop.",
    group: "Helpers"
  },
  {
    href: "/honing-cost-optimizer",
    title: "Honing Cost Optimizer",
    description: "Tinh toan chi phi honing theo nhieu kich ban.",
    group: "Helpers"
  },
  {
    href: "/gearsets",
    title: "Gearsets",
    description: "Quan ly gearset va engraving setup.",
    group: "Helpers"
  },
  {
    href: "/engraving-search",
    title: "Engraving Search",
    description: "Tra cuu ket hop engraving nhanh.",
    group: "Helpers"
  },
  {
    href: "/other-tools",
    title: "More Cool Tools",
    description: "Tap hop cac cong cu bo sung.",
    group: "Helpers"
  },
  {
    href: "/party-planner",
    title: "Party Planner",
    description: "Lap ke hoach party va phan bo role.",
    group: "Party Helpers"
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
