import { defaultTasks } from "@/lib/lostark/defaultTasks";
import { CompletionMap, LostarkTask, RosterState, SettingsState } from "@/lib/lostark/types";

const ROSTER_KEY = "lostark-central:roster";
const COMPLETION_KEY = "lostark-central:completion";
const TASKS_KEY = "lostark-central:tasks";
const SETTINGS_KEY = "lostark-central:settings";
const DATA_VERSION_KEY = "lostark-central:data-version";
const CURRENT_DATA_VERSION = 3;

export const defaultRosterState: RosterState = {
  characters: [],
  showAllTasks: false
};

export const defaultSettingsState: SettingsState = {
  region: "EU",
  hiddenOnCompletion: false,
  showHiddenCharacters: false,
  lazyTrackingEnabled: true
};

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) {
    return fallback;
  }
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function migrateStorageIfNeeded(): void {
  if (typeof window === "undefined") {
    return;
  }
  const currentVersion = Number(window.localStorage.getItem(DATA_VERSION_KEY) || "1");
  if (currentVersion >= CURRENT_DATA_VERSION) {
    return;
  }

  if (currentVersion < 3) {
    // Phase preset update: enforce the reduced checklist set for all existing users.
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(defaultTasks));
  } else if (!window.localStorage.getItem(TASKS_KEY)) {
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(defaultTasks));
  }
  if (!window.localStorage.getItem(SETTINGS_KEY)) {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettingsState));
  }

  window.localStorage.setItem(DATA_VERSION_KEY, String(CURRENT_DATA_VERSION));
}

export function readRosterState(): RosterState {
  if (typeof window === "undefined") {
    return defaultRosterState;
  }
  migrateStorageIfNeeded();
  const parsed = safeParse<RosterState>(window.localStorage.getItem(ROSTER_KEY), defaultRosterState);
  return {
    characters: parsed.characters ?? [],
    showAllTasks: Boolean(parsed.showAllTasks)
  };
}

export function writeRosterState(next: RosterState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ROSTER_KEY, JSON.stringify(next));
}

export function readCompletionMap(): CompletionMap {
  if (typeof window === "undefined") {
    return {};
  }
  migrateStorageIfNeeded();
  return safeParse<CompletionMap>(window.localStorage.getItem(COMPLETION_KEY), {});
}

export function writeCompletionMap(next: CompletionMap): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(COMPLETION_KEY, JSON.stringify(next));
}

export function readTasksState(): LostarkTask[] {
  if (typeof window === "undefined") {
    return defaultTasks;
  }
  migrateStorageIfNeeded();
  const parsed = safeParse<LostarkTask[]>(window.localStorage.getItem(TASKS_KEY), defaultTasks);
  if (!parsed.length) {
    return defaultTasks;
  }
  return parsed.map((task) => ({
    ...task,
    enabled: task.enabled !== false,
    daysFilter: task.daysFilter ?? [],
    canEditDaysFilter: task.canEditDaysFilter !== false
  }));
}

export function writeTasksState(next: LostarkTask[]): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(TASKS_KEY, JSON.stringify(next));
}

export function readSettingsState(): SettingsState {
  if (typeof window === "undefined") {
    return defaultSettingsState;
  }
  migrateStorageIfNeeded();
  const parsed = safeParse<SettingsState>(window.localStorage.getItem(SETTINGS_KEY), defaultSettingsState);
  return {
    region: parsed.region ?? "EU",
    hiddenOnCompletion: Boolean(parsed.hiddenOnCompletion),
    showHiddenCharacters: Boolean(parsed.showHiddenCharacters),
    lazyTrackingEnabled: parsed.lazyTrackingEnabled !== false
  };
}

export function writeSettingsState(next: SettingsState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}
