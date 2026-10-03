import { getCurrentCycleStats } from "#lib/server/PowerplayStats.js";

export async function GET() {
  return Response.json(await getCurrentCycleStats());
}
