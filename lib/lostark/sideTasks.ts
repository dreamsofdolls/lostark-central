import { LostarkTask } from "@/lib/lostark/types";

export const SIDE_TASK_NAMES = ["Solo Shop", "Paradise", "Howl's Hourglass"] as const;
const SIDE_TASK_SET = new Set(SIDE_TASK_NAMES.map((name) => normalizeSideTaskName(name)));

export function normalizeSideTaskName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function isSideTaskLabel(value: string): boolean {
  return SIDE_TASK_SET.has(normalizeSideTaskName(value));
}

export function isSideTask(task: Pick<LostarkTask, "label" | "scope">): boolean {
  return task.scope === "CHARACTER" && isSideTaskLabel(task.label);
}
