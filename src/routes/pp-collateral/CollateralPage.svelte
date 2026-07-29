<script lang="ts">
  import FaIcon from "$lib/components/FaIcon.svelte";
  import { Powers } from "$lib/Constants";
  import { slide } from "$lib/types/Animations.svelte";
  import { faCaretDown, faCaretRight, faXmark } from "@fortawesome/free-solid-svg-icons";
  import Time from "svelte-time/Time.svelte";
  import { onMount, untrack } from "svelte";
  import { on } from "svelte/events";
  import { getLastPPTickDate, powerStateColor } from "$lib/Powerplay";
  import CopyToClipboardButton from "$lib/components/CopyToClipboardButton.svelte";
  import PowerplaySystemInfo from "$lib/components/PowerplaySystemInfo.svelte";
  import type { CollateralSphereInfo } from "$lib/server/Collateral";
  import Select from "$lib/components/Select.svelte";
  import { browser } from "$app/env";
  import type { SpanshDumpPPData } from "$lib/SpanshAPI";

  interface Props {
    spheres: CollateralSphereInfo[];
  }
  let { spheres }: Props = $props();
  const lastTick = getLastPPTickDate();

  let showFilters = $state(true);
  let displaySphereId = $state<number>();
  let displayInnerSystem = $state<SpanshDumpPPData>();

  const sortingFunctions = {
    "Solely Supporting": (a, b) => {
      const sumB = b.collateral.soleSupportingSystemsSH.length + b.collateral.soleSupportingSystemsFort.length;
      const sumA = a.collateral.soleSupportingSystemsSH.length + a.collateral.soleSupportingSystemsFort.length;
      if (sumB > sumA) return 1;
      if (sumB < sumA) return -1;
      if (b.collateral.soleSupportingSystemsSH.length > a.collateral.soleSupportingSystemsSH.length) return 1;
      if (b.collateral.soleSupportingSystemsSH.length < a.collateral.soleSupportingSystemsSH.length) return -1;
      return a.collateral.CPToTierDrop - b.collateral.CPToTierDrop;
    },
    "Tier Drop": (a, b) => {
      const tierB =
        (b.cycleStart?.startTier ?? b.powerState) === "Stronghold"
          ? b.collateral.soleSupportingSystemsSH.length
          : b.collateral.soleSupportingSystemsFort.length;
      const tierA =
        (a.cycleStart?.startTier ?? a.powerState) === "Stronghold"
          ? a.collateral.soleSupportingSystemsSH.length
          : a.collateral.soleSupportingSystemsFort.length;
      if (tierB > tierA) return 1;
      if (tierB < tierA) return -1;
      return a.collateral.CPToTierDrop - b.collateral.CPToTierDrop;
    },
    "CP per Loss on Tier Drop": (a, b) => {
      const tierB =
        (b.cycleStart?.startTier ?? b.powerState) === "Stronghold"
          ? b.collateral.soleSupportingSystemsSH.length
          : b.collateral.soleSupportingSystemsFort.length;
      const tierA =
        (a.cycleStart?.startTier ?? a.powerState) === "Stronghold"
          ? a.collateral.soleSupportingSystemsSH.length
          : a.collateral.soleSupportingSystemsFort.length;
      return a.collateral.CPToTierDrop / tierA - b.collateral.CPToTierDrop / tierB;
    },
  } as const satisfies Record<string, (a: CollateralSphereInfo, b: CollateralSphereInfo) => number>;
  let sortBy = $state<keyof typeof sortingFunctions>("Solely Supporting");

  let filterPowers: string[] = $state(Object.keys(Powers));
  let searchSystem = $state("");
  let filteredEntries = $derived(
    spheres
      ?.filter(
        (x) =>
          filterPowers.includes(x.controllingPower!) &&
          (!searchSystem || x.name.toLowerCase().includes(searchSystem.toLowerCase())),
      )
      .sort((a, b) => sortingFunctions[sortBy](a, b)),
  );

  // Increase number of displayed results as we scroll
  let displayEntriesCount = $state(50);
  onMount(() => {
    return on(window, "scroll", () => {
      if (document.documentElement.scrollHeight - window.scrollY - window.innerHeight < 500) displayEntriesCount += 10;
    });
  });

  $effect.pre(() => {
    if (filteredEntries) {
      untrack(() => {
        displayEntriesCount = 50; // Reset on filter/sorting changes
      });
    }
  });

  // Local Storage handling
  if (browser) {
    (() => {
      const lsPowers = localStorage.getItem("ppCollateralFilterPowers");
      if (lsPowers) filterPowers = JSON.parse(lsPowers);
      const lsSortBy = localStorage.getItem("ppCollateralSortBy");
      if (lsSortBy) sortBy = JSON.parse(lsSortBy);
      const lsShowFilters = localStorage.getItem("ppCollateralShowFilters");
      if (lsShowFilters) showFilters = JSON.parse(lsShowFilters);
    })();
    $effect(() => {
      localStorage.setItem("ppCollateralFilterPowers", JSON.stringify(filterPowers));
    });
    $effect(() => {
      localStorage.setItem("ppCollateralSortBy", JSON.stringify(sortBy));
    });
    $effect(() => {
      localStorage.setItem("ppCollateralShowFilters", JSON.stringify(showFilters));
    });
  }
