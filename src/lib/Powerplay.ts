import type { SpanshDumpPPData } from "./SpanshAPI";

export function getLastPPTickDate() {
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
  return lastTick;
}

/**
 * Calculate more information we need to display PP bars from the available data.
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
  return { startBar, currentBar, currentProgress, adjustedProgress, startProgress, totalCP };
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
