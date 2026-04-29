import { Character, CompletionMap, LostarkTask } from "@/lib/lostark/types";

export function getCompletionEntryKey(character: Character, task: LostarkTask): string {
  if (task.scope === "ROSTER") {
    return task.id;
  }
  return `${character.name}:${task.id}`;
}

export function isTaskAvailable(task: LostarkTask, now: number): boolean {
  if (!task.daysFilter?.length) {
    return true;
  }
  const currentLADay = new Date(now - 10 * 60 * 60 * 1000).getUTCDay();
  return task.daysFilter.includes(currentLADay);
}

export function getTaskResetBoundary(
  task: LostarkTask,
  dailyReset: number,
  weeklyReset: number,
  biWeeklyReset: number,
  biWeeklyOffsetReset: number
): number {
  switch (task.frequency) {
    case "DAILY":
      return dailyReset;
    case "WEEKLY":
      return weeklyReset;
    case "BIWEEKLY":
      return biWeeklyReset;
    case "BIWEEKLY_OFFSET":
      return biWeeklyOffsetReset;
    case "ONE_TIME":
    default:
      return -Infinity;
  }
}

export function getDoneAmount(
  task: LostarkTask,
  character: Character,
  completion: CompletionMap,
  dailyReset: number,
  weeklyReset: number,
  biWeeklyReset: number,
  biWeeklyOffsetReset: number
): number {
  const key = getCompletionEntryKey(character, task);
  const entry = completion[key];
  if (!entry) {
    return 0;
  }

  if (task.frequency === "ONE_TIME") {
    return entry.amount;
  }

  let resetBoundary = getTaskResetBoundary(task, dailyReset, weeklyReset, biWeeklyReset, biWeeklyOffsetReset);
  if (character.lazy && task.scope === "CHARACTER") {
    resetBoundary -= 2 * 24 * 60 * 60 * 1000;
  }
  if (entry.updated < resetBoundary) {
    return 0;
  }
  return entry.amount;
}
