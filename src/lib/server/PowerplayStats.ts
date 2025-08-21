import { Powers } from "$lib/Constants";
import { calculatePPControlSegments, getDecayValue, getLastPPTickDate } from "$lib/Powerplay";
import type { SpanshDumpPPData } from "$lib/SpanshAPI";
import { getAllCacheMatching } from "./ValkeyCache";

const pp2Start = new Date("2024-10-31T07:05:00Z");
function getCycleNumber(date: Date) {
  return Math.floor((date.valueOf() - pp2Start.valueOf()) / 604_800_000) + 1;
}

function initStats() {
  return {
    reinfCP: 0,
    umCP: 0,
    umCPNoDecay: 0,
    acquisitionCP: 0,
    progressCP: 0,

    systems: 0,
    fortified: 0,
    stronghold: 0,
    updatedThisCycle: 0,

    population: 0,
    expectedAcquisitions: 0,
  };
}

export async function getCurrentCycleStats() {
  const cachedResult = await getAllCacheMatching<SpanshDumpPPData>("edbgs-map:pp-alert:*");
  const cycle = getCycleNumber(new Date());
  const lastTick = getLastPPTickDate();

  const allPowerStats = initStats();
  const powerStats: Record<keyof typeof Powers, ReturnType<typeof initStats>> = {};
  for (const power of Object.keys(Powers)) {
    powerStats[power] = initStats();
  }

  for (const system of cachedResult ?? []) {
    if (system.controllingPower) {
      // System counts
      allPowerStats.systems += 1;
      powerStats[system.controllingPower].systems += 1;
      if (system.powerState === "Stronghold") {
        allPowerStats.stronghold += 1;
        powerStats[system.controllingPower].stronghold += 1;
      } else if (system.powerState === "Fortified") {
        allPowerStats.fortified += 1;
        powerStats[system.controllingPower].fortified += 1;
      }

      allPowerStats.population += system.population ?? 0;
      powerStats[system.controllingPower].population += system.population ?? 0;

      // CP in progress bars
      const segmentProgress = system.powerStateControlProgress ?? 0;
      // We want total control CP with exploited being 0, so using different tierStart values than our bar calculations.
      // Clamp between 0 exploited and max Stronghold
      const tierStart = system.powerState === "Stronghold" ? 1000000 : system.powerState === "Fortified" ? 350000 : 0;
      const tierRange =
        system.powerState === "Stronghold" ? 1000000 : system.powerState === "Fortified" ? 650000 : 350000;
      const totalCP = Math.max(0, Math.min(2000000, Math.round(tierStart + segmentProgress * tierRange)));
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

    // Ignore everything after this when the cache is not from the current cycle
    if (new Date(system.date) < lastTick) continue;

    allPowerStats.reinfCP += system.powerStateReinforcement ?? 0;
    allPowerStats.umCP += system.powerStateUndermining ?? 0;

    if (system.controllingPower) {
      allPowerStats.updatedThisCycle += 1;
      powerStats[system.controllingPower].updatedThisCycle += 1;
      powerStats[system.controllingPower].reinfCP += system.powerStateReinforcement ?? 0;
      powerStats[system.controllingPower].umCP += system.powerStateUndermining ?? 0;

      const { startProgress, startTier } = system.cycleStart || calculatePPControlSegments(system);
      const decayUM = getDecayValue(startProgress, startTier);
      const playerUM = Math.max(0, (system.powerStateUndermining ?? 0) - decayUM);
      allPowerStats.umCPNoDecay += playerUM;
      powerStats[system.controllingPower].umCPNoDecay += playerUM;
    } else if (system.powerConflictProgress) {
      const leader = system.powerConflictProgress.toSorted((a, b) => b.progress - a.progress).at(0);
      if (leader && leader.progress >= 1) {
        allPowerStats.expectedAcquisitions += 1;
        powerStats[leader.power].expectedAcquisitions += 1;
      }
    }
  }

  return { cycle, allPowerStats, powerStats };
}
