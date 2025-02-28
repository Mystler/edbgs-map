import { fetchFactionSystems } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params }) {
  return json(await fetchFactionSystems(params.faction));
}
