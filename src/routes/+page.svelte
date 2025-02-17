<script lang="ts">
  import Map from "$lib/components/Map.svelte";
  import { MapData } from "$lib/types/MapData.svelte";
  import MapSetup from "$lib/components/MapSetup.svelte";
  import { browser } from "$app/environment";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";

  let mapData = $state(new MapData());
  let setupComplete = $state(false);

  function onConfirmRender() {
    setupComplete = true;
  }

  if (browser) {
    // Sync custom map settings with local storage
    (() => {
      const saved = localStorage.getItem("customMapSetup");
      if (saved) {
        mapData = MapData.fromJSON(saved);
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
{:else}
  <MapSetup bind:data={mapData} {onConfirmRender} />
{/if}
