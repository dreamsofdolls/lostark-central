import { NextRequest, NextResponse } from "next/server";
import { getLastDailyReset, getLastWeeklyReset } from "@/lib/lostark/time";
import { isSideTask, isSideTaskLabel } from "@/lib/lostark/sideTasks";
import { Character, CharacterRaid, CompletionMap, LostarkTask, RosterState } from "@/lib/lostark/types";
import {
  RaidKey,
  getRaidDisplayName,
  getRaidGateList,
  inferRaidKeyFromName,
  normalizeRaidModeKey
} from "@/lib/lostark/raids";
import { SIDE_TASK_NAMES, normalizeSideTaskName } from "@/lib/lostark/sideTasks";
import { connectDB } from "@/lib/mongo/db";
import { User } from "@/lib/mongo/models/User";

type StatePayload = {
  roster?: unknown;
  tasks?: unknown;
  settings?: unknown;
  completion?: unknown;
  updatedAt?: number;
};

type SideTaskDocument = {
  taskId: string;
  name: string;
  reset: "daily" | "weekly";
  completed: boolean;
  lastResetAt: number;
  createdAt: number;
};

type CharacterDocument = {
  id?: unknown;
  name?: unknown;
  class?: unknown;
  itemLevel?: unknown;
  isGoldEarner?: unknown;
  assignedRaids?: unknown;
  sideTasks?: unknown;
};

type AccountDocument = {
  accountName?: unknown;
  characters?: unknown;
};

type UserWithAccounts = {
  centralWebState?: StatePayload | null;
  accounts?: unknown;
};

type AssignedRaidsDocument = Record<RaidKey, Record<string, unknown>>;
const RAID_KEYS: RaidKey[] = ["serca", "armoche", "kazeros"];

function parseAssignedRaids(input: unknown): CharacterRaid[] {
  if (!input || typeof input !== "object") {
    return [];
  }
  const source = input as Record<string, unknown>;
  const raids: CharacterRaid[] = [];
  for (const key of RAID_KEYS) {
    const rawEntry = source[key];
    if (!rawEntry || typeof rawEntry !== "object") {
      continue;
    }
    const entry = rawEntry as Record<string, unknown>;
    if (Object.keys(entry).length === 0) {
      continue;
    }
    const customName = String(entry.name ?? "").trim();
    raids.push({
      id: `mongo-${key}`,
      raidKey: key,
      name: customName || getRaidDisplayName(key),
      gates: getRaidGateList(key).map((gate) => ({
        gate,
        difficulty: normalizeRaidModeKey(entry.difficulty ?? entry.mode ?? entry.level, key)
      }))
    });
  }
  return raids;
}

function buildAssignedRaidsDocument(
  raids: CharacterRaid[] | undefined,
  existingAssignedRaids: unknown
): AssignedRaidsDocument {
  const existing = existingAssignedRaids && typeof existingAssignedRaids === "object"
    ? (existingAssignedRaids as Record<string, unknown>)
    : {};
  const next: AssignedRaidsDocument = {
    serca: existing.serca && typeof existing.serca === "object" ? { ...(existing.serca as Record<string, unknown>) } : {},
    armoche: existing.armoche && typeof existing.armoche === "object" ? { ...(existing.armoche as Record<string, unknown>) } : {},
    kazeros: existing.kazeros && typeof existing.kazeros === "object" ? { ...(existing.kazeros as Record<string, unknown>) } : {}
  };

  for (const raid of raids ?? []) {
    const key = (String(raid.raidKey ?? "").trim().toLowerCase() || inferRaidKeyFromName(raid.name)) as RaidKey | null;
    if (!key) {
      continue;
    }
    const firstGateDifficulty = Array.isArray(raid.gates) && raid.gates.length > 0
      ? normalizeRaidModeKey(raid.gates[0].difficulty, key)
      : "normal";
    next[key] = {
      ...next[key],
      name: raid.name,
      difficulty: firstGateDifficulty,
      gates: (raid.gates ?? []).map((gate) => ({
        gate: gate.gate,
        difficulty: normalizeRaidModeKey(gate.difficulty, key)
      })),
      selected: true
    };
  }
  return next;
}

