"use client";

import { MouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_CLASS_NAME } from "@/lib/lostark/classes";
import { Character, CompletionMap, LostarkTask, SettingsState } from "@/lib/lostark/types";
import {
  defaultRosterState,
  defaultSettingsState,
  readCompletionMap,
  readRosterState,
  readSettingsState,
  readTasksState,
  writeCompletionMap,
  writeSettingsState
} from "@/lib/lostark/storage";
import {
  getCompletionEntryKey,
  getDoneAmount,
  getTrackingEntryKey,
  isTaskAvailable,
  getTaskResetBoundary
} from "@/lib/lostark/checklist";
import {
  getLastDailyReset,
  getLastWeeklyReset,
  getNextDailyReset,
  getNextWeeklyReset
} from "@/lib/lostark/time";

type SectionKey =
  | "dailyCharacter"
  | "dailyRoster"
  | "weeklyCharacter"
  | "weeklyRoster"
  | "oneTimeCharacter"
  | "oneTimeRoster";

type ChecklistRow = {
  task: LostarkTask;
  available: boolean;
  doneByCharacter: number[];
  trackedByCharacter: boolean[];
  allDone: boolean;
};

type RosterCharacterEntry = {
  accountName: string;
  character: Character;
};

const sectionLabels: Record<SectionKey, string> = {
  dailyCharacter: "Daily Character",
  dailyRoster: "Daily Roster",
  weeklyCharacter: "Weekly Character",
  weeklyRoster: "Weekly Roster",
  oneTimeCharacter: "One-Time Character",
  oneTimeRoster: "One-Time Roster"
};
const selectClassName =
  "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";
const actionButtonClass =
  "rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

