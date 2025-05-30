import { Subscriber } from "zeromq";
import { inflateSync } from "zlib";
import { setTimedCache } from "./valkey.js";

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
      // Regular journal event for carrier location tracking
      const data = eddn.message as EDDNJournalMessage;
      // PP Alert filter
      if (
        (data.PowerplayStateReinforcement && data.PowerplayStateReinforcement > 10000) ||
        (data.PowerplayStateUndermining && data.PowerplayStateUndermining > 10000) ||
        data.PowerplayConflictProgress?.some((x) => x.ConflictProgress >= 0.3)
      ) {
        // Abort if the message is an outdated one
        if (lastMessage.valueOf() - new Date(data.timestamp).valueOf() > 300000) continue;
        // Fix negative overflow
        if (data.PowerplayStateControlProgress && data.PowerplayStateControlProgress > 4000) {
          let scale = 1;
          scale = 120000;
          if (data.PowerplayState === "Exploited") {
            scale = 350000;
          } else if (data.PowerplayState === "Fortified") {
            scale = 650000;
          } else if (data.PowerplayState === "Stronghold") {
            scale = 1000000;
          }
          data.PowerplayStateControlProgress -= 4294967296 / scale;
        }
        // Prune data down to target data
        const alert: SpanshDumpPPData = {
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
        // Cache Alert
        setTimedCache(`edbgs-map:pp-alert:${data.SystemAddress}`, JSON.stringify(alert));
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
