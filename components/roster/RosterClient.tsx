"use client";

import { useEffect, useState } from "react";
import { CLASS_OPTIONS, DEFAULT_CLASS_NAME, normalizeClassName } from "@/lib/lostark/classes";
import { Character, RosterAccount, RosterState } from "@/lib/lostark/types";
import { defaultRosterState, readRosterState, writeRosterState } from "@/lib/lostark/storage";

const emptyCharacter: Character = {
  name: "",
  class: DEFAULT_CLASS_NAME,
  ilvl: 1540,
  weeklyGold: true
};
const selectClassName =
  "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";
const inputClassName =
  "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";
const primaryButtonClass =
  "rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
  "rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60";

export function RosterClient() {
  const [roster, setRoster] = useState<RosterState>(defaultRosterState);
  const [form, setForm] = useState<Character>(emptyCharacter);
  const [newAccountName, setNewAccountName] = useState("");

  useEffect(() => {
    setRoster(readRosterState());
  }, []);

  function save(next: RosterState) {
    setRoster(next);
    writeRosterState(next);
  }

  function addCharacter() {
    const normalizedName = form.name.trim();
    const targetAccountName = roster.selectedAccount.trim();
    if (!normalizedName || !targetAccountName) {
      return;
    }
    const targetIndex = roster.accounts.findIndex((account) => account.accountName === targetAccountName);
    if (targetIndex === -1) {
      return;
    }
    const nextAccounts = roster.accounts.map((account, index) =>
      index === targetIndex
        ? {
            ...account,
            characters: [
              ...account.characters,
              {
                ...form,
                class: normalizeClassName(form.class),
                name: normalizedName
              }
            ]
          }
        : account
    );
    const next: RosterState = {
      ...roster,
      accounts: nextAccounts
    };
    save(next);
    setForm(emptyCharacter);
  }

  function addAccount() {
    const normalizedName = newAccountName.trim();
    if (!normalizedName || roster.accounts.some((account) => account.accountName === normalizedName)) {
      return;
    }
    const nextAccount: RosterAccount = {
      accountName: normalizedName,
      characters: []
    };
    save({
      ...roster,
      accounts: [...roster.accounts, nextAccount],
      selectedAccount: normalizedName
    });
    setNewAccountName("");
  }

  function removeAccount() {
    if (!roster.selectedAccount || roster.accounts.length <= 1) {
      return;
    }
    const nextAccounts = roster.accounts.filter((account) => account.accountName !== roster.selectedAccount);
    save({
      ...roster,
      accounts: nextAccounts,
      selectedAccount: nextAccounts[0]?.accountName ?? ""
    });
  }

  function updateCharacter(index: number, patch: Partial<Character>) {
    const targetIndex = roster.accounts.findIndex((account) => account.accountName === roster.selectedAccount);
    if (targetIndex === -1) {
      return;
    }
    const nextAccounts = roster.accounts.map((account, idx) =>
      idx === targetIndex
        ? {
            ...account,
            characters: account.characters.map((character, characterIndex) =>
              characterIndex === index ? { ...character, ...patch } : character
            )
          }
        : account
    );
    save({ ...roster, accounts: nextAccounts });
  }

  function removeCharacter(index: number) {
    const targetIndex = roster.accounts.findIndex((account) => account.accountName === roster.selectedAccount);
    if (targetIndex === -1) {
      return;
    }
    const nextAccounts = roster.accounts.map((account, idx) =>
      idx === targetIndex
        ? {
            ...account,
            characters: account.characters.filter((_, characterIndex) => characterIndex !== index)
          }
        : account
    );
    save({ ...roster, accounts: nextAccounts });
  }

  const selectedAccount = roster.accounts.find((account) => account.accountName === roster.selectedAccount);
  const characters = selectedAccount?.characters ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Roster</h1>
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold">Accounts</h2>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Selected account
            <select
              className={selectClassName}
              value={roster.selectedAccount}
              onChange={(event) => {
                const { value } = event.currentTarget;
                save({ ...roster, selectedAccount: value });
              }}
            >
              {roster.accounts.map((account) => (
                <option key={account.accountName} value={account.accountName}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            New account name
            <input
              className={inputClassName}
              value={newAccountName}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setNewAccountName(value);
              }}
            />
          </label>
          <button type="button" className={primaryButtonClass} onClick={addAccount}>
            Add account
          </button>
          <button
            type="button"
            className={secondaryButtonClass}
            onClick={removeAccount}
            disabled={!roster.selectedAccount || roster.accounts.length <= 1}
          >
            Remove selected account
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold">Add character</h2>
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-sm">
            Account
            <select
              className={selectClassName}
              value={roster.selectedAccount}
              onChange={(event) => {
                const { value } = event.currentTarget;
                save({ ...roster, selectedAccount: value });
              }}
            >
              {roster.accounts.map((account) => (
                <option key={account.accountName} value={account.accountName}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Name
            <input
              className={inputClassName}
              value={form.name}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, name: value }));
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Class
            <select
              className={selectClassName}
              value={form.class}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, class: value }));
              }}
            >
              {CLASS_OPTIONS.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            iLvl
            <input
              className={inputClassName}
              type="number"
              value={form.ilvl}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, ilvl: Number(value) || 0 }));
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.weeklyGold}
              onChange={(event) => {
                const { checked } = event.currentTarget;
                setForm((previous) => ({ ...previous, weeklyGold: checked }));
              }}
            />
            Weekly gold
          </label>
          <button type="button" className={primaryButtonClass} onClick={addCharacter} disabled={!roster.selectedAccount}>
            Add
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={roster.showAllTasks}
            onChange={(event) => {
              const { checked } = event.currentTarget;
              save({ ...roster, showAllTasks: checked });
            }}
          />
          Show all tasks (including tasks unavailable today)
        </label>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold">Characters ({roster.selectedAccount || "No account"})</h2>
        {characters.length === 0 ? (
          <p className="text-zinc-400">Chua co character nao trong account nay.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/40">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="border-b border-zinc-800 px-4 py-3 text-left font-semibold text-zinc-400">Name</th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold text-zinc-400">Class</th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold text-zinc-400">iLvl</th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold text-zinc-400">Weekly Gold</th>
                <th className="border-b border-zinc-800 px-3 py-3 text-center font-semibold text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character, index) => (
                <tr key={`${character.name}-${index}`}>
                  <td className="border-b border-zinc-800/80 px-4 py-3 text-left">{character.name}</td>
                  <td className="border-b border-zinc-800/80 px-3 py-3 text-center">
                    <select
                      className={selectClassName}
                      value={character.class}
                      onChange={(event) => {
                        const { value } = event.currentTarget;
                        updateCharacter(index, { class: normalizeClassName(value) });
                      }}
                    >
                      {CLASS_OPTIONS.map((className) => (
                        <option key={className} value={className}>
                          {className}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="border-b border-zinc-800/80 px-3 py-3 text-center">
                    <input
                      className={`${inputClassName} w-24 text-center`}
                      type="number"
                      value={character.ilvl}
                      onChange={(event) => {
                        const { value } = event.currentTarget;
                        updateCharacter(index, { ilvl: Number(value) || character.ilvl });
                      }}
                    />
                  </td>
                  <td className="border-b border-zinc-800/80 px-3 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={character.weeklyGold}
                      onChange={(event) => {
                        const { checked } = event.currentTarget;
                        updateCharacter(index, { weeklyGold: checked });
                      }}
                    />
                  </td>
                  <td className="border-b border-zinc-800/80 px-3 py-3 text-center">
                    <button type="button" className={secondaryButtonClass} onClick={() => removeCharacter(index)}>
                      Remove
                    </button>
                  </td>
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
