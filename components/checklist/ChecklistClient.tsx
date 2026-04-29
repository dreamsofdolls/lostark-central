"use client";

import { MouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
import { getCompletionEntryKey, getDoneAmount, isTaskAvailable, getTaskResetBoundary } from "@/lib/lostark/checklist";
import {
  getLastBiWeeklyOffsetReset,
  getLastBiWeeklyReset,
  getLastDailyReset,
  getLastWeeklyReset,
  getNextBiWeeklyOffsetReset,
  getNextBiWeeklyReset,
  getNextDailyReset,
  getNextWeeklyReset
} from "@/lib/lostark/time";

type SectionKey =
  | "dailyCharacter"
  | "dailyRoster"
  | "weeklyCharacter"
  | "weeklyRoster"
  | "biWeeklyCharacter"
  | "biWeeklyRoster"
  | "oneTimeCharacter"
  | "oneTimeRoster";

type ChecklistRow = {
  task: LostarkTask;
  available: boolean;
  doneByCharacter: number[];
  allDone: boolean;
};

const sectionLabels: Record<SectionKey, string> = {
  dailyCharacter: "Daily Character",
  dailyRoster: "Daily Roster",
  weeklyCharacter: "Weekly Character",
  weeklyRoster: "Weekly Roster",
  biWeeklyCharacter: "Bi-Weekly Character",
  biWeeklyRoster: "Bi-Weekly Roster",
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
    BIWEEKLY: "biWeekly",
    BIWEEKLY_OFFSET: "biWeekly",
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
  const biWeeklyReset = getLastBiWeeklyReset(now);
  const biWeeklyOffsetReset = getLastBiWeeklyOffsetReset(now);

  const visibleCharacters = useMemo(
    () => roster.characters.filter((character) => settings.showHiddenCharacters || !character.isHide),
    [roster.characters, settings.showHiddenCharacters]
  );

  const rowsBySection = useMemo(() => {
    const next: Record<SectionKey, ChecklistRow[]> = {
      dailyCharacter: [],
      dailyRoster: [],
      weeklyCharacter: [],
      weeklyRoster: [],
      biWeeklyCharacter: [],
      biWeeklyRoster: [],
      oneTimeCharacter: [],
      oneTimeRoster: []
    };

    const eligibleTasks = tasks.filter(
      (task) =>
        task.enabled &&
      roster.characters.some(
        (character) => character.ilvl >= task.minIlvl && character.ilvl < (task.maxIlvl ?? Number.POSITIVE_INFINITY)
      )
    );

    for (const task of eligibleTasks) {
      const available = isTaskAvailable(task, now);
      const doneByCharacter =
        task.scope === "ROSTER"
          ? [
              getDoneAmount(
                task,
                roster.characters[0] ?? { name: "Roster", ilvl: 0, lazy: false, weeklyGold: false },
                completion,
                dailyReset,
                weeklyReset,
                biWeeklyReset,
                biWeeklyOffsetReset,
                settings.lazyTrackingEnabled
              )
            ]
          : visibleCharacters.map((character) =>
              getDoneAmount(
                task,
                character,
                completion,
                dailyReset,
                weeklyReset,
                biWeeklyReset,
                biWeeklyOffsetReset,
                settings.lazyTrackingEnabled
              )
            );

      const allDone =
        task.scope === "ROSTER"
          ? doneByCharacter[0] >= task.amount
          : doneByCharacter.every((value, index) => {
              const character = visibleCharacters[index];
              if (!character) {
                return true;
              }
              const doable =
                character.ilvl >= task.minIlvl && character.ilvl < (task.maxIlvl ?? Number.POSITIVE_INFINITY);
              return !doable || value >= task.amount;
            });

      const shouldHideByAvailability = !available && task.canEditDaysFilter;
      if ((allDone && settings.hiddenOnCompletion) || (shouldHideByAvailability && !roster.showAllTasks)) {
        continue;
      }

      next[getSectionKey(task)].push({
        task,
        available,
        doneByCharacter,
        allDone
      });
    }

    return next;
  }, [
    biWeeklyOffsetReset, biWeeklyReset, completion, dailyReset, now, roster.characters, roster.showAllTasks, settings.hiddenOnCompletion,
    settings.lazyTrackingEnabled, tasks, visibleCharacters, weeklyReset
  ]);

  function updateCompletion(
    task: LostarkTask,
    character: Character,
    done: boolean,
    clickEvent?: MouseEvent<HTMLButtonElement>
  ) {
    setCompletion((previous) => {
      const next = { ...previous };
      const key = getCompletionEntryKey(character, task);
      const existing = next[key];
      const resetBoundary = getTaskResetBoundary(task, dailyReset, weeklyReset, biWeeklyReset, biWeeklyOffsetReset);
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

  if (roster.characters.length === 0) {
    return (
      <article className="card">
        <h1>Checklist</h1>
        <p>Chua co character trong roster. Hay tao roster truoc de bat dau checklist.</p>
        <Link href="/roster" className="primary-link">
          Mo trang Roster
        </Link>
      </article>
    );
  }

  if (visibleCharacters.length === 0) {
    return (
      <article className="card">
        <h1>Checklist</h1>
        <p>Tat ca character hien dang o trang thai hidden. Bat tuy chon show hidden characters de xem.</p>
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
        <p>Ctrl + click vao nut task de danh dau full so lan trong mot lan nhan.</p>
        <div className="checklist-countdowns">
          <span>Daily reset: {toDuration(getNextDailyReset(now), now)}</span>
          <span>Weekly reset: {toDuration(getNextWeeklyReset(now), now)}</span>
          <span>Bi-weekly reset: {toDuration(getNextBiWeeklyReset(now), now)}</span>
          <span>Offset bi-weekly reset: {toDuration(getNextBiWeeklyOffsetReset(now), now)}</span>
        </div>
        <div className="checklist-options">
          <label>
            <input
              type="checkbox"
              checked={settings.showHiddenCharacters}
              onChange={(event) => {
                const { checked } = event.currentTarget;
                updateSettings({ showHiddenCharacters: checked });
              }}
            />{" "}
            Show hidden characters
          </label>
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
          "biWeeklyCharacter",
          "biWeeklyRoster",
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
                    visibleCharacters.map((character) => <th key={character.name}>{character.name}</th>)
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
                              visibleCharacters[0] ?? {
                                name: "Roster",
                                ilvl: 0,
                                lazy: false,
                                weeklyGold: false
                              },
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
                              ilvl: 0,
                              lazy: false,
                              weeklyGold: false
                            }, false)
                          }
                        >
                          Reset
                        </button>
                      </td>
                    ) : (
                      visibleCharacters.map((character, index) => {
                        const doable =
                          character.ilvl >= row.task.minIlvl &&
                          character.ilvl < (row.task.maxIlvl ?? Number.POSITIVE_INFINITY);
                        if (!doable) {
                          return <td key={`${row.task.id}-${character.name}`}>-</td>;
                        }
                        const doneAmount = row.doneByCharacter[index] ?? 0;
                        return (
                          <td key={`${row.task.id}-${character.name}`}>
                            <button
                              type="button"
                              className="task-btn"
                              onClick={(event) => updateCompletion(row.task, character, true, event)}
                              disabled={doneAmount >= row.task.amount}
                            >
                              {doneAmount}/{row.task.amount}
                            </button>
                            <button
                              type="button"
                              className="task-btn reset"
                              onClick={() => updateCompletion(row.task, character, false)}
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
