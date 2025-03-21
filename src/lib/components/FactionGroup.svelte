<script lang="ts">
  import type { FactionData } from "../types/MapData.svelte";
  import SystemRenderGroup from "./SystemRenderGroup.svelte";
  import { base } from "$app/paths";
  import { Billboard, Text } from "@threlte/extras";
  import type { SpanshSystem } from "../SpanshAPI";
  import { onMount } from "svelte";
  import { DefaultMapFont } from "../Constants";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";

  interface Props {
    faction: FactionData;
  }
  let { faction }: Props = $props();

  let isNC = $state(false);

  async function fetchData(): Promise<SpanshSystem[]> {
    isNC = faction.name.endsWith(" (NC)");
    const queryName = isNC ? faction.name.slice(0, -5) : faction.name;
    const m = HUDInfo.showMessage(faction.name, "Faction");
    let response = await fetch(`${base}/api/faction/${queryName}${isNC ? "/nc" : ""}`);
    HUDInfo.removeMessage(m);
    if (!response.ok) {
      alert(`Error while fetching data for faction: ${faction.name}`);
      return [];
    }
    const systems = (await response.json()) as SpanshSystem[];
    if (systems.length === 0)
      alert(`Could not find any systems controlled by faction: ${faction.name}`);
    return systems;
  }

  let textPosition: [x: number, y: number, z: number] = $state([0, 0, 0]);
  let systems: SpanshSystem[] = $state([]);

  onMount(() => {
    fetchData().then((data) => {
      systems = data;
      let mins = [100000, 100000, 100000],
        maxs = [-100000, -100000, -100000];
      for (const system of systems) {
        mins = [
          Math.min(mins[0], system.x),
          Math.min(mins[1], system.y),
          Math.min(mins[2], -system.z),
        ];
        maxs = [
          Math.max(maxs[0], system.x),
          Math.max(maxs[1], system.y),
          Math.max(maxs[2], -system.z),
        ];
        textPosition = [
          (mins[0] + maxs[0]) / 2,
          (mins[1] + maxs[1]) / 2 + 2,
          (mins[2] + maxs[2]) / 2,
        ];
      }
    });
  });
</script>

{#key systems}
  {#if systems.length > 0}
    <SystemRenderGroup
      {systems}
      color={faction.color}
      visible={faction.visible}
      zOffset={isNC ? -1 : 0}
    />
    <Billboard
      position={textPosition}
      visible={faction.visible}
      scale={Math.max(0.1, Math.min(1, CurrentCamera.Distance / 100))}
    >
      <Text
        visible={faction.labelVisible}
        text={faction.displayName}
        font={DefaultMapFont}
        fontSize={5}
        anchorX="center"
        anchorY="bottom"
        color={faction.color}
        outlineColor="black"
        outlineWidth={0.2}
      />
    </Billboard>
  {/if}
{/key}
