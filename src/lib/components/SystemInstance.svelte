<script lang="ts">
  import { Billboard, Instance, useCursor, useInteractivity } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import { Spring } from "svelte/motion";
  import { CurrentMeasurement } from "./Measurement.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { getContext } from "svelte";
  import type { MapData } from "$lib/types/MapData.svelte";
  import { LoadedSystems } from "$lib/types/LoadedData.svelte";

  interface Props {
    system: SpanshSystem;
    zOffset?: number;
  }
  let { system, zOffset = 0 }: Props = $props();

  useInteractivity();
  const { onPointerEnter: cursorEnter, onPointerLeave: cursorLeave } = useCursor();

  const systemScale = new Spring(1, {
    stiffness: 0.15,
    damping: 0.25,
  });

  const mapData: MapData = getContext("mapData");

  LoadedSystems.set(system.name, system);
</script>

<Billboard position={[system.x, system.y, -system.z]}>
  <Instance
    onpointerenter={() => {
      cursorEnter();
      systemScale.target = 2;
      HUDInfo.CurrentSystem = system.name;
    }}
    onpointerleave={() => {
      cursorLeave();
      systemScale.target = 1;
      HUDInfo.CurrentSystem = "";
    }}
    position.z={zOffset * 0.01}
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
          mapData.addSphere({
            name: system.name,
            color: "#ffffff",
            position: [system.x, system.y, system.z],
          });
        }
      }
    }}
  />
</Billboard>
