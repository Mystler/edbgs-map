<script lang="ts">
  import { Instance, useCursor, useInteractivity } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import { Spring } from "svelte/motion";
  import { CurrentMeasurement } from "./Measurement.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { getContext } from "svelte";
  import type { MapData } from "$lib/types/MapData.svelte";
  import { LoadedSystems } from "$lib/types/LoadedData.svelte";
  import { Powers } from "$lib/Constants";
  import { T } from "@threlte/core";
  import type { Group, Matrix4 } from "three";

  interface Props {
    system: SpanshSystem;
    zOffset?: number;
    visible?: boolean;
    update?: (mat: Matrix4) => void;
  }
  let { system, visible = true, update = () => {} }: Props = $props();

  useInteractivity();
  const { onPointerEnter: cursorEnter, onPointerLeave: cursorLeave } = useCursor();

  const systemScale = new Spring(1, {
    stiffness: 0.15,
    damping: 0.25,
  });

  const mapData: MapData = getContext("mapData");

  LoadedSystems.set(system.name, system);
  let vInstance: Group;

  $effect.pre(() => {
    if (systemScale.target != systemScale.current) {
      // Only cause matrix recalculations when we are actually animating. Re-use same matrix for both visual and raycast mesh.
      vInstance.updateMatrix();
      update(vInstance.matrixWorld);
    }
  });
</script>

<T.Group position={[system.x, system.y, -system.z]}>
  <Instance
    oncreate={(ref) => {
      vInstance = ref as Group;
    }}
    id="visual"
    scale={systemScale.current}
  />
  <Instance
    id="raycast"
    {visible}
    onpointerenter={() => {
      cursorEnter();
      systemScale.target = 2;
      HUDInfo.CurrentSystemInfo = systemInfo;
    }}
    onpointerleave={() => {
      cursorLeave();
      systemScale.target = 1;
      HUDInfo.CurrentSystemInfo = undefined;
    }}
    scale={systemScale.current}
    onclick={() => {
      if (HUDInfo.ClickMode === "inara") {
        window.open(
          `https://inara.cz/elite/starsystem/?search=${encodeURIComponent(system.name)}`,
          "_blank",
        );
      } else if (HUDInfo.ClickMode === "edsm") {
        window.open(
          `https://www.edsm.net/en/system/id//name?systemName=${encodeURIComponent(system.name)}`,
          "_blank",
        );
      } else if (HUDInfo.ClickMode === "spansh") {
        if (system.id64)
          window.open(`https://spansh.co.uk/system/${encodeURIComponent(system.id64)}`, "_blank");
        else
          window.open(`https://spansh.co.uk/search/${encodeURIComponent(system.name)}`, "_blank");
      } else if (HUDInfo.ClickMode === "measure") {
        CurrentMeasurement.addSystem(system.name, system.x, system.y, system.z);
      } else if (HUDInfo.ClickMode === "range") {
        const i = mapData.Spheres.findIndex((sphere) => sphere.name === system.name);
        if (i >= 0) {
          mapData.Spheres.splice(i, 1);
        } else {
          const type =
            system.power_state === "Stronghold"
              ? "Stronghold"
              : system.power_state === "Fortified"
                ? "Fortified"
                : "Colonization";
          mapData.addSphere({
            name: system.name,
            color:
              type === "Stronghold" || type === "Fortified"
                ? Powers[system.controlling_power!].color
                : "#ffffff",
            position: [system.x, system.y, system.z],
            type,
          });
        }
      }
    }}
  />
</T.Group>

{#snippet systemInfo()}
  <div>{system.name}</div>
  {#if system.controlling_power}
    <div class="text-2xl" style={`color: ${Powers[system.controlling_power].color}`}>
      {system.controlling_power} ({system.power_state})
    </div>
  {/if}
{/snippet}
