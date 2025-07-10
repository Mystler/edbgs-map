import { getCache, setTimedCache } from "$lib/server/ValkeyCache";
import { fetchSystemPPData, type SpanshDumpPPData } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=900",
  });
  const id64 = parseInt(params.id64);
  // Check if we have a result cached from spansh
  const cachedResult = await getCache(`edbgs-map:pp-data:${id64}`);
  if (cachedResult) {
    const system: SpanshDumpPPData = JSON.parse(cachedResult);
    return json(system);
  }
  // Check if we have a result cached from our EDDN listener
  const ownSystemCache = await getCache(`edbgs-map:pp-alert:${id64}`);
  if (ownSystemCache) {
    const system: SpanshDumpPPData = JSON.parse(ownSystemCache);
    return json(system);
  }
  // Fetch latest data from Spansh and cache that
  const system = await fetchSystemPPData(id64);
  setTimedCache(`edbgs-map:pp-data:${id64}`, JSON.stringify(system), 3600);
  return json(system);
}
