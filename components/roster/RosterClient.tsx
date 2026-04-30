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
    <div className="roster-page">
      <div className="header">
        <h1>Roster</h1>
      </div>

      <section className="card roster-form">
        <h2>Accounts</h2>
        <div className="form-grid">
          <label>
            Selected account
            <select
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
          <label>
            New account name
            <input
              value={newAccountName}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setNewAccountName(value);
              }}
            />
          </label>
          <button type="button" className="task-btn" onClick={addAccount}>
            Add account
          </button>
          <button
            type="button"
            className="task-btn reset"
            onClick={removeAccount}
            disabled={!roster.selectedAccount || roster.accounts.length <= 1}
          >
            Remove selected account
          </button>
        </div>
      </section>

      <section className="card roster-form">
        <h2>Add character</h2>
        <div className="form-grid">
          <label>
            Account
            <select
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
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, name: value }));
              }}
            />
          </label>
          <label>
            Class
            <select
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
          <label>
            iLvl
            <input
              type="number"
              value={form.ilvl}
              onChange={(event) => {
                const { value } = event.currentTarget;
                setForm((previous) => ({ ...previous, ilvl: Number(value) || 0 }));
              }}
            />
          </label>
          <label className="checkbox-label">
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
          <button type="button" className="task-btn" onClick={addCharacter} disabled={!roster.selectedAccount}>
            Add
          </button>
        </div>
      </section>

      <section className="card roster-settings">
        <label className="checkbox-label">
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

      <section className="card">
        <h2>Characters ({roster.selectedAccount || "No account"})</h2>
        {characters.length === 0 ? (
          <p>Chua co character nao trong account nay.</p>
        ) : (
          <table className="checklist-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>iLvl</th>
                <th>Weekly Gold</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {characters.map((character, index) => (
                <tr key={`${character.name}-${index}`}>
                  <td>{character.name}</td>
                  <td>
                    <select
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
                  <td>
                    <input
                      type="number"
                      value={character.ilvl}
                      onChange={(event) => {
                        const { value } = event.currentTarget;
                        updateCharacter(index, { ilvl: Number(value) || character.ilvl });
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={character.weeklyGold}
                      onChange={(event) => {
                        const { checked } = event.currentTarget;
                        updateCharacter(index, { weeklyGold: checked });
                      }}
                    />
                  </td>
                  <td>
                    <button type="button" className="task-btn reset" onClick={() => removeCharacter(index)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
