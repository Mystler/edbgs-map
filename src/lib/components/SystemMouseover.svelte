<script lang="ts">
  import { Powers } from "../Constants";
  import type { SpanshSystem } from "../SpanshAPI";

  let { system }: { system: SpanshSystem } = $props();
</script>

<div>{system.name}</div>
{#if system.controlling_power}
  <div class="text-2xl" style={`color: ${Powers[system.controlling_power].color}`}>
    {system.controlling_power} ({system.power_state})
  </div>
{/if}
