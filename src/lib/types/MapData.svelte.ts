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
  addFaction({ name = "", displayName = "", color = randomColor(), visible = true } = {}) {
    if (!displayName) displayName = name;
    this.Factions.push({ name, displayName, color, visible });
  }
  addSystem({ name = "", displayName = "", color = randomColor(), visible = true } = {}) {
    if (!displayName) displayName = name;
    this.Systems.push({ name, displayName, color, visible });
  }
  addSphere({
    name = "",
    type = "Fortified" as SphereType,
    color = randomColor(),
    visible = true,
  } = {}) {
    this.Spheres.push({ name, type, color, visible });
  }

  sortAll() {
    this.Factions.sort((a, b) => a.displayName.localeCompare(b.displayName));
    this.Systems.sort((a, b) => a.displayName.localeCompare(b.displayName));
    this.Spheres.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Select what to store when serializing map data.
   */
  toJSON(): Partial<MapData> {
    return {
      Factions: this.Factions,
      Systems: this.Systems,
      Spheres: this.Spheres,
      Camera: this.Camera,
    };
  }

  /**
   * Safely reconstruct map data from JSON storage by respecting defaults if data is missing.
   */
  static fromJSON(json: string): MapData {
    const obj = JSON.parse(json);
    const data = new MapData();

    if ("Factions" in obj && obj.Factions instanceof Array) {
      for (const faction of obj.Factions) {
        data.addFaction(faction);
      }
    }
    if ("Systems" in obj && obj.Systems instanceof Array) {
      for (const system of obj.Systems) {
        data.addSystem(system);
      }
    }
    if ("Spheres" in obj && obj.Spheres instanceof Array) {
      for (const sphere of obj.Spheres) {
        data.addSphere(sphere);
      }
    }
    if ("Camera" in obj) {
      Object.assign(data.Camera, obj.Camera);
    }

    return data;
  }
}
