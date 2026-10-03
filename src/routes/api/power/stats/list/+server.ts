import { dbGetAll } from "#lib/server/DB.js";
import { getCurrentCycleStats } from "#lib/server/PowerplayStats.js";

export async function GET() {
  const q = await dbGetAll<{
    id: number;
    timestamp: string;
    snapshot: string;
  }>("SELECT * FROM cycle_stats ORDER BY id DESC");
  return Response.json(
    q.map((x) => {
      return {
        id: x.id,
        cycle: (JSON.parse(x.snapshot) as Awaited<ReturnType<typeof getCurrentCycleStats>>).cycle,
      };
    }),
  );
}
