<script lang="ts">
  import { SphereRanges, type SphereData } from "../types/MapData.svelte";
  import type { SpanshSystem } from "../SpanshAPI";
  import { base } from "$app/paths";
  import { onMount } from "svelte";
  import { T } from "@threlte/core";
  import { DoubleSide } from "three";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { scale3d } from "$lib/types/Animations.svelte";
  import { transitions, global } from "@threlte/extras";
  import SystemRenderGroup from "./SystemRenderGroup.svelte";

  interface Props {
    sphere: SphereData;
  }
  let { sphere = $bindable() }: Props = $props();

  transitions();

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
    // If a position was supplied, then don't fetch system from Spansh and create it manually
    if (sphere.name && sphere.position) {
      systemData = {
        name: sphere.name,
        x: sphere.position[0],
        y: sphere.position[1],
        z: sphere.position[2],
      };
    } else {
      fetchData().then((data) => {
        if (data) {
          systemData = data;
          sphere.position = [data.x, data.y, data.z];
        }
      });
    }
  });

  let colonizationLoaded = $state(false);
  export const isColonizationLoaded = () => colonizationLoaded;
  let colonizationTargets: SpanshSystem[] = $state([]);
  export function loadColonizationSystems() {
    if (!sphere.position) return;
    colonizationLoaded = true;
    const m = HUDInfo.showMessage(sphere.name, "Colonization Targets");
    fetch(
      `${base}/api/colonization/${sphere.position[0]}/${sphere.position[1]}/${sphere.position[2]}`,
    )
      .then((x) => x.json())
      .then((x) => {
        colonizationTargets = x;
        HUDInfo.removeMessage(m);
        if (colonizationTargets.length === 0) {
          alert("No valid colonization targets found!");
        }
      })
      .catch(() => {
        alert(`Error when fetching colonization targets for ${sphere.name}`);
        HUDInfo.removeMessage(m);
      });
  }
</script>

{#if systemData}
  <T.Mesh
    position={[systemData.x, systemData.y, -systemData.z]}
    visible={sphere.visible}
    transition={global(scale3d)}
  >
    {#if sphere.type === "ExpansionCube"}
      <T.BoxGeometry
        args={[SphereRanges[sphere.type], SphereRanges[sphere.type], SphereRanges[sphere.type]]}
      />
    {:else}
      <T.SphereGeometry args={[SphereRanges[sphere.type], 32, 32]} />
    {/if}
    <T.MeshBasicMaterial
      color={sphere.color}
      opacity={0.2}
      transparent={true}
      depthTest={false}
      side={DoubleSide}
    />
  </T.Mesh>
{/if}
{#if colonizationTargets.length > 0}
  <SystemRenderGroup systems={colonizationTargets} color={sphere.color} visible={sphere.visible} />
{/if}
