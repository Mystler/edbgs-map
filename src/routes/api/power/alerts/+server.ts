import { calculatePPControlSegments, getDecayValue, getLastPPTickDate } from "$lib/Powerplay";
import type { SpanshDumpPPData } from "$lib/SpanshAPI";
import { getAllCacheMatching } from "$lib/server/ValkeyCache";
import { json } from "@sveltejs/kit";

export async function GET() {
  // This cycle or up to last 48h if before
  const cutoff = Math.min(new Date().valueOf() - 172_800_000, getLastPPTickDate().valueOf());
  const cachedResult = await getAllCacheMatching<SpanshDumpPPData>("edbgs-map:pp-alert:*", (x) => {
    // Ignore systems older than cutoff
    if (new Date(x.date).valueOf() < cutoff) return false;

    if (
      x.powerStateControlProgress !== undefined &&
      x.powerStateReinforcement !== undefined &&
      x.powerStateUndermining !== undefined
    ) {
      // Always alert on tier drop
      if (x.powerStateControlProgress < 0) return true;
      // Calculate expected decay if in same tier (to avoid capping offsets)
      let expectedDecay = 0;
      if (x.powerStateControlProgress > 0 && x.powerStateControlProgress < 100) {
        const { startProgress, startTier } = calculatePPControlSegments(x);
        expectedDecay = getDecayValue(startProgress, startTier);
      }
      // Alert on >= 10k activity with decay removed
      if (x.powerStateReinforcement + (x.powerStateUndermining - expectedDecay) >= 10000) return true;
    }

    // Show acquisitions if >= 30% progress
    if (x.powerConflictProgress !== undefined && x.powerConflictProgress.some((y) => y.progress >= 0.3)) return true;
    return false;
  });
  return json(cachedResult);
}
