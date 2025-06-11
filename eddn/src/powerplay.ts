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
    for (const p of currData.powerConflictProgress) {
      const prevValue = prevData?.powerConflictProgress?.find((x) => x.power === p.power)?.progress ?? 0;
      const diff = p.progress - prevValue;
      if (p.progress >= 0.5 && diff >= 0.2) {
        logSnipe(currData.name, "Acquisition", p.power, diff * 120000, prevData, currData);
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
        (1 - lastCycleAcqProgress) * 120000,
        prevData,
        currData,
      );
      return true;
    }
    // UM Snipe
    const umDiff = (currData?.powerStateUndermining ?? 0) - (prevData?.powerStateUndermining ?? 0);
    if (umDiff > 25000) {
      logSnipe(currData.name, "Undermining", currData.controllingPower, umDiff, prevData, currData);
      return true;
    }
    // Reinforcement Snipe
    const reinfDiff = (currData?.powerStateReinforcement ?? 0) - (prevData?.powerStateReinforcement ?? 0);
    if (reinfDiff > 25000) {
      logSnipe(currData.name, "Reinforcement", currData.controllingPower, reinfDiff, prevData, currData);
      return true;
    }
    // TODO: EOC progress control snipes that weren't caught.
    /*if (prevData) {
      const lastDate = new Date(prevData.date);
      if (lastDate < getLastPPTickDate()) {
        // EOC Control snipe?
        const progDiff = (currData.powerStateControlProgress ?? 0) - (prevData.powerStateControlProgress ?? 0);
      }
    }*/
  }
  return false;
}
