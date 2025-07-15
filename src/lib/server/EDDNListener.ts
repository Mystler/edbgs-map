import { Subscriber } from "zeromq";
import { inflateSync } from "zlib";
import { deleteCache, getCache, setCache } from "$lib/server/ValkeyCache";
import { calculatePPControlSegments, getDecayValue, getLastPPTickDate } from "$lib/Powerplay";
import type { SpanshDumpPPData } from "../SpanshAPI";
import { logSnipe } from "./DB";

interface EDDNMessage {
  $schemaRef: string;
  header: EDDNMessageHeader;
  message: unknown;
}

interface EDDNMessageHeader {
  uploaderId: string;
  softwareName: string;
  softwareVersion: string;
  gameversion?: string;
}

interface EDDNJournalMessage {
  timestamp: string;
  event: string;
  StarSystem: string;
  SystemAddress: number;
  ControllingPower?: string;
  Powers?: string[];
  PowerplayState?: string;
  PowerplayStateControlProgress?: number;
  PowerplayStateReinforcement?: number;
  PowerplayStateUndermining?: number;
  PowerplayConflictProgress?: { Power: string; ConflictProgress: number }[];
}

let running = false;
let sock: Subscriber | undefined;
let lastMessage: Date | undefined;

export async function run() {
  if (running) return;
  running = true;
  runTimeoutCatcher();
  while (true) {
    lastMessage = new Date();
    await runEDDNListener();
  }
}

