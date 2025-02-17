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
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { base } from "$app/paths";

  interface Props {
    data: MapData;
  }
  let { data = $bindable() }: Props = $props();

  let showGrid = $state(false);
  let perfMon = $state(false);
  let menuOpen = $state(false);

  if (browser) {
    const lsGridVal = localStorage.getItem("showGrid");
    if (lsGridVal) showGrid = lsGridVal === "true";

    $effect(() => {
      localStorage.setItem("showGrid", JSON.stringify(showGrid));
    });
  }

  let addFaction = $state("");
  let addSystem = $state("");
  let addSphere = $state("");
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === "g") showGrid = !showGrid;
    else if (e.key === "f") perfMon = !perfMon;
    else if (e.key === "c") menuOpen = !menuOpen;
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
        <CameraGrid {showGrid} cameraSetup={data.Camera} />

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
  {#if HUDInfo.LoadingMessages.length > 0}
    <div class="pointer-events-none absolute right-2 bottom-10 w-sm rounded-xl backdrop-blur-sm">
      {#each HUDInfo.LoadingMessages as m}
        <div class="flex items-center gap-2 p-2">
          <span
            class="size-4 animate-spin rounded-full border-4 border-(--ed-orange) border-t-transparent"
          ></span>
          <span class="grow">{m.Message}</span>
        </div>
      {/each}
    </div>
  {/if}
  <div class="pointer-events-none absolute bottom-10 w-full text-center text-3xl">
    {#if HUDInfo.CurrentSystem}
      <div>{HUDInfo.CurrentSystem}</div>
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
    <div
      transition:slide
      class="absolute top-0 max-h-full w-screen overflow-auto bg-(--ed-orange)/20 p-2 pt-6 sm:w-xs"
    >
      <div class="absolute top-2 right-2 flex flex-col items-end">
        <span><strike>Share</strike></span>
        <a data-sveltekit-reload href={`${base}/`} title="Back">Back</a>
      </div>
      <h2>Controls</h2>
      <div class="flex flex-wrap items-center justify-between gap-2 py-2">
        <div>
          <label>
            Show Grid
            <input type="checkbox" bind:checked={showGrid} class="ml-1" />
          </label>
        </div>
        <div>
          <span>On System Click</span>
          <select class="p-1" bind:value={HUDInfo.ClickMode}>
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
          <input class="flex-none" type="color" bind:value={f.color} />
        </div>
      {/each}
      <div class="flex items-center">
        <input type="text" class="grow p-1" bind:value={addFaction} />
        <input
          type="button"
          class="px-2 py-1"
          value="Add"
          onclick={() => {
            if (addFaction) {
              data.addFaction({ name: addFaction });
              addFaction = "";
            }
          }}
        />
      </div>
      <hr />
      <h4>Individual Systems</h4>
      {#each data.Systems as s, i (s.name)}
        <div class="flex gap-2">
          <label for={`mssc-${i}`} class="grow">{s.displayName}</label>
          <input id={`mssc-${i}`} type="checkbox" bind:checked={s.visible} />
          <input class="flex-none" type="color" bind:value={s.color} />
        </div>
      {/each}
      <div class="flex items-center">
        <input type="text" class="grow p-1" bind:value={addSystem} />
        <input
          type="button"
          class="px-2 py-1"
          value="Add"
          onclick={() => {
            if (addSystem) {
              data.addSystem({ name: addSystem });
              addSystem = "";
            }
          }}
        />
      </div>
      <hr />
      <h4>Powerplay Spheres</h4>
      {#each data.Spheres as s, i (s.name)}
        <div class="flex items-center gap-2">
          <label for={`mspsc-${i}`} class="grow">{s.name}</label>
          <input id={`mspsc-${i}`} type="checkbox" bind:checked={s.visible} />
          <input class="flex-none" type="color" bind:value={s.color} />
          <select bind:value={s.type} class="p-1">
            <option>Fortified</option>
            <option>Stronghold</option>
          </select>
        </div>
      {/each}
      <div class="flex items-center">
        <input type="text" class="grow p-1" bind:value={addSphere} />
        <input
          type="button"
          class="px-2 py-1"
          value="Add"
          onclick={() => {
            if (addSphere) {
              data.addSphere({ name: addSphere });
              addSphere = "";
            }
          }}
        />
      </div>
      <div class="mt-2 text-right text-xs text-zinc-400">
        {`v${__VERSION__} (${__COMMIT__})`}<br />{new Date(__COMMITDATE__).toLocaleDateString()}
      </div>
    </div>
  {/if}
{/if}
