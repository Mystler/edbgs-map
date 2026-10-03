import { autoComplete } from "#lib/SpanshAPI.js";

export async function GET({ params }) {
  return Response.json(await autoComplete(params.system, "system_names"));
}
