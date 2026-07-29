import { resolve } from "$app/paths";
import type { CollateralSphereInfo } from "$lib/server/Collateral";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ fetch, depends }) => {
  depends("app:pp-collateral");
  const loadCache = async () => {
    const res = await fetch(resolve(`/api/power/collateral`));
    const cache: {
      lastUpdated: string;
      spheres: CollateralSphereInfo[];
    } = await res.json();
    return cache ?? [];
  };
  return {
    cache: loadCache(),
  };
};
