import { base } from "$app/paths";
import type { SpanshDumpPPData } from "$lib/SpanshAPI";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, depends }) => {
  depends("app:pp-alerts");
  const res = await fetch(`${base}/api/power/alerts`);
  const systems: SpanshDumpPPData[] | null = await res.json();
  return {
    systems,
  };
};
