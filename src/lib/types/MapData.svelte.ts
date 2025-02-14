import { randomColor } from "$lib/Helpers";

export interface FactionData {
  name: string;
  displayName: string;
  color: string;
  visible: boolean;
}

export type SystemData = FactionData;

type SphereType = "Fortified" | "Stronghold";
export interface SphereData {
  name: string;
  color: string;
  type: SphereType;
  visible: boolean;
}

export interface CameraData {
  lookAtSystem: string;
  lookAt: [number, number, number];
  distance: number;
}

export class MapData {
  Factions: FactionData[] = $state([]);
  Systems: SystemData[] = $state([]);
  Spheres: SphereData[] = $state([]);

  Camera: CameraData = $state({ lookAtSystem: "", lookAt: [0, 0, 0], distance: 100 });

  // Setup Helpers
  addFaction({ name = "", displayName = "", color = randomColor() }) {
    if (!displayName) displayName = name;
    this.Factions.push({ name, displayName, color, visible: true });
  }
  addSystem({ name = "", displayName = "", color = randomColor() }) {
    if (!displayName) displayName = name;
    this.Systems.push({ name, displayName, color, visible: true });
  }
  addSphere({ name = "", type = "Fortified" as SphereType, color = randomColor() }) {
    this.Spheres.push({ name, type, color, visible: true });
  }

  sortAll() {
    this.Factions.sort((a, b) => a.displayName.localeCompare(b.displayName));
    this.Systems.sort((a, b) => a.displayName.localeCompare(b.displayName));
    this.Spheres.sort((a, b) => a.name.localeCompare(b.name));
  }
}
