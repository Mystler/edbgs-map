import { getCache, setTimedCache } from "$lib/server/ValkeyCache.js";
import { fetchFactionSystems, type SpanshSystem } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=3600",
  });
  const cachedResult = await getCache(`edbgs-map:faction:${params.faction}`);
  let systems: SpanshSystem[];
  if (cachedResult) {
    systems = JSON.parse(cachedResult);
  } else {
    systems = await fetchFactionSystems(params.faction);
    setTimedCache(`edbgs-map:faction:${params.faction}`, JSON.stringify(systems));
  }
  return json(systems.filter((x) => x.controlling_minor_faction === params.faction));
}
