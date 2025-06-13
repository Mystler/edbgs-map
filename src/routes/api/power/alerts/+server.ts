import { getLastPPTickDate } from "$lib/Helpers";
import type { SpanshDumpPPData } from "$lib/SpanshAPI";
import { getAllCacheMatching } from "$lib/ValkeyCache";
import { json } from "@sveltejs/kit";

export async function GET() {
  const cachedResult = await getAllCacheMatching<SpanshDumpPPData>("edbgs-map:pp-alert:*");
  const cutoff = Math.min(new Date().valueOf() - 172_800_000, getLastPPTickDate().valueOf());
  return json(cachedResult?.filter((x) => new Date(x.date).valueOf() > cutoff) ?? null);
}
