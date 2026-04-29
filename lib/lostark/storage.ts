import { CompletionMap, RosterState } from "@/lib/lostark/types";

const ROSTER_KEY = "lostark-central:roster";
const COMPLETION_KEY = "lostark-central:completion";

export const defaultRosterState: RosterState = {
  characters: [],
  showAllTasks: false
};

export function readRosterState(): RosterState {
  if (typeof window === "undefined") {
    return defaultRosterState;
  }
  const raw = window.localStorage.getItem(ROSTER_KEY);
  if (!raw) {
    return defaultRosterState;
  }
  try {
    const parsed = JSON.parse(raw) as RosterState;
    return {
      characters: parsed.characters ?? [],
      showAllTasks: Boolean(parsed.showAllTasks)
    };
  } catch {
    return defaultRosterState;
  }
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
  const raw = window.localStorage.getItem(COMPLETION_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as CompletionMap;
  } catch {
    return {};
  }
}

export function writeCompletionMap(next: CompletionMap): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(COMPLETION_KEY, JSON.stringify(next));
}
