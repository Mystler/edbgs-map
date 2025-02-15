<script lang="ts">
  import type { SystemData } from "../types/MapData.svelte";
  import SystemRenderGroup from "./SystemRenderGroup.svelte";
  import { base } from "$app/paths";
  import { Billboard, Text } from "@threlte/extras";
  import type { SpanshSystem } from "../SpanshAPI";
  import { onMount } from "svelte";
  import { DefaultMapFont } from "../Constants";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";

  interface Props {
    system: SystemData;
  }
  let { system }: Props = $props();

  if (!system.displayName) {
    system.displayName = system.name;
  }

  async function fetchData(): Promise<SpanshSystem | null> {
    const m = HUDInfo.showMessage(system.name, "System");
    let response = await fetch(`${base}/api/system/${system.name}`);
    HUDInfo.removeMessage(m);
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
  <Billboard position={[systemData.x, systemData.y + 2, -systemData.z]} visible={system.visible}>
    <Text
      text={system.displayName}
      font={DefaultMapFont}
      fontSize={3}
      anchorX="center"
      anchorY="bottom"
      color={system.color}
      outlineColor="black"
      outlineWidth={0.25}
    />
  </Billboard>
{/if}
