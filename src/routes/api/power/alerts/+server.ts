import { getAllCacheMatching } from "$lib/ValkeyCache";
import { json } from "@sveltejs/kit";

export async function GET() {
  const cachedResult = await getAllCacheMatching("edbgs-map:pp-alert:*");
  return json(cachedResult);
}
