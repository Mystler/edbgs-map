<script lang="ts">
  import { T } from "@threlte/core";
  import { InstancedMesh, MeshLineGeometry, MeshLineMaterial } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import SystemInstance from "./SystemInstance.svelte";
  import { DoubleSide, Vector3 } from "three";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";
  import { quadIn } from "svelte/easing";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";

  interface Props {
    systems: SpanshSystem[];
    color: string;
    visible?: boolean;
  }
  let { systems, color, visible = true }: Props = $props();
</script>

<!-- Render systems themselves -->
<InstancedMesh limit={systems.length} range={systems.length} {visible}>
  <T.CircleGeometry args={[0.5]} />
  <T.MeshBasicMaterial {color} />

  {#each systems as system (system.id64)}
    <SystemInstance {system} />
  {/each}
</InstancedMesh>

<!-- Render grid connectors -->
{#if HUDInfo.ShowGrid && visible}
  {#each systems as system (system.id64)}
    {@const pointSystem = new Vector3(system.x, system.y, -system.z)}
    {@const pointConnector = new Vector3(
      pointSystem.x,
      CurrentCamera.LookAtVector.y,
      pointSystem.z,
    )}
    {@const opacity =
      1 - // Flip curve to turn fading range into opacity
      quadIn(
        // Easing function for our range between 0 and 1
        Math.min(
          // Create a 0-1 range that is the max of three fading thresholds
          1,
          Math.max(
            CurrentCamera.Distance / 50, // Camera zoom distance
            pointConnector.distanceTo(pointSystem) / 15, // Connector length
            CurrentCamera.LookAtVector.distanceTo(pointSystem) / 30, // System to lookAt distance
          ),
        ),
      )}
    {#if opacity > 0}
      <T.Group>
        <T.Mesh>
          <MeshLineGeometry points={[pointSystem, pointConnector]} />
          <MeshLineMaterial width={0.1} color="#ffffff" {opacity} transparent depthWrite={false} />
        </T.Mesh>
        <T.Mesh position={pointConnector.toArray()} rotation={[-Math.PI / 2, 0, 0]}>
          <T.CircleGeometry args={[0.33]} />
          <T.MeshBasicMaterial
            color="#ffffff"
            {opacity}
            transparent
            depthWrite={false}
            side={DoubleSide}
          />
        </T.Mesh>
      </T.Group>
    {/if}
  {/each}
{/if}
