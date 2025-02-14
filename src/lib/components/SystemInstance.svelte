<script lang="ts">
  import { Billboard, Instance, useCursor, useInteractivity } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import { Spring } from "svelte/motion";
  import { CurrentMeasurement } from "./Measurement.svelte";
  import { getContext } from "svelte";
  import type { HUDInfo } from "$lib/types/HUDInfo";

  interface Props {
    system: SpanshSystem;
  }
  let { system }: Props = $props();

  useInteractivity();
  const { onPointerEnter: cursorEnter, onPointerLeave: cursorLeave } = useCursor();

  const systemScale = new Spring(1);
  const hudInfo: HUDInfo = getContext("hudInfo");
</script>

<Billboard position={[system.x, system.y, -system.z]}>
  <Instance
    onpointerenter={() => {
      cursorEnter();
      systemScale.target = 2;
      hudInfo.currentSystem = system.name;
    }}
    onpointerleave={() => {
      cursorLeave();
      systemScale.target = 1;
      hudInfo.currentSystem = "";
    }}
    scale={systemScale.current}
    onclick={() => {
      if (hudInfo.clickMode === "inara") {
        window.open(
          `https://inara.cz/elite/starsystem/?search=${encodeURIComponent(system.name)}`,
          "_blank",
        );
      } else if (hudInfo.clickMode === "measure") {
        CurrentMeasurement.addSystem(system.name, system.x, system.y, system.z);
      }
    }}
  />
</Billboard>
