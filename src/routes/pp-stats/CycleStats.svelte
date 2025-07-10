<script lang="ts">
  import Tooltip from "$lib/components/Tooltip.svelte";
  import { Powers } from "$lib/Constants";
  import type { getCurrentCycleStats } from "$lib/server/PowerplayStats";

  interface Props {
    stats: Awaited<ReturnType<typeof getCurrentCycleStats>>;
  }
  let { stats }: Props = $props();

  function f(number: number) {
    return number.toLocaleString("en-GB");
  }
</script>

<div class="mt-4 flex flex-wrap justify-center gap-x-10 gap-y-2">
  <div>
    <Tooltip>
      {#snippet tooltip()}The total number of CP in both Reinforcement and Undermining across all known Powerplay
        control systems with data from this cycle.{/snippet}
      <b class="underline decoration-dotted decoration-1">CP Activity in Control Systems:</b>
    </Tooltip><br />
    {f(stats.allPowerStats.reinfCP + stats.allPowerStats.umCP)}
  </div>
  <div>
    <Tooltip>
      {#snippet tooltip()}The total number of CP in Reinforcement across all known Powerplay control systems with data
        from this cycle.{/snippet}
      <b class="underline decoration-dotted decoration-1">CP of Reinforcements in Control Systems:</b>
    </Tooltip><br />
    {f(stats.allPowerStats.reinfCP)}
  </div>
  <div>
    <Tooltip>
      {#snippet tooltip()}The total number of CP in Undermining across all known Powerplay control systems with data
        from this cycle.{/snippet}
      <b class="underline decoration-dotted decoration-1">CP of Undermining in Control Systems:</b>
    </Tooltip><br />
    {f(stats.allPowerStats.umCP)}
  </div>
  <div>
    <Tooltip>
      {#snippet tooltip()}The total number of CP accumulated in open Acquisition systems. By nature of Acquisitions,
        this includes work from past cycles if a system did not reach 100%.{/snippet}
      <b class="underline decoration-dotted decoration-1">CP of Acquisition Progress:</b>
    </Tooltip><br />
    {f(stats.allPowerStats.acquisitionCP)}
  </div>
  <div>
    <Tooltip>
      {#snippet tooltip()}The converted number of all known control systems' current effective progress into CP. Per
        system value thus ranges from 0 for the left border of Exploited to 2 million for a maxed out Stronghold.{/snippet}
      <b class="underline decoration-dotted decoration-1">CP in System Progress Bars:</b>
    </Tooltip><br />
    {f(stats.allPowerStats.progressCP)}
  </div>
</div>
<div class="mt-4 grid grid-cols-[repeat(auto-fit,_minmax(225px,_1fr))] gap-2">
  {#each Object.entries(stats.powerStats) as [power, ps] (power)}
    <div class="rounded-xl border-2 bg-zinc-800 p-1.5" style={`border-color: ${Powers[power].color}`}>
      <h4 style={`color: ${Powers[power].color}`}>{power}</h4>
      <div class="flex flex-col">
        <div class="flex justify-between gap-1">
          <b>Systems:</b>
          <span>{f(ps.systems)}</span>
        </div>
        <div class="flex justify-between gap-1">
          <b>Exploited:</b>
          <span>{f(ps.systems - ps.fortified - ps.stronghold)}</span>
        </div>
        <div class="flex justify-between gap-1">
          <b>Fortified:</b>
          <span>{f(ps.fortified)}</span>
        </div>
        <div class="mb-2 flex justify-between gap-1">
          <b>Strongholds:</b>
          <span>{f(ps.stronghold)}</span>
        </div>
        <div class="flex justify-between gap-1">
          <Tooltip>
            {#snippet tooltip()}The total number of CP in both Reinforcement and Undermining of this power's space this
              cycle.<br />
              Does not include Acquisition CP since those can carry over between cycles.{/snippet}
            <b class="underline decoration-dotted decoration-1">Activity:</b>
          </Tooltip>
          <span>{f(ps.reinfCP + ps.umCP)}</span>
        </div>
        <div class="flex justify-between gap-1">
          <Tooltip>
            {#snippet tooltip()}The total number of CP in Reinforcement of this power's space this cycle.{/snippet}
            <b class="underline decoration-dotted decoration-1">Reinforcement:</b>
          </Tooltip>
          <span>{f(ps.reinfCP)}</span>
        </div>
        <div class="flex justify-between gap-1">
          <Tooltip>
            {#snippet tooltip()}The total number of CP in Undermining of this power's space this cycle.{/snippet}
            <b class="underline decoration-dotted decoration-1">Undermining:</b>
          </Tooltip>
          {f(ps.umCP)}
        </div>
        <div class="flex justify-between gap-1">
          <Tooltip>
            {#snippet tooltip()}The total number of CP accumulated by this power in open Acquisition systems. By nature
              of Acquisitions, this includes work from past cycles if a system did not reach 100%.{/snippet}
            <b class="underline decoration-dotted decoration-1">Acquisition:</b>
          </Tooltip>
          <span>{f(ps.acquisitionCP)}</span>
        </div>
        <div class="flex justify-between gap-1">
          <Tooltip>
            {#snippet tooltip()}The converted number of all known control systems' current effective progress into CP.
              Per system value thus ranges from 0 for the left border of Exploited to 2 million for a maxed out
              Stronghold.{/snippet}
            <b class="underline decoration-dotted decoration-1">System CP:</b>
          </Tooltip>
          <span>{f(ps.progressCP)}</span>
        </div>
      </div>
    </div>
  {/each}
</div>
