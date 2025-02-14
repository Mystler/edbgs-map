<script lang="ts">
  import type { SystemData } from "../types/MapData.svelte";
  import SystemRenderGroup from "./SystemRenderGroup.svelte";
  import { base } from "$app/paths";
  import { Billboard, Text } from "@threlte/extras";
  import type { SpanshSystem } from "../SpanshAPI";
  import { onMount } from "svelte";
  import { DefaultMapFont } from "../Constants";

  interface Props {
    system: SystemData;
  }
  let { system }: Props = $props();

  if (!system.displayName) {
    system.displayName = system.name;
  }

  async function fetchData(): Promise<SpanshSystem | null> {
    let response = await fetch(`${base}/api/system/${system.name}`);
    if (!response.ok) {
      alert(`Could not find system: ${system.name}`);
      return null;
    }
    return response.json();
  }

  let systemData: SpanshSystem | undefined = $state();

  onMount(() => {
    fetchData().then((data) => {
      if (data) systemData = data;
    });
  });
</script>

{#if systemData}
  <SystemRenderGroup systems={[systemData]} color={system.color} visible={system.visible} />
  <Billboard position={[systemData.x, systemData.y + 2, -systemData.z]}>
    <Text
      text={system.displayName}
      font={DefaultMapFont}
      fontSize={5}
      anchorX="center"
      anchorY="bottom"
      color={system.color}
      outlineColor="black"
      outlineWidth={0.25}
    />
  </Billboard>
{/if}
