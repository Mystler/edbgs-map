import { dbGetAll } from "$lib/server/DB.js";
import { error } from "@sveltejs/kit";

export async function load({ depends, url }) {
  depends("app:pp-snipes");

  let query = "SELECT * FROM snipe_history ORDER BY id DESC LIMIT 500";
  let params: string[] = [];
  if (url.searchParams.has("system")) {
    query = "SELECT * FROM snipe_history WHERE system = ? ORDER BY id DESC LIMIT 500";
    params = [url.searchParams.get("system")!];
  }

  const q = await dbGetAll<{
    id: number;
    system: string;
    power: string;
    type: string;
    amount: number;
    old_dump: string | null;
    new_dump: string;
  }>(query, ...params);

  if (!q) error(404, "Could not find snipe history data!");

  return {
    snipeData: q,
  };
}
