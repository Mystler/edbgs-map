<script lang="ts">
  import Map from "$lib/components/Map.svelte";
  import { MapData } from "$lib/types/MapData.svelte";
  import MapSetup from "$lib/components/MapSetup.svelte";

  let mapData = $state(new MapData());
  let setupComplete = $state(false);

  function onConfirmRender() {
    setupComplete = true;
  }
</script>

<svelte:head>
  <title>EliteBGS - Custom Factions Map</title>
  <meta
    name="description"
    content="A 3D-map of minor factions in Elite - locally configured on your browser."
  />
</svelte:head>

{#if setupComplete}
  <Map bind:data={mapData} />
{:else}
  <MapSetup bind:data={mapData} {onConfirmRender} />
{/if}
