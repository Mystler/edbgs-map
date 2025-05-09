import { autoComplete } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params }) {
  return json(await autoComplete(params.faction, "autocomplete_controlling_minor_faction"));
}
