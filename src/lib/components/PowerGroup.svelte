<script lang="ts">
  import type { PowerData } from "../types/MapData.svelte";
  import SystemRenderGroup from "./SystemRenderGroup.svelte";
  import { resolve } from "$app/paths";
  import type { SpanshSystem } from "../SpanshAPI";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { untrack } from "svelte";

  interface Props {
    power: PowerData;
  }
  let { power }: Props = $props();

  async function fetchData(): Promise<SpanshSystem[]> {
    const m = HUDInfo.showMessage(power.name, "Power");
    let response = await fetch(resolve(`/api/power/${power.name}`));
    HUDInfo.removeMessage(m);
    if (!response.ok) {
      alert(`Error while fetching data for power: ${power.name}`);
      return [];
    }
    const systems = (await response.json()) as SpanshSystem[];
    if (systems.length === 0) alert(`Could not find any systems controlled by power: ${power.name}`);
    return systems;
  }

  let exploiteds: SpanshSystem[] = $state([]);
  let fortifieds: SpanshSystem[] = $state([]);
  let strongholds: SpanshSystem[] = $state([]);

  $effect(() => {
    if (power.name) {
      untrack(() => {
        fetchData().then((data) => {
          exploiteds = data.filter((x) => x.power_state === "Exploited");
          fortifieds = data.filter((x) => x.power_state === "Fortified");
          strongholds = data.filter((x) => x.power_state === "Stronghold");
        });
      });
    }
  });
</script>

{#key exploiteds}
  {#if exploiteds.length > 0}
    <SystemRenderGroup systems={exploiteds} color={power.color} visible={power.exploitedVisible} />
  {/if}
{/key}
{#key fortifieds}
  {#if fortifieds.length > 0}
    <SystemRenderGroup systems={fortifieds} color={power.color} visible={power.fortifiedVisible} starType="triangle" />
  {/if}
{/key}
{#key strongholds}
  {#if strongholds.length > 0}
    <SystemRenderGroup systems={strongholds} color={power.color} visible={power.strongholdVisible} starType="star" />
  {/if}
{/key}
