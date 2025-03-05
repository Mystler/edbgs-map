import { quadInOut } from "svelte/easing";
import { Tween } from "svelte/motion";
import { Vector3 } from "three";

export const CurrentCamera = new (class {
  Position: [x: number, y: number, z: number] = $state([10, 10, 10]);
  LookAt: [x: number, y: number, z: number] = $state([0, 0, 0]);

  PositionVector = $derived(new Vector3(...this.Position));
  LookAtVector = $derived(new Vector3(...this.LookAt));
  Distance = $derived(this.PositionVector.distanceTo(this.LookAtVector));

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
