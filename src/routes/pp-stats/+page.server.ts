import { dbGetAll } from "$lib/server/DB.js";
import { getCurrentCycleStats } from "$lib/server/PowerplayStats.js";
import { error } from "@sveltejs/kit";

export async function load() {
  const q = await dbGetAll<{
    id: number;
    timestamp: string;
    snapshot: string;
  }>("SELECT * FROM cycle_stats ORDER BY id DESC");

  if (!q) error(404, "Could not find cycle history data!");

  return {
    currentCycle: getCurrentCycleStats(),
    history: q.map((x) => {
      return {
        id: x.id,
        date: new Date(x.timestamp),
        stats: JSON.parse(x.snapshot) as Awaited<ReturnType<typeof getCurrentCycleStats>>,
      };
    }),
  };
}
