import { getCache, setTimedCache } from "$lib/ValkeyCache";
import { fetchPowerSystems, type SpanshSystem } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=3600",
  });
  const cachedResult = await getCache(`edbgs-map:power:${params.power}`);
  if (cachedResult) {
    const system: SpanshSystem = JSON.parse(cachedResult);
    return json(system);
  } else {
    const system = await fetchPowerSystems(params.power);
    setTimedCache(`edbgs-map:power:${params.power}`, JSON.stringify(system));
    return json(system);
  }
}
