import { building } from "$app/environment";
import Valkey from "iovalkey";

let isReconnecting = false;
let client: Valkey | null = null;
if (!building && import.meta.env.VITE_USE_VALKEY === "true") {
  console.log("Looking for Valkey cache...");
  console.log("Caching will not be used if there is no Valkey server running.");
  client = new Valkey({
    port: import.meta.env.VITE_VALKEY_PORT ?? 6379,
    host: import.meta.env.VITE_VALKEY_HOST ?? "localhost",
    enableAutoPipelining: true,
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

export async function setCache(key: string, value: string) {
  if (!client || isReconnecting) return;
  await client.set(key, value);
}

export async function setTimedCache(key: string, value: string, ttl: number = 14400) {
  if (!client || isReconnecting) return;
  await client.set(key, value, "EX", ttl);
}

export async function getAllCacheMatching<T>(
  match: string,
  filterFunc: (x: T) => boolean = () => true,
): Promise<T[] | null> {
  if (!client || isReconnecting) return null;
  const keySet = new Set<string>();
  const stream = client.scanStream({ match, count: 50 });
  stream.on("data", (keys) => {
    for (const key of keys) {
      keySet.add(key);
    }
  });
  await new Promise((resolve) => stream.once("end", resolve));
  const pipe = client.pipeline();
  const results: T[] = [];
  for (const key of keySet.keys()) {
    pipe.get(key);
  }
  for (const [, result] of (await pipe.exec()) ?? []) {
    const obj = result ? (JSON.parse(result as string) as T) : undefined;
    if (obj && filterFunc(obj)) results.push(obj);
  }
  return results;
}

export async function deleteCache(key: string) {
  if (!client || isReconnecting) return;
  await client.del(key);
}
