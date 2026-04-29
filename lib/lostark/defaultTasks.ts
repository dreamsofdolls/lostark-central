import { LostarkTask, TaskFrequency, TaskScope } from "@/lib/lostark/types";

function createTask(
  label: string,
  minIlvl: number,
  frequency: TaskFrequency,
  scope: TaskScope,
  amount = 1,
  maxIlvl = 9999,
  iconPath?: string,
  additionalParams: Partial<Omit<LostarkTask, "id" | "label" | "minIlvl" | "frequency" | "scope" | "amount">> = {}
): Omit<LostarkTask, "id"> {
  return {
    label,
    minIlvl,
    frequency,
    scope,
    amount,
    maxIlvl,
    iconPath,
    daysFilter: [],
    enabled: true,
    canEditDaysFilter: true,
    ...additionalParams
  };
}

const rawTasks: Omit<LostarkTask, "id">[] = [
  createTask("Chaos Dungeon", 302, "DAILY", "CHARACTER", 1, 9999, "chaos-dungeon.webp"),
  createTask("Guardian", 302, "DAILY", "CHARACTER", 1, 9999, "guardian.png"),
  createTask("Chaos Gate", 302, "DAILY", "ROSTER", 1, 9999, "chaos_gate.png", {
    daysFilter: [1, 4, 6, 0],
    canEditDaysFilter: false
  }),
  createTask("Field Boss", 302, "DAILY", "ROSTER", 1, 9999, "island.webp", {
    daysFilter: [2, 5, 0],
    canEditDaysFilter: false
  }),
  createTask("Solo Shop", 302, "WEEKLY", "CHARACTER", 1, 9999, "weekly.webp"),
  createTask("Paradise", 1580, "WEEKLY", "CHARACTER", 5, 9999, "weekly.webp"),
  createTask("Howl's Hourglass", 1730, "WEEKLY", "CHARACTER", 1, 9999, "weekly.webp"),
  createTask("Armoche", 1700, "WEEKLY", "CHARACTER", 2, 9999, "kazeros-raid.webp"),
  createTask("Kazeros", 1710, "WEEKLY", "CHARACTER", 2, 9999, "kazeros-raid.webp"),
  createTask("Serca", 1710, "WEEKLY", "CHARACTER", 2, 9999, "kazeros-raid.webp")
];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const defaultTasks: LostarkTask[] = rawTasks.map((task, index) => ({
  ...task,
  id: `${slugify(task.label)}-${index}`
}));
