<script lang="ts">
  import { FlyToSystem } from "$lib/types/CurrentCamera.svelte";
  import { LoadedSystems } from "$lib/types/LoadedData.svelte";

  let search = $state("");
</script>

<input
  type="text"
  class="opacity-10 transition-opacity duration-400 focus:opacity-100 pointer-fine:hover:opacity-100"
  placeholder="Go to loaded system..."
  list="knownSystems"
  bind:value={search}
  onchange={(e) => {
    if (e.currentTarget.value && FlyToSystem(e.currentTarget.value)) {
      search = "";
      e.currentTarget.blur();
    }
  }}
/>
<datalist id="knownSystems">
  {#each LoadedSystems.keys()
    .filter((name) => !search || name.toLowerCase().includes(search.toLowerCase()))
    .toArray()
    .slice(0, 10)
    .sort() as name (name)}
    <option>{name}</option>
  {/each}
</datalist>
