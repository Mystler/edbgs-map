import { getAllCacheMatching, getCache, setTimedCache } from "$lib/server/ValkeyCache";
import { fetchPowerSystems, type SpanshDumpPPData, type SpanshSystem } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=3600",
  });
  const cachedResult = await getCache(`edbgs-map:power:${params.power}`);
  if (cachedResult) {
    const systems: SpanshSystem[] = JSON.parse(cachedResult);
    return json(systems);
  } else {
    if (import.meta.env.VITE_USE_VALKEY === "true" && import.meta.env.VITE_RUN_LISTENER === "true") {
      const systemsCache =
        (await getAllCacheMatching<SpanshDumpPPData>(
          "edbgs-map:pp-alert:*",
          (x) => x.controllingPower === params.power && x.x !== undefined && x.y !== undefined && x.z !== undefined,
        )) ?? [];
      // Convert to SpanshSystems for map
      const systems: SpanshSystem[] = systemsCache.map<SpanshSystem>((x) => {
        return {
          name: x.name,
          id64: x.id64,
          x: x.x!,
          y: x.y!,
          z: x.z!,
          power_state: x.powerState,
          controlling_power: x.controllingPower,
        };
      });
      setTimedCache(`edbgs-map:power:${params.power}`, JSON.stringify(systems));
      return json(systems);
    } else {
      const systems = await fetchPowerSystems(params.power);
      setTimedCache(`edbgs-map:power:${params.power}`, JSON.stringify(systems));
      return json(systems);
    }
  }
}
