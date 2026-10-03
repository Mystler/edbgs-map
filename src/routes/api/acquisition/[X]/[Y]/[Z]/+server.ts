import { fetchAcquisitionTargets } from "#lib/SpanshAPI.js";

export async function GET({ params, setHeaders }) {
  setHeaders({
    "cache-control": "max-age=3600",
  });
  return Response.json(await fetchAcquisitionTargets(parseFloat(params.X), parseFloat(params.Y), parseFloat(params.Z)));
}