function toDuration(target: number, now: number): string {
  const remain = Math.max(0, target - now);
  const totalSeconds = Math.floor(remain / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getSectionKey(task: LostarkTask): SectionKey {
  const byFrequency = {
    DAILY: "daily",
    WEEKLY: "weekly",
    BIWEEKLY: "weekly",
    BIWEEKLY_OFFSET: "weekly",
    ONE_TIME: "oneTime"
  }[task.frequency];
  const byScope = task.scope === "CHARACTER" ? "Character" : "Roster";
  return `${byFrequency}${byScope}` as SectionKey;
}

export function ChecklistClient() {
  const [roster, setRoster] = useState(defaultRosterState);
  const [completion, setCompletion] = useState<CompletionMap>({});
  const [tasks, setTasks] = useState<LostarkTask[]>([]);
  const [settings, setSettings] = useState<SettingsState>(defaultSettingsState);
  const [now, setNow] = useState(Date.now());
  const [accountFilter, setAccountFilter] = useState("ALL");

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
    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const dailyReset = getLastDailyReset(now);
  const weeklyReset = getLastWeeklyReset(now);

  const rosterCharacters = useMemo<RosterCharacterEntry[]>(
    () =>
      roster.accounts.flatMap((account) =>
        account.characters.map((character) => ({
          accountName: account.accountName,
          character
        }))
      ),
    [roster.accounts]
  );

  const accountOptions = useMemo(() => roster.accounts.map((account) => account.accountName), [roster.accounts]);

  useEffect(() => {
    if (accountFilter !== "ALL" && !accountOptions.includes(accountFilter)) {
      setAccountFilter("ALL");
    }
  }, [accountFilter, accountOptions]);

  const filteredRosterCharacters = useMemo(
    () =>
      accountFilter === "ALL"
        ? rosterCharacters
        : rosterCharacters.filter((entry) => entry.accountName === accountFilter),
    [accountFilter, rosterCharacters]
  );

  const rowsBySection = useMemo(() => {
    const next: Record<SectionKey, ChecklistRow[]> = {
      dailyCharacter: [],
      dailyRoster: [],
      weeklyCharacter: [],
      weeklyRoster: [],
      oneTimeCharacter: [],
      oneTimeRoster: []
    };

    const eligibleTasks = tasks.filter(
      (task) =>
        task.enabled &&
      filteredRosterCharacters.some(
        ({ character }) =>
          character.ilvl >= task.minIlvl && character.ilvl < (task.maxIlvl ?? Number.POSITIVE_INFINITY)
      )
    );

    for (const task of eligibleTasks) {
      const fallbackEntry = filteredRosterCharacters[0];
      const available = isTaskAvailable(task, now);
      const doneByCharacter =
        task.scope === "ROSTER"
          ? [
              getDoneAmount(
                task,
                fallbackEntry?.character ?? {
                  name: "Roster",
                  class: DEFAULT_CLASS_NAME,
                  ilvl: 0,
                  weeklyGold: false
                },
                fallbackEntry?.accountName ?? "Roster",
                completion,
                dailyReset,
                weeklyReset,
                weeklyReset,
                weeklyReset
              )
            ]
          : filteredRosterCharacters.map(({ accountName, character }) =>
              getDoneAmount(
                task,
                character,
                accountName,
                completion,
                dailyReset,
                weeklyReset,
                weeklyReset,
                weeklyReset
              )
            );
      const trackedByCharacter =
        task.scope === "ROSTER"
          ? [true]
          : filteredRosterCharacters.map(({ accountName, character }) => {
              const key = getTrackingEntryKey(accountName, character.name, task.id);
              return settings.taskTracking[key] !== false;
            });

      const allDone =
        task.scope === "ROSTER"
          ? doneByCharacter[0] >= task.amount
          : doneByCharacter.every((value, index) => {
              const character = filteredRosterCharacters[index]?.character;
              if (!character) {
                return true;
              }
              if (!trackedByCharacter[index]) {
                return true;
              }
              const doable =
                character.ilvl >= task.minIlvl && character.ilvl < (task.maxIlvl ?? Number.POSITIVE_INFINITY);
              return !doable || value >= task.amount;
            });
      const hasTrackedCharacter =
        task.scope === "ROSTER" ||
        filteredRosterCharacters.some(({ character }, index) => {
          const doable =
            character.ilvl >= task.minIlvl && character.ilvl < (task.maxIlvl ?? Number.POSITIVE_INFINITY);
          return trackedByCharacter[index] && doable;
        });

      const shouldHideByAvailability = !available && task.canEditDaysFilter;
      if (!hasTrackedCharacter) {
        continue;
      }
      if ((allDone && settings.hiddenOnCompletion) || (shouldHideByAvailability && !roster.showAllTasks)) {
        continue;
      }

      next[getSectionKey(task)].push({
        task,
        available,
        doneByCharacter,
        trackedByCharacter,
        allDone
      });
    }

    return next;
  }, [
    completion,
    dailyReset,
    now,
    roster.showAllTasks,
    settings.hiddenOnCompletion,
    settings.taskTracking,
    tasks,
    filteredRosterCharacters,
    weeklyReset
  ]);

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

  if (rosterCharacters.length === 0) {
    return (
      <article className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
        <h1 className="text-2xl font-bold">Checklist</h1>
        <p className="mt-2 text-zinc-300">Chưa có character trong roster. Hãy tạo roster trước để bắt đầu checklist.</p>
        <Link
          href="/roster"
          className="mt-3 inline-flex rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          Mở trang Roster
        </Link>
      </article>
    );
  }

  function updateSettings(patch: Partial<SettingsState>) {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      writeSettingsState(next);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Checklist</h1>
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          Account
          <select
            className={selectClassName}
            value={accountFilter}
            onChange={(event) => {
              const { value } = event.currentTarget;
              setAccountFilter(value);
            }}
          >
            <option value="ALL">All (show all)</option>
            {accountOptions.map((accountName) => (
              <option key={accountName} value={accountName}>
                {accountName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
        <p className="text-sm text-zinc-300">Ctrl + click để full task, chuột phải để trừ 1 lần hoàn thành.</p>
        <div className="mb-3 mt-3 grid gap-1 text-sm text-zinc-400">
          <span>Daily reset: {toDuration(getNextDailyReset(now), now)}</span>
          <span>Weekly reset: {toDuration(getNextWeeklyReset(now), now)}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2 text-zinc-300">
            <input
              type="checkbox"
              checked={settings.hiddenOnCompletion}
              onChange={(event) => {
                const { checked } = event.currentTarget;
                updateSettings({ hiddenOnCompletion: checked });
              }}
            />{" "}
            Hide completed tasks
          </label>
        </div>
      </div>

      {filteredRosterCharacters.length === 0 ? (
        <article className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
          <p className="text-zinc-300">Account này chưa có character.</p>
        </article>
      ) : null}

      {(
        [
            "dailyCharacter",
            "dailyRoster",
            "weeklyCharacter",
            "weeklyRoster",
            "oneTimeCharacter",
            "oneTimeRoster"
        ] as SectionKey[]
      ).map((section) => {
        const rows = rowsBySection[section];
        if (!rows.length) {
          return null;
        }
        const isCharacterScope = section.endsWith("Character");

        return (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl" key={section}>
            <h2 className="mb-3 text-lg font-semibold">{sectionLabels[section]}</h2>
            <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-950/70 text-zinc-400">
                <tr>
                  <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold">Task</th>
                  {isCharacterScope ? (
                    filteredRosterCharacters.map(({ accountName, character }) => (
                      <th
                        key={`${accountName}:${character.name}`}
                        className="border-b border-zinc-800 px-3 py-3 text-center font-semibold"
                      >
                        {character.name} ({accountName})
                      </th>
                    ))
                  ) : (
                    <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold">Roster</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.task.id}
                    className={!row.available ? "bg-fuchsia-900/30" : row.allDone ? "bg-emerald-900/30" : ""}
                  >
                    <td className="border-b border-zinc-800/80 px-4 py-3 text-left">{row.task.label}</td>
                    {row.task.scope === "ROSTER" ? (
                      <td className="border-b border-zinc-800/80 px-3 py-3 text-center">
                        <button
                          type="button"
                          className={actionButtonClass}
                          onClick={(event) =>
                            adjustCompletion(
                              row.task,
                              filteredRosterCharacters[0]?.character ?? {
                                name: "Roster",
                                class: DEFAULT_CLASS_NAME,
                                ilvl: 0,
                                weeklyGold: false
                              },
                              filteredRosterCharacters[0]?.accountName ?? "Roster",
                              1,
                              event
                            )
                          }
                          onContextMenu={(event) => {
                            event.preventDefault();
                            adjustCompletion(
                              row.task,
                              filteredRosterCharacters[0]?.character ?? {
                                name: "Roster",
                                class: DEFAULT_CLASS_NAME,
                                ilvl: 0,
                                weeklyGold: false
                              },
                              filteredRosterCharacters[0]?.accountName ?? "Roster",
                              -1
                            );
                          }}
                        >
                          {row.doneByCharacter[0]}/{row.task.amount}
                        </button>
                      </td>
                    ) : (
                      filteredRosterCharacters.map(({ accountName, character }, index) => {
                        const doable =
                          character.ilvl >= row.task.minIlvl &&
                          character.ilvl < (row.task.maxIlvl ?? Number.POSITIVE_INFINITY);
                        const tracked = row.trackedByCharacter[index] !== false;
                        if (!tracked) {
                          return (
                            <td
                              key={`${row.task.id}-${accountName}-${character.name}`}
                              className="border-b border-zinc-800/80 px-3 py-3 text-center text-zinc-500"
                            >
                              Ignored
                            </td>
                          );
                        }
                        if (!doable) {
                          return (
                            <td
                              key={`${row.task.id}-${accountName}-${character.name}`}
                              className="border-b border-zinc-800/80 px-3 py-3 text-center text-zinc-500"
                            >
                              -
                            </td>
                          );
                        }
                        const doneAmount = row.doneByCharacter[index] ?? 0;
                        return (
                          <td
                            key={`${row.task.id}-${accountName}-${character.name}`}
                            className="border-b border-zinc-800/80 px-3 py-3 text-center"
                          >
                            <button
                              type="button"
                              className={actionButtonClass}
                              onClick={(event) => adjustCompletion(row.task, character, accountName, 1, event)}
                              onContextMenu={(event) => {
                                event.preventDefault();
                                adjustCompletion(row.task, character, accountName, -1);
                              }}
                            >
                              {doneAmount}/{row.task.amount}
                            </button>
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
