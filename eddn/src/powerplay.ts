import { logSnipe } from "./sqlite.js";

let lastPPTick = new Date();
updateLastPPTickDate();

export function updateLastPPTickDate() {
  const lastTick = new Date();
  const day = lastTick.getUTCDay();
  if (day === 4 && lastTick.getUTCHours() < 7) {
    lastTick.setDate(lastTick.getDate() - 7);
  } else if (day > 4) {
    lastTick.setDate(lastTick.getDate() - (day - 4));
  } else if (day < 4) {
    lastTick.setDate(lastTick.getDate() - (day + 3));
  }
  lastTick.setUTCHours(7, 0, 0, 0);
  lastPPTick = lastTick;
}

export function getLastPPTickDate() {
  return lastPPTick;
}

export function checkForSnipe(prevData: SpanshDumpPPData | null, currData: SpanshDumpPPData): boolean {
  if (currData.powerConflictProgress) {
    // Aquisition now
    // (For now, ignore that a system having been controlled before may have been a snipe since it could have dropped via nearby fort-drop.)
    let hadSnipe = false;
    const ageOfData = prevData?.date
      ? (new Date(currData.date).valueOf() - new Date(prevData.date).valueOf()) / 36000000
      : 1;
    const acqThreshold = 0.2 + 0.4 * Math.min(1, ageOfData); // 20% to 60% drops in 10h
    for (const p of currData.powerConflictProgress) {
      const prevValue = prevData?.powerConflictProgress?.find((x) => x.power === p.power)?.progress;
      const diff = p.progress - (prevValue ?? 0);
      // Check for snipes if we know previous data, full acquisition if we don't
      if ((prevValue && p.progress >= 0.5 && diff >= acqThreshold) || (!prevValue && p.progress >= 1)) {
        logSnipe(currData.name, "Acquisition", p.power, Math.floor(diff * 120000), prevData, currData);
        hadSnipe = true;
      }
    }
    return hadSnipe;
  } else if (currData.controllingPower) {
    // Last data was still in acquisition and got sniped?
    const lastCycleAcqProgress = prevData?.powerConflictProgress?.find(
      (x) => x.power === currData.controllingPower,
    )?.progress;
    if (lastCycleAcqProgress && lastCycleAcqProgress < 0.8) {
      logSnipe(
        currData.name,
        "EOC Acquisition",
        currData.controllingPower,
        Math.floor((1 - lastCycleAcqProgress) * 120000),
        prevData,
        currData,
      );
      return true;
    }
    // UM Snipe, just check for 25k drops, better catch a bit too much than too little
    const umDiff = (currData?.powerStateUndermining ?? 0) - (prevData?.powerStateUndermining ?? 0);
    if (umDiff > 25000) {
      logSnipe(currData.name, "Undermining", currData.controllingPower, umDiff, prevData, currData);
      return true;
    }
    // Reinforcement Snipe, much less likely to have interesting stuff. Use an expanding scale up to 10h diff
    const ageOfData = prevData?.date
      ? (new Date(currData.date).valueOf() - new Date(prevData.date).valueOf()) / 36000000
      : 1;
    const reinfThreshold = 25000 + 75000 * Math.min(1, ageOfData); // 25k to 100k in 10h
    const reinfDiff = (currData?.powerStateReinforcement ?? 0) - (prevData?.powerStateReinforcement ?? 0);
    if (
      reinfDiff > reinfThreshold &&
      (!prevData?.powerStateReinforcement ||
        prevData.powerState !== "Stronghold" ||
        (prevData.powerStateControlProgress ?? 0) < 1) // Ignore reinf sniping maxed Strongholds
    ) {
      logSnipe(currData.name, "Reinforcement", currData.controllingPower, reinfDiff, prevData, currData);
      return true;
    }
    // EOC progress control snipes that weren't caught.
    if (prevData && new Date(prevData.date) < getLastPPTickDate()) {
      const prevProg = prevData?.powerStateControlProgress ?? 0;
      const currProg = currData.powerStateControlProgress ?? 0;
      // Undermining drops that changed tier over EOC
      if (prevData.powerState === "Stronghold" && currData.powerState === "Fortified" && prevProg > 0) {
        const cp = Math.floor(prevProg * 1000000 + (1 - currProg) * 650000);
        logSnipe(currData.name, "EOC Undermining", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      if (prevData.powerState === "Fortified" && currData.powerState === "Exploited" && prevProg > 0) {
        const cp = Math.floor(prevProg * 650000 + (1 - currProg) * 350000);
        logSnipe(currData.name, "EOC Undermining", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      // Reinforcement drops that changed tier over EOC
      if (prevData.powerState === "Exploited" && currData.powerState === "Fortified" && prevProg < 1) {
        const cp = Math.floor(currProg * 650000 + (1 - prevProg) * 350000);
        logSnipe(currData.name, "EOC Reinforcement", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      if (prevData.powerState === "Fortified" && currData.powerState === "Stronghold" && prevProg < 1) {
        const cp = Math.floor(currProg * 1000000 + (1 - prevProg) * 650000);
        logSnipe(currData.name, "EOC Reinforcement", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      // Uncaught major percentage changes in same tier between cycles.
      if (prevData.powerState === currData.powerState) {
        if (currData.powerState === "Stronghold" && currProg >= 1) return false;
        const cp = Math.floor(
          (currProg - prevProg) *
            (currData.powerState === "Stronghold" ? 1000000 : currData.powerState === "Fortified" ? 650000 : 350000),
        );
        if (cp > 25000) {
          logSnipe(currData.name, "EOC Reinforcement", currData.controllingPower, cp, prevData, currData);
          return true;
        } else if (cp < -25000) {
          logSnipe(currData.name, "EOC Undermining", currData.controllingPower, -cp, prevData, currData);
          return true;
        }
      }
    }
  }
  return false;
}
