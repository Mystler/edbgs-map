<script lang="ts">
  import Tooltip from "$lib/components/Tooltip.svelte";
  import { Powers } from "$lib/Constants";
  import type { getCurrentCycleStats } from "$lib/server/PowerplayStats";

  type DeepPartial<T> = T extends object
    ? {
        [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

  interface Props {
    stats: DeepPartial<Awaited<ReturnType<typeof getCurrentCycleStats>>>;
  }
  let { stats }: Props = $props();

  function f(number: number) {
    return number.toLocaleString("en-GB");
  }
</script>

<div class="mt-4 flex flex-wrap justify-center gap-x-10 gap-y-2">
  {#if stats.allPowerStats?.systems && stats.allPowerStats?.updatedThisCycle}
    <div>
      <Tooltip>
        {#snippet tooltip()}The number of known Control Systems across all powers and the percentage of control systems
          that have been visited and updated at least once this cycle.{/snippet}
        <b class="underline decoration-dotted decoration-1">Control Systems:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.systems)} ({f(
        Math.round((stats.allPowerStats.updatedThisCycle / stats.allPowerStats.systems) * 100),
      )}%)
    </div>
  {/if}
  {#if stats.allPowerStats?.reinfCP && stats.allPowerStats?.umCP}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP in both Reinforcement and Undermining across all known Powerplay
          control systems with data from this cycle.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP Activity in Control Systems:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.reinfCP + stats.allPowerStats.umCP)}
    </div>
  {/if}
  {#if stats.allPowerStats?.reinfCP}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP in Reinforcement across all known Powerplay control systems with data
          from this cycle.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP of Reinforcements in Control Systems:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.reinfCP)}
    </div>
  {/if}
  {#if stats.allPowerStats?.umCP}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP in Undermining across all known Powerplay control systems with data
          from this cycle.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP of Undermining in Control Systems:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.umCP)}
    </div>
  {/if}
  {#if stats.allPowerStats?.acquisitionCP}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP accumulated in open Acquisition systems. By nature of Acquisitions,
          this includes work from past cycles if a system did not reach 100%.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP of Acquisition Progress:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.acquisitionCP)}
    </div>
  {/if}
  {#if stats.allPowerStats?.progressCP}
    <div>
      <Tooltip>
        {#snippet tooltip()}The converted number of all known control systems' current effective progress into CP. Per
          system value thus ranges from 0 for the left border of Exploited to 2 million for a maxed out Stronghold.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP in System Progress Bars:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.progressCP)}
    </div>
  {/if}
</div>
{#if stats.powerStats}
  <div class="mt-4 grid grid-cols-[repeat(auto-fit,_minmax(225px,_1fr))] gap-2">
    {#each Object.entries(stats.powerStats) as [power, ps] (power)}
      <div class="rounded-xl border-2 bg-zinc-800 p-1.5" style={`border-color: ${Powers[power].color}`}>
        <h4 style={`color: ${Powers[power].color}`}>{power}</h4>
        <div class="flex flex-col">
          {#if ps?.systems}
            <div class="flex justify-between gap-1">
              <b>Systems:</b>
              <span>{f(ps.systems)}</span>
            </div>
          {/if}
          {#if ps?.systems && ps?.fortified && ps?.stronghold}
            <div class="flex justify-between gap-1">
              <b>Exploited:</b>
              <span>{f(ps.systems - ps.fortified - ps.stronghold)}</span>
            </div>
          {/if}
          {#if ps?.fortified}
            <div class="flex justify-between gap-1">
              <b>Fortified:</b>
              <span>{f(ps.fortified)}</span>
            </div>
          {/if}
          {#if ps?.stronghold}
            <div class="mb-2 flex justify-between gap-1">
              <b>Strongholds:</b>
              <span>{f(ps.stronghold)}</span>
            </div>
          {/if}
          {#if ps?.reinfCP && ps?.umCP}
            <div class="flex justify-between gap-1">
              <Tooltip anchor="left">
                {#snippet tooltip()}The total number of CP in both Reinforcement and Undermining of this power's space
                  this cycle.<br />
                  Does not include Acquisition CP since those can carry over between cycles.{/snippet}
                <b class="underline decoration-dotted decoration-1">Activity:</b>
              </Tooltip>
              <span>{f(ps.reinfCP + ps.umCP)}</span>
            </div>
          {/if}
          {#if ps?.reinfCP}
            <div class="flex justify-between gap-1">
              <Tooltip anchor="left">
                {#snippet tooltip()}The total number of CP in Reinforcement of this power's space this cycle.{/snippet}
                <b class="underline decoration-dotted decoration-1">Reinforcement:</b>
              </Tooltip>
              <span>{f(ps.reinfCP)}</span>
            </div>
          {/if}
          {#if ps?.umCP}
            <div class="flex justify-between gap-1">
              <Tooltip anchor="left">
                {#snippet tooltip()}The total number of CP in Undermining of this power's space this cycle.{/snippet}
                <b class="underline decoration-dotted decoration-1">Undermining:</b>
              </Tooltip>
              {f(ps.umCP)}
            </div>
          {/if}
          {#if ps?.acquisitionCP}
            <div class="flex justify-between gap-1">
              <Tooltip anchor="left">
                {#snippet tooltip()}The total number of CP accumulated by this power in open Acquisition systems. By
                  nature of Acquisitions, this includes work from past cycles if a system did not reach 100%.{/snippet}
                <b class="underline decoration-dotted decoration-1">Acquisition:</b>
              </Tooltip>
              <span>{f(ps.acquisitionCP)}</span>
            </div>
          {/if}
          {#if ps?.progressCP}
            <div class="flex justify-between gap-1">
              <Tooltip anchor="left">
                {#snippet tooltip()}The converted number of all known control systems' current effective progress into
                  CP. Per system value thus ranges from 0 for the left border of Exploited to 2 million for a maxed out
                  Stronghold.{/snippet}
                <b class="underline decoration-dotted decoration-1">System CP:</b>
              </Tooltip>
              <span>{f(ps.progressCP)}</span>
            </div>
          {/if}
          {#if ps?.systems && ps?.updatedThisCycle}
            <div class="flex justify-between gap-1">
              <Tooltip anchor="left">
                {#snippet tooltip()}The percentage of control systems that have been visited and updated at least once
                  this cycle.{/snippet}
                <b class="underline decoration-dotted decoration-1">Updated:</b>
              </Tooltip>
              <span>{f(Math.round((ps.updatedThisCycle / ps.systems) * 100))}%</span>
            </div>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}
