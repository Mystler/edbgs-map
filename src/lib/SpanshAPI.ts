import type { Powers } from "./Constants";

export interface SpanshSystem {
  name: string;
  x: number;
  y: number;
  z: number;
  id64?: number;
  controlling_minor_faction?: string;
  controlling_power?: string;
  power_state?: string;
  power?: string[];
  needs_permit?: string;
}

/**
 * Interface replicating the structure of the relevant PP data in the Spansh System API.
 * This is extended with an optional object for reverse calculated start-of-cycle data.
 */
export interface SpanshDumpPPData {
  name: string;
  id64: number;
  date: string;
  powerState?: string;
  powerStateControlProgress?: number;
  powerStateReinforcement?: number;
  powerStateUndermining?: number;
  controllingPower?: keyof typeof Powers;
  powers?: (keyof typeof Powers)[];
  powerConflictProgress?: {
    power: keyof typeof Powers;
    progress: number;
  }[];
  population?: number;
  cycleStart?: {
    startProgress: number;
    startBar: number;
    startTier: string;
  };
}
interface SpanshSearchResponse {
  results: {
    record: SpanshSystem;
    type: string;
  }[];
}

export function pruneSystemObject(system: SpanshSystem): RequireAssignment<SpanshSystem> {
  return {
    name: system.name,
    x: system.x,
    y: system.y,
    z: system.z,
    id64: system.id64,
    controlling_minor_faction: system.controlling_minor_faction,
    controlling_power: system.controlling_power,
    power_state: system.power_state,
    power: system.power,
    needs_permit: system.needs_permit,
  };
}

export function pruneSystemDumpPPObject(system: SpanshDumpPPData): RequireAssignment<SpanshDumpPPData> {
  return {
    name: system.name,
    id64: system.id64,
    date: system.date,
    powerState: system.powerState,
    powerStateControlProgress: system.powerStateControlProgress,
    powerStateReinforcement: system.powerStateReinforcement,
    powerStateUndermining: system.powerStateUndermining,
    controllingPower: system.controllingPower,
    powers: system.powers,
    powerConflictProgress: system.powerConflictProgress,
    population: system.population,
    cycleStart: system.cycleStart,
  };
}

export async function fetchSystem(name: string): Promise<SpanshSystem | null> {
  // Easy API call. Search should have an existing system match in the results, with type being "system" and record having the system data.
  const response = await fetch(`https://spansh.co.uk/api/search?q=${encodeURIComponent(name)}`);
  if (!response.ok) throw new Error("Spansh error!");
  const data: SpanshSearchResponse = await response.json();
  const system = data.results.find(
    (result) => result.type === "system" && result.record.name.toLowerCase() === name.toLowerCase(),
  );
  if (system) return pruneSystemObject(system.record);
  return null;
}

export async function fetchSystemPPData(id64: number): Promise<SpanshDumpPPData | null> {
  // Easy API call. Search should have an existing system match in the results, with type being "system" and record having the system data.
  const response = await fetch(`https://spansh.co.uk/api/dump/${encodeURIComponent(id64)}`);
  if (!response.ok) throw new Error("Spansh error!");
  const data: { system: SpanshDumpPPData } = await response.json();
  if (data && data.system) return pruneSystemDumpPPObject(data.system);
  return null;
}

interface SpanshSaveResponse {
  search_reference: string;
}
interface SpanshRecallResponse {
  count: number;
  from: number;
  size: number;
  results: SpanshSystem[];
}

async function fetchSystems(payload: unknown): Promise<SpanshSystem[]> {
  // This one is more tricky. First we need to send our query specs to the save endpoint, then we can fetch the results page by page for the ID we were given.
  let systems: SpanshSystem[] = [];
  // Set up search
  let response = await fetch("https://spansh.co.uk/api/systems/search/save", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Spansh error!");
  const searchData: SpanshSaveResponse = await response.json();
  if (!searchData.search_reference) throw new Error("Response missing search reference!");

  // Fetch all relevant result pages for the search reference
  let page = 0;
  while (true) {
    response = await fetch(`https://spansh.co.uk/api/systems/search/recall/${searchData.search_reference}/${page}`);
    if (!response.ok) throw new Error("Spansh error!");
    const data: SpanshRecallResponse = await response.json();
    systems = systems.concat(data.results.map((x) => pruneSystemObject(x)));
    if (data.from + data.size >= data.count) {
      break; // Got all systems
    }
    page++;
  }
  return systems;
}

export async function fetchFactionSystems(name: string): Promise<SpanshSystem[]> {
  return await fetchSystems({
    filters: { minor_faction_presences: { value: [name] } },
    sort: [],
    size: 500,
    page: 0,
  });
}

export async function fetchPowerSystems(name: string): Promise<SpanshSystem[]> {
  const systems = await fetchSystems({
    filters: { controlling_power: { value: [name] } },
    sort: [],
    size: 500,
    page: 0,
  });
  return systems;
}

export async function fetchColonizationTargets(x: number, y: number, z: number): Promise<SpanshSystem[]> {
  let systems = await fetchSystems({
    filters: {
      distance: { min: "0", max: "15" },
      population: { comparison: "<=>", value: [0, 0] },
    },
    sort: [],
    size: 500,
    page: 0,
    reference_coords: { x, y, z },
  });
  systems = systems.filter((system) => !system.controlling_minor_faction && !system.needs_permit);
  return systems;
}

/**
 * Fetch all unoccupied populated systems in 30Ly range and leave filtering down to 20Ly for fortified to the frontend.
 */
export async function fetchAcquisitionTargets(x: number, y: number, z: number): Promise<SpanshSystem[]> {
  const systems = await fetchSystems({
    filters: {
      distance: { min: "0", max: "30" },
      population: { comparison: "<=>", value: [1, 100000000000] },
      power_state: { value: ["Unoccupied"] },
    },
    sort: [],
    size: 500,
    page: 0,
    reference_coords: { x, y, z },
  });
  return systems;
}

interface SpanshAutocompleteResponse {
  values: string[];
}
type AutoCompleteType = "autocomplete_controlling_minor_faction" | "system_names";

export async function autoComplete(name: string, type: AutoCompleteType): Promise<string[]> {
  const response = await fetch(`https://spansh.co.uk/api/systems/field_values/${type}?q=${encodeURIComponent(name)}`);
  if (response.ok) {
    const data: SpanshAutocompleteResponse = await response.json();
    return data.values;
  }
  return [];
}
