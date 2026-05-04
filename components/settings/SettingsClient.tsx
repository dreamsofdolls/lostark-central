"use client";

import { useEffect, useMemo, useState } from "react";
import { LostarkTask, SettingsState } from "@/lib/lostark/types";
import { defaultSettingsState, readRosterState, readSettingsState, readTasksState, writeSettingsState } from "@/lib/lostark/storage";
import { getTrackingEntryKey } from "@/lib/lostark/checklist";

type CharacterEntry = {
  accountName: string;
  characterName: string;
  label: string;
};

export function SettingsClient() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettingsState);
  const [tasks, setTasks] = useState<LostarkTask[]>([]);
  const [characterEntries, setCharacterEntries] = useState<CharacterEntry[]>([]);

  useEffect(() => {
    setSettings(readSettingsState());
    setTasks(readTasksState().filter((task) => task.scope === "CHARACTER" && task.enabled));
    setCharacterEntries(
      readRosterState().accounts.flatMap((account) =>
        account.characters.map((character) => ({
          accountName: account.accountName,
          characterName: character.name,
          label: `${character.name} (${account.accountName})`
        }))
      )
    );
  }, []);

  function save(patch: Partial<SettingsState>) {
    setSettings((previous) => {
      const next = { ...previous, ...patch };
      writeSettingsState(next);
      return next;
    });
  }

  function setTracking(accountName: string, characterName: string, taskId: string, tracked: boolean) {
    const key = getTrackingEntryKey(accountName, characterName, taskId);
    const nextMap = { ...settings.taskTracking, [key]: tracked };
    save({ taskTracking: nextMap });
  }

  const trackingRows = useMemo(() => {
    return tasks.map((task) => ({
      task,
      cells: characterEntries.map((entry) => {
        const key = getTrackingEntryKey(entry.accountName, entry.characterName, task.id);
        return {
          ...entry,
          tracked: settings.taskTracking[key] !== false
        };
      })
    }));
  }, [characterEntries, settings.taskTracking, tasks]);

  return (
    <div className="settings-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-xl">
        <div className="border-b border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-semibold">Task tracking</h2>
          <p className="mt-1 text-sm text-zinc-400">Bật/tắt theo dõi cho từng character trong checklist.</p>
          <label className="mt-3 inline-flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={settings.hiddenOnCompletion}
              onChange={(event) => {
                const { checked } = event.currentTarget;
                save({ hiddenOnCompletion: checked });
              }}
            />
            Hide completed tasks
          </label>
        </div>
        {characterEntries.length === 0 ? (
          <p className="p-5 text-sm text-zinc-400">Chưa có character trong roster.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-950/60 text-zinc-400">
                <tr>
                  <th className="border-b border-zinc-800 px-4 py-3 text-left">Task</th>
                  {characterEntries.map((entry) => (
                    <th key={`${entry.accountName}:${entry.characterName}`} className="border-b border-zinc-800 px-4 py-3 text-center">
                      {entry.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trackingRows.map((row) => (
                  <tr key={row.task.id} className="border-b border-zinc-800/80 last:border-b-0">
                    <td className="px-4 py-3 text-zinc-100">{row.task.label}</td>
                    {row.cells.map((cell) => (
                      <td key={`${row.task.id}-${cell.accountName}-${cell.characterName}`} className="px-4 py-3 text-center">
                        <button
                          type="button"
                          aria-pressed={cell.tracked}
                          className={`relative inline-flex h-8 w-28 items-center rounded-full px-1 transition ${
                            cell.tracked ? "bg-emerald-600/90" : "bg-zinc-700"
                          }`}
                          onClick={() =>
                            setTracking(cell.accountName, cell.characterName, row.task.id, !cell.tracked)
                          }
                        >
                          <span
                            className={`h-6 w-6 rounded-full bg-white shadow transition ${
                              cell.tracked ? "translate-x-[76px]" : "translate-x-0"
                            }`}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white">
                            {cell.tracked ? "Tracked" : "Ignored"}
                          </span>
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
