import { getCache, setTimedCache } from "$lib/RedisCache";
import { fetchSystem, type SpanshSystem } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=3600",
  });
  const cachedResult = await getCache(`edbgs-map:system:${params.system}`);
  if (cachedResult) {
    const system: SpanshSystem = JSON.parse(cachedResult);
    return json(system);
  } else {
    const system = await fetchSystem(params.system);
    setTimedCache(`edbgs-map:system:${params.system}`, JSON.stringify(system));
    return json(system);
  }
}
