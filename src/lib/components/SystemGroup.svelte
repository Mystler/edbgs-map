<script lang="ts">
  import type { SystemData } from "../types/MapData.svelte";
  import SystemRenderGroup from "./SystemRenderGroup.svelte";
  import { base } from "$app/paths";
  import { Billboard, Text } from "@threlte/extras";
  import type { SpanshSystem } from "../SpanshAPI";
  import { onMount } from "svelte";
  import { DefaultMapFont } from "../Constants";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";

  interface Props {
    system: SystemData;
  }
  let { system = $bindable() }: Props = $props();

  if (!system.displayName) {
    system.displayName = system.name;
  }

  async function fetchData(): Promise<SpanshSystem | null> {
    const m = HUDInfo.showMessage(system.name, "System");
    let response = await fetch(`${base}/api/system/${system.name}`);
    HUDInfo.removeMessage(m);
    if (!response.ok) {
      alert(`Error while fetching data from Spansh.co.uk for system: ${system.name}`);
      return null;
    }
    const res = (await response.json()) as SpanshSystem | null;
    if (!res) alert(`Could not find system: ${system.name}`);
    return res;
  }

  let systemData: SpanshSystem | undefined = $state();

  onMount(() => {
    // If a position was supplied, then don't fetch system from Spansh and create it manually
    if (system.name && system.position) {
      systemData = {
        name: system.name,
        x: system.position[0],
        y: system.position[1],
        z: system.position[2],
      };
    } else {
      fetchData().then((data) => {
        if (data) {
          systemData = data;
          system.position = [data.x, data.y, data.z];
        }
      });
    }
  });
</script>

{#if systemData}
  <SystemRenderGroup
    systems={[systemData]}
    color={system.color}
    visible={system.visible}
    zOffset={-1}
  />
  <Billboard
    position={[systemData.x, systemData.y + 1, -systemData.z]}
    visible={system.visible}
    scale={Math.max(0.1, Math.min(1, CurrentCamera.Distance / 100))}
  >
    <Text
      visible={system.labelVisible}
      text={system.displayName}
      font={DefaultMapFont}
      fontSize={3}
      anchorX="center"
      anchorY="bottom"
      color={system.color}
      outlineColor="black"
      outlineWidth={0.1}
    />
  </Billboard>
{/if}
