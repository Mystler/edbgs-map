import type { ServerInit } from "@sveltejs/kit/hooks";
import { building } from "$app/env";
import { run } from "#lib/server/EDDNListener.js";
import { scheduleStatSnapshot } from "#lib/server/PPStatsSnapshot.js";

export const init: ServerInit = async () => {
  process.on("SIGINT", () => {
    process.exit(0);
  });

  // Run our EDDN listener if Valkey caching is also on
  if (!building && import.meta.env.VITE_USE_VALKEY === "true" && import.meta.env.VITE_RUN_LISTENER === "true") {
    run();
    scheduleStatSnapshot();
  }
};
