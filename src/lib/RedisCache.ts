import { createClient } from "redis";

let isReconnecting = true;
const client = createClient();
client.on("error", (e) => {
  if (!isReconnecting) console.log(e);
});
client.on("reconnecting", () => {
  if (isReconnecting) return;
  console.log("Redis connection lost. Reconnecting...");
  isReconnecting = true;
});
client.on("connect", () => {
  console.log("Connecting to Redis cache...");
  isReconnecting = false;
});
client.on("ready", () => console.log("Redis cache ready!"));

if (import.meta.env.VITE_USE_REDIS === "true") {
  console.log("Looking for Redis cache...");
  console.log("Caching will not be used if there is no Redis server running.");
  client.connect();
}

export async function getCache(key: string): Promise<string | null> {
  if (!client.isReady) return null;
  return await client.get(key);
}

export async function setTimedCache(key: string, value: string, ttl: number = 14400) {
  if (!client.isReady) return;
  await client.set(key, value, { EX: ttl });
}
