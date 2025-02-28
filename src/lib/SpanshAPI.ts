export interface SpanshSystem {
  name: string;
  x: number;
  y: number;
  z: number;
  id64?: number;
  controlling_minor_faction?: string;
}
interface SpanshSearchResponse {
  results: {
    record: SpanshSystem;
    type: string;
  }[];
}

export async function fetchSystem(name: string): Promise<SpanshSystem | null> {
  // Easy API call. Search should have an existing system match in the results, with type being "system" and record having the system data.
  const response = await fetch(`https://spansh.co.uk/api/search?q=${encodeURIComponent(name)}`);
  if (!response.ok) throw new Error("Spansh error!");
  const data: SpanshSearchResponse = await response.json();
  const system = data.results.find(
    (result) => result.type === "system" && result.record.name.toLowerCase() === name.toLowerCase(),
  );
  if (system) {
    // Prune to relevant data
    return {
      name: system.record.name,
      x: system.record.x,
      y: system.record.y,
      z: system.record.z,
      id64: system.record.id64,
      controlling_minor_faction: system.record.controlling_minor_faction,
    };
  }
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
    response = await fetch(
      `https://spansh.co.uk/api/systems/search/recall/${searchData.search_reference}/${page}`,
    );
    if (!response.ok) throw new Error("Spansh error!");
    const data: SpanshRecallResponse = await response.json();
    systems = systems.concat(
      data.results.map((x) => {
        return {
          // Only keep the relevant data
          name: x.name,
          x: x.x,
          y: x.y,
          z: x.z,
          id64: x.id64,
          controlling_minor_faction: x.controlling_minor_faction,
        };
      }),
    );
    if (data.from + data.size >= data.count) {
      break; // Got all systems
    }
    page++;
  }
  return systems;
}

export async function fetchFactionSystems(name: string): Promise<SpanshSystem[]> {
  return await fetchSystems({
    filters: { controlling_minor_faction: { value: [name] } },
    sort: [],
    size: 1000,
    page: 0,
  });
}

export async function fetchColonizationTargets(
  x: number,
  y: number,
  z: number,
): Promise<SpanshSystem[]> {
  let systems = await fetchSystems({
    filters: {
      distance: { min: "0", max: "16" },
      population: { comparison: "<=>", value: [0, 0] },
    },
    sort: [],
    size: 1000,
    page: 0,
    reference_coords: { x, y, z },
  });
  systems = systems.filter((system) => !system.controlling_minor_faction);
  return systems;
}

interface SpanshAutocompleteResponse {
  values: string[];
}
type AutoCompleteType = "autocomplete_controlling_minor_faction" | "system_names";

export async function autoComplete(name: string, type: AutoCompleteType): Promise<string[]> {
  const response = await fetch(
    `https://spansh.co.uk/api/systems/field_values/${type}?q=${encodeURIComponent(name)}`,
  );
  if (response.ok) {
    const data: SpanshAutocompleteResponse = await response.json();
    return data.values;
  }
  return [];
}
