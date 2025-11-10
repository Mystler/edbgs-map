<script lang="ts">
  import type { PageProps } from "./$types";
  import CycleStats from "$lib/components/CycleStats.svelte";

  let { data }: PageProps = $props();
</script>

{#await data.stats}
  <div class="flex justify-center overflow-hidden">
    <span class="size-32 animate-spin rounded-full border-24 border-(--ed-orange) border-t-transparent"></span>
  </div>
{:then stats}
  <!-- Current Cycle View -->
  <div class="mt-2 text-center">
    <div class="mx-auto w-full p-2 text-center">
      <h2>Cycle 2.{stats.stats.cycle}</h2>
      <p>
        <i
          >Snapshot from {new Date(stats.date).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
          })}</i
        >
      </p>
      {#key stats.stats}
        <CycleStats stats={stats.stats} />
      {/key}
    </div>
  </div>
{/await}
