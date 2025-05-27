import { fetchColonizationTargets } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=3600",
  });
  return json(await fetchColonizationTargets(parseFloat(params.X), parseFloat(params.Y), parseFloat(params.Z)));
}
