import { getCache, setTimedCache } from "#lib/server/ValkeyCache.js";
import { fetchSystem, type SpanshSystem } from "#lib/SpanshAPI.js";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=3600",
  });
  const cachedResult = await getCache(`edbgs-map:system:${params.system}`);
  if (cachedResult) {
    const system: SpanshSystem = JSON.parse(cachedResult);
    return Response.json(system);
  } else {
    const system = await fetchSystem(params.system);
    setTimedCache(`edbgs-map:system:${params.system}`, JSON.stringify(system));
    return Response.json(system);
  }
}
