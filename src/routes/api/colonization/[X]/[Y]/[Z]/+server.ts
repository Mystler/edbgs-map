import { fetchColonizationTargets, pruneSystemObject } from "$lib/SpanshAPI";
import { json } from "@sveltejs/kit";

export async function GET({ params }) {
  return json(
    (
      await fetchColonizationTargets(
        parseFloat(params.X),
        parseFloat(params.Y),
        parseFloat(params.Z),
      )
    ).map((x) => pruneSystemObject(x)),
  );
}
