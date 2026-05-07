import type { RaidKey } from "@/lib/lostark/raids";

export type TaskFrequency =
  | "DAILY"
  | "WEEKLY"
  | "ONE_TIME"
  | "BIWEEKLY"
  | "BIWEEKLY_OFFSET";

export type TaskScope = "CHARACTER" | "ROSTER";

export type LostarkTask = {
  id: string;
  label: string;
  minIlvl: number;
  frequency: TaskFrequency;
  scope: TaskScope;
  amount: number;
  maxIlvl?: number;
  iconPath?: string;
  daysFilter: number[];
  canEditDaysFilter: boolean;
  enabled: boolean;
};

export type Character = {
  name: string;
  class: string;
  ilvl: number;
  weeklyGold: boolean;
  note?: string;
  raids?: CharacterRaid[];
  sideTasks?: string[];
};

export type CharacterRaidGate = {
  gate: string;
  difficulty: string;
};

export type CharacterRaid = {
  id: string;
  raidKey: RaidKey;
  name: string;
  gates: CharacterRaidGate[];
};

export type RosterAccount = {
  accountName: string;
  characters: Character[];
};

export type RosterState = {
  accounts: RosterAccount[];
  selectedAccount: string;
  showAllTasks: boolean;
};

export type CompletionEntry = {
  amount: number;
  updated: number;
};

export type CompletionMap = Record<string, CompletionEntry>;

export type SettingsState = {
  hiddenOnCompletion: boolean;
  taskTracking: Record<string, boolean>;
};
