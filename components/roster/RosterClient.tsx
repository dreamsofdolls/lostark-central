"use client";

import { useEffect, useState } from "react";
import { DEFAULT_CLASS_NAME, normalizeClassName } from "@/lib/lostark/classes";
import { ClassDropdown } from "@/components/ClassDropdown";
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
const dangerButtonClass =
  "rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60";

export function RosterClient() {
  const [roster, setRoster] = useState<RosterState>(defaultRosterState);
  const [form, setForm] = useState<Character>(emptyCharacter);
  const [newAccountName, setNewAccountName] = useState("");
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);
  const [pendingRemoveAccount, setPendingRemoveAccount] = useState<string | null>(null);
  const [addCharacterAccount, setAddCharacterAccount] = useState("");
  const [accountFilter, setAccountFilter] = useState("ALL");

  useEffect(() => {
    const saved = readRosterState();
    setRoster(saved);
    setAddCharacterAccount(saved.selectedAccount || saved.accounts[0]?.accountName || "");
  }, []);

  useEffect(() => {
    const accountExists = roster.accounts.some((account) => account.accountName === addCharacterAccount);
    if (!accountExists) {
      setAddCharacterAccount(roster.selectedAccount || roster.accounts[0]?.accountName || "");
    }
  }, [addCharacterAccount, roster.accounts, roster.selectedAccount]);

  useEffect(() => {
    if (accountFilter === "ALL") {
      return;
    }
    const exists = roster.accounts.some((account) => account.accountName === accountFilter);
    if (!exists) {
      setAccountFilter("ALL");
    }
  }, [accountFilter, roster.accounts]);

  function save(next: RosterState) {
    setRoster(next);
    writeRosterState(next);
  }

  function addCharacter() {
    const normalizedName = form.name.trim();
    const targetAccountName = addCharacterAccount.trim();
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
      accounts: nextAccounts,
      selectedAccount: targetAccountName
    };
    save(next);
    setForm(emptyCharacter);
    setShowAddCharacterModal(false);
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
    setAddCharacterAccount(normalizedName);
    setNewAccountName("");
    setShowAddAccountModal(false);
  }

  function removeAccount(accountName: string) {
    if (!accountName || roster.accounts.length <= 1) {
      return;
    }
    const nextAccounts = roster.accounts.filter((account) => account.accountName !== accountName);
    const fallbackAccount = nextAccounts[0]?.accountName ?? "";
    save({
      ...roster,
      accounts: nextAccounts,
      selectedAccount: roster.selectedAccount === accountName ? fallbackAccount : roster.selectedAccount
    });
    if (addCharacterAccount === accountName) {
      setAddCharacterAccount(fallbackAccount);
    }
    if (accountFilter === accountName) {
      setAccountFilter("ALL");
    }
    setPendingRemoveAccount(null);
  }

  function updateCharacter(accountName: string, index: number, patch: Partial<Character>) {
    const targetIndex = roster.accounts.findIndex((account) => account.accountName === accountName);
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

  function removeCharacter(accountName: string, index: number) {
    const targetIndex = roster.accounts.findIndex((account) => account.accountName === accountName);
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

  const characters = roster.accounts.flatMap((account) =>
    account.characters.map((character, index) => ({
      accountName: account.accountName,
      index,
      character
    }))
  );
  const filteredCharacters =
    accountFilter === "ALL" ? characters : characters.filter((entry) => entry.accountName === accountFilter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Roster</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={secondaryButtonClass} onClick={() => setShowAddAccountModal(true)}>
            Add Account
          </button>
          <button
            type="button"
            className={primaryButtonClass}
            onClick={() => setShowAddCharacterModal(true)}
            disabled={roster.accounts.length === 0}
          >
            Add Character
          </button>
        </div>
      </div>

      {showAddAccountModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onClick={() => setShowAddAccountModal(false)}>
          <div
            className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Dismiss add account dialog"
              className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setShowAddAccountModal(false)}
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">Add Account</h2>
            <label className="mt-4 flex flex-col gap-1.5 text-sm">
              Account name
              <input
                autoFocus
                className={inputClassName}
                value={newAccountName}
                onChange={(event) => {
                  const { value } = event.currentTarget;
                  setNewAccountName(value);
                }}
              />
            </label>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setShowAddAccountModal(false)}>
                Cancel
              </button>
              <button type="button" className={primaryButtonClass} onClick={addAccount}>
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAddCharacterModal ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onClick={() => setShowAddCharacterModal(false)}>
          <div
            className="relative w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Dismiss add character dialog"
              className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setShowAddCharacterModal(false)}
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">Add Character</h2>
            <div className="mt-4 grid grid-cols-1 items-end gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                Account
                <select
                  className={selectClassName}
                  value={addCharacterAccount}
                  onChange={(event) => setAddCharacterAccount(event.currentTarget.value)}
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
                <ClassDropdown
                  value={form.class}
                  onChange={(nextClass) => {
                    setForm((previous) => ({ ...previous, class: nextClass }));
                  }}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                iLvl
                <input
                  className={inputClassName}
                  type="number"
                  step={10}
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
              <div className="flex justify-end gap-2">
                <button type="button" className={secondaryButtonClass} onClick={() => setShowAddCharacterModal(false)}>
                  Cancel
                </button>
                <button type="button" className={primaryButtonClass} onClick={addCharacter} disabled={!addCharacterAccount}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {pendingRemoveAccount ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onClick={() => setPendingRemoveAccount(null)}>
          <div
            className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Dismiss remove account dialog"
              className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setPendingRemoveAccount(null)}
            >
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
                <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">Remove account</h2>
            <p className="mt-2 text-sm text-zinc-300">
              Remove <span className="font-semibold text-white">{pendingRemoveAccount}</span> and all its characters?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setPendingRemoveAccount(null)}>
                Cancel
              </button>
              <button type="button" className={dangerButtonClass} onClick={() => removeAccount(pendingRemoveAccount)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Characters</h2>
          <div className="flex items-center gap-2">
            {accountFilter !== "ALL" ? (
                <button
                  type="button"
                  className={dangerButtonClass}
                  disabled={roster.accounts.length <= 1}
                  onClick={() => setPendingRemoveAccount(accountFilter)}
                >
                  Remove
                </button>
            ) : null}
            <select
              className={selectClassName}
              value={accountFilter}
              onChange={(event) => setAccountFilter(event.currentTarget.value)}
            >
              <option value="ALL">All</option>
              {roster.accounts.map((account) => (
                <option key={account.accountName} value={account.accountName}>
                  {account.accountName}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filteredCharacters.length === 0 ? (
          <p className="text-zinc-400">Chua co character nao trong account nay.</p>
        ) : (
          <div className="space-y-3">
            {filteredCharacters.map((entry) => (
              <article
                key={`${entry.accountName}:${entry.character.name}:${entry.index}`}
                className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(170px,220px)_120px_auto_auto] md:items-end">
                  <div className="md:pb-2">
                    <p className="truncate text-sm font-medium text-zinc-100">{entry.character.name}</p>
                    <p className="text-xs text-zinc-400">{entry.accountName}</p>
                  </div>
                  <label className="flex flex-col gap-1.5 text-sm">
                    Class
                    <ClassDropdown
                      value={entry.character.class}
                      onChange={(nextClass) => {
                        updateCharacter(entry.accountName, entry.index, { class: normalizeClassName(nextClass) });
                      }}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    iLvl
                    <input
                      className={`${inputClassName} text-center`}
                      type="number"
                      step={10}
                      value={entry.character.ilvl}
                      onChange={(event) => {
                        const { value } = event.currentTarget;
                        updateCharacter(entry.accountName, entry.index, { ilvl: Number(value) || entry.character.ilvl });
                      }}
                    />
                  </label>
                  <label className="flex items-center gap-2 pt-0 text-sm md:pb-2">
                    <input
                      type="checkbox"
                      checked={entry.character.weeklyGold}
                      onChange={(event) => {
                        const { checked } = event.currentTarget;
                        updateCharacter(entry.accountName, entry.index, { weeklyGold: checked });
                      }}
                    />
                    Weekly Gold
                  </label>
                  <button
                    type="button"
                    className={`${secondaryButtonClass} md:mb-0.5`}
                    onClick={() => removeCharacter(entry.accountName, entry.index)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
