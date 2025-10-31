<script lang="ts">
  import {
    calculatePPControlSegments,
    getCorrectedSegmentProgress,
    getDecayValue,
    getLastPPTickDate,
    getPPTickWindowDate,
    powerStateColor,
  } from "$lib/Powerplay";
  import Time from "svelte-time";
  import PowerplaySystemInfo from "$lib/components/PowerplaySystemInfo.svelte";
  import { slide } from "$lib/types/Animations.svelte";
  import { Powers } from "$lib/Constants";
  import type { SpanshDumpPPData } from "$lib/SpanshAPI";
  import { browser } from "$app/environment";
  import FaIcon from "$lib/components/FaIcon.svelte";
  import { faCaretDown, faCaretRight, faXmark } from "@fortawesome/free-solid-svg-icons";
  import { on } from "svelte/events";
  import { onMount, untrack } from "svelte";
  import CopyToClipboardButton from "$lib/components/CopyToClipboardButton.svelte";

  interface Props {
    systems: SpanshDumpPPData[];
  }
  let { systems }: Props = $props();
  const lastTick = getLastPPTickDate();
  const tickWindow = getPPTickWindowDate(lastTick);

  let showFilters = $state(true);
  let displaySystemId = $state<number>();

  let availableStates = $derived(
    [...new Set(systems?.filter((x) => x.powerState).map((x) => x.powerState!) ?? [])].sort(),
  );

  let searchSystem = $state("");
  let filterPowers: string[] = $state(Object.keys(Powers));
  let filterStates: string[] = $state((() => availableStates)());
  let includePrevCycle = $state(false);
  let excludeMaxedStrongholds = $state(false);
  const acquisitionFilteringModes = ["Any Present", "All Present", "Leading"] as const;
  let acquisitonFiltering: (typeof acquisitionFilteringModes)[number] = $state("Any Present");

  function resetFilters() {
    searchSystem = "";
    filterPowers = Object.keys(Powers);
    filterStates = availableStates;
    includePrevCycle = false;
    excludeMaxedStrongholds = false;
    acquisitonFiltering = "Any Present";
  }

  const sortingFunctions = {
    "Total Control Points": (a, b) => {
      return (
        (a.powerConflictProgress
          ? Math.floor(a.powerConflictProgress.reduce((sum, entry) => sum + entry.progress * 120000, 0))
          : (a.powerStateReinforcement ?? 0) + (a.powerStateUndermining ?? 0)) -
        (b.powerConflictProgress
          ? Math.floor(b.powerConflictProgress.reduce((sum, entry) => sum + entry.progress * 120000, 0))
          : (b.powerStateReinforcement ?? 0) + (b.powerStateUndermining ?? 0))
      );
    },
    "Total Activity": (a, b) => {
      const { startProgress: startProgressA, startTier: startTierA } = a.cycleStart || calculatePPControlSegments(a);
      const { startProgress: startProgressB, startTier: startTierB } = b.cycleStart || calculatePPControlSegments(b);
      const aDecay = getDecayValue(startProgressA, startTierA);
      const bDecay = getDecayValue(startProgressB, startTierB);
      return (
        (a.powerConflictProgress
          ? Math.floor(a.powerConflictProgress.reduce((sum, entry) => sum + entry.progress * 120000, 0)) -
            Math.floor(a.powerConflictCycleStart?.reduce((sum, entry) => sum + entry.progress * 120000, 0) ?? 0)
          : (a.powerStateReinforcement ?? 0) + (a.powerStateUndermining ?? 0) - aDecay) -
        (b.powerConflictProgress
          ? Math.floor(b.powerConflictProgress.reduce((sum, entry) => sum + entry.progress * 120000, 0)) -
            Math.floor(b.powerConflictCycleStart?.reduce((sum, entry) => sum + entry.progress * 120000, 0) ?? 0)
          : (b.powerStateReinforcement ?? 0) + (b.powerStateUndermining ?? 0) - bDecay)
      );
    },
    "Control Point Difference": (a, b) => {
      return (
        (a.powerConflictProgress
          ? Math.abs(
              a.powerConflictProgress
                .toSorted((x, y) => y.progress - x.progress)
                .slice(0, 2)
                .reduce((sum, x, i) => sum + (i === 1 ? -1 : 1) * x.progress * 120000, 0),
            )
          : (a.powerStateReinforcement ?? 0) - (a.powerStateUndermining ?? 0)) -
        (b.powerConflictProgress
          ? Math.abs(
              b.powerConflictProgress
                .toSorted((x, y) => y.progress - x.progress)
                .slice(0, 2)
                .reduce((sum, x, i) => sum + (i === 1 ? -1 : 1) * x.progress * 120000, 0),
            )
          : (b.powerStateReinforcement ?? 0) - (b.powerStateUndermining ?? 0))
      );
    },
    "Segment Control Progress": (a, b) => {
      let pA = 0;
      if (a.powerStateControlProgress) {
        const cd = calculatePPControlSegments(a);
        const { startTier } = a.cycleStart || cd;
        pA = getCorrectedSegmentProgress(cd.totalCP, startTier);
      } else if (a.powerConflictProgress) {
        pA = a.powerConflictProgress.toSorted((x, y) => y.progress - x.progress).at(0)?.progress ?? 0;
      }
      let pB = 0;
      if (b.powerStateControlProgress) {
        const cd = calculatePPControlSegments(b);
        const { startTier } = b.cycleStart || cd;
        pB = getCorrectedSegmentProgress(cd.totalCP, startTier);
      } else if (b.powerConflictProgress) {
        pB = b.powerConflictProgress.toSorted((x, y) => y.progress - x.progress).at(0)?.progress ?? 0;
      }
      return pA - pB;
    },
    "Total Undermining": (a, b) => {
      return (a.powerStateUndermining ?? 0) - (b.powerStateUndermining ?? 0);
    },
    "Total Player UM": (a, b) => {
      const { startProgress: startProgressA, startTier: startTierA } = a.cycleStart || calculatePPControlSegments(a);
      const { startProgress: startProgressB, startTier: startTierB } = b.cycleStart || calculatePPControlSegments(b);
      const aDecay = getDecayValue(startProgressA, startTierA);
      const bDecay = getDecayValue(startProgressB, startTierB);
      return (a.powerStateUndermining ?? 0) - aDecay - ((b.powerStateUndermining ?? 0) - bDecay);
    },
    "Total Reinforcement": (a, b) => {
      return (a.powerStateReinforcement ?? 0) - (b.powerStateReinforcement ?? 0);
    },
    "Highest Acquisition": (a, b) => {
      return (
        (a.powerConflictProgress?.toSorted((x, y) => y.progress - x.progress).at(0)?.progress ?? 0) -
        (b.powerConflictProgress?.toSorted((x, y) => y.progress - x.progress).at(0)?.progress ?? 0)
      );
    },
  } as const satisfies Record<string, (a: SpanshDumpPPData, b: SpanshDumpPPData) => number>;
  let sortBy = $state<keyof typeof sortingFunctions>("Total Control Points");
  let descending = $state(true);

  let filteredSystems = $derived(
    systems?.filter(
      (x) =>
        (filterPowers.includes(x.controllingPower ?? "") ||
          (acquisitonFiltering === "Any Present" &&
            new Set(filterPowers).intersection(new Set(x.powerConflictProgress?.map((x) => x.power) ?? [])).size > 0) ||
          (acquisitonFiltering === "All Present" &&
            new Set(filterPowers).isSubsetOf(new Set(x.powerConflictProgress?.map((x) => x.power) ?? []))) ||
          (acquisitonFiltering === "Leading" &&
            filterPowers.includes(
              x.powerConflictProgress?.toSorted((a, b) => b.progress - a.progress)?.at(0)?.power ?? "",
            ))) &&
        filterStates.includes(x.cycleStart?.startTier || (x.powerState ?? "")) &&
        (!searchSystem || x.name.toLowerCase().includes(searchSystem.toLowerCase())) &&
        (includePrevCycle || new Date(x.date) > lastTick) &&
        (!excludeMaxedStrongholds ||
          (x.cycleStart?.startTier !== "Stronghold" && x.powerState !== "Stronghold") ||
          (x.powerStateControlProgress ?? 0) < 0.75),
    ),
  );

  let sortedSystems = $derived(
    filteredSystems?.toSorted((a, b) => (descending ? -1 : 1) * sortingFunctions[sortBy](a, b)),
  );

  // Local Storage handling
  if (browser) {
    (() => {
      const lsPowers = localStorage.getItem("ppAlertsFilterPowers");
      if (lsPowers) filterPowers = JSON.parse(lsPowers);
      const lsStates = localStorage.getItem("ppAlertsFilterStates");
      if (lsStates) filterStates = JSON.parse(lsStates);
      const lsSortBy = localStorage.getItem("ppAlertsSortBy");
      if (lsSortBy) sortBy = JSON.parse(lsSortBy);
      const lsSortDesc = localStorage.getItem("ppAlertsSortDesc");
      if (lsSortDesc) descending = JSON.parse(lsSortDesc);
      const lsShowFilters = localStorage.getItem("ppAlertsShowFilters");
      if (lsShowFilters) showFilters = JSON.parse(lsShowFilters);
      const lsIncludePrevious = localStorage.getItem("ppAlertsIncludePrevious");
      if (lsIncludePrevious) includePrevCycle = JSON.parse(lsIncludePrevious);
      const lsExcludeMaxed = localStorage.getItem("ppAlertsExcludeMaxedStrongholds");
      if (lsExcludeMaxed) excludeMaxedStrongholds = JSON.parse(lsExcludeMaxed);
      const lsAcquisitonFiltering = localStorage.getItem("ppAlertsAcquisitonFiltering") as
        | (typeof acquisitionFilteringModes)[number]
        | null;
      if (lsAcquisitonFiltering && acquisitionFilteringModes.includes(lsAcquisitonFiltering))
        acquisitonFiltering = lsAcquisitonFiltering;
    })();
    $effect(() => {
      localStorage.setItem("ppAlertsFilterPowers", JSON.stringify(filterPowers));
    });
    $effect(() => {
      localStorage.setItem("ppAlertsFilterStates", JSON.stringify(filterStates));
    });
    $effect(() => {
      localStorage.setItem("ppAlertsSortBy", JSON.stringify(sortBy));
    });
    $effect(() => {
      localStorage.setItem("ppAlertsSortDesc", JSON.stringify(descending));
    });
    $effect(() => {
      localStorage.setItem("ppAlertsShowFilters", JSON.stringify(showFilters));
    });
    $effect(() => {
      localStorage.setItem("ppAlertsIncludePrevious", JSON.stringify(includePrevCycle));
    });
    $effect(() => {
      localStorage.setItem("ppAlertsExcludeMaxedStrongholds", JSON.stringify(excludeMaxedStrongholds));
    });
    $effect(() => {
      localStorage.setItem("ppAlertsAcquisitonFiltering", acquisitonFiltering);
    });
  }

  // Increase number of displayed results as we scroll
  let displayEntriesCount = $state(50);
  onMount(() => {
    return on(window, "scroll", () => {
      if (document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 500) displayEntriesCount += 10;
    });
  });

  $effect.pre(() => {
    if (sortedSystems) {
      untrack(() => {
        displayEntriesCount = 50; // Reset on filter/sorting changes
      });
    }
  });
