<script lang="ts">
  import type { FactionData } from "../types/MapData.svelte";
  import SystemRenderGroup from "./SystemRenderGroup.svelte";
  import { resolve } from "$app/paths";
  import { Billboard, Text } from "@threlte/extras";
  import type { SpanshSystem } from "../SpanshAPI";
  import { onMount } from "svelte";
  import { DefaultMapFont } from "../Constants";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";
  import { calculateGeometricMedian } from "$lib/Helpers";

  interface Props {
    faction: FactionData;
  }
  let { faction }: Props = $props();

  let isNC = $state(false);

  async function fetchData(): Promise<SpanshSystem[]> {
    isNC = faction.name.endsWith(" (NC)");
    const queryName = isNC ? faction.name.slice(0, -5) : faction.name;
    const m = HUDInfo.showMessage(faction.name, "Faction");
    let response = await fetch(resolve(`/api/faction/${queryName}${isNC ? "/nc" : ""}`));
    HUDInfo.removeMessage(m);
    if (!response.ok) {
      alert(`Error while fetching data for faction: ${faction.name}`);
      return [];
    }
    const systems = (await response.json()) as SpanshSystem[];
    if (systems.length === 0) alert(`Could not find any systems controlled by faction: ${faction.name}`);
    return systems;
  }

  let textPosition: [x: number, y: number, z: number] = $state([0, 0, 0]);
  let systems: SpanshSystem[] = $state([]);

  onMount(() => {
    fetchData().then((data) => {
      systems = data;

      if (systems.length === 0) return;
      const median = calculateGeometricMedian(systems);
      textPosition = [median.x, median.y + 2, -median.z];
    });
  });
</script>

{#key systems}
  {#if systems.length > 0}
    <SystemRenderGroup {systems} color={faction.color} visible={faction.visible} zOffset={isNC ? -1 : 0} />
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
