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
  import { slide } from "$lib/types/Animations.svelte";
  import Measurement, { CurrentMeasurement } from "./Measurement.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { base } from "$app/paths";
  import AutocompleteInput from "./AutocompleteInput.svelte";
  import { page } from "$app/state";
  import { createShortlink } from "$lib/CustomURL";
  import Dialog from "./Dialog.svelte";
  import { setContext } from "svelte";

  interface Props {
    data: MapData;
  }
  let { data = $bindable() }: Props = $props();

  setContext("mapData", data);

  let perfMon = $state(false);
  let menuOpen = $state(false);

  let addFaction = $state("");
  let addSystem = $state("");
  let addSphere = $state("");

  let controlsDialog = $state() as Dialog;
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === "g") HUDInfo.ShowGrid = !HUDInfo.ShowGrid;
    else if (e.key === "p") perfMon = !perfMon;
    else if (e.key === "c") menuOpen = !menuOpen;
    else if (e.key === "h") {
      if (controlsDialog.isOpen()) controlsDialog.close();
      else controlsDialog.show();
    }
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
        <CameraGrid cameraSetup={data.Camera} />

        {#each data.Factions as f, i (f.name)}
          <FactionGroup faction={data.Factions[i]} />
        {/each}
        {#each data.Systems as s, i (s.name)}
          <SystemGroup system={data.Systems[i]} />
        {/each}
        {#each data.Spheres as s, i (s.name)}
          <Sphere sphere={data.Spheres[i]} />
        {/each}

        <Measurement />
      </MapContent>
    </Canvas>
  </div>

  <!-- HUD -->
  {#if HUDInfo.LoadingMessages.length > 0}
    <div class="pointer-events-none absolute right-2 bottom-10 w-sm rounded-xl backdrop-blur-xs">
      {#each HUDInfo.LoadingMessages as m, i (i)}
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
      class="absolute top-0 max-h-full w-screen overflow-auto bg-(--ed-orange)/20 p-2 pt-12 backdrop-blur-xs sm:w-sm"
    >
      <h2>Controls</h2>
      {#if page.route.id === "/"}
        <div class="absolute top-2 right-2 flex flex-col items-end">
          <button class="link" onclick={() => createShortlink(data)}>Share</button>
          <a data-sveltekit-reload href={`${base}/`}>Back</a>
        </div>
      {/if}
      <button class="link-btn" onclick={() => controlsDialog.show()}>Help</button>
      <div class="align-center flex flex-col py-2">
        <div>
          <label>
            Show Grid
            <input type="checkbox" bind:checked={HUDInfo.ShowGrid} class="ml-1" />
          </label>
        </div>
        <div class="flex items-center gap-2">
          <span>Pan Speed</span>
          <input
            class="grow"
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            bind:value={HUDInfo.PanSpeed}
          />
          <input
            type="number"
            class="w-14 p-1"
            bind:value={HUDInfo.PanSpeed}
            min="0.5"
            max="3"
            step="0.5"
          />
        </div>
        <div class="flex items-center gap-2">
          <span>Panning Mode</span>
          <select class="grow p-1" bind:value={HUDInfo.PanMode}>
            <option value="screen">Screen Space</option>
            <option value="grid">Elite Dangerous</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <span>On System Click</span>
          <select class="grow p-1" bind:value={HUDInfo.ClickMode}>
            <option value="inara">Open INARA</option>
            <option value="measure">Measure Distance</option>
            <option value="range">Toggle Range</option>
          </select>
        </div>
      </div>
      <hr />
      <h4>Minor Factions</h4>
      {#each data.Factions as f, i (f.name)}
        <div class="flex items-center gap-1" transition:slide>
          <label for={`mfsc-${i}`} class="grow">{f.displayName}</label>
          <input id={`mfsc-${i}`} type="checkbox" bind:checked={f.visible} />
          <input class="flex-none" type="color" bind:value={f.color} />
        </div>
      {/each}
      <div class="flex items-center gap-1">
        <AutocompleteInput dataType="faction" class="grow p-1" bind:value={addFaction} />
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
        <div class="flex items-center gap-1" transition:slide>
          <label for={`mssc-${i}`} class="grow">{s.displayName}</label>
          <input id={`mssc-${i}`} type="checkbox" bind:checked={s.visible} />
          <input class="flex-none" type="color" bind:value={s.color} />
        </div>
      {/each}
      <div class="flex items-center gap-1">
        <AutocompleteInput dataType="system" class="grow p-1" bind:value={addSystem} />
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
      <h4>Ranges</h4>
      {#each data.Spheres as s, i (s.name)}
        <div class="flex items-center gap-1" transition:slide>
          <label for={`mspsc-${i}`} class="grow">{s.name}</label>
          <input id={`mspsc-${i}`} type="checkbox" bind:checked={s.visible} />
          <input class="flex-none" type="color" bind:value={s.color} />
          <select bind:value={s.type} class="p-1">
            <option>Colonization</option>
            <option>Fortified</option>
            <option>Stronghold</option>
            <option value="ExpansionCube">Expansion Cube</option>
          </select>
        </div>
      {/each}
      <div class="flex items-center gap-1">
        <AutocompleteInput dataType="system" class="grow p-1" bind:value={addSphere} />
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

  <!-- Controls Help dialog -->
  <Dialog bind:this={controlsDialog}>
    <h2>Controls Help</h2>
    <h4>Panning Modes</h4>
    <p>
      The control settings support two panning modes: "Screen Space" and "Elite Dangerous". The
      former defines left, right, up, down, forward, and backward based on the current view vector.
      It is recommended when the grid is disabled. The latter more closely reproduces what the game
      does and is more intuitive when the grid is on, as it follows the planes of the galactic
      coordinate system. You can choose freely which one you would like to use. However, touch
      screen devices should probably always keep this set to screen space.
    </p>
    <ul class="list-disc pl-4">
      <li><kbd>Primary Mouse Button</kbd>: Rotate</li>
      <li><kbd>Secondary Mouse Button</kbd>: Pan (vertical)</li>
      <li>
        <kbd>Middle Mouse Button / Left+Right Mouse Buttons</kbd>: Pan (horizontal)
      </li>
      <li><kbd>Mouse Wheel</kbd>: Zoom</li>
      <li><kbd>W / A / S / D / R / F</kbd>: Pan</li>
      <li><kbd>Single Touch</kbd>: Rotate</li>
      <li><kbd>Double Touch</kbd>: Zoom and Pan (vertical)</li>
    </ul>
    <h4>Measuring Distances</h4>
    <p>
      When the Click Mode is set to "Measure Distance", you can click on two systems on the map to
      measure the distance between them. The measured distance will be displayed in the bottom of
      the screen. Clicking on further systems will replace the measurement to go from the last
      system you clicked on to the new one. In order to hide a measurement, you can just click on
      the last system you clicked on a second time.
    </p>
    <h4>Other Hotkeys</h4>
    <ul class="list-disc pl-4">
      <li><kbd>c</kbd>: Toggle Controls Menu</li>
      <li><kbd>h</kbd>: Toggle Help</li>
      <li><kbd>g</kbd>: Toggle Grid</li>
      <li><kbd>p</kbd>: Toggle Performance Stats</li>
    </ul>
  </Dialog>
{/if}
