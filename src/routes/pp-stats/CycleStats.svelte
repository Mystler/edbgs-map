<script lang="ts">
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
    <b>CP activity in Control Systems:</b><br />
    {f(stats.allPowerStats.reinfCP + stats.allPowerStats.umCP)}
  </div>
  <div>
    <b>CP of Reinforcements in Control Systems:</b><br />
    {f(stats.allPowerStats.reinfCP)}
  </div>
  <div>
    <b>CP of Undermining in Control Systems:</b><br />
    {f(stats.allPowerStats.umCP)}
  </div>
  <div>
    <b>CP of Acquisition Progress:</b><br />
    {f(stats.allPowerStats.acquisitionCP)}
  </div>
  <div>
    <b>CP in System Progress Bars:</b><br />
    {f(stats.allPowerStats.progressCP)}
  </div>
</div>
<div class="mt-4 grid grid-cols-[repeat(auto-fit,_minmax(225px,_1fr))] gap-2">
  {#each Object.entries(stats.powerStats) as [power, ps] (power)}
    <div class="rounded-xl border-2 p-1.5" style={`border-color: ${Powers[power].color}`}>
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
          <b>Activity:</b>
          <span>{f(ps.reinfCP + ps.umCP)}</span>
        </div>
        <div class="flex justify-between gap-1">
          <b>Reinforcement:</b>
          <span>{f(ps.reinfCP)}</span>
        </div>
        <div class="flex justify-between gap-1">
          <b>Undermining:</b>
          {f(ps.umCP)}
        </div>
        <div class="flex justify-between gap-1">
          <b>Acquisition:</b>
          <span>{f(ps.acquisitionCP)}</span>
        </div>
        <div class="flex justify-between gap-1">
          <b>System CP:</b>
          <span>{f(ps.progressCP)}</span>
        </div>
      </div>
    </div>
  {/each}
</div>
