<script lang="ts">
  import Map from "$lib/components/Map.svelte";
  import { MapData } from "$lib/types/MapData.svelte";

  let mapData = $state(new MapData());

  // Preset setup
  (() => {
    mapData.Camera.lookAt = [100, -150, -80];
    mapData.Camera.distance = 250;
    mapData.addFaction({ name: "The Guard of Outer Imperial Colonies", color: "#e5ff00" });
    mapData.addFaction({ name: "House Chanter Corporation", color: "#6e6bff" });
    mapData.addFaction({ name: "Nexus Heavy Industries", color: "#ff2beb" });
    mapData.addFaction({ name: "The Void Walkers", color: "#9000b8" });
    mapData.addFaction({ name: "Imperial Dragoons", color: "#ff0000" });
    mapData.addFaction({ name: "The Silent Guardians", color: "#70ff94" });
    mapData.addFaction({ name: "Workers of Quillaente Union Party", color: "#c252ff" });
    mapData.addFaction({ name: "Confederacy of British Commanders", color: "#00ffff" });
    mapData.addFaction({ name: "Imperial Deathwatch", color: "#00aaff" });
    mapData.addFaction({ name: "Clans of Mandalore", color: "#c252ff" });
    mapData.addFaction({ name: "Off World Collective", color: "#fe8b62" });
    mapData.sortAll();
  })();
</script>

<svelte:head>
  <title>Signum Initiative Map</title>
  <meta name="description" content="A 3D-map of factions related to the Signum Initiative." />
</svelte:head>

<Map bind:data={mapData} />
