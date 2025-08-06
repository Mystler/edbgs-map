import { fetchAcquisitionTargets } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=3600",
  });
  return json(await fetchAcquisitionTargets(parseFloat(params.X), parseFloat(params.Y), parseFloat(params.Z)));
}
