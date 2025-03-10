<script lang="ts">
  import Map from "$lib/components/Map.svelte";
  import { MapData } from "$lib/types/MapData.svelte";
  import MapSetup from "$lib/components/MapSetup.svelte";
  import { browser } from "$app/environment";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";
  import { page } from "$app/state";
  import { readCustomURL } from "$lib/CustomURL";

  let mapData = $state(new MapData());
  let setupComplete = $state(false);

  function onConfirmRender() {
    setupComplete = true;
  }

  if (browser && page.url.searchParams.size === 0) {
    // Sync custom map settings with local storage, if we're not using a customized link
    (() => {
      const saved = localStorage.getItem("customMapSetup");
      if (saved) {
        mapData.setFromJSON(saved);
        mapData.sortAll();
      }
      const savedCamera = localStorage.getItem("customMapCamera");
      if (savedCamera) {
        const json: Partial<typeof CurrentCamera> = JSON.parse(savedCamera);
        mapData.Camera.position = json.Position;
        mapData.Camera.lookAt = json.LookAt;
      }
    })();
    $effect(() => {
      localStorage.setItem("customMapSetup", JSON.stringify(mapData));
    });
    $effect(() => {
      if (setupComplete) localStorage.setItem("customMapCamera", JSON.stringify(CurrentCamera));
    });
  } else if (browser && page.url.searchParams.size > 0) {
    (() => {
      readCustomURL(page.url.searchParams, mapData);
      mapData.sortAll();
      setupComplete = true;
    })();
  }
</script>

<svelte:head>
  <title>Custom Factions Map</title>
  <meta
    name="description"
    content="A 3D-map of minor factions in Elite Dangerous - locally configured on your browser."
  />
</svelte:head>

{#if setupComplete}
  <Map bind:data={mapData} />
{:else if page.url.searchParams.size === 0}
  <MapSetup bind:data={mapData} {onConfirmRender} />
{/if}
