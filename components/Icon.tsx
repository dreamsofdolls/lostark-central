import type { ComponentProps, FC } from "react";
import { normalizeClassName } from "@/lib/lostark/classes";
import Aeromancer from "@/app/assets/classes/aeromancer.svg";
import Arcanist from "@/app/assets/classes/arcanist.svg";
import Artillerist from "@/app/assets/classes/artillerist.svg";
import Artist from "@/app/assets/classes/artist.svg";
import Bard from "@/app/assets/classes/bard.svg";
import Berserker from "@/app/assets/classes/berserker.svg";
import Breaker from "@/app/assets/classes/breaker.svg";
import Deadeye from "@/app/assets/classes/deadeye.svg";
import Deathblade from "@/app/assets/classes/deathblade.svg";
import Destroyer from "@/app/assets/classes/destroyer.svg";
import Glaivier from "@/app/assets/classes/glaivier.svg";
import GuardianKnight from "@/app/assets/classes/guardianknight.svg";
import Gunlancer from "@/app/assets/classes/gunlancer.svg";
import Gunslinger from "@/app/assets/classes/gunslinger.svg";
import Machinist from "@/app/assets/classes/machinist.svg";
import Paladin from "@/app/assets/classes/paladin.svg";
import Reaper from "@/app/assets/classes/reaper.svg";
import Scrapper from "@/app/assets/classes/scrapper.svg";
import ShadowHunter from "@/app/assets/classes/shadowhunter.svg";
import Sharpshooter from "@/app/assets/classes/sharpshooter.svg";
import Slayer from "@/app/assets/classes/slayer.svg";
import Sorceress from "@/app/assets/classes/sorceress.svg";
import SoulEater from "@/app/assets/classes/souleater.svg";
import Soulfist from "@/app/assets/classes/soulfist.svg";
import Striker from "@/app/assets/classes/striker.svg";
import Summoner from "@/app/assets/classes/summoner.svg";
import Valkyrie from "@/app/assets/classes/valkyrie.svg";
import Wardancer from "@/app/assets/classes/wardancer.svg";
import Wildsoul from "@/app/assets/classes/wildsoul.svg";

export const Icons = {
  Aeromancer,
  Arcanist,
  Artillerist,
  Artist,
  Bard,
  Berserker,
  Breaker,
  Deadeye,
  Deathblade,
  Destroyer,
  Glaivier,
  GuardianKnight,
  Gunlancer,
  Gunslinger,
  Machinist,
  Paladin,
  Reaper,
  Scrapper,
  ShadowHunter,
  Sharpshooter,
  Slayer,
  Sorceress,
  SoulEater,
  Soulfist,
  Striker,
  Summoner,
  Valkyrie,
  Wardancer,
  Wildsoul
} as const;

type IconName = keyof typeof Icons;

const classNameToIconName: Record<string, IconName> = {
  aeromancer: "Aeromancer",
  arcanist: "Arcanist",
  artillerist: "Artillerist",
  artist: "Artist",
  bard: "Bard",
  berserker: "Berserker",
  breaker: "Breaker",
  deadeye: "Deadeye",
  deathblade: "Deathblade",
  destroyer: "Destroyer",
  glaivier: "Glaivier",
  guardianknight: "GuardianKnight",
  gunlancer: "Gunlancer",
  gunslinger: "Gunslinger",
  machinist: "Machinist",
  paladin: "Paladin",
  reaper: "Reaper",
  scrapper: "Scrapper",
  shadowhunter: "ShadowHunter",
  sharpshooter: "Sharpshooter",
  slayer: "Slayer",
  sorceress: "Sorceress",
  souleater: "SoulEater",
  soulfist: "Soulfist",
  striker: "Striker",
  summoner: "Summoner",
  valkyrie: "Valkyrie",
  wardancer: "Wardancer",
  wildsoul: "Wildsoul"
};

type ClassIconProps = {
  className: string;
  size?: "sm" | "md" | "lg";
  title?: string;
};

const sizeClassNames = {
  sm: "h-5 w-5",
  md: "h-7 w-7",
  lg: "h-10 w-10"
} as const;

export function resolveClassIcon(className: string): FC<ComponentProps<"svg">> | null {
  const normalized = normalizeClassName(className);
  const key = normalized.toLowerCase().replace(/[^a-z0-9]/g, "");
  const iconName = classNameToIconName[key];
  return iconName ? Icons[iconName] : null;
}

export function ClassIcon({ className, size = "md", title }: ClassIconProps) {
  const Icon = resolveClassIcon(className);
  if (!Icon) {
    return <span className="text-xs font-semibold text-[oklch(0.95_0_0)]">{className.slice(0, 2).toUpperCase()}</span>;
  }

  return <Icon className={`${sizeClassNames[size]} shrink-0`} aria-label={title ?? className} role="img" />;
}
