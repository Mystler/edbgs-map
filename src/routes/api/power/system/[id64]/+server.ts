import { getCache, setTimedCache } from "$lib/ValkeyCache";
import { fetchSystemPPData, type SpanshDumpPPData } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=900",
  });
  const id64 = parseInt(params.id64);
  const cachedResult = await getCache(`edbgs-map:pp-data:${id64}`);
  if (cachedResult) {
    const system: SpanshDumpPPData = JSON.parse(cachedResult);
    return json(system);
  } else {
    const system = await fetchSystemPPData(id64);
    setTimedCache(`edbgs-map:pp-data:${id64}`, JSON.stringify(system), 3600);
    return json(system);
  }
}
