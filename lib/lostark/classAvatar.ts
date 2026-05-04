export type ClassColor = {
  bg: string;
  text: string;
  border: string;
};

const classColorMap: Record<string, ClassColor> = {
  berserker: { bg: "bg-red-600", text: "text-white", border: "border-red-500" },
  slayer: { bg: "bg-red-600", text: "text-white", border: "border-red-500" },
  guardian_knight: { bg: "bg-blue-600", text: "text-white", border: "border-blue-500" },
  gunlancer: { bg: "bg-blue-600", text: "text-white", border: "border-blue-500" },
  paladin: { bg: "bg-yellow-600", text: "text-white", border: "border-yellow-500" },
  valkyrie: { bg: "bg-pink-600", text: "text-white", border: "border-pink-500" },
  destroyer: { bg: "bg-amber-600", text: "text-white", border: "border-amber-500" },
  wardancer: { bg: "bg-purple-600", text: "text-white", border: "border-purple-500" },
  scrapper: { bg: "bg-green-600", text: "text-white", border: "border-green-500" },
  soulfist: { bg: "bg-cyan-600", text: "text-white", border: "border-cyan-500" },
  glaivier: { bg: "bg-teal-600", text: "text-white", border: "border-teal-500" },
  breaker: { bg: "bg-orange-600", text: "text-white", border: "border-orange-500" },
  striker: { bg: "bg-purple-600", text: "text-white", border: "border-purple-500" },
  deadeye: { bg: "bg-gray-600", text: "text-white", border: "border-gray-500" },
  gunslinger: { bg: "bg-indigo-600", text: "text-white", border: "border-indigo-500" },
  artillerist: { bg: "bg-orange-600", text: "text-white", border: "border-orange-500" },
  sharpshooter: { bg: "bg-green-600", text: "text-white", border: "border-green-500" },
  machinist: { bg: "bg-blue-600", text: "text-white", border: "border-blue-500" },
  bard: { bg: "bg-pink-600", text: "text-white", border: "border-pink-500" },
  arcanist: { bg: "bg-purple-600", text: "text-white", border: "border-purple-500" },
  summoner: { bg: "bg-green-600", text: "text-white", border: "border-green-500" },
  sorceress: { bg: "bg-blue-600", text: "text-white", border: "border-blue-500" },
  deathblade: { bg: "bg-red-600", text: "text-white", border: "border-red-500" },
  shadow_hunter: { bg: "bg-gray-800", text: "text-white", border: "border-gray-700" },
  reaper: { bg: "bg-purple-700", text: "text-white", border: "border-purple-600" },
  souleater: { bg: "bg-red-700", text: "text-white", border: "border-red-600" },
  artist: { bg: "bg-pink-600", text: "text-white", border: "border-pink-500" },
  aeromancer: { bg: "bg-cyan-600", text: "text-white", border: "border-cyan-500" },
  wildsoul: { bg: "bg-green-700", text: "text-white", border: "border-green-600" }
};

export function getClassColor(className: string): ClassColor {
  const normalized = className.toLowerCase().replace(/\s+/g, "_");
  return classColorMap[normalized] ?? { bg: "bg-zinc-600", text: "text-white", border: "border-zinc-500" };
}

export function getClassInitials(className: string): string {
  const parts = className.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}
