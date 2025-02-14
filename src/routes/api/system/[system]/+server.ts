import { fetchSystem } from "$lib/SpanshAPI";
import { error, json } from "@sveltejs/kit";

export async function GET({ params }) {
  try {
    return json(await fetchSystem(params.system));
  } catch {
    error(500, "Failed to fetch system");
  }
}
