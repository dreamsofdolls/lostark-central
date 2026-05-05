"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultTasks } from "@/lib/lostark/defaultTasks";
import { LostarkTask, TaskFrequency, TaskScope } from "@/lib/lostark/types";
import { readTasksState, writeTasksState } from "@/lib/lostark/storage";

type TaskForm = {
  label: string;
  minIlvl: number;
  maxIlvl: number;
  amount: number;
  frequency: TaskFrequency;
  scope: TaskScope;
  enabled: boolean;
  daysFilter: string;
};

const defaultForm: TaskForm = {
  label: "",
  minIlvl: 0,
  maxIlvl: 9999,
  amount: 1,
  frequency: "DAILY",
  scope: "CHARACTER",
  enabled: true,
  daysFilter: ""
};
const inputClassName =
  "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";
const selectClassName = inputClassName;
const selectWithChevronClass = `${selectClassName} appearance-none pr-9`;
const primaryButtonClass =
  "rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
  "rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60";

function createTaskId(label: string): string {
  return `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${Date.now()}`;
}

function parseDaysFilter(value: string): number[] {
  return value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item >= 0 && item <= 6);
}

export function TasksManagerClient() {
  const [tasks, setTasks] = useState<LostarkTask[]>([]);
  const [form, setForm] = useState<TaskForm>(defaultForm);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setTasks(readTasksState());
  }, []);

  function save(next: LostarkTask[]) {
    setTasks(next);
    writeTasksState(next);
  }

  function addTask() {
    const label = form.label.trim();
    if (!label) {
      return;
    }
    const nextTask: LostarkTask = {
      id: createTaskId(label),
      label,
      minIlvl: form.minIlvl,
      maxIlvl: form.maxIlvl,
      amount: form.amount,
      frequency: form.frequency,
      scope: form.scope,
      enabled: form.enabled,
      daysFilter: parseDaysFilter(form.daysFilter),
      canEditDaysFilter: true
    };
    save([...tasks, nextTask]);
    setForm(defaultForm);
  }

  function patchTask(taskId: string, patch: Partial<LostarkTask>) {
    save(tasks.map((task) => (task.id === taskId ? { ...task, ...patch } : task)));
  }

  function removeTask(taskId: string) {
    save(tasks.filter((task) => task.id !== taskId));
  }

  function resetTasksToDefault() {
    save(defaultTasks);
  }

  const visibleTasks = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return tasks;
    }
    return tasks.filter((task) => task.label.toLowerCase().includes(keyword));
  }, [query, tasks]);

  function ChevronIcon() {
    return (
      <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 text-zinc-400" aria-hidden="true">
        <path d="M6 8L10 12L14 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tasks Manager</h1>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold">Add task</h2>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-5">
          <label className="flex flex-col gap-1.5 text-sm">
            Label
            <input
              className={inputClassName}
              value={form.label}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, label: value }));
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Min iLvl
            <input
              className={inputClassName}
              type="number"
              value={form.minIlvl}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, minIlvl: Number(value) || 0 }));
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Max iLvl
            <input
              className={inputClassName}
              type="number"
              value={form.maxIlvl}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, maxIlvl: Number(value) || 9999 }));
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Amount
            <input
              className={inputClassName}
              type="number"
              min={1}
              value={form.amount}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, amount: Math.max(1, Number(value) || 1) }));
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Frequency
            <div className="relative">
              <select
                className={selectWithChevronClass}
                value={form.frequency}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setForm((previous) => ({ ...previous, frequency: value as TaskFrequency }));
                }}
              >
                <option value="DAILY">DAILY</option>
                <option value="WEEKLY">WEEKLY</option>
                <option value="BIWEEKLY">BIWEEKLY</option>
                <option value="BIWEEKLY_OFFSET">BIWEEKLY_OFFSET</option>
                <option value="ONE_TIME">ONE_TIME</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <ChevronIcon />
              </span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Scope
            <div className="relative">
              <select
                className={selectWithChevronClass}
                value={form.scope}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setForm((previous) => ({ ...previous, scope: value as TaskScope }));
                }}
              >
                <option value="CHARACTER">CHARACTER</option>
                <option value="ROSTER">ROSTER</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <ChevronIcon />
              </span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Day filter (0-6, comma)
            <input
              className={inputClassName}
              value={form.daysFilter}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, daysFilter: value }));
              }}
              placeholder="1,3,5"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => {
                const { checked } = event.currentTarget;
                setForm((previous) => ({ ...previous, enabled: checked }));
              }}
            />
            Enabled
          </label>
          <button type="button" className={primaryButtonClass} onClick={addTask}>
            Add task
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className={`${inputClassName} md:flex-1`}
            value={query}
            placeholder="Search task..."
            onChange={(event) => {
              const { value } = event.currentTarget;
              setQuery(value);
            }}
          />
          <button type="button" className={secondaryButtonClass} onClick={resetTasksToDefault}>
            Reset to default
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold">Tasks ({visibleTasks.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-950/70 text-zinc-400">
            <tr>
              <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold">Label</th>
              <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold">iLvl</th>
              <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold">Amount</th>
              <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold">Frequency</th>
              <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold">Scope</th>
              <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold">Days</th>
              <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold">Enabled</th>
              <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map((task) => (
              <tr key={task.id}>
                <td className="border-b border-zinc-800/80 px-4 py-3 text-left">{task.label}</td>
                <td className="border-b border-zinc-800/80 px-3 py-3 text-center">
                  {task.minIlvl}-{task.maxIlvl ?? 9999}
                </td>
                <td className="border-b border-zinc-800/80 px-3 py-3 text-center">{task.amount}</td>
                <td className="border-b border-zinc-800/80 px-3 py-3 text-center">{task.frequency}</td>
                <td className="border-b border-zinc-800/80 px-3 py-3 text-center">{task.scope}</td>
                <td className="border-b border-zinc-800/80 px-3 py-3 text-center">{task.daysFilter.join(", ") || "-"}</td>
                <td className="border-b border-zinc-800/80 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={task.enabled}
                    onChange={(event) => {
                      const { checked } = event.currentTarget;
                      patchTask(task.id, { enabled: checked });
                    }}
                  />
                </td>
                <td className="border-b border-zinc-800/80 px-3 py-3 text-center">
                  <button type="button" className={secondaryButtonClass} onClick={() => removeTask(task.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </section>
    </div>
  );
}
