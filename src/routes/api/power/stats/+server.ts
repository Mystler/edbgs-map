import { getCurrentCycleStats } from "$lib/server/PowerplayStats";
import { json } from "@sveltejs/kit";

export async function GET() {
  return json(await getCurrentCycleStats());
}
