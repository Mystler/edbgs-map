import { Subscriber } from "zeromq";
import { inflateSync } from "zlib";
import { getCache, setTimedCache } from "./valkey.js";
import { checkForSnipe, getLastPPTickDate, updateLastPPTickDate } from "./powerplay.js";

let lastMessage: Date | undefined;

async function runEDDNListener() {
  const sock = new Subscriber();
  sock.connect("tcp://eddn.edcd.io:9500");
  sock.subscribe("");
  console.log("Worker connected to EDDN.");

  runTimeoutCatcher();

  for await (const [msg] of sock) {
    if (!msg) continue;
    lastMessage = new Date();
    const eddn: EDDNMessage = JSON.parse(inflateSync(msg).toString());
    if (!eddn.header.gameversion?.startsWith("4")) continue;
    if (eddn.$schemaRef === "https://eddn.edcd.io/schemas/journal/1") {
      // Regular journal event
      const data = eddn.message as EDDNJournalMessage;
      const date = new Date(data.timestamp);
      // Reject timestamps older than 5min
      if (lastMessage.valueOf() - date.valueOf() > 300000) continue;
      // Calculate latest PP tick, for re-use
      updateLastPPTickDate();
      // Fix negative overflow
      if (data.PowerplayStateControlProgress && data.PowerplayStateControlProgress > 4000) {
        let scale = 120000; // Should never be reached/used.
        if (data.PowerplayState === "Exploited") {
          scale = 349999; // This makes math check out. Idk if the others should also be -1.
        } else if (data.PowerplayState === "Fortified") {
          scale = 649999; // Guessing same as Exploited
        } else if (data.PowerplayState === "Stronghold") {
          scale = 999999; // Guessing same as Exploited
        }
        data.PowerplayStateControlProgress -= 4294967296 / scale;
      }
      // Prune data down to PP target data in Spansh Format
      const ppData: SpanshDumpPPData = {
        date: data.timestamp,
        name: data.StarSystem,
        id64: data.SystemAddress,
        controllingPower: data.ControllingPower,
        powerConflictProgress: data.PowerplayConflictProgress?.map((x) => {
          return { power: x.Power, progress: x.ConflictProgress };
        }),
        powerState: data.PowerplayState,
        powerStateControlProgress: data.PowerplayStateControlProgress,
        powerStateReinforcement: data.PowerplayStateReinforcement,
        powerStateUndermining: data.PowerplayStateUndermining,
        powers: data.Powers,
      };
      // Grab existing cache
      const prevCache = await getCache(`edbgs-map:pp-alert:${data.SystemAddress}`);
      const prevData: SpanshDumpPPData | null = prevCache ? JSON.parse(prevCache) : null;
      if (prevData) {
        const prevDate = new Date(prevData.date);
        // Reject outdated data
        if (prevDate > date) continue; // Already got newer data (by timestamp)
        if (prevDate > getLastPPTickDate()) {
          // During the same cycle, control numbers are only allowed to go up.
          if (
            (ppData.powerStateReinforcement &&
              ppData.powerStateReinforcement < (prevData.powerStateReinforcement ?? 0)) ||
            (ppData.powerStateUndermining && ppData.powerStateUndermining < (prevData.powerStateUndermining ?? 0))
          ) {
            continue; // Reinforcement or UM went down, skip
          }
          if (
            ppData.powerConflictProgress &&
            ppData.powerConflictProgress.reduce((sum, x) => sum + x.progress, 0) <
              (prevData.powerConflictProgress?.reduce((sum, x) => sum + x.progress, 0) ?? 0)
          ) {
            continue; // Acquisition went down, skip
          }
        }
      }
      // Do some data analysis if a snipe may have happened and log it asynchronously.
      const snipe = checkForSnipe(prevData, ppData);
      // PP Alert filter
      if (
        (ppData.powerStateReinforcement !== undefined &&
          ppData.powerStateUndermining !== undefined &&
          ppData.powerStateReinforcement + ppData.powerStateUndermining > 10000) ||
        ppData.powerConflictProgress?.some((x) => x.progress >= 0.3) ||
        snipe
      ) {
        // Cache Alert
        setTimedCache(`edbgs-map:pp-alert:${ppData.id64}`, JSON.stringify(ppData));
      }
    }
  }
  console.error("ZMQ runner exited! Exiting bot to schedule restart.");
  process.exit(1);
}

// Kill the process if we haven't received any data in 5 minutes. Kudos to elitebgs for this failsafe approach.
async function runTimeoutCatcher() {
  setInterval(async () => {
    const now = new Date();
    if (now.valueOf() - (lastMessage?.valueOf() ?? 0) > 300000) {
      console.log("No EDDN messages received in 5 minutes. Exiting to schedule restart!");
      process.exit(1);
    }
  }, 300000);
}

runEDDNListener();
