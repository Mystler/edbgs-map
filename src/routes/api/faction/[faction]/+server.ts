import { fetchFactionSystems } from "$lib/SpanshAPI";
import { error, json } from "@sveltejs/kit";

export async function GET({ params }) {
  try {
    return json(await fetchFactionSystems(params.faction));
  } catch {
    error(500, "Failed to fetch faction systems");
  }
}
