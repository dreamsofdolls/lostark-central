import { defaultTasks } from "@/lib/lostark/defaultTasks";
import { normalizeClassName } from "@/lib/lostark/classes";
import {
  Character,
  CharacterRaid,
  CompletionMap,
  LostarkTask,
  RosterAccount,
  RosterState,
  SettingsState
} from "@/lib/lostark/types";

const ROSTER_KEY = "lostark-central:roster";
const COMPLETION_KEY = "lostark-central:completion";
const TASKS_KEY = "lostark-central:tasks";
const SETTINGS_KEY = "lostark-central:settings";
const DATA_VERSION_KEY = "lostark-central:data-version";
const CURRENT_DATA_VERSION = 6;
const DEFAULT_ACCOUNT_NAME = "Main";

export const defaultRosterState: RosterState = {
  accounts: [{ accountName: DEFAULT_ACCOUNT_NAME, characters: [] }],
  selectedAccount: DEFAULT_ACCOUNT_NAME,
  showAllTasks: false
};

export const defaultSettingsState: SettingsState = {
  hiddenOnCompletion: false,
  taskTracking: {}
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
  const parsed = safeParse<RosterState & { characters?: unknown[] }>(
    window.localStorage.getItem(ROSTER_KEY),
    defaultRosterState
  );
  const normalizeCharacter = (character: unknown): Character => {
    const raw = (character ?? {}) as Partial<Character> & { class?: string };
    const raids = Array.isArray(raw.raids)
      ? raw.raids
          .map((raid): CharacterRaid | null => {
            if (!raid || typeof raid !== "object") {
              return null;
            }
            const raidRaw = raid as Partial<CharacterRaid>;
            const name = String(raidRaw.name ?? "").trim();
            if (!name) {
              return null;
            }
            return {
              id: String(raidRaw.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
              name,
              difficulty: String(raidRaw.difficulty ?? "N").trim() || "N"
            };
          })
          .filter((raid): raid is CharacterRaid => Boolean(raid))
      : [];
    return {
      name: String(raw.name ?? "").trim(),
      class: normalizeClassName(raw.class),
      ilvl: Number(raw.ilvl ?? 0),
      weeklyGold: Boolean(raw.weeklyGold),
      note: typeof raw.note === "string" ? raw.note : undefined,
      raids
    };
  };

  const normalizeAccount = (account: any): RosterAccount => ({
    accountName: String(account?.accountName ?? "").trim(),
    characters: Array.isArray(account?.characters)
      ? (account.characters as unknown[])
          .map(normalizeCharacter)
          .filter((character: Character) => character.name.length > 0)
      : []
  });

  let normalizedAccounts =
    Array.isArray(parsed.accounts) && parsed.accounts.length > 0
      ? parsed.accounts.map(normalizeAccount).filter((account) => account.accountName.length > 0)
      : Array.isArray(parsed.characters)
        ? [
            {
              accountName: DEFAULT_ACCOUNT_NAME,
              characters: parsed.characters
                .map(normalizeCharacter)
                .filter((character: Character) => character.name.length > 0)
            }
          ]
        : [];
  if (normalizedAccounts.length === 0) {
    normalizedAccounts = [{ accountName: DEFAULT_ACCOUNT_NAME, characters: [] }];
  }

  const selectedAccountRaw = String(parsed.selectedAccount ?? "").trim();
  const selectedAccount =
    normalizedAccounts.some((account) => account.accountName === selectedAccountRaw)
      ? selectedAccountRaw
      : normalizedAccounts[0]?.accountName ?? DEFAULT_ACCOUNT_NAME;

  return {
    accounts: normalizedAccounts,
    selectedAccount,
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
    hiddenOnCompletion: Boolean(parsed.hiddenOnCompletion),
    taskTracking:
      parsed.taskTracking && typeof parsed.taskTracking === "object" ? parsed.taskTracking : {}
  };
}

export function writeSettingsState(next: SettingsState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
}
