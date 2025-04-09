import type { SpanshSystem } from "./SpanshAPI";

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

  // Initial guess: the centroid of the points
  let current = calculateCentroid(points);
  const tolerance = 1e-6;
  let converged = false;

  while (!converged) {
    const numerator = { x: 0, y: 0, z: 0 };
    let denominator = 0;

    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(point.x - current.x, 2) +
          Math.pow(point.y - current.y, 2) +
          Math.pow(point.z - current.z, 2),
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
  }
  return { x: current.x, y: current.y, z: current.z };
}
