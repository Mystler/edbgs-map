import { dbGetAll } from "$lib/server/DB.js";
import { error } from "@sveltejs/kit";

export async function load({ depends }) {
  depends("app:pp-snipes");

  const q = await dbGetAll<{
    id: number;
    system: string;
    power: string;
    type: string;
    amount: number;
    old_dump: string | null;
    new_dump: string;
  }>("SELECT * FROM snipe_history ORDER BY id DESC LIMIT 100");

  if (!q) error(404, "Could not find snipe history data!");

  return {
    snipeData: q,
  };
}
