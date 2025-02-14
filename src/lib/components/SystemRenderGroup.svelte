<script lang="ts">
  import { T } from "@threlte/core";
  import { InstancedMesh } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import SystemInstance from "./SystemInstance.svelte";

  interface Props {
    systems: SpanshSystem[];
    color: string;
    visible?: boolean;
  }
  let { systems, color, visible = true }: Props = $props();
</script>

<InstancedMesh limit={systems.length} range={systems.length} {visible}>
  <T.CircleGeometry />
  <T.MeshBasicMaterial {color} />

  {#each systems as system (system.id64)}
    <SystemInstance {system} />
  {/each}
</InstancedMesh>
