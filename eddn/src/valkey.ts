import { Redis as Valkey } from "iovalkey";
import dotenv from "dotenv";

dotenv.config({ path: "../.env.local" });

let isReconnecting = true;
let client: Valkey | null = null;
if (process.env.VITE_USE_VALKEY === "true") {
  console.log("Looking for Valkey cache...");
  const port = process.env.VITE_VALKEY_PORT ? parseInt(process.env.VITE_VALKEY_PORT) : 6379;
  client = new Valkey({
    port,
    host: process.env.VITE_VALKEY_HOST ?? "localhost",
  });
  client.on("error", (e) => {
    if (!isReconnecting) console.log(e);
  });
  client.on("reconnecting", () => {
    if (isReconnecting) return;
    console.log("Valkey connection lost. Reconnecting...");
    isReconnecting = true;
  });
  client.on("connect", () => {
    console.log("Connecting to Valkey cache...");
  });
  client.on("ready", () => {
    console.log("Valkey cache ready!");
    isReconnecting = false;
  });
} else {
  console.error("Parent environment was not set to use Valkey via VITE_USE_VALKEY=true in .env.local!");
}

export async function setTimedCache(key: string, value: string, ttl: number = 172800) {
  if (!client || isReconnecting) return;
  await client.set(key, value, "EX", ttl);
}
