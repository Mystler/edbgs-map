export interface EliteBGSSystem {
  _id: string;
  name: string;
  name_lower: string;
  x: number;
  y: number;
  z: number;
}
interface EliteBGSResponsePage {
  docs: unknown[];
  total: number;
  limit: number;
  page: number;
  pages: number;
  hasNextPage: boolean;
}
interface EliteBGSSystemsPage extends EliteBGSResponsePage {
  docs: EliteBGSSystem[];
}

/** This file is just a past/future reference but not actively supported and used, atm. */

/**
 * @deprecated The method should not be used
 */
async function fetchSystems(url: string): Promise<EliteBGSSystem[]> {
  let systems: EliteBGSSystem[] = [];
  try {
    let page = 1;
    while (true) {
      const response = await fetch(`${url}&page=${page}`);
      if (!response.ok) throw new Error();
      const data: EliteBGSSystemsPage = await response.json();
      systems = systems.concat(data.docs);
      if (!data.hasNextPage) {
        break; // Got all systems
      }
      page++;
    }
  } catch {
    throw new Error(
      `Could not fetch data. EliteBGS.app might be down, so you will have to try again later.`,
    );
  }
  if (systems.length > 0) return systems;
  throw new Error(`No system data found for ${name}.`);
}

/**
 * @deprecated The method should not be used
 */
export async function fetchFactionSystems(name: string): Promise<EliteBGSSystem[]> {
  return fetchSystems(
    `https://elitebgs.app/api/ebgs/v5/systems?faction=${encodeURIComponent(name)}`,
  );
}

/**
 * @deprecated The method should not be used
 */
export async function fetchSystem(name: string): Promise<EliteBGSSystem> {
  const systems = await fetchSystems(
    `https://elitebgs.app/api/ebgs/v5/systems?name=${encodeURIComponent(name)}`,
  );
  return systems[0];
}