function parseRosterState(input: unknown): RosterState | null {
  if (!input || typeof input !== "object") {
    return null;
  }
  const source = input as Partial<RosterState>;
  if (!Array.isArray(source.accounts)) {
    return null;
  }
  const accounts = source.accounts
    .map((account) => {
      if (!account || typeof account !== "object") {
        return null;
      }
      const accountName = String((account as { accountName?: unknown }).accountName ?? "").trim();
      if (!accountName) {
        return null;
      }
      const charactersRaw = (account as { characters?: unknown }).characters;
      const characters = Array.isArray(charactersRaw)
        ? charactersRaw
            .map((character) => {
              if (!character || typeof character !== "object") {
                return null;
              }
              const raw = character as Partial<Character>;
              const name = String(raw.name ?? "").trim();
              if (!name) {
                return null;
              }
              const raids = Array.isArray(raw.raids)
                ? raw.raids
                    .map((raid): CharacterRaid | null => {
                      if (!raid || typeof raid !== "object") {
                        return null;
                      }
                      const raidRaw = raid as Partial<CharacterRaid>;
                      const raidName = String(raidRaw.name ?? "").trim();
                      const raidKeyRaw = String((raidRaw as { raidKey?: unknown }).raidKey ?? "").trim().toLowerCase();
                      const raidKey = (raidKeyRaw || inferRaidKeyFromName(raidName)) as RaidKey | null;
                      if (!raidKey) {
                        return null;
                      }
                      const gates = Array.isArray(raidRaw.gates)
                        ? raidRaw.gates
                            .map((gate) => {
                              if (!gate || typeof gate !== "object") {
                                return null;
                              }
                              const gateRaw = gate as { gate?: unknown; difficulty?: unknown };
                              const gateName = String(gateRaw.gate ?? "").trim();
                              if (!gateName) {
                                return null;
                              }
                              return {
                                gate: gateName,
                                difficulty: normalizeRaidModeKey(gateRaw.difficulty, raidKey)
                              };
                            })
                            .filter((gate): gate is { gate: string; difficulty: string } => Boolean(gate))
                        : [];
                      return {
                        id: String(raidRaw.id ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`),
                        raidKey,
                        name: raidName || getRaidDisplayName(raidKey),
                        gates:
                          gates.length > 0
                            ? gates
                            : getRaidGateList(raidKey).map((gate) => ({
                                gate,
                                difficulty: normalizeRaidModeKey((raidRaw as { difficulty?: unknown }).difficulty, raidKey)
                              }))
                      };
                    })
                    .filter((raid): raid is CharacterRaid => Boolean(raid))
                : [];
              const hasSideTasksField = Array.isArray((raw as { sideTasks?: unknown }).sideTasks);
              const rawSideTasks = hasSideTasksField
                ? ((raw as { sideTasks?: unknown }).sideTasks as unknown[])
                    .map((taskName) => String(taskName ?? "").trim())
                    .filter((taskName) => taskName.length > 0)
                : [];
              const normalizedSideTasks = hasSideTasksField
                ? SIDE_TASK_NAMES.filter((taskName) =>
                    rawSideTasks.some((value) => normalizeSideTaskName(value) === normalizeSideTaskName(taskName))
                  )
                : [...SIDE_TASK_NAMES];
              const normalizedCharacter: Character = {
                name,
                class: String(raw.class ?? "").trim(),
                ilvl: Number(raw.ilvl ?? 0),
                weeklyGold: Boolean(raw.weeklyGold),
                raids,
                sideTasks: normalizedSideTasks,
                ...(typeof raw.note === "string" ? { note: raw.note } : {})
              };
              return normalizedCharacter;
            })
            .filter((character): character is Character => Boolean(character))
        : [];
      return { accountName, characters };
    })
    .filter((account): account is NonNullable<typeof account> => Boolean(account));

  return {
    accounts,
    selectedAccount: String(source.selectedAccount ?? accounts[0]?.accountName ?? ""),
    showAllTasks: Boolean(source.showAllTasks)
  };
}

function parseTasks(input: unknown): LostarkTask[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const parsed: LostarkTask[] = [];
  for (const task of input) {
    if (!task || typeof task !== "object") {
      continue;
    }
    const raw = task as Partial<LostarkTask>;
    const label = String(raw.label ?? "").trim();
    const id = String(raw.id ?? "").trim();
    const scope = raw.scope === "CHARACTER" || raw.scope === "ROSTER" ? raw.scope : null;
    if (!label || !id || !scope) {
      continue;
    }
    parsed.push({
      id,
      label,
      scope,
      frequency: raw.frequency ?? "WEEKLY",
      amount: Number(raw.amount ?? 1),
      minIlvl: Number(raw.minIlvl ?? 0),
      maxIlvl: Number(raw.maxIlvl ?? 9999),
      daysFilter: Array.isArray(raw.daysFilter) ? raw.daysFilter.filter((day) => Number.isInteger(day)) : [],
      canEditDaysFilter: raw.canEditDaysFilter !== false,
      enabled: raw.enabled !== false
    });
  }
  return parsed;
}

function parseCompletion(input: unknown): CompletionMap {
  if (!input || typeof input !== "object") {
    return {};
  }
  const result: CompletionMap = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (!value || typeof value !== "object") {
      continue;
    }
    const raw = value as { amount?: unknown; updated?: unknown };
    result[key] = {
      amount: Number(raw.amount ?? 0),
      updated: Number(raw.updated ?? 0)
    };
  }
  return result;
}

function parseAccounts(input: unknown): AccountDocument[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input.filter((account): account is AccountDocument => Boolean(account) && typeof account === "object");
}

function parseSideTasks(input: unknown): SideTaskDocument[] {
  if (!Array.isArray(input)) {
    return [];
  }
  return input
    .map((task) => {
      if (!task || typeof task !== "object") {
        return null;
      }
      const raw = task as Partial<SideTaskDocument>;
      const taskId = String(raw.taskId ?? "").trim();
      const name = String(raw.name ?? "").trim();
      const reset = raw.reset === "daily" ? "daily" : "weekly";
      if (!taskId || !name) {
        return null;
      }
      return {
        taskId,
        name,
        reset,
        completed: Boolean(raw.completed),
        lastResetAt: Number(raw.lastResetAt ?? 0),
        createdAt: Number(raw.createdAt ?? Date.now())
      };
    })
    .filter((task): task is SideTaskDocument => Boolean(task));
}

function getTaskResetBoundary(task: LostarkTask, now: number): number {
  if (task.frequency === "DAILY") {
    return getLastDailyReset(now);
  }
  return getLastWeeklyReset(now);
}

function toCharacterId(accountName: string, characterName: string): string {
  const raw = `${accountName}-${characterName}`.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return raw.replace(/^-+|-+$/g, "") || `${Date.now()}`;
}

function mergeSideTasksIntoCompletion(
  state: StatePayload | null | undefined,
  accountsRaw: unknown,
  now: number
): StatePayload | null {
  if (!state || typeof state !== "object") {
    return state ?? null;
  }
  const roster = parseRosterState(state.roster);
  if (!roster) {
    return state;
  }
  const allTasks = parseTasks(state.tasks);
  const sideTasks = allTasks.filter((task) => task.enabled && isSideTask(task));
  if (!sideTasks.length) {
    return state;
  }

  const accountDocuments = parseAccounts(accountsRaw);
  const completion = parseCompletion(state.completion);
  const mergedRosterAccounts = roster.accounts.map((rosterAccount) => {
    const accountDocument = accountDocuments.find(
      (account) => String(account.accountName ?? "").trim() === rosterAccount.accountName
    );
    const characterDocuments = Array.isArray(accountDocument?.characters)
      ? (accountDocument.characters as CharacterDocument[])
      : [];
    const characters = rosterAccount.characters.map((character) => {
      const characterDocument = characterDocuments.find(
        (item) => String(item?.name ?? "").trim() === character.name
      );
      if (!characterDocument) {
        return character;
      }
      const dbRaids = parseAssignedRaids(characterDocument.assignedRaids);
      const dbItemLevel = Number(characterDocument.itemLevel);
      return {
        ...character,
        ilvl: Number.isFinite(dbItemLevel) ? dbItemLevel : character.ilvl,
        weeklyGold:
          typeof characterDocument.isGoldEarner === "boolean"
            ? characterDocument.isGoldEarner
            : character.weeklyGold,
        raids: character.raids && character.raids.length > 0 ? character.raids : dbRaids
      } satisfies Character;
    });
    return {
      ...rosterAccount,
      characters
    };
  });
  const mergedRoster: RosterState = {
    ...roster,
    accounts: mergedRosterAccounts
  };

  for (const rosterAccount of mergedRoster.accounts) {
    const accountDocument = accountDocuments.find(
      (account) => String(account.accountName ?? "").trim() === rosterAccount.accountName
    );
    const characterDocuments = Array.isArray(accountDocument?.characters)
      ? (accountDocument.characters as CharacterDocument[])
      : [];

    for (const character of rosterAccount.characters) {
      const characterDocument = characterDocuments.find(
        (item) => String(item?.name ?? "").trim() === character.name
      );
      if (!characterDocument) {
        continue;
      }
      const sideTaskDocs = parseSideTasks(characterDocument.sideTasks);
      for (const task of sideTasks) {
        const dbSideTask = sideTaskDocs.find(
          (item) => item.taskId === task.id || (isSideTaskLabel(item.name) && isSideTaskLabel(task.label))
        );
        if (!dbSideTask) {
          continue;
        }
        const key = `${rosterAccount.accountName}:${character.name}:${task.id}`;
        const resetBoundary = getTaskResetBoundary(task, now);
        completion[key] = {
          amount: dbSideTask.completed ? task.amount : 0,
          updated: Math.max(Number(dbSideTask.lastResetAt || 0), resetBoundary)
        };
      }
    }
  }

  return { ...state, roster: mergedRoster, completion };
}

function buildMergedAccounts(
  state: StatePayload,
  existingAccountsRaw: unknown,
  now: number
): AccountDocument[] | null {
  const roster = parseRosterState(state.roster);
  if (!roster) {
    return null;
  }
  const allTasks = parseTasks(state.tasks);
  const completion = parseCompletion(state.completion);
  const sideTaskDefs = allTasks.filter((task) => task.enabled && isSideTask(task));

  const existingAccounts = parseAccounts(existingAccountsRaw);
  const existingAccountMap = new Map(
    existingAccounts.map((account) => [String(account.accountName ?? "").trim(), account] as const)
  );

  const nextAccounts: AccountDocument[] = [];
  for (const rosterAccount of roster.accounts) {
    const existingAccount = existingAccountMap.get(rosterAccount.accountName);
    const existingCharacters = Array.isArray(existingAccount?.characters)
      ? (existingAccount.characters as CharacterDocument[])
      : [];

    const nextCharacters = rosterAccount.characters.map((character) => {
      const existingCharacter = existingCharacters.find((item) => String(item.name ?? "").trim() === character.name);
      const existingSideTasks = parseSideTasks(existingCharacter?.sideTasks);
      const sideTaskSet = new Set(sideTaskDefs.map((task) => task.id));
      const preserved = sideTaskDefs.length
        ? existingSideTasks.filter((task) => !sideTaskSet.has(task.taskId) && !isSideTaskLabel(task.name))
        : existingSideTasks;
      const mapped = sideTaskDefs.map((task) => {
        const completionKey = `${rosterAccount.accountName}:${character.name}:${task.id}`;
        const completionEntry = completion[completionKey];
        const resetBoundary = getTaskResetBoundary(task, now);
        const done =
          completionEntry && Number(completionEntry.updated) >= resetBoundary
            ? Number(completionEntry.amount)
            : 0;
        const existingSideTask = existingSideTasks.find((item) => item.taskId === task.id || item.name === task.label);
        return {
          taskId: task.id,
          name: task.label,
          reset: task.frequency === "DAILY" ? "daily" : "weekly",
          completed: done >= task.amount,
          lastResetAt: resetBoundary,
          createdAt: existingSideTask?.createdAt ?? now
        } satisfies SideTaskDocument;
      });

      return {
        ...(existingCharacter ?? {}),
        id: String(existingCharacter?.id ?? toCharacterId(rosterAccount.accountName, character.name)),
        name: character.name,
        class: character.class,
        itemLevel: Number.isFinite(character.ilvl) ? character.ilvl : 0,
        isGoldEarner: Boolean(character.weeklyGold),
        assignedRaids: buildAssignedRaidsDocument(character.raids, existingCharacter?.assignedRaids),
        sideTasks: [...preserved, ...mapped]
      } satisfies CharacterDocument;
    });

    nextAccounts.push({
      ...(existingAccount ?? {}),
      accountName: rosterAccount.accountName,
      characters: nextCharacters
    });
    existingAccountMap.delete(rosterAccount.accountName);
  }

  for (const [remainingName, remainingAccount] of existingAccountMap) {
    if (!remainingName) {
      continue;
    }
    nextAccounts.push(remainingAccount);
  }

  return nextAccounts;
}

export async function GET(request: NextRequest) {
  const discordId = request.nextUrl.searchParams.get("discordId")?.trim();
  if (!discordId) {
    return NextResponse.json({ error: "Missing discordId" }, { status: 400 });
  }

  await connectDB();
  const user = (await User.findOne({ discordId }).select("discordId centralWebState accounts").lean()) as
    | UserWithAccounts
    | null;
  const mergedState = mergeSideTasksIntoCompletion(user?.centralWebState, user?.accounts, Date.now());
  return NextResponse.json({
    discordId,
    state: mergedState
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { discordId?: string; state?: StatePayload };
  const discordId = String(body.discordId ?? "").trim();
  if (!discordId) {
    return NextResponse.json({ error: "Missing discordId" }, { status: 400 });
  }
  if (!body.state || typeof body.state !== "object") {
    return NextResponse.json({ error: "Missing state payload" }, { status: 400 });
  }

  await connectDB();
  const now = Date.now();
  const nextState: StatePayload = {
    ...body.state,
    updatedAt: typeof body.state.updatedAt === "number" ? body.state.updatedAt : now
  };
  const existingUser = (await User.findOne({ discordId }).select("accounts").lean()) as UserWithAccounts | null;
  const mergedAccounts = buildMergedAccounts(nextState, existingUser?.accounts, now);
  const updatePayload: {
    $setOnInsert: { discordId: string };
    $set: { centralWebState: StatePayload; accounts?: AccountDocument[] };
  } = {
    $setOnInsert: { discordId },
    $set: { centralWebState: nextState }
  };
  if (mergedAccounts) {
    updatePayload.$set.accounts = mergedAccounts;
  }

  await User.findOneAndUpdate(
    { discordId },
    updatePayload,
    { upsert: true }
  );

  return NextResponse.json({ ok: true, discordId, state: nextState });
}
