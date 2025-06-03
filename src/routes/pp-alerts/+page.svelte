<script lang="ts">
  import { getLastPPTickDate, powerStateColor } from "$lib/Helpers";
  import Time from "svelte-time";
  import type { PageProps } from "./$types";
  import PowerplaySystemInfo from "$lib/components/PowerplaySystemInfo.svelte";
  import { slide } from "$lib/types/Animations.svelte";
  import { Powers } from "$lib/Constants";
  import type { SpanshDumpPPData } from "$lib/SpanshAPI";
  import { browser } from "$app/environment";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import FaIcon from "$lib/components/FaIcon.svelte";
  import { faCaretDown, faCaretRight, faRotate, faXmark } from "@fortawesome/free-solid-svg-icons";

  let { data }: PageProps = $props();
  const lastTick = getLastPPTickDate();

  let lastRefresh = $state(new Date());
  let showFilters = $state(true);
  let displaySystemId = $state<number>();

  let availableStates = $derived(
    [...new Set(data.systems?.filter((x) => x.powerState).map((x) => x.powerState!) ?? [])].sort(),
  );

  let searchSystem = $state("");
  let filterPowers: string[] = $state(Object.keys(Powers));
  let filterStates: string[] = $state((() => availableStates)());

  const sortingFunctions: { [index: string]: (a: SpanshDumpPPData, b: SpanshDumpPPData) => number } = {
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
    "Total Undermining": (a, b) => {
      return (a.powerStateUndermining ?? 0) - (b.powerStateUndermining ?? 0);
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
  };
  let sortBy = $state<keyof typeof sortingFunctions>("Total Control Points");
  let descending = $state(true);

  let filteredSystems = $derived(
    data.systems?.filter(
      (x) =>
        (filterPowers.includes(x.controllingPower ?? "") ||
          new Set(filterPowers).intersection(new Set(x.powerConflictProgress?.map((x) => x.power) ?? [])).size > 0) &&
        filterStates.includes(x.powerState ?? "") &&
        (!searchSystem || x.name.toLowerCase().includes(searchSystem.toLowerCase())),
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
  }

  // Auto refreshing
  function refresh() {
    invalidate("app:pp-alerts");
    lastRefresh = new Date();
  }
  onMount(() => {
    const refreshId = setInterval(refresh, 600000);
    return () => {
      clearInterval(refreshId);
    };
  });
</script>

<svelte:head>
  <title>Powerplay Alerts</title>
  <meta name="description" content="Frontier did not give us the War Room, so I made my own..." />
</svelte:head>

<div class="mx-auto px-1 py-4 xl:max-w-(--breakpoint-xl)">
  <h1 class="text-center">Powerplay Alerts</h1>
  <p class="text-center">Welcome to the War Room.</p>
  <p class="text-center text-sm">
    This shows all systems that were detected in the last 48h with more than 10k CP of total merits (for Control
    Systems) or above the 30% threshold (for Acquisitions).
  </p>
  <p class="text-right text-xs text-zinc-500">
    Last Refresh:
    {#key lastRefresh}<Time relative live timestamp={lastRefresh} title={undefined} />{/key}
    <button
      type="button"
      class="size-6"
      onclick={(e) => {
        const button = e.currentTarget;
        const icon = button.querySelector("svg");
        icon?.classList.add("animate-spin");
        button.disabled = true;
        refresh();
        setTimeout(() => {
          icon?.classList.remove("animate-spin");
          button.disabled = false;
        }, 1000);
      }}><FaIcon class="inline" icon={faRotate} /></button
    >
  </p>
  <div class="mb-2 flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <div class="flex flex-col">
        <b>Sort By</b>
        <label class="ext-sm">
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
      </div>
    {/if}
  </div>
  {#if sortedSystems}
    <div class="flex items-start">
      <div class="flex w-full flex-col gap-2">
        {#each sortedSystems as system (system.id64)}
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
              <div class="flex flex-col">
                <span class={["font-semibold", cpDiff > 0 && "text-[#00a5ff]", cpDiff < 0 && "text-[#ff3632]"]}>
                  {cpDiff > 0 ? "+" : ""}{cpDiff.toLocaleString("en-US")}
                </span>
                <span class="text-xs">({((system.powerStateControlProgress ?? 0) * 100).toFixed(2)}%)</span>
              </div>
              <div class="basis-32 max-sm:hidden">
                {((system.powerStateReinforcement ?? 0) + (system.powerStateUndermining ?? 0)).toLocaleString(
                  "en-US",
                )}<br />
                Total
              </div>
            {:else}
              <div class="flex flex-col font-semibold">
                {#each system.powerConflictProgress
                  ?.toSorted((a, b) => b.progress - a.progress)
                  .slice(0, 2) ?? [] as acqPower (acqPower.power)}
                  <span style={`color: ${Powers[acqPower.power].color}`}>{(acqPower.progress * 100).toFixed(1)}%</span>
                {/each}
              </div>
              <div class="basis-32 max-sm:hidden">
                {Math.floor(
                  system.powerConflictProgress?.reduce((sum, entry) => sum + entry.progress * 120000, 0) ?? 0,
                ).toLocaleString("en-US")}<br />
                Total
              </div>
            {/if}
            <div
              class="basis-40 max-lg:hidden"
              style={`color: ${system.controllingPower ? Powers[system.controllingPower].color : "inherit"}`}
            >
              {system.controllingPower}
            </div>
            <div class="basis-32 max-sm:hidden" style={`color: ${powerStateColor(system.powerState)}`}>
              {system.powerState}
            </div>
            <div class="basis-32 max-lg:hidden">
              <Time
                class={{
                  "text-red-500": lastUpdate < lastTick,
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
              <h2>{system.name}</h2>
              <PowerplaySystemInfo data={system} />
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {:else}
    <p>No systems are currently logged.</p>
  {/if}
</div>
