import { db } from "$lib/DB.js";
import { json } from "@sveltejs/kit";
import { randomBytes } from "node:crypto";

export async function POST({ request }) {
  const long: string = await request.json();
  const short = randomBytes(5).toString("base64url");
  db.run("INSERT INTO shortlinks (short, long) VALUES (?, ?)", short, long);
  return json(short);
}
