import { db } from "#lib/server/DB.js";
import { randomBytes } from "node:crypto";

export async function POST({ request }) {
  const long: string = await request.json();
  const short = randomBytes(5).toString("base64url");
  db.prepare("INSERT INTO shortlinks (short, long) VALUES (?, ?)").run(short, long);
  return Response.json(short);
}
