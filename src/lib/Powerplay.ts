import type { SpanshDumpPPData } from "./SpanshAPI";

export function getLastPPTickDate() {
  const lastTick = new Date();
  const day = lastTick.getUTCDay();
  if (day === 4 && (lastTick.getUTCHours() < 7 || (lastTick.getUTCHours() === 7 && lastTick.getUTCMinutes() < 5))) {
    lastTick.setDate(lastTick.getDate() - 7);
  } else if (day > 4) {
    lastTick.setDate(lastTick.getDate() - (day - 4));
  } else if (day < 4) {
    lastTick.setDate(lastTick.getDate() - (day + 3));
  }
  lastTick.setUTCHours(7, 5, 0, 0);
  return lastTick;
}

/**
 * This calculates an arbitrary PP tick window. This is not a technical date but we use it to define how long we consider the PP tick
 * to take and display dates in that time span in yellow for potentially not being accurate yet.
 */
export function getPPTickWindowDate(tickDate: Date = getLastPPTickDate()) {
  return new Date(tickDate.valueOf() + 14_400_000); // 4h after canonical tick time
}

/**
 * Calculate more information we need to display PP bars from the available data.
 * Returns:
 * - startBar: start of cycle progress marker, 0-1 float with every 0.25 being a segment/tier break
 * - currentBar: current cycle progress marker, 0-1 float with every 0.25 being a segment/tier break
 * - currentProgress: current progress from 0-1 within the tier that the marker is in (regardless of cycle's system tier in journal)
 * - currentTier: current tier that the current progress marker is in
 * - adjustedProgress: like currentProgress but 1-x if the journal progress is negative, i.e. expected tier drop
 * - startProgress: reverse-calculates progress at start of cycle within whatever tier the marker is.
 *      WARNING: Will offset when running into tier progress caps though.
 * - starTier: reverse-calculated tier at start of cycle (to allow accounting for caching bugs in reported journal data)
 *      WARNING: Will offset when running into tier progress caps though.
 * - totalCP: CP relative to the whole bar as shown by the main menu galaxy map bug
 */
export function calculatePPControlSegments(data: SpanshDumpPPData) {
  const segmentProgress = data.powerStateControlProgress ?? 0;
  const tierStart = data.powerState === "Stronghold" ? 1350000 : data.powerState === "Fortified" ? 700000 : 350000;
  const tierRange = data.powerState === "Stronghold" ? 1000000 : data.powerState === "Fortified" ? 650000 : 350000;
  const totalCP = Math.round(tierStart + segmentProgress * tierRange);
  const cycleStartCP = totalCP - (data.powerStateReinforcement ?? 0) + (data.powerStateUndermining ?? 0);
  const currentBar = totalCPToBarPercent(totalCP);
  const startBar = totalCPToBarPercent(cycleStartCP);
  const currentProgress = currentBar === 1 ? 1 : (currentBar % 0.25) / 0.25;
  // Show negative progress for tier drops
  const adjustedProgress = segmentProgress < 0 ? -(1 - currentProgress) : currentProgress;
  const startProgress = startBar === 1 ? 1 : (startBar % 0.25) / 0.25;
  const currentTier = totalCPToTierName(totalCP);
  const startTier = totalCPToTierName(cycleStartCP);
  return { startBar, currentBar, currentProgress, currentTier, adjustedProgress, startProgress, startTier, totalCP };
}

export function getCorrectedSegmentProgress(totalCP: number, startTier: string) {
  const tierStart = startTier === "Stronghold" ? 1350000 : startTier === "Fortified" ? 700000 : 350000;
  const tierRange = startTier === "Stronghold" ? 1000000 : startTier === "Fortified" ? 650000 : 350000;
  return (totalCP - tierStart) / tierRange;
}

function totalCPToBarPercent(cp: number) {
  if (cp >= 1350000) {
    // Stronghold
    return Math.min(1, 0.75 + ((cp - 1350000) / 1000000) * 0.25);
  } else if (cp >= 700000) {
    // Fortified
    return 0.5 + ((cp - 700000) / 650000) * 0.25;
  } else if (cp >= 350000) {
    // Exploited
    return 0.25 + ((cp - 350000) / 350000) * 0.25;
  }
  return Math.max(0, (cp / 350000) * 0.25);
}

export function totalCPToTierName(cp: number) {
  if (cp >= 1350000) {
    // Stronghold
    return "Stronghold";
  } else if (cp >= 700000) {
    return "Fortified";
  } else if (cp >= 350000) {
    return "Exploited";
  }
  return "Unoccupied";
}

export function powerStateColor(state?: string) {
  switch (state) {
    case "Stronghold":
      return "#985cb6";
    case "Fortified":
      return "#519d52";
    case "Exploited":
      return "#b24241";
    case "Unoccupied":
      return "#646464";
    default:
      return "#ffffff";
  }
}

/**
 * Calculate the expected Decay as UM into a control system based on its tier and segment progress percentage.
 */
export function getDecayValue(progress: number, state: string | undefined): number {
  if (progress <= 0.25 || progress > 1 || !state || state === "Unoccupied") return 0;
  const tierRange = state === "Stronghold" ? 1000000 : state === "Fortified" ? 650000 : 350000;
  const decayMod = state === "Stronghold" ? 50 / 240 : state === "Fortified" ? 41 / 240 : 20 / 240;
  return Math.floor(((progress - 0.25) / 0.75) * (tierRange * 0.75) * decayMod);
}
