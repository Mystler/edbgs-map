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
  let currentBar = totalCPToBarPercent(totalCP);
  let startBar = totalCPToBarPercent(cycleStartCP);
  const adjustedProgress =
    segmentProgress > 1
      ? (currentBar % 0.25) / 0.25
      : segmentProgress < 0
        ? -(1 - (currentBar % 0.25) / 0.25)
        : segmentProgress;

  currentBar = Math.max(0, Math.min(1, currentBar));
  startBar = Math.max(0, Math.min(1, startBar));
  const startProgress = startBar === 1 ? 1 : (startBar % 0.25) / 0.25;
  return { startBar, currentBar, adjustedProgress, startProgress, totalCP };
}

function totalCPToBarPercent(cp: number) {
  let bar = 0;
  if (cp >= 1350000) {
    // Stronghold
    bar = 0.75 + ((cp - 1350000) / 1000000) * 0.25;
  } else if (cp >= 700000) {
    // Fortified
    bar = 0.5 + ((cp - 700000) / 650000) * 0.25;
  } else if (cp >= 350000) {
    // Exploited
    bar = 0.25 + ((cp - 350000) / 350000) * 0.25;
  } else {
    bar = (cp / 350000) * 0.25;
  }
  return bar;
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
