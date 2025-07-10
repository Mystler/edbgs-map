import { getLastPPTickDate } from "$lib/Powerplay";
import type { SpanshDumpPPData } from "$lib/SpanshAPI";
import { getAllCacheMatching } from "$lib/server/ValkeyCache";
import { json } from "@sveltejs/kit";

export async function GET() {
  // This cycle or up to last 48h if before
  const cutoff = Math.min(new Date().valueOf() - 172_800_000, getLastPPTickDate().valueOf());
  const cachedResult = await getAllCacheMatching<SpanshDumpPPData>(
    "edbgs-map:pp-alert:*",
    (x) =>
      new Date(x.date).valueOf() > cutoff &&
      ((x.powerStateReinforcement !== undefined &&
        x.powerStateUndermining !== undefined &&
        x.powerStateReinforcement + x.powerStateUndermining >= 10000) || // >=10k total CP done
        (x.powerConflictProgress !== undefined && x.powerConflictProgress.some((y) => y.progress >= 0.3))), // >=30% progress
  );
  return json(cachedResult);
}
