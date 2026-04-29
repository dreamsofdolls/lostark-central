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

  return (
    <div className="tasks-page">
      <div className="header">
        <h1>Tasks Manager</h1>
      </div>

      <section className="card">
        <h2>Add task</h2>
        <div className="form-grid">
          <label>
            Label
            <input
              value={form.label}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, label: value }));
              }}
            />
          </label>
          <label>
            Min iLvl
            <input
              type="number"
              value={form.minIlvl}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, minIlvl: Number(value) || 0 }));
              }}
            />
          </label>
          <label>
            Max iLvl
            <input
              type="number"
              value={form.maxIlvl}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, maxIlvl: Number(value) || 9999 }));
              }}
            />
          </label>
          <label>
            Amount
            <input
              type="number"
              min={1}
              value={form.amount}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, amount: Math.max(1, Number(value) || 1) }));
              }}
            />
          </label>
          <label>
            Frequency
            <select
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
          </label>
          <label>
            Scope
            <select
              value={form.scope}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, scope: value as TaskScope }));
              }}
            >
              <option value="CHARACTER">CHARACTER</option>
              <option value="ROSTER">ROSTER</option>
            </select>
          </label>
          <label>
            Day filter (0-6, comma)
            <input
              value={form.daysFilter}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, daysFilter: value }));
              }}
              placeholder="1,3,5"
            />
          </label>
          <label className="checkbox-label">
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
          <button type="button" className="task-btn" onClick={addTask}>
            Add task
          </button>
        </div>
      </section>

      <section className="card">
        <div className="tasks-toolbar">
          <input
            value={query}
            placeholder="Search task..."
            onChange={(event) => {
              const { value } = event.currentTarget;
              setQuery(value);
            }}
          />
          <button type="button" className="task-btn reset" onClick={resetTasksToDefault}>
            Reset to default
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Tasks ({visibleTasks.length})</h2>
        <table className="checklist-table">
          <thead>
            <tr>
              <th>Label</th>
              <th>iLvl</th>
              <th>Amount</th>
              <th>Frequency</th>
              <th>Scope</th>
              <th>Days</th>
              <th>Enabled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {visibleTasks.map((task) => (
              <tr key={task.id}>
                <td>{task.label}</td>
                <td>
                  {task.minIlvl}-{task.maxIlvl ?? 9999}
                </td>
                <td>{task.amount}</td>
                <td>{task.frequency}</td>
                <td>{task.scope}</td>
                <td>{task.daysFilter.join(", ") || "-"}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={task.enabled}
                    onChange={(event) => {
                      const { checked } = event.currentTarget;
                      patchTask(task.id, { enabled: checked });
                    }}
                  />
                </td>
                <td>
                  <button type="button" className="task-btn reset" onClick={() => removeTask(task.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
