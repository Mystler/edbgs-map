import { building } from "$app/environment";
import { run } from "$lib/EDDNListener";

process.on("SIGINT", () => {
  process.exit(0);
});

// Run our EDDN listener if Valkey caching is also on
if (!building && import.meta.env.VITE_USE_VALKEY === "true" && import.meta.env.VITE_RUN_LISTENER === "true") {
  run();
}
