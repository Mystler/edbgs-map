<script lang="ts">
  import { getLastPPTickDate, powerStateColor } from "$lib/Helpers";
  import Time from "svelte-time";
  import type { PageProps } from "./$types";
  import PowerplaySystemInfo from "$lib/components/PowerplaySystemInfo.svelte";
  import { slide } from "$lib/types/Animations.svelte";
  import { Powers } from "$lib/Constants";
  import type { SpanshDumpPPData } from "$lib/SpanshAPI";
  import { browser } from "$app/environment";
  import FaIcon from "$lib/components/FaIcon.svelte";
  import {
    faArrowDown,
    faArrowRight,
    faCaretDown,
    faCaretRight,
    faRotate,
    faXmark,
  } from "@fortawesome/free-solid-svg-icons";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";

  let { data }: PageProps = $props();
  const lastTick = getLastPPTickDate();

  let lastRefresh = $state(new Date());
  let showFilters = $state(true);
  let displayLogId = $state<number>();

  let availableTypes = $derived([...new Set(data.snipeData?.map((x) => x.type))].sort());
  let filterPowers: string[] = $state(Object.keys(Powers));
  let filterTypes: string[] = $state((() => availableTypes)());
  let searchSystem = $state("");
  let excludeNoPreviousData = $state(true);

  let filteredEntries = $derived(
    data.snipeData?.filter(
      (x) =>
        filterPowers.includes(x.power) &&
        filterTypes.includes(x.type) &&
        (!excludeNoPreviousData || (x.old_dump && x.old_dump !== "null")) &&
        (!searchSystem || x.system.toLowerCase().includes(searchSystem.toLowerCase())),
    ),
  );

  function getTypeClass(type: string) {
    return type.includes("Reinforcement") ? "text-[#00a5ff]" : type.includes("Undermining") ? "text-[#ff3632]" : "";
  }

  // Local Storage handling
  if (browser) {
    (() => {
      const lsPowers = localStorage.getItem("ppSnipesFilterPowers");
      if (lsPowers) filterPowers = JSON.parse(lsPowers);
      const lsFilterTypes = localStorage.getItem("ppSnipesFilterTypes");
      if (lsFilterTypes) filterTypes = JSON.parse(lsFilterTypes);
      const lsShowFilters = localStorage.getItem("ppSnipesShowFilters");
      if (lsShowFilters) showFilters = JSON.parse(lsShowFilters);
      const lsExcludeNoPreviousData = localStorage.getItem("ppSnipesExcludeNoPreviousData");
      if (lsExcludeNoPreviousData) excludeNoPreviousData = JSON.parse(lsExcludeNoPreviousData);
    })();
    $effect(() => {
      localStorage.setItem("ppSnipesFilterPowers", JSON.stringify(filterPowers));
    });
    $effect(() => {
      localStorage.setItem("ppSnipesFilterTypes", JSON.stringify(filterTypes));
    });
    $effect(() => {
      localStorage.setItem("ppSnipesShowFilters", JSON.stringify(showFilters));
    });
    $effect(() => {
      localStorage.setItem("ppSnipesExcludeNoPreviousData", JSON.stringify(excludeNoPreviousData));
    });
  }

  // Auto refreshing
  function refresh() {
    invalidate("app:pp-snipes");
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
  <title>Snipe Detector</title>
  <meta name="description" content="This log tries to catch snipes in Powerplay systems." />
</svelte:head>

<div class="mx-auto px-1 py-4 xl:max-w-(--breakpoint-xl)">
  <!-- Intro section -->
  <h1 class="text-center">Snipe Detector</h1>
  <p class="text-center text-sm">
    This is an experimental tool that attempts to catch snipe spikes in Powerplay systems and provides a comparison
    view. Please note that not every snipe will be caught and there may also be false positives.
  </p>
  <p class="text-right text-xs text-zinc-500">
    Last Refresh:
    {#key lastRefresh}<Time relative live={5000} timestamp={lastRefresh} title={undefined} />{/key}
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
  <!-- Filters -->
  <div class="mb-2">
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
          {#each availableTypes as type (type)}
            <label
              class={[
                "flex min-h-16 cursor-pointer items-center justify-center rounded-xl border-2 border-(--ed-orange) bg-zinc-800 p-1 text-center text-[min(3vw,_var(--text-base))] font-semibold hover:bg-zinc-700",
                filterTypes.includes(type) ? "opacity-100" : "opacity-20",
              ]}
            >
              <span class={getTypeClass(type)}>{type}</span>
              <input type="checkbox" class="hidden" name="filterTypes" bind:group={filterTypes} value={type} />
            </label>
          {/each}
        </div>
        <div class="border-1 border-zinc-500"></div>
        <div class="flex flex-wrap gap-2">
          <label
            ><input type="checkbox" bind:checked={excludeNoPreviousData} /> Exclude entries without previous data</label
          >
        </div>
        <div class="border-1 border-zinc-500"></div>
      </div>
    {/if}
  </div>
  <!-- Log View -->
  {#if filteredEntries}
    <div class="flex items-start">
      <div class="flex w-full flex-col gap-2">
        {#each filteredEntries as snipe (snipe.id)}
          {@const oldData = snipe.old_dump ? (JSON.parse(snipe.old_dump) as SpanshDumpPPData) : null}
          {@const newData = JSON.parse(snipe.new_dump) as SpanshDumpPPData}
          {@const lastUpdate = new Date(newData.date)}
          <button
            type="button"
            onclick={() => {
              displayLogId = displayLogId !== snipe.id ? snipe.id : undefined;
            }}
            class={[
              "flex min-h-20 items-center gap-2 rounded-xl border-2 p-2 text-right",
              lastUpdate < lastTick
                ? "border-red-500 bg-red-900/20 hover:bg-red-900/50"
                : "border-(--ed-orange) bg-zinc-800 hover:bg-zinc-700",
            ]}
            draggable="true"
            ondragstart={(e) => {
              e.dataTransfer?.setData("json/edbgs-map-pp-alert", JSON.stringify(newData));
            }}
          >
            <div
              class="w-4 flex-none self-stretch"
              style={`background-color: ${snipe.power ? Powers[snipe.power].color : "transparent"}`}
            ></div>
            <div class="grow-1 text-left font-semibold">{snipe.system}</div>
            <div class="basis-40">
              {snipe.amount.toLocaleString("en-US")}<br />
              <span
                class={snipe.type.includes("Reinforcement")
                  ? "text-[#00a5ff]"
                  : snipe.type.includes("Undermining")
                    ? "text-[#ff3632]"
                    : ""}>{snipe.type}</span
              >
            </div>
            <div class="basis-40 max-lg:hidden" style={`color: ${snipe.power ? Powers[snipe.power].color : "inherit"}`}>
              {snipe.power ?? "Unknown"}
            </div>
            <div class="basis-32 max-sm:hidden" style={`color: ${powerStateColor(newData.powerState)}`}>
              {newData.powerState}
            </div>
            <div class="basis-32 max-lg:hidden">
              <Time
                class={{
                  "text-red-500": lastUpdate < lastTick,
                }}
                relative
                live
                timestamp={newData.date}
                title={undefined}
              />
            </div>
          </button>
          {#if displayLogId === snipe.id}
            <div transition:slide class="mx-auto w-full p-2 text-center lg:max-w-(--breakpoint-lg)">
              <h2>{snipe.system}</h2>
              <div class="justify-between gap-2 max-sm:flex max-sm:flex-col sm:grid sm:grid-cols-[1fr_min-content_1fr]">
                <div><PowerplaySystemInfo data={oldData} /></div>
                <div class="mx-4 my-auto justify-items-center text-7xl text-green-500">
                  <FaIcon class="sm:hidden" icon={faArrowDown} /><FaIcon class="max-sm:hidden" icon={faArrowRight} />
                </div>
                <div><PowerplaySystemInfo data={newData} /></div>
              </div>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  {:else}
    <p>No systems are currently logged.</p>
  {/if}
</div>
