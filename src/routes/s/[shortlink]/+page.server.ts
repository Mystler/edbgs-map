import { dbGet } from "$lib/DB.js";
import { error } from "@sveltejs/kit";

export async function load({ params }) {
  const q = await dbGet<{ short: string; long: string }>(
    "SELECT * FROM shortlinks WHERE short = ?",
    params.shortlink,
  );

  if (!q || !q.long) error(404, "Could not find data for this shortlink!");

  return {
    long: q.long,
  };
}
