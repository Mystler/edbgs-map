export interface FactionData {
  name: string;
  displayName: string;
  color: string;
  visible: boolean;
}

export type SystemData = FactionData;

export interface SphereData {
  name: string;
  color: string;
  type: "Fortified" | "Stronghold";
  visible: boolean;
}

export interface CameraData {
  lookAtSystem: string;
  distance: number;
}

export class MapData {
  Factions: FactionData[] = $state([]);
  Systems: SystemData[] = $state([]);
  Spheres: SphereData[] = $state([]);

  Camera: CameraData = $state({ lookAtSystem: "", distance: 100 });
}
