import { quadInOut } from "svelte/easing";
import { Tween } from "svelte/motion";
import { Vector3 } from "three";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { LoadedSystems } from "./LoadedData.svelte";

export const CurrentCamera = new (class {
  Position: [x: number, y: number, z: number] = $state([10, 10, 10]);
  LookAt: [x: number, y: number, z: number] = $state([0, 0, 0]);

  PositionVector = $derived(new Vector3(...this.Position));
  LookAtVector = $derived(new Vector3(...this.LookAt));
  Distance = $derived(this.PositionVector.distanceTo(this.LookAtVector));

  Controls: OrbitControls | undefined = $state();

  toJSON(): Partial<typeof CurrentCamera> {
    return { Position: this.Position, LookAt: this.LookAt };
  }
})();

export const FlyToTarget = new Tween(
  {
    targetX: 0,
    targetY: 0,
    targetZ: 0,
    posX: 0,
    posY: 0,
    posZ: 0,
  },
  { easing: quadInOut, duration: 1000 },
);

export const FlyToSystemOnceLoaded = $state({ value: "" });

export function FlyToSystem(name: string): boolean {
  const system = LoadedSystems.get(name.trim());
  if (system) {
    if (CurrentCamera.LookAtVector.distanceTo(new Vector3(system.x, system.y, -system.z)) > 0.1) {
      // Hard set tween to current position first
      FlyToTarget.set(
        {
          targetX: CurrentCamera.LookAt[0],
          targetY: CurrentCamera.LookAt[1],
          targetZ: CurrentCamera.LookAt[2],
          posX: CurrentCamera.Position[0],
          posY: CurrentCamera.Position[1],
          posZ: CurrentCamera.Position[2],
        },
        { duration: 0 },
      );
      // Set actual fly targets for both lookAt and position, maintaining camera distance
      FlyToTarget.set({
        targetX: system.x,
        targetY: system.y,
        targetZ: -system.z,
        posX: system.x + CurrentCamera.Position[0] - CurrentCamera.LookAt[0],
        posY: system.y + CurrentCamera.Position[1] - CurrentCamera.LookAt[1],
        posZ: -system.z + CurrentCamera.Position[2] - CurrentCamera.LookAt[2],
      });
    }
    return true;
  }
  return false;
}
