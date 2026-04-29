"use client";

import { useEffect, useMemo, useState } from "react";
import { LostarkTask, SettingsState } from "@/lib/lostark/types";
import { defaultSettingsState, readRosterState, readSettingsState, readTasksState, writeSettingsState } from "@/lib/lostark/storage";
import { getTrackingEntryKey } from "@/lib/lostark/checklist";

export function SettingsClient() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettingsState);
  const [tasks, setTasks] = useState<LostarkTask[]>([]);
  const [characterNames, setCharacterNames] = useState<string[]>([]);

  useEffect(() => {
    setSettings(readSettingsState());
    setTasks(readTasksState().filter((task) => task.scope === "CHARACTER" && task.enabled));
    setCharacterNames(readRosterState().characters.filter((character) => !character.isHide).map((character) => character.name));
  }, []);

  function save(patch: Partial<SettingsState>) {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      writeSettingsState(next);
      return next;
    });
  }

  function setTracking(characterName: string, taskId: string, tracked: boolean) {
    const key = getTrackingEntryKey(characterName, taskId);
    const nextMap = { ...settings.taskTracking, [key]: tracked };
    save({ taskTracking: nextMap });
  }

  const trackingRows = useMemo(() => {
    return tasks.map((task) => ({
      task,
      cells: characterNames.map((name) => {
        const key = getTrackingEntryKey(name, task.id);
        return {
          name,
          tracked: settings.taskTracking[key] !== false
        };
      })
    }));
  }, [characterNames, settings.taskTracking, tasks]);

  return (
    <div className="settings-page">
      <div className="header">
        <h1>Settings</h1>
      </div>
      <section className="card">
        <h2>Task tracking</h2>
        {characterNames.length === 0 ? (
          <p>Chua co character trong roster.</p>
        ) : (
          <table className="checklist-table">
            <thead>
              <tr>
                <th>Task</th>
                {characterNames.map((name) => (
                  <th key={name}>{name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trackingRows.map((row) => (
                <tr key={row.task.id}>
                  <td>{row.task.label}</td>
                  {row.cells.map((cell) => (
                    <td key={`${row.task.id}-${cell.name}`}>
                      {cell.tracked ? (
                        <button
                          type="button"
                          className="task-btn"
                          onClick={() => setTracking(cell.name, row.task.id, false)}
                        >
                          On (Tracked)
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="task-btn reset"
                          onClick={() => setTracking(cell.name, row.task.id, true)}
                        >
                          Off (Ignored)
                        </button>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
