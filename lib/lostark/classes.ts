export const CLASS_NAMES: Record<string, string> = {
  berserker: "Berserker",
  berserker_female: "Slayer",
  dragon_knight: "Guardian Knight",
  warlord: "Gunlancer",
  holyknight: "Paladin",
  holyknight_female: "Valkyrie",
  destroyer: "Destroyer",
  battle_master: "Wardancer",
  infighter: "Scrapper",
  soulmaster: "Soulfist",
  force_master: "Soulfist",
  lance_master: "Glaivier",
  infighter_male: "Breaker",
  battle_master_male: "Striker",
  devil_hunter: "Deadeye",
  devil_hunter_female: "Gunslinger",
  blaster: "Artillerist",
  hawkeye: "Sharpshooter",
  hawk_eye: "Sharpshooter",
  scouter: "Machinist",
  bard: "Bard",
  arcana: "Arcanist",
  summoner: "Summoner",
  elemental_master: "Sorceress",
  blade: "Deathblade",
  demonic: "Shadow Hunter",
  reaper: "Reaper",
  soul_eater: "Souleater",
  yinyangshi: "Artist",
  weather_artist: "Aeromancer",
  alchemist: "Wildsoul"
};

export const CLASS_OPTIONS = Array.from(new Set(Object.values(CLASS_NAMES)));
export const DEFAULT_CLASS_NAME = CLASS_OPTIONS[0] ?? "Berserker";

export function normalizeClassName(input: string | undefined | null): string {
  const value = String(input ?? "").trim();
  if (!value) {
    return DEFAULT_CLASS_NAME;
  }
  if (CLASS_OPTIONS.includes(value)) {
    return value;
  }
  return CLASS_NAMES[value] ?? DEFAULT_CLASS_NAME;
}
