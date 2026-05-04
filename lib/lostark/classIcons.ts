import aeromancer from "@/app/assets/classes/aeromancer.svg";
import arcanist from "@/app/assets/classes/arcanist.svg";
import artillerist from "@/app/assets/classes/artillerist.svg";
import artist from "@/app/assets/classes/artist.svg";
import bard from "@/app/assets/classes/bard.svg";
import berserker from "@/app/assets/classes/berserker.svg";
import breaker from "@/app/assets/classes/breaker.svg";
import deadeye from "@/app/assets/classes/deadeye.svg";
import deathblade from "@/app/assets/classes/deathblade.svg";
import destroyer from "@/app/assets/classes/destroyer.svg";
import glaivier from "@/app/assets/classes/glaivier.svg";
import guardianknight from "@/app/assets/classes/guardianknight.svg";
import gunlancer from "@/app/assets/classes/gunlancer.svg";
import gunslinger from "@/app/assets/classes/gunslinger.svg";
import machinist from "@/app/assets/classes/machinist.svg";
import paladin from "@/app/assets/classes/paladin.svg";
import reaper from "@/app/assets/classes/reaper.svg";
import scrapper from "@/app/assets/classes/scrapper.svg";
import shadowhunter from "@/app/assets/classes/shadowhunter.svg";
import sharpshooter from "@/app/assets/classes/sharpshooter.svg";
import slayer from "@/app/assets/classes/slayer.svg";
import sorceress from "@/app/assets/classes/sorceress.svg";
import souleater from "@/app/assets/classes/souleater.svg";
import soulfist from "@/app/assets/classes/soulfist.svg";
import striker from "@/app/assets/classes/striker.svg";
import summoner from "@/app/assets/classes/summoner.svg";
import valkyrie from "@/app/assets/classes/valkyrie.svg";
import wardancer from "@/app/assets/classes/wardancer.svg";
import wildsoul from "@/app/assets/classes/wildsoul.svg";

type ClassIconAsset = { src: string } | string;

const CLASS_ICON_MAP: Record<string, ClassIconAsset> = {
  aeromancer,
  arcanist,
  artillerist,
  artist,
  bard,
  berserker,
  breaker,
  deadeye,
  deathblade,
  destroyer,
  glaivier,
  guardianknight,
  gunlancer,
  gunslinger,
  machinist,
  paladin,
  reaper,
  scrapper,
  shadowhunter,
  sharpshooter,
  slayer,
  sorceress,
  souleater,
  soulfist,
  striker,
  summoner,
  valkyrie,
  wardancer,
  wildsoul
};

function classToIconKey(className: string): string {
  return className.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toAssetUrl(asset: ClassIconAsset): string {
  return typeof asset === "string" ? asset : asset.src;
}

export function getClassIcon(className: string): string | null {
  const asset = CLASS_ICON_MAP[classToIconKey(className)];
  return asset ? toAssetUrl(asset) : null;
}
