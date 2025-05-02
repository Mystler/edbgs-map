import { getCache, setTimedCache } from "$lib/RedisCache";
import { fetchSystemPPData, type SpanshDumpPPData } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

const cacheLength = 3600;

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": `max-age=${cacheLength}`,
  });
  const id64 = parseInt(params.id64);
  const cachedResult = await getCache(`edbgs-map:pp-data:${id64}`);
  if (cachedResult) {
    const system: SpanshDumpPPData = JSON.parse(cachedResult);
    return json(system);
  } else {
    const system = await fetchSystemPPData(id64);
    setTimedCache(`edbgs-map:pp-data:${id64}`, JSON.stringify(system), cacheLength);
    return json(system);
  }
}
