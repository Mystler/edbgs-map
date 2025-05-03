<script lang="ts">
  import { Instance, useCursor, useInteractivity } from "@threlte/extras";
  import { type SpanshDumpPPData, type SpanshSystem } from "../SpanshAPI";
  import { Spring } from "svelte/motion";
  import { CurrentMeasurement } from "./Measurement.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { getContext } from "svelte";
  import type { MapData } from "$lib/types/MapData.svelte";
  import { LoadedSystems } from "$lib/types/LoadedData.svelte";
  import { Powers } from "$lib/Constants";
  import { T } from "@threlte/core";
  import type { Group, Matrix4 } from "three";
  import { base } from "$app/paths";
  import Dialog from "./Dialog.svelte";
  import {
    faCaretDown,
    faCaretLeft,
    faCaretRight,
    faCaretUp,
    faChevronDown,
    faChevronUp,
    faTriangleExclamation,
  } from "@fortawesome/free-solid-svg-icons";
  import FaIcon from "./FaIcon.svelte";
  import Time from "svelte-time";
  import { calculatePPControlSegments, getLastPPTickDate } from "$lib/Helpers";

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

  let ppData = $state<Promise<SpanshDumpPPData | null>>();
  let showPPData = $state(false);
  async function fetchPPData(): Promise<SpanshDumpPPData | null> {
    let id64 = system.id64;
    let response;
    if (!id64) {
      response = await fetch(`${base}/api/system/${system.name}`);
      if (!response.ok) {
        alert(`Error while fetching data for system: ${system.name}`);
        return null;
      }
      const idquery = (await response.json()) as SpanshSystem | null;
      id64 = idquery?.id64;
    }
    response = await fetch(`${base}/api/power/system/${id64}`);
    if (!response.ok) {
      alert(`Error while fetching powerplay data for system: ${system.name}`);
      return null;
    }
    const res = (await response.json()) as SpanshDumpPPData | null;
    return res;
  }
</script>

