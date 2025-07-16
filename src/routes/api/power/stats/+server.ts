import { dbGetAll } from "$lib/server/DB";
import { getCurrentCycleStats } from "$lib/server/PowerplayStats";
import { json } from "@sveltejs/kit";

export async function GET() {
  const q = await dbGetAll<{
    id: number;
    timestamp: string;
    snapshot: string;
  }>("SELECT * FROM cycle_stats ORDER BY id DESC");
  return json({
    currentCycle: await getCurrentCycleStats(),
    history: q.map((x) => {
      return {
        id: x.id,
        date: new Date(x.timestamp),
        stats: JSON.parse(x.snapshot) as DeepPartial<Awaited<ReturnType<typeof getCurrentCycleStats>>>,
      };
    }),
  });
}
