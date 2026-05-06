"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_CLASS_NAME, normalizeClassName } from "@/lib/lostark/classes";
import { ClassDropdown } from "@/components/ClassDropdown";
import { ClassIcon } from "@/components/Icon";
import { ButtonDropdown, ButtonDropdownOption } from "@/components/ButtonDropdown";
import { Character, CharacterRaid, CharacterRaidGate, RosterAccount, RosterState } from "@/lib/lostark/types";
import { defaultRosterState, readRosterState, writeRosterState } from "@/lib/lostark/storage";
import {
  RaidKey,
  getRaidDisplayName,
  getRaidGateList,
  getRaidKeys,
  getRaidModeOptions,
  normalizeRaidModeKey
} from "@/lib/lostark/raids";

type CharacterRef = {
  accountName: string;
  index: number;
};

type CharacterEntry = CharacterRef & {
  character: Character;
};

type RaidMenuTarget = CharacterRef & {
  raidId: string;
};

type EditRaidState = CharacterRef & {
  raidId: string;
  raidName: string;
  raidKey: RaidKey;
  gates: CharacterRaidGate[];
};

const emptyCharacter: Character = {
  name: "",
  class: DEFAULT_CLASS_NAME,
  ilvl: 1540,
  weeklyGold: true,
  raids: []
};

const inputClassName =
  "rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30";
const primaryButtonClass =
  "rounded-lg bg-fuchsia-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-60";
const secondaryButtonClass =
  "rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-600 disabled:cursor-not-allowed disabled:opacity-60";