</script>

<!-- Sorting -->
<div class="flex flex-wrap items-center gap-2">
  <div class="flex flex-col">
    <b>Sort By</b>
  </div>
  <Select class="w-64 px-2 max-sm:grow" bind:value={sortBy}>
    {#each Object.keys(sortingFunctions) as sort (sort)}
      <option>{sort}</option>
    {/each}
  </Select>
</div>
<!-- Filters -->
<div class="mb-2">
  <div class="flex items-center gap-2">
    <button type="button" class="flex items-center gap-1" onclick={() => (showFilters = !showFilters)}>
      <b>Filters</b>
      <FaIcon class="text-xl" icon={showFilters ? faCaretDown : faCaretRight} />
    </button>
    <div class="h-0 grow border border-zinc-500"></div>
  </div>
  {#if showFilters}
    <!-- Filters -->
    <div transition:slide class="flex flex-col gap-2">
      <div class="flex justify-between gap-2">
        <div class="relative">
          <input
            type="text"
            class="w-78 p-1 pr-4 max-sm:grow"
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
      <div class="grid grid-cols-[repeat(auto-fit,minmax(80px,1fr))] gap-2 select-none">
        {#each Object.keys(Powers) as power (power)}
          <label
            class={[
              "flex min-h-16 cursor-pointer items-center justify-center rounded-xl border-2 border-(--ed-orange) bg-zinc-800 p-1 text-center font-semibold hover:bg-zinc-700",
              filterPowers.includes(power) ? "opacity-100" : "opacity-20",
            ]}
          >
            <span style:color={Powers[power].color}>{power}</span>
            <input type="checkbox" class="hidden" name="filterPowers" bind:group={filterPowers} value={power} />
          </label>
        {/each}
      </div>
      <div class="border border-zinc-500"></div>
    </div>
  {/if}
</div>
<!-- Log View -->
{#if filteredEntries}
  <div class="flex items-start">
    <div class="flex w-full flex-col gap-2">
      {#each filteredEntries.slice(0, displayEntriesCount) as sphere (sphere.id64)}
        {@const lastUpdate = new Date(sphere.date)}
        <button
          type="button"
          onclick={() => {
            displaySphereId = displaySphereId !== sphere.id64 ? sphere.id64 : undefined;
            displayInnerSystem = sphere;
          }}
          class={[
            "flex min-h-20 items-center gap-2 rounded-xl border-2 p-2 text-right",
            lastUpdate < lastTick
              ? "border-red-500 bg-red-900/20 hover:bg-red-900/50"
              : "border-(--ed-orange) bg-zinc-800 hover:bg-zinc-700",
          ]}
          draggable="true"
          ondragstart={(e) => {
            e.dataTransfer?.setData("json/edbgs-map-pp-alert", JSON.stringify(sphere));
          }}
        >
          <div
            class="w-4 flex-none self-stretch"
            style:background-color={sphere.controllingPower ? Powers[sphere.controllingPower].color : "transparent"}
          ></div>
          <div class="grow text-left font-semibold">{sphere.name}</div>
          <div class="basis-32">
            {#if (sphere.cycleStart?.startTier ?? sphere.powerState) === "Stronghold"}
              {sphere.collateral.soleSupportingSystemsFort.length} + {sphere.collateral.soleSupportingSystemsSH.length}
            {:else}
              {sphere.collateral.soleSupportingSystemsFort.length}
            {/if}
          </div>
          <div class="basis-32 max-sm:hidden">{sphere.collateral.CPToTierDrop.toLocaleString("en-US")}</div>
          <div
            class="basis-40 max-lg:hidden"
            style:color={sphere.controllingPower ? Powers[sphere.controllingPower].color : "inherit"}
          >
            {sphere.controllingPower}
          </div>
          <div class="basis-32 max-lg:hidden" style:color={powerStateColor(sphere.powerState)}>
            {sphere.powerState}
          </div>
          <div class="basis-32 max-sm:hidden">
            <Time
              class={{
                "text-red-500": lastUpdate < lastTick,
                "text-yellow-300":
                  lastUpdate >= lastTick &&
                  sphere.powerState !== "Unoccupied" &&
                  (sphere.cycleStart?.startBar ?? 0) < 1 &&
                  sphere.lastCycleStart?.startBar === sphere.cycleStart?.startBar,
              }}
              relative
              live
              timestamp={sphere.date}
              title={undefined}
            />
          </div>
        </button>
        {#if displaySphereId === sphere.id64}
          <div transition:slide class="mx-auto w-full p-2 text-center lg:max-w-(--breakpoint-lg)">
            <h2>
              {sphere.name}
              <CopyToClipboardButton text={sphere.name} />
            </h2>
            <p>
              <button
                class="link-btn"
                onclick={() => (displayInnerSystem = sphere)}
                draggable="true"
                ondragstart={(e) => {
                  e.dataTransfer?.setData("json/edbgs-map-pp-alert", JSON.stringify(sphere));
                }}>View System</button
              >
            </p>
            <div class="mb-4 flex flex-col items-start justify-start gap-2">
              <div>
                <b>Supporting Systems:</b>
                {sphere.collateral.supportingSystems}
                {#if sphere.collateral.supportingSystemsSHOnly}({sphere.collateral.supportingSystemsSHOnly} from Stronghold){/if}
              </div>
              <div>
                <b>Solely Supporting:</b>
                {sphere.collateral.soleSupportingSystemsFort.length + sphere.collateral.soleSupportingSystemsSH.length}
              </div>
              {#if sphere.collateral.soleSupportingSystemsSH.length}
                <div>
                  <b>Solely Supporting in Stronghold Range:</b>
                  {sphere.collateral.soleSupportingSystemsSH.length}
                </div>
                <div class="flex flex-wrap gap-2">
                  {#each sphere.collateral.soleSupportingSystemsSH as sys (sys.id64)}
                    <div>
                      <button
                        class="link-btn"
                        onclick={() => (displayInnerSystem = sys)}
                        draggable="true"
                        ondragstart={(e) => {
                          e.dataTransfer?.setData("json/edbgs-map-pp-alert", JSON.stringify(sys));
                        }}>{sys.name}</button
                      >
                    </div>
                  {/each}
                </div>
              {/if}
              {#if sphere.collateral.soleSupportingSystemsFort.length}
                <div>
                  <b>Solely Supporting in Fortified Range:</b>
                  {sphere.collateral.soleSupportingSystemsFort.length}
                </div>
                <div class="flex flex-wrap gap-2">
                  {#each sphere.collateral.soleSupportingSystemsFort as sys (sys.id64)}
                    <div>
                      <button
                        class="link-btn"
                        onclick={() => (displayInnerSystem = sys)}
                        draggable="true"
                        ondragstart={(e) => {
                          e.dataTransfer?.setData("json/edbgs-map-pp-alert", JSON.stringify(sys));
                        }}>{sys.name}</button
                      >
                    </div>
                  {/each}
                </div>
              {/if}
            </div>
            {#if displayInnerSystem}
              {#key displayInnerSystem}
                <div transition:slide>
                  <h3>
                    {displayInnerSystem.name}
                    <CopyToClipboardButton text={displayInnerSystem.name} />
                  </h3>
                  <PowerplaySystemInfo data={displayInnerSystem} />
                </div>
              {/key}
            {/if}
          </div>
        {/if}
      {/each}
    </div>
  </div>
{:else}
  <p>No systems are currently logged.</p>
{/if}
