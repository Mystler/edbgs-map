<script lang="ts">
  import { Canvas } from "@threlte/core";
  import type { MapData } from "../types/MapData.svelte";
  import FactionGroup from "./FactionGroup.svelte";
  import SystemGroup from "./SystemGroup.svelte";
  import Sphere from "./Sphere.svelte";
  import { browser } from "$app/environment";
  import CameraGrid from "./CameraGrid.svelte";
  import MapContent from "./MapContent.svelte";
  import { PerfMonitor } from "@threlte/extras";
  import { slide } from "svelte/transition";
  import Measurement, { CurrentMeasurement } from "./Measurement.svelte";
  import { setContext } from "svelte";
  import type { ClickMode, HUDInfo } from "$lib/types/HUDInfo";

  interface Props {
    data: MapData;
  }
  let { data = $bindable() }: Props = $props();

  let showGrid = $state(true);
  let perfMon = $state(false);
  let menuOpen = $state(false);

  let hudInfo: HUDInfo = $state({ currentSystem: "", clickMode: "inara" });
  setContext("hudInfo", hudInfo);

  if (browser) {
    const lsGridVal = localStorage.getItem("showGrid");
    if (lsGridVal) showGrid = lsGridVal === "true";
    const lsClickVal = localStorage.getItem("clickMode");
    if (lsClickVal) hudInfo.clickMode = lsClickVal as ClickMode;

    $effect(() => {
      localStorage.setItem("showGrid", JSON.stringify(showGrid));
    });
    $effect(() => {
      localStorage.setItem("clickMode", hudInfo.clickMode);
    });
  }
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.key === "g") showGrid = !showGrid;
    else if (e.key === "f") perfMon = !perfMon;
    else if (e.key === "m") menuOpen = !menuOpen;
  }}
/>

{#if browser}
  <!-- Canvas -->
  <div class="h-lvh w-lvw">
    <Canvas>
      <MapContent>
        {#if perfMon}
          <PerfMonitor anchorX="right" />
        {/if}
        <CameraGrid {showGrid} />

        <Measurement />

        {#each data.Factions as f, i (f.name)}
          <FactionGroup faction={data.Factions[i]} />
        {/each}
        {#each data.Systems as s, i (s.name)}
          <SystemGroup system={data.Systems[i]} />
        {/each}
        {#each data.Spheres as s, i (s.name)}
          <Sphere sphere={data.Spheres[i]} />
        {/each}
      </MapContent>
    </Canvas>
  </div>

  <!-- HUD -->
  <div class="pointer-events-none fixed bottom-10 w-full text-center text-3xl">
    {#if hudInfo.currentSystem}
      <div>{hudInfo.currentSystem}</div>
    {/if}
    {@render CurrentMeasurement.HUDSnippet()}
  </div>

  <!-- Controls Menu -->
  <button
    class="hover:cur fixed top-0 left-0 z-50 p-1 text-3xl"
    onclick={() => {
      menuOpen = !menuOpen;
    }}>☰</button
  >
  {#if menuOpen}
    <div transition:slide class="fixed top-0 w-xs bg-(--ed-orange)/20 p-2 pt-6">
      <span class="absolute top-2 right-2">Share</span>
      <h2>Controls</h2>
      <div class="flex flex-wrap justify-between gap-2 py-2">
        <div>
          <label>
            Show Grid
            <input type="checkbox" bind:checked={showGrid} class="ml-1" />
          </label>
        </div>
        <div>
          <span>On System Click</span>
          <select class="p-1" bind:value={hudInfo.clickMode}>
            <option value="inara">Open INARA</option>
            <option value="measure">Measure Distance</option>
          </select>
        </div>
      </div>
      <hr />
      <h4>Minor Factions</h4>
      {#each data.Factions as f, i (f.name)}
        <div class="flex items-center gap-2">
          <label for={`mfsc-${i}`} class="grow">{f.displayName}</label>
          <input id={`mfsc-${i}`} type="checkbox" bind:checked={f.visible} />
          <input type="color" bind:value={f.color} />
        </div>
      {/each}
      <hr />
      <h4>Individual Systems</h4>
      {#each data.Systems as s, i (s.name)}
        <div class="flex gap-2">
          <label for={`mssc-${i}`} class="grow">{s.displayName}</label>
          <input id={`mssc-${i}`} type="checkbox" bind:checked={s.visible} />
          <input type="color" bind:value={s.color} />
        </div>
      {/each}
      <hr />
      <h4>Powerplay Spheres</h4>
      {#each data.Spheres as s, i (s.name)}
        <div class="flex items-center gap-2">
          <label for={`mspsc-${i}`} class="grow">{s.name}</label>
          <input id={`mspsc-${i}`} type="checkbox" bind:checked={s.visible} />
          <input type="color" bind:value={s.color} />
          <select bind:value={s.type} class="p-1">
            <option>Fortified</option>
            <option>Stronghold</option>
          </select>
        </div>
      {/each}
    </div>
  {/if}
{/if}
