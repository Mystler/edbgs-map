import { dbGet } from "#lib/server/DB.js";
import { getCurrentCycleStats } from "#lib/server/PowerplayStats.js";
import { error } from "@sveltejs/kit";

export async function GET({ params }) {
  const q = await dbGet<{
    id: number;
    timestamp: string;
    snapshot: string;
  }>("SELECT * FROM cycle_stats WHERE id = ?", parseInt(params.id));
  if (!q) error(404, "No data available!");
  return Response.json({
    id: q.id,
    date: q.timestamp,
    stats: JSON.parse(q.snapshot) as DeepPartial<Awaited<ReturnType<typeof getCurrentCycleStats>>>,
  });
}
