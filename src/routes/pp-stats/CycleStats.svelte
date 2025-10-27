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
  {#if stats.allPowerStats?.reinfCP !== undefined && stats.allPowerStats?.umCPNoDecay !== undefined && stats.allPowerStats?.cycleAcquisitionCP}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP done by players in Reinforcement, Acquisition, and Undermining (with
          decay removed) across all known Powerplay systems with data from this cycle.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP Activity:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.reinfCP + stats.allPowerStats.umCPNoDecay + stats.allPowerStats.cycleAcquisitionCP)}
    </div>
  {:else if stats.allPowerStats?.reinfCP !== undefined && stats.allPowerStats?.umCPNoDecay !== undefined}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP in both Reinforcement and Undermining (with decay removed) across all
          known Powerplay control systems with data from this cycle.<br /><br />This is an older version of the activity
          score from before in cycle Acquisition was being tracked.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP Activity in Control Systems:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.reinfCP + stats.allPowerStats.umCPNoDecay)}
    </div>
  {:else if stats.allPowerStats?.reinfCP !== undefined && stats.allPowerStats?.umCP !== undefined}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP in both Reinforcement and Undermining (including decay) across all
          known Powerplay control systems with data from this cycle..<br /><br />This is an older version of the
          activity score from before decay existed or in cycle Acquisition was being tracked.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP Activity* in Control Systems:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.reinfCP + stats.allPowerStats.umCP)}
    </div>
  {/if}
  {#if stats.allPowerStats?.reinfCP !== undefined}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP in Reinforcement across all known Powerplay control systems with data
          from this cycle.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP of Reinforcements in Control Systems:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.reinfCP)}
    </div>
  {/if}
  {#if stats.allPowerStats?.umCP !== undefined}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP in Undermining (including decay) across all known Powerplay control
          systems with data from this cycle.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP of Undermining in Control Systems:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.umCP)}
    </div>
  {/if}
  {#if stats.allPowerStats?.umCPNoDecay !== undefined}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP in Undermining (with decay removed) across all known Powerplay
          control systems with data from this cycle.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP of Player UM in Control Systems:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.umCPNoDecay)}
    </div>
  {/if}
  {#if stats.allPowerStats?.acquisitionCP !== undefined}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of CP accumulated in open Acquisition systems. By nature of Acquisitions,
          this includes work from past cycles if a system did not reach 100%.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP of Acquisition Progress:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.acquisitionCP)}
    </div>
  {/if}
  {#if stats.allPowerStats?.cycleAcquisitionCP !== undefined}
    <div>
      <Tooltip>
        {#snippet tooltip()}The calculated number of CP that powers were known to do in Acquisitions this cycle.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP of Acquisition in Cycle:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.cycleAcquisitionCP)}
    </div>
  {/if}
  {#if stats.allPowerStats?.expectedAcquisitions !== undefined}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total number of new systems expected to be controlled by a power next cycle.{/snippet}
        <b class="underline decoration-dotted decoration-1">Expected Acquisitions:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.expectedAcquisitions)}
    </div>
  {/if}
  {#if stats.allPowerStats?.progressCP !== undefined}
    <div>
      <Tooltip>
        {#snippet tooltip()}The converted number of all known control systems' current effective progress into CP. Per
          system value thus ranges from 0 for the left border of Exploited to 2 million for a maxed out Stronghold.{/snippet}
        <b class="underline decoration-dotted decoration-1">CP in System Progress Bars:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.progressCP)}
    </div>
  {/if}
  {#if stats.allPowerStats?.population !== undefined}
    <div>
      <Tooltip>
        {#snippet tooltip()}The total amount of population controlled by all powers.{/snippet}
        <b class="underline decoration-dotted decoration-1">Controlled Population:</b>
      </Tooltip><br />
      {f(stats.allPowerStats.population)}
    </div>
  {/if}
</div>
{#if stats.powerStats}
  <div class="mt-4 grid grid-cols-[repeat(auto-fit,minmax(225px,1fr))] gap-2">
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
          {#if ps?.reinfCP !== undefined && ps?.umCPNoDecay !== undefined && ps?.cycleAcquisitionCP !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The total number of CP by players in Reinforcement, Acquisition, and Undermining
                  (with decay removed) of this power's space this cycle.{/snippet}
                <b class="underline decoration-dotted decoration-1">Activity:</b>
              </Tooltip>
              <span>{f(ps.reinfCP + ps.umCPNoDecay + ps.cycleAcquisitionCP)}</span>
            </div>
          {:else if ps?.reinfCP !== undefined && ps?.umCPNoDecay !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The total number of CP in both Reinforcement and Undermining (with decay removed) of
                  this power's space this cycle.<br />
                  This stat is from before in cyle Acquisition was tracked and thus does not include Acquisition CP.{/snippet}
                <b class="underline decoration-dotted decoration-1">Activity:</b>
              </Tooltip>
              <span>{f(ps.reinfCP + ps.umCPNoDecay)}</span>
            </div>
          {:else if ps?.reinfCP !== undefined && ps?.umCP !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The total number of CP in both Reinforcement and Undermining (including decay) of
                  this power's space this cycle.<br />
                  Does not include Acquisition CP since those can carry over between cycles. This is an old version of this
                  stat.{/snippet}
                <b class="underline decoration-dotted decoration-1">Activity*:</b>
              </Tooltip>
              <span>{f(ps.reinfCP + ps.umCP)}</span>
            </div>
          {/if}
          {#if ps?.reinfCP !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The total number of CP in Reinforcement of this power's space this cycle.{/snippet}
                <b class="underline decoration-dotted decoration-1">Reinforcement:</b>
              </Tooltip>
              <span>{f(ps.reinfCP)}</span>
            </div>
          {/if}
          {#if ps?.umCP !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The total number of CP in Undermining (including decay) of this power's space this
                  cycle.{/snippet}
                <b class="underline decoration-dotted decoration-1">Undermining:</b>
              </Tooltip>
              {f(ps.umCP)}
            </div>
          {/if}
          {#if ps?.umCPNoDecay !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The total number of CP in Undermining (with decay removed) of this power's space
                  this cycle.{/snippet}
                <b class="underline decoration-dotted decoration-1">Player UM:</b>
              </Tooltip>
              {f(ps.umCPNoDecay)}
            </div>
          {/if}
          {#if ps?.acquisitionCP !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The total number of CP accumulated by this power in open Acquisition systems. By
                  nature of Acquisitions, this includes work from past cycles if a system did not reach 100%.{/snippet}
                <b class="underline decoration-dotted decoration-1">Acquisition:</b>
              </Tooltip>
              <span>{f(ps.acquisitionCP)}</span>
            </div>
          {/if}
          {#if ps?.cycleAcquisitionCP !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The calculated number of CP that this power was known to spend in Acquisitions this
                  cycle.{/snippet}
                <b class="underline decoration-dotted decoration-1">Acq in Cycle:</b>
              </Tooltip>
              <span>{f(ps.cycleAcquisitionCP)}</span>
            </div>
          {/if}
          {#if ps?.expectedAcquisitions !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The current number of systems with the power leading the acquisition above 100%,
                  thus expecting it to control the system next cycle.{/snippet}
                <b class="underline decoration-dotted decoration-1">Expected New:</b>
              </Tooltip>
              <span>{f(ps.expectedAcquisitions)}</span>
            </div>
          {/if}
          {#if ps?.progressCP !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The converted number of all known control systems' current effective progress into
                  CP. Per system value thus ranges from 0 for the left border of Exploited to 2 million for a maxed out
                  Stronghold.{/snippet}
                <b class="underline decoration-dotted decoration-1">System CP:</b>
              </Tooltip>
              <span>{f(ps.progressCP)}</span>
            </div>
          {/if}
          {#if ps?.population !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
                {#snippet tooltip()}The total amount of population controlled by this power.{/snippet}
                <b class="underline decoration-dotted decoration-1">Pops:</b>
              </Tooltip>
              <span>{f(ps.population)}</span>
            </div>
          {/if}
          {#if ps?.systems && ps?.updatedThisCycle !== undefined}
            <div class="flex justify-between gap-1">
              <Tooltip>
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
