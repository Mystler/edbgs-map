import { resolve } from "$app/paths";
import type { getCurrentCycleStats } from "$lib/server/PowerplayStats";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, depends }) => {
  depends("app:pp-stats");
  const loadStats = async () => {
    const res = await fetch(resolve(`/api/power/stats`));
    const stats: Awaited<ReturnType<typeof getCurrentCycleStats>> = await res.json();
    return stats;
  };
  return {
    stats: loadStats(),
  };
};
