<script lang="ts">
  import { Powers } from "$lib/Constants";
  import {
    calculatePPControlSegments,
    getCorrectedSegmentProgress,
    getDecayValue,
    getLastPPTickDate,
  } from "$lib/Powerplay";
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
  {@const startProgress = data.cycleStart?.startProgress || controlData.startProgress}
  {@const startBar = data.cycleStart?.startBar || controlData.startBar}
  {@const startTier = data.cycleStart?.startTier || controlData.startTier}
  {@const cpDiff = (data.powerStateReinforcement ?? 0) - (data.powerStateUndermining ?? 0)}
  {@const correctedSegmentProgress = getCorrectedSegmentProgress(controlData.totalCP, startTier)}
  <h3 style={`color: ${Powers[data.controllingPower].color}`}>
    {data.controllingPower}
  </h3>
  <h4>{data.cycleStart?.startTier || data.powerState}</h4>
  {#if data.cycleStart?.startTier && data.cycleStart.startTier !== data.powerState}
    <p class="text-sm italic">(received {data.powerState} in source data)</p>
  {/if}
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
      {(startProgress * 100).toFixed(2)}%
      {#if (correctedSegmentProgress > 1 && controlData.adjustedProgress >= 0.25 && data.powerState !== "Stronghold") || (correctedSegmentProgress < 0 && controlData.adjustedProgress <= -0.25 && data.powerState !== "Exploited")}
        <br />
        <FaIcon icon={faTriangleExclamation} class="inline text-yellow-500" />
        <i class="text-xs text-yellow-500"> Tier cap has been reached.</i>
      {/if}
    </div>
    <div>
      <b>Current Progress:</b>
      {(correctedSegmentProgress * 100).toFixed(2)}%
      {#if (correctedSegmentProgress > 1 && data.powerState !== "Stronghold") || (correctedSegmentProgress < 0 && data.powerState !== "Exploited")}
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
      {#if controlData.currentBar > startBar}
        <div
          class="progress-positive-a absolute top-0 h-4 grow-0"
          style={`left: ${startBar * 100}%; right: ${(1 - controlData.currentBar) * 100}%;`}
        ></div>
        <div
          class="progress-positive-b absolute top-4 h-4 grow-0"
          style={`left: ${startBar * 100}%; right: ${(1 - controlData.currentBar) * 100}%;`}
        ></div>
      {:else if controlData.currentBar < startBar}
        <div
          class="progress-negative-a absolute top-0 h-4 grow-0"
          style={`left: ${controlData.currentBar * 100}%; right: ${(1 - startBar) * 100}%;`}
        ></div>
        <div
          class="progress-negative-b absolute top-4 h-4 grow-0"
          style={`left: ${controlData.currentBar * 100}%; right: ${(1 - startBar) * 100}%;`}
        ></div>
      {/if}
      <div class="absolute top-0 left-1/4 h-8 grow-0 -translate-x-1/2 border-r-2 border-dashed border-white"></div>
      <div class="absolute top-0 left-2/4 h-8 grow-0 -translate-x-1/2 border-r-2 border-dashed border-white"></div>
      <div class="absolute top-0 left-3/4 h-8 grow-0 -translate-x-1/2 border-r-2 border-dashed border-white"></div>
      <div
        class="absolute top-0 -translate-1/2 overflow-visible text-3xl text-white/60"
        style={`left: ${startBar * 100}%`}
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
      <b>Expected Decay From This Cycle:</b>
      {getDecayValue(startProgress, startTier).toLocaleString("en-US")}
    </div>
    <div>
      <b>Projected Decay With Next Cycle:</b>
      {getDecayValue(controlData.currentProgress, controlData.currentTier).toLocaleString("en-US")}
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
        class="relative h-8 select-none"
        style={`background: linear-gradient(90deg, ${powerColor}, ${powerColor} ${normalizedProgress}%, var(--color-zinc-700) ${normalizedProgress}%`}
      >
        {#if data.powerConflictCycleStart !== undefined}
          {@const acqStart = data.powerConflictCycleStart.find((x) => x.power === acqPower.power)?.progress ?? 0}
          <div class="absolute top-0 overflow-visible" style={`left: ${(acqStart / normalize) * 100}%`}>
            <Tooltip>
              {#snippet tooltip()}
                {(acqStart * 100).toFixed(2)}% ({Math.floor(acqStart * 120000).toLocaleString("en-US")})
              {/snippet}
              <div class="-translate-1/2 text-3xl text-white/60">
                <FaIcon icon={faCaretDown} />
              </div>
            </Tooltip>
          </div>
          <div class="absolute top-full overflow-visible" style={`right: ${100 - normalizedProgress}%`}>
            <Tooltip>
              {#snippet tooltip()}
                +{((acqPower.progress - acqStart) * 100).toFixed(2)}% (+{Math.floor(
                  (acqPower.progress - acqStart) * 120000,
                ).toLocaleString("en-US")}) this Cycle
              {/snippet}
              <div class="translate-x-1/2 -translate-y-1/2 text-3xl text-white">
                <FaIcon icon={faCaretUp} />
              </div>
            </Tooltip>
          </div>
        {/if}
      </div>
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
              "text-yellow-300":
                date && date >= lastTick && ppInfo.lastCycleStart?.startBar === ppInfo.cycleStart?.startBar,
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
