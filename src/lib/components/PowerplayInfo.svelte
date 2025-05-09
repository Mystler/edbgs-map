<script lang="ts">
  import { base } from "$app/paths";
  import type { SpanshDumpPPData, SpanshSystem } from "$lib/SpanshAPI";
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
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { Powers } from "$lib/Constants";
  import Tooltip from "./Tooltip.svelte";

  async function fetchPPData(): Promise<SpanshDumpPPData | null> {
    const system = HUDInfo.CurrentPPInfo;
    if (!system) return null;
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

{#key HUDInfo.CurrentPPInfo}
  {#if HUDInfo.CurrentPPInfo}
    {@const ppData = fetchPPData()}
    <Dialog
      onclose={() => {
        HUDInfo.CurrentPPInfo = undefined;
      }}
      showImmediately={true}
    >
      <div class="text-center sm:min-w-sm">
        <h2 class="px-6">{HUDInfo.CurrentPPInfo.name}</h2>
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
            {@const cpDiff =
              (ppInfo.powerStateReinforcement ?? 0) - (ppInfo.powerStateUndermining ?? 0)}
            <h3 style={`color: ${Powers[ppInfo.controllingPower].color}`}>
              {ppInfo.controllingPower}
            </h3>
            <h4>{ppInfo.powerState}</h4>
            <div class="flex flex-col items-center gap-2">
              <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 font-medium">
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
              <div
                class={[
                  "font-semibold",
                  cpDiff > 0 && "text-[#00a5ff]",
                  cpDiff < 0 && "text-[#ff3632]",
                ]}
              >
                {cpDiff > 0 ? "+" : ""}{cpDiff.toLocaleString("en-US")}
              </div>
              <div>
                <b>Cycle Start:</b>
                {(controlData.startProgress * 100).toFixed(2)}%
                {#if ((ppInfo.powerStateControlProgress ?? 0) > 1 && controlData.adjustedProgress >= 0.25 && ppInfo.powerState !== "Stronghold") || ((ppInfo.powerStateControlProgress ?? 0) < 0 && controlData.adjustedProgress <= -0.25 && ppInfo.powerState !== "Exploited")}
                  <br />
                  <FaIcon icon={faTriangleExclamation} class="inline text-yellow-500" />
                  <i class="text-xs text-yellow-500">
                    Tier cap has been reached. Reverse calculation of cycle start value will be
                    inaccurate!
                  </i>
                {/if}
              </div>
              <div>
                <b>Current Progress:</b>
                {((ppInfo.powerStateControlProgress ?? 0) * 100).toFixed(2)}%
                {#if ((ppInfo.powerStateControlProgress ?? 0) > 1 && ppInfo.powerState !== "Stronghold") || ((ppInfo.powerStateControlProgress ?? 0) < 0 && ppInfo.powerState !== "Exploited")}
                  ({(controlData.adjustedProgress * 100).toFixed(2)}%)
                {/if}
                {#if cpDiff > 0}
                  <FaIcon class="inline text-[#00a5ff]" icon={faChevronUp} />
                {:else if cpDiff < 0}
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
                {@const powerColor = Powers[acqPower.power].color}
                {@const normalizedProgress = (acqPower.progress / normalize) * 100}
                <div>
                  <b>{index + 1}.</b>
                  <b style={`color: ${powerColor}`}>{acqPower.power}:</b>
                  {(acqPower.progress * 100).toFixed(2)}%
                </div>
                <div
                  class="h-8"
                  style={`background: linear-gradient(90deg, ${powerColor}, ${powerColor} ${normalizedProgress}%, var(--color-zinc-700) ${normalizedProgress}%`}
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
{/key}

{#snippet ppLastUpdate(ppInfo: SpanshDumpPPData | null)}
  {#if ppInfo && ppInfo.date}
    {@const date = new Date(ppInfo.date)}
    {@const lastTick = getLastPPTickDate()}
    <p>
      <i>
        Last Update:<br />
        <Tooltip>
          {#snippet tooltip()}
            {date.toLocaleString()}
          {/snippet}
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
            title={undefined}
          />
        </Tooltip>
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
