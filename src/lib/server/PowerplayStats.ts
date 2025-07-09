import { Powers } from "$lib/Constants";
import { calculatePPControlSegments } from "$lib/Powerplay";
import type { SpanshDumpPPData } from "$lib/SpanshAPI";
import { getAllCacheMatching } from "./ValkeyCache";

const pp2Start = new Date("2024-10-31T07:00:00Z");
function getCycleNumber(date: Date) {
  return Math.floor((date.valueOf() - pp2Start.valueOf()) / 604_800_000) + 1;
}

function initStats() {
  return {
    reinfCP: 0,
    umCP: 0,
    acquisitionCP: 0,
    progressCP: 0,

    systems: 0,
    fortified: 0,
    stronghold: 0,
  };
}

export async function getCurrentCycleStats() {
  const cachedResult = await getAllCacheMatching<SpanshDumpPPData>("edbgs-map:pp-alert:*");
  const cycle = getCycleNumber(new Date());

  const allPowerStats = initStats();
  const powerStats: Record<keyof typeof Powers, ReturnType<typeof initStats>> = {};
  for (const power of Object.keys(Powers)) {
    powerStats[power] = initStats();
  }

  for (const system of cachedResult ?? []) {
    allPowerStats.reinfCP += system.powerStateReinforcement ?? 0;
    allPowerStats.umCP += system.powerStateUndermining ?? 0;

    if (system.controllingPower) {
      powerStats[system.controllingPower].systems += 1;
      if (system.powerState === "Stronghold") {
        powerStats[system.controllingPower].stronghold += 1;
      } else if (system.powerState === "Fortified") {
        powerStats[system.controllingPower].fortified += 1;
      }
      powerStats[system.controllingPower].reinfCP += system.powerStateReinforcement ?? 0;
      powerStats[system.controllingPower].umCP += system.powerStateUndermining ?? 0;
      const totalCP = calculatePPControlSegments(system).totalCP;
      powerStats[system.controllingPower].progressCP += totalCP;
      allPowerStats.progressCP += totalCP;
    }
    if (system.powerConflictProgress) {
      for (const x of system.powerConflictProgress) {
        const acqCP = Math.floor(x.progress * 120000);
        powerStats[x.power].acquisitionCP += acqCP;
        allPowerStats.acquisitionCP += acqCP;
      }
    }
  }

  return { cycle, allPowerStats, powerStats };
}
