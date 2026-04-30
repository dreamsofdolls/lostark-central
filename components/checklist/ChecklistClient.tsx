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
      rosterCharacters.some(
        ({ character }) =>
          character.ilvl >= task.minIlvl && character.ilvl < (task.maxIlvl ?? Number.POSITIVE_INFINITY)
      )
    );

    for (const task of eligibleTasks) {
      const fallbackEntry = rosterCharacters[0];
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
          : rosterCharacters.map(({ accountName, character }) =>
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
          : rosterCharacters.map(({ accountName, character }) => {
              const key = getTrackingEntryKey(accountName, character.name, task.id);
              return settings.taskTracking[key] !== false;
            });

      const allDone =
        task.scope === "ROSTER"
          ? doneByCharacter[0] >= task.amount
          : doneByCharacter.every((value, index) => {
              const character = rosterCharacters[index]?.character;
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
        rosterCharacters.some(({ character }, index) => {
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
    roster.accounts,
    roster.showAllTasks,
    settings.hiddenOnCompletion,
    settings.taskTracking,
    tasks,
    rosterCharacters,
    weeklyReset
  ]);

  function updateCompletion(
    task: LostarkTask,
    character: Character,
    accountName: string,
    done: boolean,
    clickEvent?: MouseEvent<HTMLButtonElement>
  ) {
    setCompletion((previous) => {
      const next = { ...previous };
      const key = getCompletionEntryKey(character, task, accountName);
      const existing = next[key];
      const resetBoundary = getTaskResetBoundary(task, dailyReset, weeklyReset, weeklyReset, weeklyReset);
      const stale = existing && task.frequency !== "ONE_TIME" && existing.updated < resetBoundary;
      const oldAmount = stale ? 0 : existing?.amount ?? 0;

      if (!done) {
        next[key] = {
          amount: 0,
          updated: Date.now()
        };
      } else {
        const setAllDone = Boolean(clickEvent?.ctrlKey);
        next[key] = {
          amount: setAllDone ? task.amount : Math.min(task.amount, oldAmount + 1),
          updated: Date.now()
        };
      }

      writeCompletionMap(next);
      return next;
    });
  }

  if (rosterCharacters.length === 0) {
    return (
      <article className="card">
        <h1>Checklist</h1>
        <p>Chưa có character trong roster. Hãy tạo roster trước để bắt đầu checklist.</p>
        <Link href="/roster" className="primary-link">
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
    <div className="checklist-page">
      <div className="header">
        <h1>Checklist</h1>
      </div>

      <div className="card checklist-meta">
        <p>Ctrl + click vào nút task để đánh dấu đầy đủ số lần trong một lần nhấn.</p>
        <div className="checklist-countdowns">
          <span>Daily reset: {toDuration(getNextDailyReset(now), now)}</span>
          <span>Weekly reset: {toDuration(getNextWeeklyReset(now), now)}</span>
        </div>
        <div className="checklist-options">
          <label>
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
          <section className="card checklist-section" key={section}>
            <h2>{sectionLabels[section]}</h2>
            <table className="checklist-table">
              <thead>
                <tr>
                  <th>Task</th>
                  {isCharacterScope ? (
                    rosterCharacters.map(({ accountName, character }) => (
                      <th key={`${accountName}:${character.name}`}>{character.name} ({accountName})</th>
                    ))
                  ) : (
                    <th>Roster</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.task.id} className={!row.available ? "task-unavailable" : row.allDone ? "task-done" : ""}>
                    <td>{row.task.label}</td>
                    {row.task.scope === "ROSTER" ? (
                      <td>
                        <button
                          type="button"
                          className="task-btn"
                          onClick={(event) =>
                            updateCompletion(
                              row.task,
                              rosterCharacters[0]?.character ?? {
                                name: "Roster",
                                class: DEFAULT_CLASS_NAME,
                                ilvl: 0,
                                weeklyGold: false
                              },
                              rosterCharacters[0]?.accountName ?? "Roster",
                              true,
                              event
                            )
                          }
                          disabled={row.doneByCharacter[0] >= row.task.amount}
                        >
                          {row.doneByCharacter[0]}/{row.task.amount}
                        </button>
                        <button
                          type="button"
                          className="task-btn reset"
                          onClick={() =>
                            updateCompletion(row.task, {
                              name: "Roster",
                              class: DEFAULT_CLASS_NAME,
                              ilvl: 0,
                              weeklyGold: false
                            }, "Roster", false)
                          }
                        >
                          Reset
                        </button>
                      </td>
                    ) : (
                      rosterCharacters.map(({ accountName, character }, index) => {
                        const doable =
                          character.ilvl >= row.task.minIlvl &&
                          character.ilvl < (row.task.maxIlvl ?? Number.POSITIVE_INFINITY);
                        const tracked = row.trackedByCharacter[index] !== false;
                        if (!tracked) {
                          return <td key={`${row.task.id}-${accountName}-${character.name}`}>Ignored</td>;
                        }
                        if (!doable) {
                          return <td key={`${row.task.id}-${accountName}-${character.name}`}>-</td>;
                        }
                        const doneAmount = row.doneByCharacter[index] ?? 0;
                        return (
                          <td key={`${row.task.id}-${accountName}-${character.name}`}>
                            <button
                              type="button"
                              className="task-btn"
                              onClick={(event) => updateCompletion(row.task, character, accountName, true, event)}
                              disabled={doneAmount >= row.task.amount}
                            >
                              {doneAmount}/{row.task.amount}
                            </button>
                            <button
                              type="button"
                              className="task-btn reset"
                              onClick={() => updateCompletion(row.task, character, accountName, false)}
                            >
                              Reset
                            </button>
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
