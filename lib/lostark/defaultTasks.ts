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
  createTask("Una's Task", 302, "DAILY", "CHARACTER", 3, 9999, "daily.webp"),
  createTask("Kalthertz Slaves", 302, "DAILY", "CHARACTER", 1, 9999, "pirate_coin.png"),
  createTask("Guild Support", 0, "DAILY", "CHARACTER", 1, 9999, "sylmael.png"),
  createTask("Chaos Gate", 302, "DAILY", "ROSTER", 1, 9999, "chaos_gate.png", {
    daysFilter: [1, 4, 6, 0],
    canEditDaysFilter: false
  }),
  createTask("Anguished Island", 302, "DAILY", "ROSTER", 1, 9999, "anguished.png"),
  createTask("Adventure Island", 302, "DAILY", "ROSTER", 1, 9999, "island.webp"),
  createTask("Procyon Boss", 302, "DAILY", "ROSTER", 1, 9999, "island.webp", {
    daysFilter: [2, 5, 0],
    canEditDaysFilter: false
  }),
  createTask("Affinity Song", 302, "DAILY", "ROSTER", 6, 9999, "rapport.webp"),
  createTask("Affinity Emote", 302, "DAILY", "ROSTER", 6, 9999, "rapport.webp"),
  createTask("Weekly Mission", 302, "WEEKLY", "CHARACTER", 3, 9999, "weekly.webp"),
  createTask("Paradise", 1580, "WEEKLY", "CHARACTER", 5, 9999, "weekly.webp"),
  createTask("Howl's Hourglass", 1730, "WEEKLY", "CHARACTER", 1, 9999, "weekly.webp"),
  createTask("Demon Beast Canyon", 340, "WEEKLY", "CHARACTER", 1, 840, "abyssal-dungeon.webp"),
  createTask("Necromancer's Origin", 340, "WEEKLY", "CHARACTER", 1, 840, "abyssal-dungeon.webp"),
  createTask("Hall of the Twisted Warlord", 460, "WEEKLY", "CHARACTER", 1, 960, "abyssal-dungeon.webp"),
  createTask("Hildebrandt Palace", 460, "WEEKLY", "CHARACTER", 1, 960, "abyssal-dungeon.webp"),
  createTask("Road of Lament", 840, "WEEKLY", "CHARACTER", 1, 1325, "abyssal-dungeon.webp"),
  createTask("Forge of Fallen Pride", 840, "WEEKLY", "CHARACTER", 1, 1325, "abyssal-dungeon.webp"),
  createTask("Sea of Indolence", 960, "WEEKLY", "CHARACTER", 1, 1370, "abyssal-dungeon.webp"),
  createTask("Tranquil Karkosa", 960, "WEEKLY", "CHARACTER", 1, 1370, "abyssal-dungeon.webp"),
  createTask("Alaric's Sanctuary", 960, "WEEKLY", "CHARACTER", 1, 1370, "abyssal-dungeon.webp"),
  createTask("Aira's Oculus", 1325, "WEEKLY", "CHARACTER", 1, 1415, "abyssal-dungeon.webp"),
  createTask("Oreha Preveza", 1340, "WEEKLY", "CHARACTER", 1, 1415, "abyssal-dungeon.webp"),
  createTask("Argos", 1370, "WEEKLY", "CHARACTER", 3, 1475, "abyssal-raid.webp"),
  createTask("Valtan", 1415, "WEEKLY", "CHARACTER", 2, 9999, "legion_raid.png"),
  createTask("Vykas", 1430, "WEEKLY", "CHARACTER", 2, 9999, "legion_raid.png"),
  createTask("Kakul-Saydon", 1475, "WEEKLY", "CHARACTER", 3, 9999, "legion_raid.png"),
  createTask("Brelshaza Gate 1-2", 1490, "WEEKLY", "CHARACTER", 2, 9999, "legion_raid.png"),
  createTask("Brelshaza Gate 3", 1500, "WEEKLY", "CHARACTER", 1, 9999, "legion_raid.png"),
  createTask("Brelshaza Gate 4", 1520, "BIWEEKLY", "CHARACTER", 1, 9999, "legion_raid.png"),
  createTask("Kayangel", 1540, "WEEKLY", "CHARACTER", 3, 9999, "abyssal-dungeon.webp"),
  createTask("Akkan", 1580, "WEEKLY", "CHARACTER", 3, 9999, "legion_raid.png"),
  createTask("Ivory Tower", 1600, "WEEKLY", "CHARACTER", 3, 9999, "abyssal-dungeon.webp"),
  createTask("Thaemine", 1610, "WEEKLY", "CHARACTER", 3, 9999, "legion_raid.png"),
  createTask("Thaemine G4", 1620, "BIWEEKLY_OFFSET", "CHARACTER", 1, 9999, "legion_raid.png"),
  createTask("Echidna", 1620, "WEEKLY", "CHARACTER", 2, 9999, "kazeros-raid.webp"),
  createTask("Behemoth", 1620, "WEEKLY", "CHARACTER", 2, 9999, "kazeros-raid.webp"),
  createTask("Aegir", 1660, "WEEKLY", "CHARACTER", 2, 9999, "kazeros-raid.webp"),
  createTask("Brelshaza Chapter 2", 1670, "WEEKLY", "CHARACTER", 2, 9999, "kazeros-raid.webp"),
  createTask("Mordum", 1680, "WEEKLY", "CHARACTER", 3, 9999, "kazeros-raid.webp"),
  createTask("Armoche", 1700, "WEEKLY", "CHARACTER", 2, 9999, "kazeros-raid.webp"),
  createTask("Kazeros", 1710, "WEEKLY", "CHARACTER", 2, 9999, "kazeros-raid.webp"),
  createTask("Serca", 1710, "WEEKLY", "CHARACTER", 2, 9999, "kazeros-raid.webp"),
  createTask("South Vern Chaos Line Dungeon", 1340, "WEEKLY", "ROSTER", 2, 9999, "dungeon.webp"),
  createTask("Primal Island Battle Royale", 1490, "WEEKLY", "ROSTER", 9, 9999, "event_quest.webp", {
    daysFilter: [2, 4, 6],
    canEditDaysFilter: false
  }),
  createTask("Sylmael Bloodstones Purchases", 302, "WEEKLY", "CHARACTER", 1, 9999, "sylmael.png"),
  createTask("Pirate Coin Purchases", 302, "WEEKLY", "CHARACTER", 1, 9999, "pirate_coin.png"),
  createTask("Chaos Purchases", 302, "WEEKLY", "CHARACTER", 1, 9999, "chaos-dungeon.webp")
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
