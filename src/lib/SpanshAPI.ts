export interface SpanshSystem {
  name: string;
  id64: number;
  x: number;
  y: number;
  z: number;
}
interface SpanshSearchResponse {
  results: {
    record: SpanshSystem;
    type: string;
  }[];
}

export async function fetchSystem(name: string): Promise<SpanshSystem> {
  // Easy API call. Search should have an existing system match in the results, with type being "system" and record having the system data.
  let response: Response;
  try {
    response = await fetch(`https://spansh.co.uk/api/search?q=${encodeURIComponent(name)}`);
  } catch {
    throw new Error(
      `Could not fetch data. Spansh.co.uk might be down, so you will have to try again later.`,
    );
  }
  if (response.ok) {
    const data: SpanshSearchResponse = await response.json();
    const system = data.results.find(
      (result) =>
        result.type === "system" && result.record.name.toLowerCase() === name.toLowerCase(),
    );
    if (system) {
      // Prune to relevant data
      return {
        name: system.record.name,
        id64: system.record.id64,
        x: system.record.x,
        y: system.record.y,
        z: system.record.z,
      };
    }
  }
  throw new Error(`No system data found for ${name}.`);
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

export async function fetchFactionSystems(name: string): Promise<SpanshSystem[]> {
  // This one is more tricky. First we need to send our query specs to the save endpoint, then we can fetch the results page by page for the ID we were given.
  let systems: SpanshSystem[] = [];
  try {
    // Set up search
    let response = await fetch("https://spansh.co.uk/api/systems/search/save", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filters: { controlling_minor_faction: { value: [name] } },
        sort: [],
        size: 1000,
        page: 0,
      }),
    });
    if (!response.ok) throw new Error();
    const searchData: SpanshSaveResponse = await response.json();
    if (!searchData.search_reference) throw new Error();

    // Fetch all relevant result pages for the search reference
    let page = 0;
    while (true) {
      response = await fetch(
        `https://spansh.co.uk/api/systems/search/recall/${searchData.search_reference}/${page}`,
      );
      if (!response.ok) throw new Error();
      const data: SpanshRecallResponse = await response.json();
      systems = systems.concat(
        data.results.map((x) => {
          return { name: x.name, id64: x.id64, x: x.x, y: x.y, z: x.z }; // Only keep the relevant data
        }),
      );
      if (data.from + data.size >= data.count) {
        break; // Got all systems
      }
      page++;
    }
  } catch {
    throw new Error(`Error while fetching faction data from Spansh.co.uk.`);
  }
  if (systems.length > 0) return systems;
  throw new Error(`No system data found for faction ${name}.`);
}

interface SpanshAutocompleteResponse {
  values: string[];
}
type AutoCompleteType = "autocomplete_controlling_minor_faction" | "system_names";

export async function autoComplete(name: string, type: AutoCompleteType): Promise<string[]> {
  let response: Response;
  try {
    response = await fetch(
      `https://spansh.co.uk/api/systems/field_values/${type}?q=${encodeURIComponent(name)}`,
    );
  } catch {
    throw new Error(
      `Could not fetch data. Spansh.co.uk might be down, so you will have to try again later.`,
    );
  }
  if (response.ok) {
    const data: SpanshAutocompleteResponse = await response.json();
    return data.values;
  }
  return [];
}
