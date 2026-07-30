import { getCollateralDamageSystems, type CollateralSphereInfo } from "$lib/server/Collateral.js";
import { getCache, setTimedCache } from "$lib/server/ValkeyCache";
import { json } from "@sveltejs/kit";

interface Cache {
  lastUpdated: string;
  spheres: CollateralSphereInfo[];
}

export async function GET() {
  const cachedResult = await getCache(`edbgs-map:pp-collateral`);
  if (cachedResult) {
    const cache: Cache = JSON.parse(cachedResult);
    return json(cache);
  } else {
    const spheres = await getCollateralDamageSystems();
    const cache: Cache = {
      lastUpdated: new Date().toISOString(),
      spheres,
    };
    setTimedCache(`edbgs-map:pp-collateral`, JSON.stringify(cache), 3600);
    return json(cache);
  }
}
