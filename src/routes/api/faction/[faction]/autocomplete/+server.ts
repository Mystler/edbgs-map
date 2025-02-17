import { autoComplete } from "$lib/SpanshAPI";
import { error, json } from "@sveltejs/kit";

export async function GET({ params }) {
  try {
    return json(await autoComplete(params.faction, "autocomplete_controlling_minor_faction"));
  } catch {
    error(500, "Failed to fetch autocompleteion data");
  }
}
