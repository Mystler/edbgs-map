import { getCache, setTimedCache } from "$lib/RedisCache.js";
import { fetchFactionNCSystems, pruneSystemObject, type SpanshSystem } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=3600",
  });
  const cachedResult = await getCache(`edbgs-map:faction-nc:${params.faction}`);
  if (cachedResult) {
    const systems: SpanshSystem[] = JSON.parse(cachedResult);
    return json(systems.map((x) => pruneSystemObject(x)));
  } else {
    const systems = await fetchFactionNCSystems(params.faction);
    setTimedCache(`edbgs-map:faction-nc:${params.faction}`, JSON.stringify(systems));
    return json(systems.map((x) => pruneSystemObject(x)));
  }
}
