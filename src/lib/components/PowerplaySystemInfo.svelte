<script lang="ts">
  import { Powers } from "$lib/Constants";
  import { calculatePPControlSegments, getDecayValue, getLastPPTickDate, totalCPToTierName } from "$lib/Powerplay";
  import type { SpanshDumpPPData } from "$lib/SpanshAPI";
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
  import Tooltip from "./Tooltip.svelte";
  import Time from "svelte-time";

  interface Props {
    data: SpanshDumpPPData | null;
  }
  let { data }: Props = $props();
</script>

{#if data?.controllingPower}
  <!-- PP Control System Display -->
  {@const controlData = calculatePPControlSegments(data)}
  {@const cpDiff = (data.powerStateReinforcement ?? 0) - (data.powerStateUndermining ?? 0)}
  <h3 style={`color: ${Powers[data.controllingPower].color}`}>
    {data.controllingPower}
  </h3>
  <h4>{data.powerState}</h4>
  <div class="flex flex-col items-center gap-2">
    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-2 font-medium">
      <div class="flex items-center justify-end gap-2">
        <span class="text-[#ff3632]">
          {data.powerStateUndermining?.toLocaleString("en-US")}
        </span>
        <FaIcon class="text-[#ff3632]" icon={faCaretLeft} />
      </div>
      <span>Control Points</span>
      <div class="flex items-center justify-start gap-2">
        <FaIcon class="text-[#00a5ff]" icon={faCaretRight} />
        <span class="text-[#00a5ff]">
          {data.powerStateReinforcement?.toLocaleString("en-US")}
        </span>
      </div>
    </div>
    <div class={["font-semibold", cpDiff > 0 && "text-[#00a5ff]", cpDiff < 0 && "text-[#ff3632]"]}>
      {cpDiff > 0 ? "+" : ""}{cpDiff.toLocaleString("en-US")}
    </div>
    <div>
      <b>Cycle Start:</b>
      {(controlData.startProgress * 100).toFixed(2)}%
      {#if ((data.powerStateControlProgress ?? 0) > 1 && controlData.adjustedProgress >= 0.25 && data.powerState !== "Stronghold") || ((data.powerStateControlProgress ?? 0) < 0 && controlData.adjustedProgress <= -0.25 && data.powerState !== "Exploited")}
        <br />
        <FaIcon icon={faTriangleExclamation} class="inline text-yellow-500" />
        <i class="text-xs text-yellow-500">
          Tier cap has been reached. Reverse calculation of cycle start value will be wrong and moving!
        </i>
      {/if}
    </div>
    <div>
      <b>Current Progress:</b>
      {((data.powerStateControlProgress ?? 0) * 100).toFixed(2)}%
      {#if ((data.powerStateControlProgress ?? 0) > 1 && data.powerState !== "Stronghold") || ((data.powerStateControlProgress ?? 0) < 0 && data.powerState !== "Exploited")}
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
      <div class="absolute top-0 left-1/4 h-8 grow-0 -translate-x-1/2 border-r-2 border-dashed border-white"></div>
      <div class="absolute top-0 left-2/4 h-8 grow-0 -translate-x-1/2 border-r-2 border-dashed border-white"></div>
      <div class="absolute top-0 left-3/4 h-8 grow-0 -translate-x-1/2 border-r-2 border-dashed border-white"></div>
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
    <div>
      <b>Expected Decay from this Cycle:</b>
      {getDecayValue(controlData.startProgress, data.powerState).toLocaleString("en-US")}
    </div>
    <div>
      <b>Projected Decay with next Cycle:</b>
      {getDecayValue(controlData.currentProgress, totalCPToTierName(controlData.totalCP)).toLocaleString("en-US")}
    </div>
    {@render ppLastUpdate(data)}
  </div>
{:else if data?.powerConflictProgress}
  <!-- PP Acquisition / Contested System Display -->
  {@const sorted = data.powerConflictProgress.sort((a, b) => b.progress - a.progress)}
  {@const normalize = Math.max(sorted[0]?.progress ?? 1, 1)}
  <h3>Acquisition System</h3>
  {#if sorted.length >= 2 && sorted[1].progress >= 0.3}
    <p class="text-yellow-400">
      <FaIcon icon={faTriangleExclamation} class="inline" /> Conflict Threshold reached!
    </p>
  {/if}
  <div class="mb-2 flex flex-col gap-2">
    {#each sorted as acqPower, index (acqPower.power)}
      {@const powerColor = Powers[acqPower.power].color}
      {@const normalizedProgress = (acqPower.progress / normalize) * 100}
      <div>
        <b>{index + 1}.</b>
        <b style={`color: ${powerColor}`}>{acqPower.power}:</b>
        {(acqPower.progress * 100).toFixed(2)}% ({Math.floor(acqPower.progress * 120000).toLocaleString("en-US")})
      </div>
      <div
        class="h-8"
        style={`background: linear-gradient(90deg, ${powerColor}, ${powerColor} ${normalizedProgress}%, var(--color-zinc-700) ${normalizedProgress}%`}
      ></div>
    {/each}
  </div>
  {@render ppLastUpdate(data)}
{:else}
  <p>No Powerplay information found for this system.</p>
{/if}

{#snippet ppLastUpdate(ppInfo: SpanshDumpPPData | null)}
  {#if ppInfo && ppInfo.date}
    {@const date = new Date(ppInfo.date)}
    {@const lastTick = getLastPPTickDate()}
    <p>
      <i>
        Last Update:<br />
        <Tooltip>
          {#snippet tooltip()}
            {date.toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
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