<T.Group position={[system.x, system.y, -system.z]} scale={systemScale.current}>
  <Instance
    oncreate={(ref) => {
      vInstance = ref as Group;
    }}
    id="visual"
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
      } else if (HUDInfo.ClickMode === "powerplay") {
        if (!ppData) {
          ppData = fetchPPData();
        }
        showPPData = true;
        HUDInfo.CurrentPPInfo = systemPPInfo;
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

{#snippet systemPPInfo()}
  {#if ppData && showPPData}
    <Dialog
      onclose={() => {
        showPPData = false;
      }}
      showImmediately={true}
    >
      <div class="text-center sm:min-w-sm">
        <h2 class="px-6">{system.name}</h2>
        {#await ppData}
          <div class="flex justify-center overflow-hidden">
            <span
              class="size-32 animate-spin rounded-full border-24 border-(--ed-orange) border-t-transparent"
            ></span>
          </div>
        {:then ppInfo}
          {#if ppInfo?.controllingPower}
            <!-- PP Control System Display -->
            {@const controlData = calculatePPControlSegments(ppInfo)}
            <h3 style={`color: ${Powers[ppInfo.controllingPower].color}`}>
              {ppInfo.controllingPower}
            </h3>
            <h4>{ppInfo.powerState}</h4>
            <div class="flex flex-col items-center gap-2">
              <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div class="flex items-center justify-end gap-2">
                  <span class="text-[#ff3632]">
                    {ppInfo.powerStateUndermining?.toLocaleString("en-US")}
                  </span>
                  <FaIcon class="text-[#ff3632]" icon={faCaretLeft} />
                </div>
                <span>Control Points</span>
                <div class="flex items-center justify-start gap-2">
                  <FaIcon class="text-[#00a5ff]" icon={faCaretRight} />
                  <span class="text-[#00a5ff]">
                    {ppInfo.powerStateReinforcement?.toLocaleString("en-US")}
                  </span>
                </div>
              </div>
              <div>
                <b>Cycle Start:</b>
                {(controlData.startProgress * 100).toFixed(2)}%
              </div>
              <div>
                <b>Segment Progress:</b>
                {((ppInfo.powerStateControlProgress ?? 0) * 100).toFixed(2)}%
                {#if (ppInfo.powerStateControlProgress ?? 0) > 1 && ppInfo.powerState !== "Stronghold"}
                  ({(controlData.adjustedProgress * 100).toFixed(2)}%)
                {/if}
                {#if (ppInfo.powerStateReinforcement ?? 0) > (ppInfo.powerStateUndermining ?? 0)}
                  <FaIcon class="inline text-[#00a5ff]" icon={faChevronUp} />
                {:else if (ppInfo.powerStateReinforcement ?? 0) < (ppInfo.powerStateUndermining ?? 0)}
                  <FaIcon class="inline text-[#ff3632]" icon={faChevronDown} />
                {/if}
              </div>
              <div class="relative w-full select-none">
                <div class="grid h-8 grid-cols-4">
                  <div class="bg-[#646464]"></div>
                  <div class="bg-[#b24241]"></div>
                  <div class="bg-[#519d52]"></div>
                  <div class="bg-[#985cb6]"></div>
                </div>
                {#if controlData.currentBar > controlData.startBar}
                  <div
                    class="progress-positive-a absolute top-0 h-4 grow-0"
                    style={`left: ${controlData.startBar * 100}%; right: ${(1 - controlData.currentBar) * 100}%;`}
                  ></div>
                  <div
                    class="progress-positive-b absolute top-4 h-4 grow-0"
                    style={`left: ${controlData.startBar * 100}%; right: ${(1 - controlData.currentBar) * 100}%;`}
                  ></div>
                {:else if controlData.currentBar < controlData.startBar}
                  <div
                    class="progress-negative-a absolute top-0 h-4 grow-0"
                    style={`left: ${controlData.currentBar * 100}%; right: ${(1 - controlData.startBar) * 100}%;`}
                  ></div>
                  <div
                    class="progress-negative-b absolute top-4 h-4 grow-0"
                    style={`left: ${controlData.currentBar * 100}%; right: ${(1 - controlData.startBar) * 100}%;`}
                  ></div>
                {/if}
                <div
                  class="absolute top-0 left-1/4 h-8 grow-0 -translate-x-1/2 border-r-2 border-dashed border-white"
                ></div>
                <div
                  class="absolute top-0 left-2/4 h-8 grow-0 -translate-x-1/2 border-r-2 border-dashed border-white"
                ></div>
                <div
                  class="absolute top-0 left-3/4 h-8 grow-0 -translate-x-1/2 border-r-2 border-dashed border-white"
                ></div>
                <div
                  class="absolute top-0 -translate-1/2 overflow-visible text-3xl text-white/60"
                  style={`left: ${controlData.startBar * 100}%`}
                >
                  <FaIcon icon={faCaretDown} />
                </div>
                <div
                  class="absolute -translate-1/2 overflow-visible text-3xl text-white"
                  style={`left: ${controlData.currentBar * 100}%`}
                >
                  <FaIcon icon={faCaretUp} />
                </div>
              </div>
              {@render ppLastUpdate(ppInfo)}
            </div>
          {:else if ppInfo?.powerConflictProgress}
            <!-- PP Acquisition / Contested System Display -->
            {@const sorted = ppInfo.powerConflictProgress.sort((a, b) => b.progress - a.progress)}
            {@const normalize = Math.max(sorted[0]?.progress ?? 1, 1)}
            <h3>Acquisition System</h3>
            {#if sorted.length >= 2 && sorted[1].progress >= 0.3}
              <p class="text-yellow-400">
                <FaIcon icon={faTriangleExclamation} class="inline" /> Conflict Threshold reached!
              </p>
            {/if}
            <div class="flex flex-col gap-2">
              {#each sorted as acqPower, index (acqPower.power)}
                <div>
                  <b>{index + 1}.</b>
                  <b style={`color: ${Powers[acqPower.power].color}`}>{acqPower.power}:</b>
                  {(acqPower.progress * 100).toFixed(2)}%
                </div>
                <div
                  class="h-8"
                  style={`background-color: ${Powers[acqPower.power].color}; width: ${(acqPower.progress / normalize) * 100}%`}
                ></div>
              {/each}
            </div>
            {@render ppLastUpdate(ppInfo)}
          {:else}
            <p>No Powerplay information found for this system.</p>
          {/if}
        {/await}
      </div>
    </Dialog>
  {/if}
{/snippet}

{#snippet ppLastUpdate(ppInfo: SpanshDumpPPData | null)}
  {#if ppInfo && ppInfo.date}
    {@const date = new Date(ppInfo.date)}
    {@const lastTick = getLastPPTickDate()}
    <p>
      <i>
        Last Update:<br />
        <Time
          class={{
            "text-red-500": date && date < lastTick,
            underline: true,
            "decoration-dashed": true,
            "decoration-1": true,
          }}
          relative
          live
          timestamp={ppInfo.date}
          title={date.toLocaleString()}
        />
      </i>
    </p>
  {/if}
{/snippet}

<style>
  .progress-positive-a {
    background: repeating-linear-gradient(45deg, #00a5ff, #00a5ff 5px, #4d5aa7 5px, #4d5aa7 10px);
  }
  .progress-positive-b {
    background: repeating-linear-gradient(135deg, #00a5ff, #00a5ff 5px, #4d5aa7 5px, #4d5aa7 10px);
  }
  .progress-negative-a {
    background: repeating-linear-gradient(-45deg, #ff3632, #ff3632 5px, #a5231f 5px, #a5231f 10px);
  }
  .progress-negative-b {
    background: repeating-linear-gradient(-135deg, #ff3632, #ff3632 5px, #a5231f 5px, #a5231f 10px);
  }
</style>
