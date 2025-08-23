import { resolve } from "$app/paths";
import type { SpanshDumpPPData } from "$lib/SpanshAPI";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, depends }) => {
  depends("app:pp-alerts");
  const loadSystems = async () => {
    const res = await fetch(resolve(`/api/power/alerts`));
    const systems: SpanshDumpPPData[] | null = await res.json();
    return systems ?? [];
  };
  return {
    systems: loadSystems(),
  };
};
