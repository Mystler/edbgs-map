<script lang="ts">
  import Map from "$lib/components/Map.svelte";
  import { MapData } from "$lib/types/MapData.svelte";

  let mapData = $state(new MapData());

  // Preset setup
  (() => {
    mapData.Camera.lookAt = [130, -178, -90];
    mapData.Camera.distance = 125;
    mapData.addFaction({ name: "Adamantine Union", color: "#ff0000" });
    mapData.addFaction({ name: "Prismatic Imperium", color: "#00ff00" });
  })();
</script>

<svelte:head>
  <title>Prismatic Imperium Map</title>
  <meta name="description" content="A 3D-map of Prismatic Imperium space in the bubble." />
</svelte:head>

<Map bind:data={mapData} />
