<script lang="ts">
  import Map from "$lib/components/Map.svelte";
  import { readCustomURL } from "$lib/CustomURL";
  import { MapData } from "$lib/types/MapData.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let mapData = $state(new MapData());
  (() => readCustomURL(new URLSearchParams(data.long), mapData))();
</script>

<svelte:head>
  <title>Shared Factions Map</title>
  <meta name="description" content="A shared map of factions in Elite Dangerous." />
</svelte:head>

<Map bind:data={mapData} />
