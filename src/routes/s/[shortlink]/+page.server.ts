import { db } from "$lib/DB.js";
import { error } from "@sveltejs/kit";

export async function load({ params }) {
  let long: string | undefined;

  await new Promise<void>((resolve) => {
    db.get<{ short: string; long: string }>(
      "SELECT * FROM shortlinks WHERE short = ?",
      params.shortlink,
      (err, row) => {
        if (!err && row) {
          long = row.long;
        }
        resolve();
      },
    );
  });

  if (!long) error(404, "Could not find data for this shortlink!");

  return {
    long,
  };
}
