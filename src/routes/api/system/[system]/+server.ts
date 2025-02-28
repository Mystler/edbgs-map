import { fetchSystem } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params }) {
  return json(await fetchSystem(params.system));
}
