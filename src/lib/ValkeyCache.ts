import Valkey from "iovalkey";

let isReconnecting = false;
let client: Valkey | null = null;
if (import.meta.env.VITE_USE_VALKEY === "true") {
  console.log("Looking for Valkey cache...");
  console.log("Caching will not be used if there is no Valkey server running.");
  client = new Valkey({
    port: import.meta.env.VITE_VALKEY_PORT ?? 6379,
    host: import.meta.env.VITE_VALKEY_HOST ?? "localhost",
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
}

export async function getCache(key: string): Promise<string | null> {
  if (!client || isReconnecting) return null;
  return await client.get(key);
}

export async function setTimedCache(key: string, value: string, ttl: number = 14400) {
  if (!client || isReconnecting) return;
  await client.set(key, value, "EX", ttl);
}

export async function getAllCacheMatching(match: string): Promise<string[] | null> {
  if (!client || isReconnecting) return null;
  const keySet = new Set<string>();
  const stream = client.scanStream({ match, count: 50 });
  stream.on("data", (keys) => {
    for (const key of keys) {
      keySet.add(key);
    }
  });
  await new Promise((resolve) => stream.once("end", resolve));
  const results: string[] = [];
  for (const key of keySet) {
    const val = await getCache(key);
    if (val) results.push(JSON.parse(val));
  }
  return results;
}
