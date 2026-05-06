export type RaidKey = "armoche" | "kazeros" | "serca";

export type RaidModeKey = "normal" | "hard" | "nightmare";

export type RaidMode = {
  label: string;
  minItemLevel: number;
  gold: Record<string, number>;
};

export type RaidDefinition = {
  label: string;
  displayName: string;
  gates: string[];
  modes: Partial<Record<RaidModeKey, RaidMode>>;
};

export const RAID_REQUIREMENTS: Record<RaidKey, RaidDefinition> = {
  armoche: {
    label: "Act 4",
    displayName: "Act 4: Armoche",
    gates: ["G1", "G2"],
    modes: {
      normal: { label: "Normal", minItemLevel: 1700, gold: { G1: 12500, G2: 20500 } },
      hard: { label: "Hard", minItemLevel: 1720, gold: { G1: 15000, G2: 27000 } }
    }
  },
  kazeros: {
    label: "Kazeros",
    displayName: "Final Act: Kazeros",
    gates: ["G1", "G2"],
    modes: {
      normal: { label: "Normal", minItemLevel: 1710, gold: { G1: 14000, G2: 26000 } },
      hard: { label: "Hard", minItemLevel: 1730, gold: { G1: 17000, G2: 35000 } }
    }
  },
  serca: {
    label: "Serca",
    displayName: "Act 3: Mordum",
    gates: ["G1", "G2"],
    modes: {
      normal: { label: "Normal", minItemLevel: 1710, gold: { G1: 14000, G2: 21000 } },
      hard: { label: "Hard", minItemLevel: 1730, gold: { G1: 17500, G2: 26500 } },
      nightmare: { label: "Nightmare", minItemLevel: 1740, gold: { G1: 21000, G2: 33000 } }
    }
  }
};

export function getRaidKeys(): RaidKey[] {
  return Object.keys(RAID_REQUIREMENTS) as RaidKey[];
}

export function getRaidDisplayName(raidKey: RaidKey): string {
  return RAID_REQUIREMENTS[raidKey].displayName;
}

export function getRaidGateList(raidKey: RaidKey): string[] {
  return [...RAID_REQUIREMENTS[raidKey].gates];
}

export function getRaidModeOptions(raidKey: RaidKey): Array<{ value: string; label: string }> {
  const modes = RAID_REQUIREMENTS[raidKey].modes;
  return (Object.keys(modes) as RaidModeKey[]).map((modeKey) => ({
    value: modeKey,
    label: modes[modeKey]?.label ?? modeKey
  }));
}

export function normalizeRaidModeKey(input: unknown, raidKey: RaidKey): string {
  const normalized = String(input ?? "").trim().toLowerCase();
  const modeOptions = getRaidModeOptions(raidKey);
  if (modeOptions.some((option) => option.value === normalized)) {
    return normalized;
  }
  return modeOptions[0]?.value ?? "normal";
}

export function inferRaidKeyFromName(name: string): RaidKey | null {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const map: Array<{ key: RaidKey; tokens: string[] }> = [
    { key: "serca", tokens: ["mordum", "serca"] },
    { key: "armoche", tokens: ["armoche"] },
    { key: "kazeros", tokens: ["kazeros"] }
  ];
  for (const item of map) {
    if (item.tokens.some((token) => normalized.includes(token))) {
      return item.key;
    }
  }
  return null;
}
