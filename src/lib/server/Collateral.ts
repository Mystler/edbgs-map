import type { SpanshDumpPPData } from "$lib/SpanshAPI";
import { Vector3 } from "three";
import { getAllCacheMatching } from "./ValkeyCache";
import { PointOctree } from "sparse-octree";
import { calculatePPControlSegments, getCPToTierDrop } from "$lib/Powerplay";

export type CollateralSphereInfo = SpanshDumpPPData & {
  collateral: {
    supportingSystems: number;
    supportingSystemsSHOnly: number;
    soleSupportingSystemsFort: SpanshDumpPPData[];
    soleSupportingSystemsSH: SpanshDumpPPData[];
    CPToTierDrop: number;
  };
};

export async function getCollateralDamageSystems(): Promise<CollateralSphereInfo[]> {
  const systemsCache = await getAllCacheMatching<SpanshDumpPPData>(
    "edbgs-map:pp-alert:*",
    (x) => x.controllingPower !== undefined && x.x !== undefined && x.y !== undefined && x.z !== undefined,
  );
  if (!systemsCache) return [];

  // Creat octree for more efficient processing
  const min = [-100, -100, -100];
  const max = [100, 100, 100];
  for (const sys of systemsCache) {
    min[0] = sys.x! < min[0] ? sys.x! : min[0];
    min[1] = sys.y! < min[1] ? sys.x! : min[1];
    min[2] = sys.z! < min[2] ? sys.x! : min[2];
    max[0] = sys.x! > max[0] ? sys.x! : max[0];
    max[1] = sys.y! > max[1] ? sys.y! : max[1];
    max[2] = sys.z! > max[2] ? sys.z! : max[2];
  }
  const systems = new PointOctree<SpanshDumpPPData>(
    new Vector3(min[0], min[1], min[2]),
    new Vector3(max[0], max[1], max[2]),
  );
  for (const sys of systemsCache) {
    systems.set(new Vector3(sys.x, sys.y, sys.z), sys);
  }

  // Iterate Fort+
  const results: CollateralSphereInfo[] = [];
  for (const sys of systemsCache) {
    const tier = sys.cycleStart?.startTier ?? sys.powerState;
    if (tier !== "Fortified" && tier !== "Stronghold") continue;
    const collateral: CollateralSphereInfo["collateral"] = {
      supportingSystems: 0,
      supportingSystemsSHOnly: 0,
      soleSupportingSystemsFort: [],
      soleSupportingSystemsSH: [],
      CPToTierDrop: 0,
    };

    const sysPos = new Vector3(sys.x, sys.y, sys.z);
    const supporting = systems.findPoints(sysPos, tier === "Stronghold" ? 30 : 20, false);
    for (const supSys of supporting) {
      if (!supSys.data) continue;
      if (supSys.data.controllingPower !== sys.controllingPower) continue;

      const supSHOnly = supSys.distance > 20;
      collateral.supportingSystems++;
      if (supSHOnly) collateral.supportingSystemsSHOnly++;

      let supSysSupports = systems.findPoints(supSys.point!, 30, false);
      supSysSupports = supSysSupports.filter(
        (x) =>
          x.data?.id64 !== sys.id64 &&
          x.data?.controllingPower === sys.controllingPower &&
          ["Fortified", "Stronghold"].includes(x.data?.cycleStart?.startTier ?? x.data?.powerState ?? "") &&
          x.distance <= ((x.data?.cycleStart?.startTier ?? x.data?.powerState) === "Stronghold" ? 30 : 20),
      );
      if (supSysSupports.length === 0) {
        if (supSHOnly) collateral.soleSupportingSystemsSH.push(supSys.data);
        else collateral.soleSupportingSystemsFort.push(supSys.data);
      }
    }

    if (collateral.soleSupportingSystemsSH.length > 0 || collateral.soleSupportingSystemsFort.length > 0) {
      collateral.CPToTierDrop = getCPToTierDrop(
        calculatePPControlSegments(sys).totalCP,
        sys.cycleStart?.startTier ?? sys.powerState ?? "",
      );
      results.push({
        ...sys,
        collateral,
      });
    }
  }
  return results;
}
