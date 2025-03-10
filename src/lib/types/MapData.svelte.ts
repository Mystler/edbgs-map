import { randomColor } from "$lib/Helpers";

export interface FactionData {
  name: string;
  displayName: string;
  color: string;
  visible: boolean;
  labelVisible: boolean;
}

export interface SystemData extends FactionData {
  position?: [x: number, y: number, z: number];
}

export type SphereType = "Fortified" | "Stronghold" | "Colonization" | "ExpansionCube";
export interface SphereData {
  name: string;
  color: string;
  type: SphereType;
  visible: boolean;
  position?: [x: number, y: number, z: number];
}
export const SphereRanges: { [k in SphereType]: number } = {
  Fortified: 20,
  Stronghold: 30,
  Colonization: 15,
  ExpansionCube: 40,
};

/**
 * Intended priority of usage:
 * 1. If lookAtSystem is not empty, use it and distance.
 * 2. Use lookAt, if set; use 0,0,0 otherwise.
 * 3. Use position if set; apply distance along unit vector 1,1,1 to lookAt otherwise.
 */
export interface CameraData {
  lookAtSystem: string;
  distance: number;
  position?: [x: number, y: number, z: number];
  lookAt?: [x: number, y: number, z: number];
}

export class MapData {
  Factions: FactionData[] = $state([]);
  Systems: SystemData[] = $state([]);
  Spheres: SphereData[] = $state([]);

  Camera: CameraData = $state({ lookAtSystem: "", distance: 100 });

  reset() {
    this.Factions = [];
    this.Systems = [];
    this.Spheres = [];
    this.Camera = { lookAtSystem: "", distance: 100 };
  }

  // Setup Helpers
  addFaction({
    name = "",
    displayName = "",
    color = randomColor(),
    visible = true,
    labelVisible = true,
  }: Partial<FactionData> = {}) {
    if (name && this.Factions.some((x) => x.name === name)) return;
    if (!displayName) displayName = name;
    this.Factions.push({ name, displayName, color, visible, labelVisible });
  }
  addSystem({
    name = "",
    displayName = "",
    color = randomColor(),
    visible = true,
    labelVisible = true,
    position = undefined,
  }: Partial<SystemData> = {}) {
    if (name && this.Systems.some((x) => x.name === name)) return;
    if (!displayName) displayName = name;
    this.Systems.push({ name, displayName, color, visible, labelVisible, position });
  }
  addSphere({
    name = "",
    type = "Colonization" as SphereType,
    color = randomColor(),
    visible = true,
    position = undefined,
  }: Partial<SphereData> = {}) {
    if (name && this.Spheres.some((x) => x.name === name)) return;
    this.Spheres.push({ name, type, color, visible, position });
  }

  sortAll() {
    this.Factions.sort((a, b) => a.displayName.localeCompare(b.displayName));
    this.Systems.sort((a, b) => a.displayName.localeCompare(b.displayName));
    this.Spheres.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Select what to store when serializing map data.
   * We do NOT store any camera data automatically!
   */
  toJSON(): Partial<MapData> {
    return {
      Factions: this.Factions,
      Systems: this.Systems,
      Spheres: this.Spheres,
    };
  }

  /**
   * Safely reconstruct map data from JSON storage by respecting defaults if data is missing.
   * This does not load or change any camera data automatically but will reset it to the defaults!
   */
  setFromJSON(json: string) {
    this.reset();

    const obj = JSON.parse(json);
    if ("Factions" in obj && obj.Factions instanceof Array) {
      for (const faction of obj.Factions) {
        this.addFaction(faction);
      }
    }
    if ("Systems" in obj && obj.Systems instanceof Array) {
      for (const system of obj.Systems) {
        this.addSystem(system);
      }
    }
    if ("Spheres" in obj && obj.Spheres instanceof Array) {
      for (const sphere of obj.Spheres) {
        this.addSphere(sphere);
      }
    }
  }
}
