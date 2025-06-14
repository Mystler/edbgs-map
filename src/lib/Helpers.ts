import type { SpanshDumpPPData, SpanshSystem } from "./SpanshAPI";

export function randomColor(): string {
  let hex = Math.floor(Math.random() * 0xffffff).toString(16);
  while (hex.length < 6) {
    hex = "0" + hex;
  }
  return "#" + hex;
}

export function calculateCentroid(points: SpanshSystem[]) {
  if (points.length === 0) throw new Error("Cannot calculate centroid of an empty list.");

  const sum = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
      z: acc.z + point.z,
    }),
    { x: 0, y: 0, z: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length, z: sum.z / points.length };
}

export function calculateGeometricMedian(points: SpanshSystem[]) {
  if (points.length === 0) throw new Error("Cannot calculate geometric median of an empty list.");
  if (points.length === 1) return { x: points[0].x, y: points[0].y, z: points[0].z };

  // Initial guess: the centroid of the points
  let current = calculateCentroid(points);
  const tolerance = 1e-6;
  let converged = false;

  const maxItFailsafe = 1000;
  let iterations = 0;
  while (!converged && iterations < maxItFailsafe) {
    const numerator = { x: 0, y: 0, z: 0 };
    let denominator = 0;

    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - current.x, 2) + Math.pow(point.y - current.y, 2) + Math.pow(point.z - current.z, 2),
      );
      if (distance > 0) {
        const weight = 1 / distance;
        numerator.x += point.x * weight;
        numerator.y += point.y * weight;
        numerator.z += point.z * weight;
        denominator += weight;
      }
    }

    const next = {
      x: numerator.x / denominator,
      y: numerator.y / denominator,
      z: numerator.z / denominator,
    };
    converged =
      Math.abs(next.x - current.x) < tolerance &&
      Math.abs(next.y - current.y) < tolerance &&
      Math.abs(next.z - current.z) < tolerance;
    current = next;
    iterations++;
  }
  return { x: current.x, y: current.y, z: current.z };
}

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
  return { startBar, currentBar, adjustedProgress, startProgress };
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
