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
  Population?: number;
}

let running = false;
let sock: Subscriber | undefined;
let lastMessage: Date | undefined;
// This tracks the most common game version to filter for. Seed with 5 instances of a default.
let requiredGameVersion = "";
const versionTrack: string[] = Array(4).fill("4.2.0.0");
trackVersion(versionTrack[0]);

function trackVersion(version: string) {
  // Ignore all legacy.
  if (!version.startsWith("4.")) return;
  versionTrack.push(version);
  // Track the last 200 versions for now.
  if (versionTrack.length > 200) {
    versionTrack.shift();
  }
  const mode = getModeVersion();
  if (mode !== requiredGameVersion) {
    console.log(`Setting expected game version to ${mode}`);
    requiredGameVersion = mode;
  }
}

function getModeVersion() {
  const frequencyMap: { [index: string]: number } = {};
  for (const version of versionTrack) {
    frequencyMap[version] = (frequencyMap[version] || 0) + 1;
  }
  let mode = "";
  let maxCount = 0;
  for (const [version, count] of Object.entries(frequencyMap)) {
    if (count > maxCount) {
      maxCount = count;
      mode = version;
    }
  }
  return mode;
}

export async function run() {
  if (running) return;
  running = true;
  runTimeoutCatcher();
  while (true) {
    lastMessage = new Date();
    await runEDDNListener();
  }
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
    // Only listen to journal schema events
    if (eddn.$schemaRef !== "https://eddn.edcd.io/schemas/journal/1") continue;
    // Track and check for right game version
    if (eddn.header.gameversion) trackVersion(eddn.header.gameversion);
    if (eddn.header.gameversion !== requiredGameVersion) continue;

    // Regular journal event
    const data = eddn.message as EDDNJournalMessage;
    // Ignore events that are not expected to contain PP data
    if (data.event !== "FSDJump" && data.event !== "Location") continue;
    // Get event timestamp of the journal entry
    const date = new Date(data.timestamp);
    // Calculate latest PP tick, for re-use
    const lastPPTick = getLastPPTickDate();
    // Fix negative overflow
    if (data.PowerplayStateControlProgress && data.PowerplayStateControlProgress > 4000) {
      let scale = 120000; // Should never be reached/used.
      if (data.PowerplayState === "Exploited") {
        scale = 349999; // This makes math check out. Idk if the others should also be -1.
      } else if (data.PowerplayState === "Fortified") {
        scale = 650000;
      } else if (data.PowerplayState === "Stronghold") {
        scale = 1000000;
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
      population: data.Population,
    };
    // Grab existing cache
    const prevCache = await getCache(`edbgs-map:pp-alert:${data.SystemAddress}`);
    const prevData: SpanshDumpPPData | null = prevCache ? JSON.parse(prevCache) : null;
    const prevDate = prevData ? new Date(prevData.date) : null;
    if (prevData && prevDate) {
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
    if (ppData.powerStateControlProgress !== undefined) {
      if (!prevData || (prevDate && prevDate < lastPPTick) || !prevData.cycleStart) {
        // If this is the first time we get the system this cycle (or at all) also store calculated cycle start data (to avoid the reverse-calculation offset when capping)
        const { startProgress, startBar, startTier } = calculatePPControlSegments(ppData);
        ppData.cycleStart = { startProgress, startBar, startTier };
      } else if (prevData.cycleStart) {
        // Otherwise, carry forward stored data.
        ppData.cycleStart = prevData.cycleStart;
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
  console.log("ZMQ runner exited! Restart initiating.");
}

function checkForSnipe(
  prevData: SpanshDumpPPData | null,
  currData: SpanshDumpPPData,
  lastPPTick = getLastPPTickDate(),
): boolean {
  if (currData.powerState === "Unoccupied" && prevData?.powerState === "Fortified" && prevData.controllingPower) {
    // Snipes from fort to unoccupied due to lacking nearby forts.
    // We ignore Exploited->Unoccupied drops for now because without deep analysis, we cannot know if it dropped due to fort drop and was actually sniped itself.
    // Other types of snipes that leave the power in control further down.
    const prevProg = prevData?.powerStateControlProgress ?? 0;
    const cp = Math.max(0, Math.floor(prevProg * 650000));
    logSnipe(currData.name, "EOC Undermining", prevData.controllingPower, cp, prevData, currData);
  } else if (currData.powerConflictProgress) {
    // Aquisition in-progress snipes
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
    if (lastCycleAcqProgress && lastCycleAcqProgress < 0.8 && currData.powerStateControlProgress >= 0) {
      // Added progress >= 0 check to account for caching bug reporting lost system as exploited with negative progress for some.
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
    const { startProgress: currStartProgress, startTier: currStartTier } =
      currData.cycleStart || calculatePPControlSegments(currData);
    if (umDiff > 25000 && um > getDecayValue(currStartProgress, currStartTier) + 25000) {
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
      // Use reverse calculated start of cycle data, in-cycle stuff should be caught above.
      // Sanity check currProg as well because of the stupid game cache bug (showing last cycle's tier with >100% or <0% progress still).
      // Undermining drops that changed tier over EOC
      if (prevData.powerState === "Stronghold" && prevProg > 0 && currStartTier === "Fortified") {
        const cp = Math.floor(prevProg * 1000000 + (1 - currStartProgress) * 650000);
        logSnipe(currData.name, "EOC Undermining", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      if (prevData.powerState === "Fortified" && prevProg > 0 && currStartTier === "Exploited") {
        const cp = Math.floor(prevProg * 650000 + (1 - currStartProgress) * 350000);
        logSnipe(currData.name, "EOC Undermining", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      // Reinforcement drops that changed tier over EOC
      if (prevData.powerState === "Exploited" && prevProg < 1 && currStartTier === "Fortified") {
        const cp = Math.floor(currStartProgress * 650000 + (1 - prevProg) * 350000);
        logSnipe(currData.name, "EOC Reinforcement", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      if (prevData.powerState === "Fortified" && prevProg < 1 && currStartTier === "Stronghold") {
        const cp = Math.floor(currStartProgress * 1000000 + (1 - prevProg) * 650000);
        logSnipe(currData.name, "EOC Reinforcement", currData.controllingPower, cp, prevData, currData);
        return true;
      }
      // Uncaught major percentage changes in same tier between cycles.
      if (prevData.powerState === currData.powerState && prevData.powerState === currStartTier) {
        if (
          (currStartProgress > 0.25 && Math.abs(currStartProgress - prevProg) < 0.2) || // Ignore snipes above 25% that did less than 20%
          (currData.powerState === "Stronghold" && currStartProgress > 0.999) // Ignore maxed Strongholds resetting
        ) {
          return false;
        }
        const cp = Math.floor(
          (currData.powerStateControlProgress - prevProg) *
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
