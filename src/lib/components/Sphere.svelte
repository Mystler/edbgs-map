<script lang="ts">
  import { SphereRanges, type SphereData } from "../types/MapData.svelte";
  import type { SpanshSystem } from "../SpanshAPI";
  import { resolve } from "$app/paths";
  import { onMount } from "svelte";
  import { T } from "@threlte/core";
  import { DoubleSide, Vector3 } from "three";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { scale3d } from "$lib/types/Animations.svelte";
  import { transitions, global } from "@threlte/extras";
  import SystemRenderGroup from "./SystemRenderGroup.svelte";
  import { LoadedSystems } from "$lib/types/LoadedData.svelte";

  interface Props {
    sphere: SphereData;
  }
  let { sphere = $bindable() }: Props = $props();

  transitions();

  async function fetchData(): Promise<SpanshSystem | null> {
    const m = HUDInfo.showMessage(sphere.name, "Sphere");
    let response = await fetch(resolve(`/api/system/${sphere.name}`));
    HUDInfo.removeMessage(m);
    if (!response.ok) {
      alert(`Error while fetching data for sphere: ${sphere.name}`);
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
      LoadedSystems.set(sphere.name, systemData);
    } else {
      fetchData().then((data) => {
        if (data) {
          systemData = data;
          sphere.position = [data.x, data.y, data.z];
          LoadedSystems.set(sphere.name, data);
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
    fetch(resolve(`/api/colonization/${sphere.position[0]}/${sphere.position[1]}/${sphere.position[2]}`))
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

  let acquisitionLoaded = $state(false);
  export const isAcquisitionLoaded = () => acquisitionLoaded;
  let acquisitionTargets: SpanshSystem[] = $state([]);
  export function loadAcquisitionSystems() {
    if (!sphere.position) return;
    acquisitionLoaded = true;
    const m = HUDInfo.showMessage(sphere.name, "Acquisition Targets");
    fetch(resolve(`/api/acquisition/${sphere.position[0]}/${sphere.position[1]}/${sphere.position[2]}`))
      .then((x) => x.json())
      .then((x) => {
        acquisitionTargets = x;
        HUDInfo.removeMessage(m);
        if (acquisitionTargets.length === 0) {
          alert("No valid acquisition targets found!");
        }
      })
      .catch(() => {
        alert(`Error when fetching acquisition targets for ${sphere.name}`);
        HUDInfo.removeMessage(m);
      });
  }
  let filteredAcquisitonTargets = $derived(
    acquisitionTargets.filter(
      (x) =>
        sphere.position &&
        new Vector3(x.x, x.y, x.z).distanceTo(
          new Vector3(sphere.position[0], sphere.position[1], sphere.position[2]),
        ) <= (sphere.type === "Stronghold" ? 30 : 20),
    ),
  );
</script>

{#if systemData}
  <T.Mesh position={[systemData.x, systemData.y, -systemData.z]} visible={sphere.visible} transition={global(scale3d)}>
    {#if sphere.type === "ExpansionCube"}
      <T.BoxGeometry args={[SphereRanges[sphere.type], SphereRanges[sphere.type], SphereRanges[sphere.type]]} />
    {:else}
      <T.SphereGeometry args={[SphereRanges[sphere.type], 32, 32]} />
    {/if}
    <T.MeshBasicMaterial color={sphere.color} opacity={0.2} transparent={true} depthTest={false} side={DoubleSide} />
  </T.Mesh>
{/if}
{#if sphere.type === "Colonization" && colonizationTargets.length > 0}
  <SystemRenderGroup systems={colonizationTargets} color={sphere.color} visible={sphere.visible} />
{/if}
{#if ["Fortified", "Stronghold"].includes(sphere.type) && filteredAcquisitonTargets.length > 0}
  {#key filteredAcquisitonTargets}
    <SystemRenderGroup systems={filteredAcquisitonTargets} color="#ffffff" visible={sphere.visible} />
  {/key}
{/if}
