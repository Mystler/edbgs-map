<script lang="ts">
  import { T } from "@threlte/core";
  import { Instance, InstancedMesh } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import SystemInstance from "./SystemInstance.svelte";
  import { DoubleSide, Vector3 } from "three";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";
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
<InstancedMesh id="line" limit={systems.length} range={systems.length} frustumCulled={false}>
  <T.PlaneGeometry
    args={[0.1, 1]}
    oncreate={(ref) => {
      ref.translate(0, 0.5, 0);
    }}
  />
  <T.MeshBasicMaterial color="#ffffff" side={DoubleSide} />

  <InstancedMesh id="circle" limit={systems.length} range={systems.length} frustumCulled={false}>
    <T.CircleGeometry args={[0.33]} />
    <T.MeshBasicMaterial color="#ffffff" side={DoubleSide} />

    {#each systems as system (system.id64)}
      {@const pointSystem = new Vector3(system.x, system.y, -system.z)}
      {@const pointConnector = new Vector3(
        pointSystem.x,
        CurrentCamera.LookAtVector.y,
        pointSystem.z,
      )}
      {@const showConnector =
        CurrentCamera.Distance <= 50 &&
        pointConnector.distanceTo(pointSystem) <= 15 &&
        CurrentCamera.LookAtVector.distanceTo(pointSystem) <= 50}
      {#if HUDInfo.ShowGrid && visible && showConnector}
        <Instance
          id="line"
          position={pointConnector.toArray()}
          rotation.y={Math.atan2(
            CurrentCamera.PositionVector.x - pointSystem.x,
            CurrentCamera.PositionVector.z - pointSystem.z,
          )}
          scale.y={pointSystem.y -
            pointConnector.y -
            Math.sign(pointSystem.y - pointConnector.y) * 0.1}
        />
        <Instance id="circle" position={pointConnector.toArray()} rotation={[-Math.PI / 2, 0, 0]} />
      {/if}
    {/each}
  </InstancedMesh>
</InstancedMesh>
