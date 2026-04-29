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
  ilvl: number;
  lazy: boolean;
  isHide?: boolean;
  weeklyGold: boolean;
  note?: string;
};

export type RosterState = {
  characters: Character[];
  showAllTasks: boolean;
};

export type CompletionEntry = {
  amount: number;
  updated: number;
};

export type CompletionMap = Record<string, CompletionEntry>;

export type SettingsState = {
  hiddenOnCompletion: boolean;
  lazyTrackingEnabled: boolean;
  taskTracking: Record<string, boolean>;
};
