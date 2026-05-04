"use client";

import { MouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { getClassIcon } from "@/lib/lostark/classIcons";
import { isSideTask } from "@/lib/lostark/sideTasks";
import { Character, CompletionMap, LostarkTask, SettingsState } from "@/lib/lostark/types";
import {
  defaultRosterState,
  defaultSettingsState,
  readCompletionMap,
  readRosterState,
  readSettingsState,
  readTasksState,
  writeCompletionMap
} from "@/lib/lostark/storage";
import { getCompletionEntryKey, getDoneAmount, getTrackingEntryKey, isTaskAvailable, getTaskResetBoundary } from "@/lib/lostark/checklist";
import { getLastDailyReset, getLastWeeklyReset, getNextDailyReset, getNextWeeklyReset } from "@/lib/lostark/time";

type TaskBucket = "raids" | "tasks";

type TaskRow = {
  task: LostarkTask;
  done: number;
  completed: boolean;
};

type CharacterView = {
  accountName: string;
  character: Character;
  role: "main" | "sub";
  raids: TaskRow[];
  tasks: TaskRow[];
  dailyDone: number;
  dailyTotal: number;
  raidsDone: number;
  raidsTotal: number;
};

type AccountView = {
  accountName: string;
  characters: CharacterView[];
  raidsDone: number;
  raidsTotal: number;
  dailyDone: number;
  dailyTotal: number;
};

const cardClass =
  "rounded-xl border border-[oklch(0.38_0.02_260)] bg-[oklch(0.23_0.015_260)] transition hover:border-[oklch(0.42_0.03_260)]";
const accentButtonClass =
  "rounded-md bg-[oklch(0.75_0.18_330)] px-2.5 py-1.5 text-xs font-semibold text-[oklch(0.18_0.01_260)] shadow-[0_0_0_1px_oklch(0.75_0.18_330)] transition active:scale-95";
const successButtonClass =
  "rounded-md bg-[oklch(0.7_0.2_145)] px-2.5 py-1.5 text-xs font-semibold text-[oklch(0.18_0.01_260)] transition active:scale-95";

function toDuration(target: number, now: number): string {
  const remain = Math.max(0, target - now);
  const totalSeconds = Math.floor(remain / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getBucket(task: LostarkTask): TaskBucket {
  if (isSideTask(task)) {
    return "tasks";
  }
  if (task.frequency === "WEEKLY" || task.frequency === "BIWEEKLY" || task.frequency === "BIWEEKLY_OFFSET") {
    return "raids";
  }
  return "tasks";
}

export function ChecklistClient() {
  const [roster, setRoster] = useState(defaultRosterState);
  const [completion, setCompletion] = useState<CompletionMap>({});
  const [tasks, setTasks] = useState<LostarkTask[]>([]);
  const [settings, setSettings] = useState<SettingsState>(defaultSettingsState);
  const [now, setNow] = useState(Date.now());
  const [openAccounts, setOpenAccounts] = useState<Record<string, boolean>>({});
  const [activeTabs, setActiveTabs] = useState<Record<string, TaskBucket>>({});

  useEffect(() => {
    setRoster(readRosterState());
    setCompletion(readCompletionMap());
    setTasks(readTasksState());
    setSettings(readSettingsState());
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
      setRoster(readRosterState());
      setTasks(readTasksState());
      setSettings(readSettingsState());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setOpenAccounts((previous) => {
      const next: Record<string, boolean> = {};
      for (const [index, account] of roster.accounts.entries()) {
        next[account.accountName] = previous[account.accountName] ?? index === 0;
      }
      return next;
    });
  }, [roster.accounts]);

  const dailyReset = getLastDailyReset(now);
  const weeklyReset = getLastWeeklyReset(now);

  const accountViews = useMemo<AccountView[]>(() => {
    const characterTasks = tasks.filter((task) => task.scope === "CHARACTER" && task.enabled);
    return roster.accounts.map((account) => {
      const characters = account.characters.map((character, characterIndex) => {
        const rows: TaskRow[] = [];
        for (const task of characterTasks) {
          const tracked = settings.taskTracking[getTrackingEntryKey(account.accountName, character.name, task.id)] !== false;
          if (!tracked) {
            continue;
          }
          const doable = character.ilvl >= task.minIlvl && character.ilvl < (task.maxIlvl ?? Number.POSITIVE_INFINITY);
          if (!doable) {
            continue;
          }
          const available = isTaskAvailable(task, now);
          const hideByAvailability = !available && task.canEditDaysFilter && !roster.showAllTasks;
          const done = getDoneAmount(task, character, account.accountName, completion, dailyReset, weeklyReset, weeklyReset, weeklyReset);
          const completed = done >= task.amount;
          if (settings.hiddenOnCompletion && completed) {
            continue;
          }
          if (hideByAvailability) {
            continue;
          }
          rows.push({ task, done, completed });
        }

        const raids = rows.filter((row) => getBucket(row.task) === "raids");
        const taskRows = rows.filter((row) => getBucket(row.task) === "tasks");
        const dailyRows = taskRows.filter((row) => row.task.frequency === "DAILY");
        const role: CharacterView["role"] = characterIndex === 0 ? "main" : "sub";

        return {
          accountName: account.accountName,
          character,
          role,
          raids,
          tasks: taskRows,
          raidsDone: raids.filter((row) => row.completed).length,
          raidsTotal: raids.length,
          dailyDone: dailyRows.filter((row) => row.completed).length,
          dailyTotal: dailyRows.length
        };
      });

      return {
        accountName: account.accountName,
        characters,
        raidsDone: characters.reduce((sum, item) => sum + item.raidsDone, 0),
        raidsTotal: characters.reduce((sum, item) => sum + item.raidsTotal, 0),
        dailyDone: characters.reduce((sum, item) => sum + item.dailyDone, 0),
        dailyTotal: characters.reduce((sum, item) => sum + item.dailyTotal, 0)
      };
    });
  }, [
    completion,
    dailyReset,
    now,
    roster.accounts,
    roster.showAllTasks,
    settings.hiddenOnCompletion,
    settings.taskTracking,
    tasks,
    weeklyReset
  ]);

  const statSummary = useMemo(() => {
    const totalCharacters = accountViews.reduce((sum, account) => sum + account.characters.length, 0);
    const raidsDone = accountViews.reduce((sum, account) => sum + account.raidsDone, 0);
    const raidsTotal = accountViews.reduce((sum, account) => sum + account.raidsTotal, 0);
    const dailyDone = accountViews.reduce((sum, account) => sum + account.dailyDone, 0);
    const dailyTotal = accountViews.reduce((sum, account) => sum + account.dailyTotal, 0);
    return {
      totalCharacters,
      totalAccounts: accountViews.length,
      raidsDone,
      raidsTotal,
      dailyDone,
      dailyTotal
    };
  }, [accountViews]);

  function adjustCompletion(
    task: LostarkTask,
    character: Character,
    accountName: string,
    delta: number,
    clickEvent?: MouseEvent<HTMLButtonElement>
  ) {
    setCompletion((previous) => {
      const next = { ...previous };
      const key = getCompletionEntryKey(character, task, accountName);
      const existing = next[key];
      const resetBoundary = getTaskResetBoundary(task, dailyReset, weeklyReset, weeklyReset, weeklyReset);
      const stale = existing && task.frequency !== "ONE_TIME" && existing.updated < resetBoundary;
      const oldAmount = stale ? 0 : existing?.amount ?? 0;
      const setAllDone = delta > 0 && Boolean(clickEvent?.ctrlKey);
      const nextAmount = setAllDone ? task.amount : Math.max(0, Math.min(task.amount, oldAmount + delta));
      next[key] = {
        amount: nextAmount,
        updated: Date.now()
      };
      writeCompletionMap(next);
      return next;
    });
  }

  if (!accountViews.length || statSummary.totalCharacters === 0) {
    return (
      <article className={`${cardClass} p-5`}>
        <h1 className="text-2xl font-bold">Checklist Dashboard</h1>
        <p className="mt-2 text-[oklch(0.7_0_0)]">Chưa có character trong roster. Hãy tạo roster trước để bắt đầu.</p>
        <Link
          href="/roster"
          className="mt-3 inline-flex rounded-lg bg-[oklch(0.75_0.18_330)] px-3 py-2 text-sm font-semibold text-[oklch(0.18_0.01_260)] transition hover:opacity-90"
        >
          Mở trang Roster
        </Link>
      </article>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Task Tracker Dashboard</h1>
        <div className="text-sm text-[oklch(0.7_0_0)]">
          Daily reset: {toDuration(getNextDailyReset(now), now)} • Weekly reset: {toDuration(getNextWeeklyReset(now), now)}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className={`${cardClass} p-4`}>
          <p className="text-xs uppercase tracking-wide text-[oklch(0.7_0_0)]">Total Characters</p>
          <p className="mt-2 text-2xl font-bold">{statSummary.totalCharacters}</p>
        </article>
        <article className={`${cardClass} p-4`}>
          <p className="text-xs uppercase tracking-wide text-[oklch(0.7_0_0)]">Accounts</p>
          <p className="mt-2 text-2xl font-bold">{statSummary.totalAccounts}</p>
        </article>
        <article className={`${cardClass} p-4`}>
          <p className="text-xs uppercase tracking-wide text-[oklch(0.7_0_0)]">Raids Progress</p>
          <p className="mt-2 text-2xl font-bold">
            {statSummary.raidsDone}/{statSummary.raidsTotal}
          </p>
        </article>
        <article className={`${cardClass} p-4`}>
          <p className="text-xs uppercase tracking-wide text-[oklch(0.7_0_0)]">Daily Progress</p>
          <p className="mt-2 text-2xl font-bold">
            {statSummary.dailyDone}/{statSummary.dailyTotal}
          </p>
        </article>
      </section>

      {accountViews.map((account) => (
        <section key={account.accountName} className={`${cardClass} overflow-hidden`}>
          <button
            type="button"
            className="flex w-full items-center justify-between border-b border-[oklch(0.38_0.02_260)] px-4 py-3 text-left transition hover:bg-white/5"
            onClick={() =>
              setOpenAccounts((previous) => ({
                ...previous,
                [account.accountName]: !previous[account.accountName]
              }))
            }
          >
            <div>
              <p className="text-lg font-semibold">{account.accountName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[oklch(0.7_0_0)]">
                <span className="rounded-md border border-[oklch(0.38_0.02_260)] px-2 py-0.5">
                  Raids {account.raidsDone}/{account.raidsTotal}
                </span>
                <span className="rounded-md border border-[oklch(0.38_0.02_260)] px-2 py-0.5">
                  Daily {account.dailyDone}/{account.dailyTotal}
                </span>
              </div>
            </div>
            <span className={`text-lg transition ${openAccounts[account.accountName] ? "rotate-180" : ""}`}>⌄</span>
          </button>

          {openAccounts[account.accountName] ? (
            <div className="p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
                {account.characters.map((entry) => {
                  const tabKey = `${entry.accountName}:${entry.character.name}`;
                  const tab = activeTabs[tabKey] ?? "raids";
                  const rows = tab === "raids" ? entry.raids : entry.tasks;
                  return (
                    <article key={tabKey} className={`${cardClass} p-3 hover:shadow-[0_0_0_1px_oklch(0.38_0.02_260)]`}>
                      <div className="flex items-start gap-3">
                        <div
                          className={`grid h-10 w-10 place-items-center overflow-hidden rounded-full border ${
                            entry.role === "main"
                              ? "border-[oklch(0.75_0.18_330)]"
                              : "border-[oklch(0.38_0.02_260)]"
                          } bg-[oklch(0.18_0.01_260)]`}
                          title={entry.character.class}
                        >
                          {(() => {
                            const icon = getClassIcon(entry.character.class);
                            return icon ? (
                              <Image src={icon} alt={entry.character.class} width={30} height={30} className="h-7 w-7 object-contain" />
                            ) : (
                              <span className="text-xs font-semibold text-[oklch(0.95_0_0)]">
                                {entry.character.class.slice(0, 2).toUpperCase()}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-[oklch(0.7_0_0)]">{entry.character.class}</p>
                          <p className="truncate font-semibold">{entry.character.name}</p>
                          <p className="mt-0.5 text-xs text-[oklch(0.7_0_0)]">⚔ iLvl {entry.character.ilvl}</p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 rounded-lg border border-[oklch(0.38_0.02_260)] p-1 text-xs">
                        <button
                          type="button"
                          className={`rounded-md px-2 py-1 transition ${
                            tab === "raids"
                              ? "bg-[oklch(0.75_0.18_330)] text-[oklch(0.18_0.01_260)]"
                              : "text-[oklch(0.7_0_0)] hover:text-[oklch(0.95_0_0)]"
                          }`}
                          onClick={() => setActiveTabs((previous) => ({ ...previous, [tabKey]: "raids" }))}
                        >
                          Raids
                        </button>
                        <button
                          type="button"
                          className={`rounded-md px-2 py-1 transition ${
                            tab === "tasks"
                              ? "bg-[oklch(0.75_0.18_330)] text-[oklch(0.18_0.01_260)]"
                              : "text-[oklch(0.7_0_0)] hover:text-[oklch(0.95_0_0)]"
                          }`}
                          onClick={() => setActiveTabs((previous) => ({ ...previous, [tabKey]: "tasks" }))}
                        >
                          Tasks
                        </button>
                      </div>

                      <div className="mt-3 space-y-2">
                        {rows.length === 0 ? (
                          <p className="text-xs text-[oklch(0.7_0_0)]">No tasks in this tab.</p>
                        ) : (
                          rows.map((row) => {
                            const progress = Math.min(100, Math.round((row.done / row.task.amount) * 100));
                            return (
                              <div
                                key={row.task.id}
                                className="rounded-lg border border-[oklch(0.38_0.02_260)] p-2 transition hover:border-[oklch(0.75_0.18_330)]/70"
                              >
                                <div className="mb-1 flex items-center justify-between gap-2">
                                  <p className={`truncate text-xs ${row.completed ? "text-[oklch(0.7_0.2_145)] line-through" : ""}`}>
                                    {row.task.label}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    {row.completed ? <span className="text-[oklch(0.7_0.2_145)]">✓</span> : null}
                                    <button
                                      type="button"
                                      className={row.completed ? successButtonClass : `${accentButtonClass} shadow-[0_0_10px_oklch(0.75_0.18_330_/_0.3)]`}
                                      onClick={(event) => adjustCompletion(row.task, entry.character, entry.accountName, 1, event)}
                                      onContextMenu={(event) => {
                                        event.preventDefault();
                                        adjustCompletion(row.task, entry.character, entry.accountName, -1);
                                      }}
                                    >
                                      {row.done}/{row.task.amount}
                                    </button>
                                  </div>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-[oklch(0.18_0.01_260)]">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      row.completed ? "bg-[oklch(0.7_0.2_145)]" : "bg-[oklch(0.75_0.18_330)]"
                                    }`}
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      ))}

    </div>
  );
}