const dangerButtonClass =
  "rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60";

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M6 6L14 14M14 6L6 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M13.8 3.6a1.6 1.6 0 1 1 2.3 2.3L8 14H5v-3l8.8-7.4Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <circle cx="5" cy="10" r="1.4" />
      <circle cx="10" cy="10" r="1.4" />
      <circle cx="15" cy="10" r="1.4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M6.5 6.5v8m3.5-8v8m3.5-8v8M4.5 5h11m-8-2h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function createRaidId() {
  return `raid-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function buildDefaultRaidGates(raidKey: RaidKey): CharacterRaidGate[] {
  const modeOptions = getRaidModeOptions(raidKey);
  const defaultMode = modeOptions[0]?.value ?? "normal";
  return getRaidGateList(raidKey).map((gate) => ({
    gate,
    difficulty: defaultMode
  }));
}

export function RosterClient() {
  const [roster, setRoster] = useState<RosterState>(defaultRosterState);
  const [newAccountName, setNewAccountName] = useState("");
  const [newCharacterForm, setNewCharacterForm] = useState<Character>(emptyCharacter);
  const [addCharacterAccount, setAddCharacterAccount] = useState("");

  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [showAddCharacterModal, setShowAddCharacterModal] = useState(false);

  const [editCharacterRef, setEditCharacterRef] = useState<CharacterRef | null>(null);
  const [editCharacterForm, setEditCharacterForm] = useState<Character>(emptyCharacter);

  const [activeTabs, setActiveTabs] = useState<Record<string, "raids" | "tasks">>({});
  const [raidMenuTarget, setRaidMenuTarget] = useState<RaidMenuTarget | null>(null);

  const [addRaidRef, setAddRaidRef] = useState<CharacterRef | null>(null);
  const [newRaidKey, setNewRaidKey] = useState<RaidKey | "">("");
  const [newRaidGates, setNewRaidGates] = useState<CharacterRaidGate[]>([]);

  const [editRaidState, setEditRaidState] = useState<EditRaidState | null>(null);

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

  const characterEntries = useMemo<CharacterEntry[]>(
    () =>
      roster.accounts.flatMap((account) =>
        account.characters.map((character, index) => ({
          accountName: account.accountName,
          index,
          character
        }))
      ),
    [roster.accounts]
  );

  const raidOptions = useMemo<ButtonDropdownOption[]>(
    () =>
      getRaidKeys().map((raidKey) => ({
        value: raidKey,
        label: getRaidDisplayName(raidKey)
      })),
    []
  );

  const accountOptions = useMemo<ButtonDropdownOption[]>(
    () =>
      roster.accounts.map((account) => ({
        value: account.accountName,
        label: account.accountName
      })),
    [roster.accounts]
  );

  function save(next: RosterState) {
    setRoster(next);
    writeRosterState(next);
  }

  function updateCharacterAt(ref: CharacterRef, updater: (character: Character) => Character) {
    const accountIndex = roster.accounts.findIndex((account) => account.accountName === ref.accountName);
    if (accountIndex === -1) {
      return;
    }
    const nextAccounts = roster.accounts.map((account, idx) =>
      idx === accountIndex
        ? {
            ...account,
            characters: account.characters.map((character, characterIndex) =>
              characterIndex === ref.index ? updater(character) : character
            )
          }
        : account
    );
    save({ ...roster, accounts: nextAccounts });
  }

  function removeCharacter(ref: CharacterRef) {
    const accountIndex = roster.accounts.findIndex((account) => account.accountName === ref.accountName);
    if (accountIndex === -1) {
      return;
    }
    const nextAccounts = roster.accounts.map((account, idx) =>
      idx === accountIndex
        ? {
            ...account,
            characters: account.characters.filter((_, characterIndex) => characterIndex !== ref.index)
          }
        : account
    );
    save({ ...roster, accounts: nextAccounts });
    setEditCharacterRef(null);
  }

  function findCharacter(ref: CharacterRef | null): Character | null {
    if (!ref) {
      return null;
    }
    const account = roster.accounts.find((item) => item.accountName === ref.accountName);
    if (!account) {
      return null;
    }
    return account.characters[ref.index] ?? null;
  }

  function addAccount() {
    const normalizedName = newAccountName.trim();
    if (!normalizedName || roster.accounts.some((account) => account.accountName === normalizedName)) {
      return;
    }
    const nextAccount: RosterAccount = { accountName: normalizedName, characters: [] };
    save({
      ...roster,
      accounts: [...roster.accounts, nextAccount],
      selectedAccount: normalizedName
    });
    setAddCharacterAccount(normalizedName);
    setNewAccountName("");
    setShowAddAccountModal(false);
  }

  function addCharacter() {
    const normalizedName = newCharacterForm.name.trim();
    const targetAccountName = addCharacterAccount.trim();
    if (!normalizedName || !targetAccountName) {
      return;
    }
    const accountIndex = roster.accounts.findIndex((account) => account.accountName === targetAccountName);
    if (accountIndex === -1) {
      return;
    }
    const characterToAdd: Character = {
      ...newCharacterForm,
      name: normalizedName,
      class: normalizeClassName(newCharacterForm.class),
      raids: Array.isArray(newCharacterForm.raids) ? newCharacterForm.raids : []
    };
    const nextAccounts = roster.accounts.map((account, idx) =>
      idx === accountIndex
        ? {
            ...account,
            characters: [...account.characters, characterToAdd]
          }
        : account
    );
    save({
      ...roster,
      accounts: nextAccounts,
      selectedAccount: targetAccountName
    });
    setNewCharacterForm(emptyCharacter);
    setShowAddCharacterModal(false);
  }

  function openEditCharacterModal(ref: CharacterRef) {
    const found = findCharacter(ref);
    if (!found) {
      return;
    }
    setEditCharacterRef(ref);
    setEditCharacterForm({
      ...found,
      raids: Array.isArray(found.raids) ? found.raids : []
    });
  }

  function confirmEditCharacter() {
    if (!editCharacterRef) {
      return;
    }
    const normalizedName = editCharacterForm.name.trim();
    if (!normalizedName) {
      return;
    }
    updateCharacterAt(editCharacterRef, (current) => ({
      ...current,
      ...editCharacterForm,
      name: normalizedName,
      class: normalizeClassName(editCharacterForm.class),
      raids: Array.isArray(editCharacterForm.raids) ? editCharacterForm.raids : current.raids ?? []
    }));
    setEditCharacterRef(null);
  }

  function openAddRaidModal(ref: CharacterRef) {
    setAddRaidRef(ref);
    setNewRaidKey("");
    setNewRaidGates([]);
    setRaidMenuTarget(null);
  }

  function onSelectRaidForAdd(value: string) {
    const raidKey = value as RaidKey;
    setNewRaidKey(raidKey);
    setNewRaidGates(buildDefaultRaidGates(raidKey));
  }

  function changeAddRaidGateDifficulty(gateName: string, difficulty: string) {
    if (!newRaidKey) {
      return;
    }
    setNewRaidGates((previous) =>
      previous.map((gate) =>
        gate.gate === gateName
          ? { ...gate, difficulty: normalizeRaidModeKey(difficulty, newRaidKey) }
          : gate
      )
    );
  }

  function confirmAddRaid() {
    if (!addRaidRef || !newRaidKey) {
      return;
    }
    const raid: CharacterRaid = {
      id: createRaidId(),
      raidKey: newRaidKey,
      name: getRaidDisplayName(newRaidKey),
      gates: newRaidGates.length > 0 ? newRaidGates : buildDefaultRaidGates(newRaidKey)
    };
    updateCharacterAt(addRaidRef, (character) => ({
      ...character,
      raids: [...(character.raids ?? []), raid]
    }));
    setAddRaidRef(null);
  }

  function openEditRaidModal(ref: CharacterRef, raid: CharacterRaid) {
    const gates = Array.isArray(raid.gates) && raid.gates.length > 0 ? raid.gates : buildDefaultRaidGates(raid.raidKey);
    setEditRaidState({
      ...ref,
      raidId: raid.id,
      raidName: raid.name,
      raidKey: raid.raidKey,
      gates
    });
    setRaidMenuTarget(null);
  }

  function changeEditRaidGateDifficulty(gateName: string, difficulty: string) {
    setEditRaidState((previous) => {
      if (!previous) {
        return previous;
      }
      return {
        ...previous,
        gates: previous.gates.map((gate) =>
          gate.gate === gateName
            ? { ...gate, difficulty: normalizeRaidModeKey(difficulty, previous.raidKey) }
            : gate
        )
      };
    });
  }

  function confirmEditRaid() {
    if (!editRaidState) {
      return;
    }
    updateCharacterAt(editRaidState, (character) => ({
      ...character,
      raids: (character.raids ?? []).map((raid) =>
        raid.id === editRaidState.raidId
          ? { ...raid, gates: editRaidState.gates }
          : raid
      )
    }));
    setEditRaidState(null);
  }

  function removeRaid(ref: CharacterRef, raidId: string) {
    updateCharacterAt(ref, (character) => ({
      ...character,
      raids: (character.raids ?? []).filter((raid) => raid.id !== raidId)
    }));
    setRaidMenuTarget(null);
  }

  function formatRaidGateSummary(raid: CharacterRaid): string {
    const modeMap = Object.fromEntries(getRaidModeOptions(raid.raidKey).map((item) => [item.value, item.label]));
    return (raid.gates ?? [])
      .map((gate) => `${gate.gate} ${modeMap[gate.difficulty] ?? gate.difficulty}`)
      .join(" • ");
  }

  return (
    <div className="space-y-4" onClick={() => setRaidMenuTarget(null)}>
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

      {characterEntries.length === 0 ? (
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 shadow-xl">
          <p className="text-zinc-400">Chua co character nao trong roster.</p>
        </section>
      ) : (
        roster.accounts.map((account) => (
          <section key={account.accountName} className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-xl">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h2 className="text-lg font-semibold">{account.accountName}</h2>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
                {account.characters.map((character, index) => {
                  const entry: CharacterEntry = { accountName: account.accountName, index, character };
              const raids = entry.character.raids ?? [];
              const key = `${entry.accountName}:${entry.character.name}:${entry.index}`;
              const activeTab = activeTabs[key] ?? "raids";
              const isTaskTab = activeTab === "tasks";
              return (
                <article
                  key={key}
                  className="self-start overflow-hidden rounded-xl border border-[oklch(0.38_0.02_260)] bg-[oklch(0.23_0.015_260)]"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-start justify-between border-b border-[oklch(0.38_0.02_260)] p-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="h-9 w-9">
                        <ClassIcon className={entry.character.class} size="lg" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs text-[oklch(0.7_0_0)]">{entry.character.class}</p>
                        <p className="truncate text-lg font-semibold leading-6 text-white">{entry.character.name}</p>
                        <p className="mt-0.5 text-sm text-[oklch(0.7_0_0)]">⚔ {entry.character.ilvl}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                      onClick={() => openEditCharacterModal(entry)}
                    >
                      <PencilIcon />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 border-b border-[oklch(0.38_0.02_260)] text-sm">
                    <button
                      type="button"
                      className={`px-3 py-2 transition ${!isTaskTab ? "bg-zinc-800/60 text-white" : "text-zinc-400 hover:text-white"}`}
                      onClick={() => setActiveTabs((previous) => ({ ...previous, [key]: "raids" }))}
                    >
                      Raids ({raids.length})
                    </button>
                    <button
                      type="button"
                      className={`px-3 py-2 transition ${isTaskTab ? "bg-zinc-800/60 text-white" : "text-zinc-400 hover:text-white"}`}
                      onClick={() => setActiveTabs((previous) => ({ ...previous, [key]: "tasks" }))}
                    >
                      Tasks (0)
                    </button>
                  </div>

                  {isTaskTab ? (
                    <div className="p-4 text-sm text-zinc-400">No tasks assigned.</div>
                  ) : (
                    <>
                      <div className="divide-y divide-[oklch(0.38_0.02_260)]">
                        {raids.map((raid) => {
                          const menuOpen =
                            raidMenuTarget?.accountName === entry.accountName &&
                            raidMenuTarget.index === entry.index &&
                            raidMenuTarget.raidId === raid.id;
                          return (
                            <div key={raid.id} className="relative px-4 py-3">
                              <div className="pr-10">
                                <p className="truncate text-xl text-white">{raid.name}</p>
                                <p className="mt-1 text-sm text-zinc-400">{formatRaidGateSummary(raid)}</p>
                              </div>
                              <button
                                type="button"
                                className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setRaidMenuTarget(menuOpen ? null : { accountName: entry.accountName, index: entry.index, raidId: raid.id });
                                }}
                              >
                                <DotsIcon />
                              </button>
                              {menuOpen ? (
                                <div className="absolute right-3 top-10 z-20 w-32 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl">
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-sm text-zinc-100 transition hover:bg-zinc-800"
                                    onClick={() => openEditRaidModal(entry, raid)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="block w-full px-3 py-2 text-left text-sm text-rose-300 transition hover:bg-zinc-800"
                                    onClick={() => removeRaid(entry, raid.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                        {raids.length === 0 ? <p className="px-4 py-3 text-sm text-zinc-500">No raids yet.</p> : null}
                      </div>
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 border-t border-[oklch(0.38_0.02_260)] py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-800/40 hover:text-white"
                        onClick={() => openAddRaidModal(entry)}
                      >
                        <PlusIcon />
                        Add Raid
                      </button>
                    </>
                  )}
                </article>
              );
                })}
              </div>
            </div>
          </section>
        ))
      )}

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
              <CloseIcon />
            </button>
            <h2 className="text-lg font-semibold">Add Account</h2>
            <label className="mt-4 flex flex-col gap-1.5 text-sm">
              Account name
              <input
                autoFocus
                className={inputClassName}
                value={newAccountName}
                onChange={(event) => setNewAccountName(event.currentTarget.value)}
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
              <CloseIcon />
            </button>
            <h2 className="text-lg font-semibold">Add Character</h2>
            <div className="mt-4 grid grid-cols-1 items-end gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                Account
                <ButtonDropdown value={addCharacterAccount} options={accountOptions} onChange={setAddCharacterAccount} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Name
                <input
                  className={inputClassName}
                  value={newCharacterForm.name}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    setNewCharacterForm((previous) => ({ ...previous, name: value }));
                  }}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Class
                <ClassDropdown
                  value={newCharacterForm.class}
                  onChange={(nextClass) => setNewCharacterForm((previous) => ({ ...previous, class: nextClass }))}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Item level
                <input
                  className={inputClassName}
                  type="number"
                  step={10}
                  value={newCharacterForm.ilvl}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    setNewCharacterForm((previous) => ({ ...previous, ilvl: Number(value) || 0 }));
                  }}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={newCharacterForm.weeklyGold}
                  onChange={(event) => {
                    const { checked } = event.currentTarget;
                    setNewCharacterForm((previous) => ({ ...previous, weeklyGold: checked }));
                  }}
                />
                Is Gold Earner?
              </label>
              <div className="flex justify-end gap-2">
                <button type="button" className={secondaryButtonClass} onClick={() => setShowAddCharacterModal(false)}>
                  Cancel
                </button>
                <button type="button" className={primaryButtonClass} onClick={addCharacter} disabled={!addCharacterAccount}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editCharacterRef ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onClick={() => setEditCharacterRef(null)}>
          <div
            className="relative w-full max-w-2xl rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Dismiss edit character dialog"
              className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setEditCharacterRef(null)}
            >
              <CloseIcon />
            </button>
            <h2 className="text-3xl font-bold text-fuchsia-500">Update Character</h2>
            <p className="mt-1 text-lg text-zinc-400">Update your character&apos;s information</p>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="md:col-span-2 flex flex-col gap-1.5 text-sm">
                Name
                <input
                  className={inputClassName}
                  value={editCharacterForm.name}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    setEditCharacterForm((previous) => ({ ...previous, name: value }));
                  }}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Class
                <ClassDropdown
                  value={editCharacterForm.class}
                  onChange={(nextClass) => setEditCharacterForm((previous) => ({ ...previous, class: nextClass }))}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Item level
                <input
                  className={inputClassName}
                  type="number"
                  step={10}
                  value={editCharacterForm.ilvl}
                  onChange={(event) => {
                    const { value } = event.currentTarget;
                    setEditCharacterForm((previous) => ({ ...previous, ilvl: Number(value) || 0 }));
                  }}
                />
              </label>
              <label className="flex items-center gap-2 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  checked={editCharacterForm.weeklyGold}
                  onChange={(event) => {
                    const { checked } = event.currentTarget;
                    setEditCharacterForm((previous) => ({ ...previous, weeklyGold: checked }));
                  }}
                />
                Is Gold Earner?
              </label>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3">
              <button type="button" className={dangerButtonClass} onClick={() => removeCharacter(editCharacterRef)}>
                <span className="flex items-center gap-2">
                  <TrashIcon />
                  Remove
                </span>
              </button>
              <div className="flex items-center gap-2">
                <button type="button" className={secondaryButtonClass} onClick={() => setEditCharacterRef(null)}>
                  Cancel
                </button>
                <button type="button" className={primaryButtonClass} onClick={confirmEditCharacter}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {addRaidRef ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onClick={() => setAddRaidRef(null)}>
          <div
            className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Dismiss add raid dialog"
              className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setAddRaidRef(null)}
            >
              <CloseIcon />
            </button>
            <h2 className="text-lg font-semibold">Add Raid</h2>
            <div className="mt-4 space-y-3">
              <label className="flex flex-col gap-1.5 text-sm">
                Select the Raid
                <ButtonDropdown value={newRaidKey} options={raidOptions} onChange={onSelectRaidForAdd} placeholder="Select the Raid" />
              </label>

              {newRaidKey ? (
                <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
                  <p className="text-xs text-zinc-400">
                    Gates: {getRaidGateList(newRaidKey).length}
                  </p>
                  {newRaidGates.map((gate) => (
                    <label key={gate.gate} className="flex flex-col gap-1.5 text-sm">
                      {gate.gate} difficulty
                      <ButtonDropdown
                        value={gate.difficulty}
                        options={getRaidModeOptions(newRaidKey)}
                        onChange={(value) => changeAddRaidGateDifficulty(gate.gate, value)}
                      />
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setAddRaidRef(null)}>
                Cancel
              </button>
              <button type="button" className={primaryButtonClass} onClick={confirmAddRaid} disabled={!newRaidKey}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editRaidState ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" onClick={() => setEditRaidState(null)}>
          <div
            className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Dismiss edit raid dialog"
              className="absolute right-3 top-3 rounded-md p-1 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
              onClick={() => setEditRaidState(null)}
            >
              <CloseIcon />
            </button>
            <h2 className="text-lg font-semibold">Edit Raid Difficulty</h2>
            <p className="mt-2 text-sm text-zinc-400">{editRaidState.raidName}</p>
            <div className="mt-4 space-y-3">
              {editRaidState.gates.map((gate) => (
                <label key={gate.gate} className="flex flex-col gap-1.5 text-sm">
                  {gate.gate} difficulty
                  <ButtonDropdown
                    value={gate.difficulty}
                    options={getRaidModeOptions(editRaidState.raidKey)}
                    onChange={(value) => changeEditRaidGateDifficulty(gate.gate, value)}
                  />
                </label>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" className={secondaryButtonClass} onClick={() => setEditRaidState(null)}>
                Cancel
              </button>
              <button type="button" className={primaryButtonClass} onClick={confirmEditRaid}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