async function runEDDNListener() {
  sock = new Subscriber();
  sock.connect("tcp://eddn.edcd.io:9500");
  //sock.connect("tcp://127.0.0.1:9500");
  sock.subscribe("");
  console.log("Worker connected to EDDN.");

  for await (const [msg] of sock) {
    if (!msg) continue;
    lastMessage = new Date();
    const eddn: EDDNMessage = JSON.parse(inflateSync(msg).toString());
    if (!eddn.header.gameversion?.startsWith("4")) continue;
    if (eddn.$schemaRef === "https://eddn.edcd.io/schemas/journal/1") {
      // Regular journal event
      const data = eddn.message as EDDNJournalMessage;
      // Ignore events that are not expected to contain PP data
      if (data.event !== "FSDJump" && data.event !== "Location") continue;
      const date = new Date(data.timestamp);
      // Reject timestamps older than 5min
      if (lastMessage.valueOf() - date.valueOf() > 300000) continue;
      // Calculate latest PP tick, for re-use
      const lastPPTick = getLastPPTickDate();
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
        if (prevDate > lastPPTick) {
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
      const snipe = checkForSnipe(prevData, ppData, lastPPTick);
      // PP Alert filter. Used to filter here but now we log all if any progress and filter on the view. Naming is legacy.
      if (
        (ppData.powerStateReinforcement !== undefined && ppData.powerStateUndermining !== undefined) || // Control system
        ppData.powerConflictProgress?.some((x) => x.progress > 0) || // Acquisition
        snipe // Detected for snipe, probably redundant now but no big deal to keep in
      ) {
        // Store system
        setCache(`edbgs-map:pp-alert:${ppData.id64}`, JSON.stringify(ppData));
      } else if (
        prevData?.powerState !== undefined &&
        prevData.powerState !== "Unoccupied" &&
        new Date(prevData.date) < lastPPTick &&
        (ppData.powerState === undefined || ppData.powerState === "Unoccupied")
      ) {
        // Delete potentially lost systems once if no other data for this cycle
        deleteCache(`edbgs-map:pp-alert:${ppData.id64}`);
      }
    }
  }
  console.log("ZMQ runner exited! Restart initiating.");
}

// Kill the socket if we haven't received any data in 5 minutes.
async function runTimeoutCatcher() {
  setInterval(async () => {
    const now = new Date();
    if (now.valueOf() - (lastMessage?.valueOf() ?? 0) > 300000) {
      console.log("No EDDN messages received in 5 minutes. Attempt restart!");
      sock?.close();
    }
  }, 300000);
}

function checkForSnipe(
  prevData: SpanshDumpPPData | null,
  currData: SpanshDumpPPData,
  lastPPTick = getLastPPTickDate(),
): boolean {
  if (currData.powerConflictProgress) {
    // Aquisition now
    // (For now, ignore that a system having been controlled before may have been a snipe since it could have dropped via nearby fort-drop.)
    let hadSnipe = false;
    const ageOfData = prevData?.date
      ? (new Date(currData.date).valueOf() - new Date(prevData.date).valueOf()) / 36000000
      : 1;
    const acqThreshold = 0.25 + 0.5 * Math.min(1, ageOfData); // 25% to 75% drops in 10h
    const fullPowers = currData.powerConflictProgress.reduce((full, x) => (x.progress >= 1 ? full + 1 : full), 0);
    for (const p of currData.powerConflictProgress) {
      const prevValue = prevData?.powerConflictProgress?.find((x) => x.power === p.power)?.progress;
      const diff = p.progress - (prevValue ?? 0);
      // Check for snipes if we know previous data, full acquisition if we don't. Ignore past 100% but only if no other power is at 100 too.
      if (
        (prevValue && (prevValue < 1 || fullPowers >= 1) && p.progress >= 0.5 && diff >= acqThreshold) ||
        (!prevValue && p.progress >= 1)
      ) {
        logSnipe(currData.name, "Acquisition", p.power, Math.floor(diff * 120000), prevData, currData);
        hadSnipe = true;
      }
    }
    return hadSnipe;
  } else if (currData.controllingPower && currData.powerStateControlProgress !== undefined) {
    // Last data was still in acquisition and got sniped?
    const lastCycleAcqProgress = prevData?.powerConflictProgress?.find(
      (x) => x.power === currData.controllingPower,
    )?.progress;
    if (lastCycleAcqProgress && lastCycleAcqProgress < 0.8) {
      logSnipe(
        currData.name,
        "EOC Acquisition",
        currData.controllingPower,
        Math.floor((1 - lastCycleAcqProgress) * 120000),
        prevData,
        currData,
      );
      return true;
    }
    // UM Snipe, just check for 25k drops (beyond expected decay), better catch a bit too much than too little
    const um = currData?.powerStateUndermining ?? 0;
    const umDiff = um - (prevData?.powerStateUndermining ?? 0);
    const { startProgress: currStartProgress } = calculatePPControlSegments(currData);
    if (umDiff > 25000 && um > getDecayValue(currStartProgress, currData.powerState) + 25000) {
      logSnipe(currData.name, "Undermining", currData.controllingPower, umDiff, prevData, currData);
      return true;
    }
    // Reinforcement Snipe, much less likely to have interesting stuff. Use an expanding scale up to 10h diff
    const ageOfData = prevData?.date
      ? (new Date(currData.date).valueOf() - new Date(prevData.date).valueOf()) / 36000000
      : 1;
    const reinfThreshold = 30000 + 70000 * Math.min(1, ageOfData); // 30k to 100k in 10h
    const reinfDiff = (currData?.powerStateReinforcement ?? 0) - (prevData?.powerStateReinforcement ?? 0);
    if (
      reinfDiff > reinfThreshold &&
      (!prevData?.powerStateReinforcement ||
        prevData.powerState !== "Stronghold" ||
        (prevData.powerStateControlProgress ?? 0) < 1) // Ignore reinf sniping maxed Strongholds
    ) {
      logSnipe(currData.name, "Reinforcement", currData.controllingPower, reinfDiff, prevData, currData);
      return true;
    }
    // EOC progress control snipes that weren't caught.
    if (prevData && new Date(prevData.date) < lastPPTick) {
      const prevProg = prevData?.powerStateControlProgress ?? 0;
      const currProg = currStartProgress; // Use reverse calculated start of cycle data, in-cycle stuff should be caught above.
      // Undermining drops that changed tier over EOC
      if (prevData.powerState === "Stronghold" && currData.powerState === "Fortified" && prevProg > 0) {
        const cp = Math.floor(prevProg * 1000000 + (1 - currProg) * 650000);
        logSnipe(currData.name, "EOC Undermining", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      if (prevData.powerState === "Fortified" && currData.powerState === "Exploited" && prevProg > 0) {
        const cp = Math.floor(prevProg * 650000 + (1 - currProg) * 350000);
        logSnipe(currData.name, "EOC Undermining", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      // Reinforcement drops that changed tier over EOC
      if (prevData.powerState === "Exploited" && currData.powerState === "Fortified" && prevProg < 1) {
        const cp = Math.floor(currProg * 650000 + (1 - prevProg) * 350000);
        logSnipe(currData.name, "EOC Reinforcement", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      if (prevData.powerState === "Fortified" && currData.powerState === "Stronghold" && prevProg < 1) {
        const cp = Math.floor(currProg * 1000000 + (1 - prevProg) * 650000);
        logSnipe(currData.name, "EOC Reinforcement", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      // Uncaught major percentage changes in same tier between cycles.
      if (prevData.powerState === currData.powerState) {
        if (
          currData.powerState === "Stronghold" &&
          currProg + (um - (currData.powerStateReinforcement ?? 0)) / 1000000 > 0.999
        ) {
          return false;
        }
        const cp = Math.floor(
          (currProg - prevProg) *
            (currData.powerState === "Stronghold" ? 1000000 : currData.powerState === "Fortified" ? 650000 : 350000),
        );
        if (cp > reinfThreshold) {
          logSnipe(currData.name, "EOC Reinforcement", currData.controllingPower, cp, prevData, currData);
          return true;
        } else if (cp < -25000) {
          logSnipe(currData.name, "EOC Undermining", currData.controllingPower, -cp, prevData, currData);
          return true;
        }
      }
    }
  }
  return false;
}