</script>

<div>
  <!-- Sorting -->
  <div class="flex flex-wrap items-center gap-2">
    <div class="flex flex-col">
      <b>Sort By</b>
      <label class="text-sm">
        <input type="checkbox" class="align-middle" title="Descending" bind:checked={descending} /> Desc
      </label>
    </div>
    <select class="px-2 max-sm:grow-1" bind:value={sortBy}>
      {#each Object.keys(sortingFunctions) as sort (sort)}
        <option>{sort}</option>
      {/each}
    </select>
  </div>
  <div class="flex items-center gap-2">
    <button type="button" class="flex items-center gap-1" onclick={() => (showFilters = !showFilters)}>
      <b>Filters</b>
      <FaIcon class="text-xl" icon={showFilters ? faCaretDown : faCaretRight} />
    </button>
    <div class="h-0 grow-1 border-1 border-zinc-500"></div>
  </div>
  {#if showFilters}
    <!-- Filters -->
    <div transition:slide class="flex flex-col gap-2">
      <div class="flex justify-between gap-2">
        <div class="relative">
          <input
            type="text"
            class="w-78 p-1 pr-4 max-sm:grow-1"
            placeholder="Search System..."
            bind:value={searchSystem}
          />
          {#if searchSystem}
            <button
              type="button"
              class="absolute top-1/2 right-1 -translate-y-1/2"
              title="Clear Search"
              onclick={() => {
                searchSystem = "";
              }}><FaIcon icon={faXmark} /></button
            >
          {/if}
        </div>
        <button
          type="button"
          class="link-btn"
          onclick={() => {
            if (filterPowers.length > 0) filterPowers = [];
            else filterPowers = Object.keys(Powers);
          }}>Toggle All Powers</button
        >
      </div>
      <div class="grid grid-cols-[repeat(auto-fit,_minmax(80px,_1fr))] gap-2 select-none">
        {#each Object.keys(Powers) as power (power)}
          <label
            class={[
              "flex min-h-16 cursor-pointer items-center justify-center rounded-xl border-2 border-(--ed-orange) bg-zinc-800 p-1 text-center font-semibold hover:bg-zinc-700",
              filterPowers.includes(power) ? "opacity-100" : "opacity-20",
            ]}
          >
            <span style={`color: ${Powers[power].color}`}>{power}</span>
            <input type="checkbox" class="hidden" name="filterPowers" bind:group={filterPowers} value={power} />
          </label>
        {/each}
      </div>
      <div class="border-1 border-zinc-500"></div>
      <div class="grid grid-cols-[repeat(auto-fit,_minmax(80px,_1fr))] gap-2 select-none">
        {#each availableStates as state (state)}
          <label
            class={[
              "flex min-h-16 cursor-pointer items-center justify-center rounded-xl border-2 border-(--ed-orange) bg-zinc-800 p-1 text-center text-[min(3vw,_var(--text-base))] font-semibold hover:bg-zinc-700",
              filterStates.includes(state) ? "opacity-100" : "opacity-20",
            ]}
          >
            <span style={`color: ${powerStateColor(state)}`}>{state}</span>
            <input type="checkbox" class="hidden" name="filterStates" bind:group={filterStates} value={state} />
          </label>
        {/each}
      </div>
      <div class="border-1 border-zinc-500"></div>
      <div class="flex flex-wrap gap-2">
        <label><input type="checkbox" bind:checked={includePrevCycle} /> Include Previous Cycle</label>
        <label><input type="checkbox" bind:checked={excludeMaxedStrongholds} /> Exclude Strongholds above 75%</label>
      </div>
      <div class="flex gap-2">
        Filter Acquisition Powers:
        {#each acquisitionFilteringModes as type (type)}
          <label>
            <input type="radio" name="acquisitonFilter" value={type} bind:group={acquisitonFiltering} />
            {type}
          </label>
        {/each}
      </div>
      <div class="border-1 border-zinc-500"></div>
    </div>
  {/if}
</div>
<!-- Systems list -->
{#if sortedSystems}
  <div class="m-2 flex justify-between text-sm">
    <div><button type="button" class="link-btn" onclick={resetFilters}>Reset All Filters</button></div>
    <div class="text-right">{sortedSystems.length} Systems</div>
  </div>
  <div class="flex items-start">
    <div class="flex w-full flex-col gap-2">
      {#each sortedSystems.slice(0, displayEntriesCount) as system (system.id64)}
        {@const lastUpdate = new Date(system.date)}
        {@const cpDiff = (system.powerStateReinforcement ?? 0) - (system.powerStateUndermining ?? 0)}
        <button
          type="button"
          onclick={() => {
            displaySystemId = displaySystemId !== system.id64 ? system.id64 : undefined;
          }}
          class={[
            "flex min-h-20 items-center gap-2 rounded-xl border-2 p-2 text-right",
            lastUpdate < lastTick
              ? "border-red-500 bg-red-900/20 hover:bg-red-900/50"
              : "border-(--ed-orange) bg-zinc-800 hover:bg-zinc-700",
          ]}
          draggable="true"
          ondragstart={(e) => {
            e.dataTransfer?.setData("json/edbgs-map-pp-alert", JSON.stringify(system));
          }}
        >
          <div
            class="w-4 flex-none self-stretch"
            style={`background-color: ${system.controllingPower ? Powers[system.controllingPower].color : "transparent"}`}
          ></div>
          <div class="grow-1 text-left font-semibold">{system.name}</div>
          {#if system.powerStateControlProgress}
            {@const controlData = calculatePPControlSegments(system)}
            {@const { startProgress, startTier } = system.cycleStart || controlData}
            {@const correctedSegmentProgress = getCorrectedSegmentProgress(controlData.totalCP, startTier)}
            <div class="flex flex-col">
              <span class={["font-semibold", cpDiff > 0 && "text-[#00a5ff]", cpDiff < 0 && "text-[#ff3632]"]}>
                {cpDiff > 0 ? "+" : ""}{cpDiff.toLocaleString("en-US")}
              </span>
              <span class="text-xs">({(correctedSegmentProgress * 100).toFixed(2)}%)</span>
            </div>
            <div class="basis-32 max-sm:hidden">
              <!-- Control system specific -->
              {#if sortBy === "Total Reinforcement"}
                {(system.powerStateReinforcement ?? 0).toLocaleString("en-US")}<br />
                Reinforcement
              {:else if sortBy === "Total Undermining"}
                {(system.powerStateUndermining ?? 0).toLocaleString("en-US")}<br />
                Undermining
              {:else if sortBy === "Total Player UM"}
                {((system.powerStateUndermining ?? 0) - getDecayValue(startProgress, startTier)).toLocaleString(
                  "en-US",
                )}<br />
                Undermining
              {:else if sortBy === "Total Activity"}
                {(
                  (system.powerStateReinforcement ?? 0) +
                  (system.powerStateUndermining ?? 0) -
                  getDecayValue(startProgress, startTier)
                ).toLocaleString("en-US")}<br />
                Activity
              {:else}
                {((system.powerStateReinforcement ?? 0) + (system.powerStateUndermining ?? 0)).toLocaleString(
                  "en-US",
                )}<br />
                Total
              {/if}
            </div>
          {:else}
            <!-- Acquisition system specific -->
            <div class="flex flex-col font-semibold">
              {#each system.powerConflictProgress
                ?.toSorted((a, b) => b.progress - a.progress)
                .slice(0, 2) ?? [] as acqPower (acqPower.power)}
                <span style={`color: ${Powers[acqPower.power].color}`}>{(acqPower.progress * 100).toFixed(1)}%</span>
              {/each}
            </div>
            <div class="basis-32 max-sm:hidden">
              {#if sortBy === "Highest Acquisition"}
                {Math.floor(
                  (system.powerConflictProgress?.toSorted((a, b) => b.progress - a.progress).at(0)?.progress ?? 0) *
                    120000,
                ).toLocaleString("en-US")}<br />
                1st Place
              {:else if sortBy === "Total Activity"}
                {(
                  Math.floor(
                    system.powerConflictProgress?.reduce((sum, entry) => sum + entry.progress * 120000, 0) ?? 0,
                  ) -
                  Math.floor(
                    system.powerConflictCycleStart?.reduce((sum, entry) => sum + entry.progress * 120000, 0) ?? 0,
                  )
                ).toLocaleString("en-US")}<br />
                Activity
              {:else}
                {Math.floor(
                  system.powerConflictProgress?.reduce((sum, entry) => sum + entry.progress * 120000, 0) ?? 0,
                ).toLocaleString("en-US")}<br />
                Total
              {/if}
            </div>
          {/if}
          <div
            class="basis-40 max-lg:hidden"
            style={`color: ${system.controllingPower ? Powers[system.controllingPower].color : "inherit"}`}
          >
            {system.controllingPower}
          </div>
          <div
            class="basis-32 max-sm:hidden"
            style={`color: ${powerStateColor(system.cycleStart?.startTier || system.powerState)}`}
          >
            {system.cycleStart?.startTier || system.powerState}
          </div>
          <div class="basis-32 max-lg:hidden">
            <Time
              class={{
                "text-red-500": lastUpdate < lastTick,
                "text-yellow-300": lastUpdate >= lastTick && lastUpdate < tickWindow,
              }}
              relative
              live
              timestamp={system.date}
              title={undefined}
            />
          </div>
        </button>
        {#if displaySystemId === system.id64}
          <div transition:slide class="mx-auto w-full p-2 text-center lg:max-w-(--breakpoint-lg)">
            <h2>
              {system.name}
              <CopyToClipboardButton text={system.name} />
            </h2>
            <PowerplaySystemInfo data={system} />
          </div>
        {/if}
      {/each}
    </div>
  </div>
{:else}
  <p>No systems are currently logged.</p>
{/if}
