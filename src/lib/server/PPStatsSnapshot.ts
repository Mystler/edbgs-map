import { getLastPPTickDate } from "$lib/Powerplay";
import { db } from "./DB";
import { getCurrentCycleStats } from "./PowerplayStats";

export async function scheduleStatSnapshot() {
  const snapshotTime = getLastPPTickDate();
  snapshotTime.setDate(snapshotTime.getDate() + 7);
  snapshotTime.setMinutes(snapshotTime.getMinutes() - 5);
  console.log(`Scheduling new PP stats snapshot for ${snapshotTime.toISOString()}`);
  // Take snapshot 5 minutes before EOC
  setTimeout(() => {
    takeSnapshot();
    // Schedule new snapshot for next cycle 10mins later.
    setTimeout(() => {
      scheduleStatSnapshot();
    }, 600000);
  }, snapshotTime.valueOf() - new Date().valueOf());
}

function takeSnapshot() {
  console.log("Taking EOC Powerplay stats snapshot.");
  getCurrentCycleStats().then((x) => {
    db.run("INSERT INTO cycle_stats (timestamp, snapshot) VALUES (?, ?)", new Date().toISOString(), JSON.stringify(x));
  });
}
