<script lang="ts">
  import type { SphereData } from "../types/MapData.svelte";
  import type { SpanshSystem } from "../SpanshAPI";
  import { base } from "$app/paths";
  import { onMount } from "svelte";
  import { T } from "@threlte/core";
  import { DoubleSide } from "three";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";

  interface Props {
    sphere: SphereData;
  }
  let { sphere }: Props = $props();

  async function fetchData(): Promise<SpanshSystem | null> {
    const m = HUDInfo.showMessage(sphere.name, "Sphere");
    let response = await fetch(`${base}/api/system/${sphere.name}`);
    HUDInfo.removeMessage(m);
    if (!response.ok) {
      alert(`Error while fetching data from Spansh.co.uk for sphere: ${sphere.name}`);
      return null;
    }
    const res = (await response.json()) as SpanshSystem | null;
    if (!res) alert(`Could not find sphere system: ${sphere.name}`);
    return res;
  }

  let systemData: SpanshSystem | undefined = $state();

  onMount(() => {
    fetchData().then((data) => {
      if (data) systemData = data;
    });
  });
</script>

{#if systemData}
  <T.Mesh position={[systemData.x, systemData.y, -systemData.z]} visible={sphere.visible}>
    <T.SphereGeometry args={[sphere.type === "Stronghold" ? 30 : 20]} />
    <T.MeshBasicMaterial
      color={sphere.color}
      opacity={0.4}
      transparent={true}
      depthWrite={false}
      side={DoubleSide}
    />
  </T.Mesh>
{/if}
