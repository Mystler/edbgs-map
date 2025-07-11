<script lang="ts">
  import Time from "svelte-time";
  import type { PageProps } from "./$types";
  import { slide } from "$lib/types/Animations.svelte";
  import PowerplayPageNav from "$lib/components/PowerplayPageNav.svelte";
  import CycleStats from "./CycleStats.svelte";

  let { data }: PageProps = $props();

  let displayHistoryId = $state<number>();
</script>

<svelte:head>
  <title>Cycle Stats</title>
  <meta name="description" content="An approximated view of Powerplay Cycle Stats." />
</svelte:head>

<PowerplayPageNav />
<div class="mx-auto px-1 pb-4 xl:max-w-(--breakpoint-xl)">
  <!-- Intro section -->
  <h1 class="text-center">Cycle Stats</h1>
  <p class="text-center text-sm">
    See this and past cycle's stats. Note that these are based on known data and subject to inaccuracies from missing or
    outdated information.
  </p>
  {#await data.stats}
    <div class="flex justify-center overflow-hidden">
      <span class="size-32 animate-spin rounded-full border-24 border-(--ed-orange) border-t-transparent"></span>
    </div>
  {:then stats}
    <!-- Current Cycle View -->
    <div class="mt-2 text-center">
      <div class="mx-auto w-full p-2 text-center lg:max-w-(--breakpoint-lg)">
        <h2>Current Cycle 2.{stats.currentCycle.cycle}</h2>
        <CycleStats stats={stats.currentCycle} />
      </div>
    </div>
    <!-- History -->
    {#if stats.history.length > 0}
      <div class="my-2 border-1 border-zinc-500"></div>
      <div class="flex flex-col gap-2">
        {#each stats.history as cycle (cycle.id)}
          {@const timestamp = new Date(cycle.date)}
          <button
            type="button"
            onclick={() => {
              displayHistoryId = displayHistoryId !== cycle.id ? cycle.id : undefined;
            }}
            class="flex min-h-20 items-center gap-2 rounded-xl border-2 border-(--ed-orange) bg-zinc-800 p-2 text-right hover:bg-zinc-700"
          >
            <div class="grow-1 text-left text-xl font-bold">Cycle 2.{cycle.stats.cycle}</div>
            <div class="basis-32">
              <Time relative live {timestamp} title={undefined} />
            </div>
          </button>
          {#if displayHistoryId === cycle.id}
            <div transition:slide class="mx-auto w-full p-2 text-center lg:max-w-(--breakpoint-lg)">
              <p>
                <i
                  >Snapshot from {timestamp.toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })}</i
                >
              </p>
              <CycleStats stats={cycle.stats} />
            </div>
          {/if}
        {/each}
      </div>
    {/if}
  {/await}
</div>
