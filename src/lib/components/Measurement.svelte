<script module lang="ts">
  import { DoubleSide, Vector3 } from "three";
  import { T, useTask } from "@threlte/core";
  import { MeshLineGeometry, MeshLineMaterial } from "@threlte/extras";
  import { fade } from "$lib/types/Animations.svelte";

  interface MeasurementSystem {
    name: string;
    x: number;
    y: number;
    z: number;
  }
  class Measurement {
    #Systems: MeasurementSystem[] = $state([]);

    addSystem(name: string, x: number, y: number, z: number) {
      if (this.#Systems.length >= 2) this.#Systems.shift();
      this.#Systems.push({ name, x, y, z });
    }

    getDistance(): number {
      if (this.#Systems.length !== 2) return 0;
      const a = new Vector3(this.#Systems[0].x, this.#Systems[0].y, this.#Systems[0].z);
      const b = new Vector3(this.#Systems[1].x, this.#Systems[1].y, this.#Systems[1].z);
      return a.distanceTo(b);
    }

    get A(): string {
      return this.#Systems[0].name;
    }
    get B(): string {
      return this.#Systems[1].name;
    }

    get Points(): Vector3[] {
      if (this.#Systems.length !== 2) return [];
      return [
        new Vector3(this.#Systems[0].x, this.#Systems[0].y, -this.#Systems[0].z),
        new Vector3(this.#Systems[1].x, this.#Systems[1].y, -this.#Systems[1].z),
      ];
    }

    HUDSnippet = HUDInfo;
  }

  export const CurrentMeasurement = new Measurement();
</script>

<script lang="ts">
  let dashOffset = $state(0);
  useTask(
    (delta) => {
      dashOffset -= delta / 20;
    },
    { autoInvalidate: false },
  );

  let points = $derived(CurrentMeasurement.Points);
</script>

{#snippet HUDInfo()}
  {@const distance = CurrentMeasurement.getDistance()}
  {#if distance > 0}
    <div transition:fade>
      {CurrentMeasurement.A} &mdash; {CurrentMeasurement.B}: {distance.toFixed(2)} Ly
    </div>
  {/if}
{/snippet}

{#if points.length > 0}
  <T.Mesh>
    <MeshLineGeometry {points} />
    <MeshLineMaterial
      width={0.25}
      color="#ffffff"
      transparent
      depthWrite={false}
      dashArray={0.05}
      dashRatio={0.2}
      {dashOffset}
      side={DoubleSide}
    />
  </T.Mesh>
{/if}
