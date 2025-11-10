import { resolve } from "$app/paths";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch }) => {
  const loadCycles = async () => {
    const res = await fetch(resolve(`/api/power/stats/list`));
    const cycles: {
      id: number;
      cycle: number;
    }[] = await res.json();
    return cycles;
  };
  return {
    history: loadCycles(),
  };
};
