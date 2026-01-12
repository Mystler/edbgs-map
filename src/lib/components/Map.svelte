<script lang="ts">
  import { Canvas } from "@threlte/core";
  import { type MapData } from "../types/MapData.svelte";
  import FactionGroup from "./FactionGroup.svelte";
  import SystemGroup from "./SystemGroup.svelte";
  import Sphere from "./Sphere.svelte";
  import { browser } from "$app/environment";
  import CameraGrid from "./CameraGrid.svelte";
  import MapContent from "./MapContent.svelte";
  import { PerfMonitor } from "@threlte/extras";
  import { slide, fade } from "$lib/types/Animations.svelte";
  import Measurement, { CurrentMeasurement } from "./Measurement.svelte";
  import { HUDInfo, ClickMode } from "$lib/types/HUDInfo.svelte";
  import { resolve } from "$app/paths";
  import AutocompleteInput from "./AutocompleteInput.svelte";
  import { page } from "$app/state";
  import { createShortlink } from "$lib/CustomURL";
  import type Dialog from "./Dialog.svelte";
  import { setContext } from "svelte";
  import { faBars, faDownload } from "@fortawesome/free-solid-svg-icons";
  import FaIcon from "./FaIcon.svelte";
  import SessionManager from "./SessionManager.svelte";
  import SystemSearch from "./SystemSearch.svelte";
  import { Powers } from "$lib/Constants";
  import PowerGroup from "./PowerGroup.svelte";
  import { NoToneMapping } from "three";
  import HelpDialog from "./HelpDialog.svelte";
  import PowerplaySystemDialog from "./PowerplaySystemDialog.svelte";
  import { LoadedSystems } from "$lib/types/LoadedData.svelte";
  import { FlyToSystem, FlyToSystemOnceLoaded } from "$lib/types/CurrentCamera.svelte";
  import { type SpanshDumpPPData } from "$lib/SpanshAPI";
  import SystemMouseover from "./SystemMouseover.svelte";

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
  let addPower = $state("");

  let controlsDialog = $state() as Dialog;
  let sessionManager = $state() as SessionManager;

  const sphereRefs: Sphere[] = $state([]);
</script>

<svelte:window
  onkeydown={(e) => {
    if (e.target instanceof HTMLInputElement) return;
    if (e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
    const number = parseInt(e.key);
    if (e.key === "g") HUDInfo.ShowGrid = !HUDInfo.ShowGrid;
    else if (e.key === "p") perfMon = !perfMon;
    else if (e.key === "c") menuOpen = !menuOpen;
    else if (e.key === "h") {
      if (controlsDialog.isOpen()) controlsDialog.close();
      else controlsDialog.show();
    } else if (e.key === "m") {
      if (sessionManager.isOpen()) sessionManager.close();
      else sessionManager.show();
    } else if (number > 0 && number <= Object.keys(ClickMode).length) {
      HUDInfo.changeClickMode(Object.keys(ClickMode)[number - 1] as keyof typeof ClickMode);
    }
  }}
/>

{#if browser}
  <!-- Canvas -->
  <div
    class="h-lvh w-lvw"
    role="presentation"
    ondragover={(e) => {
      e.preventDefault();
    }}
    ondrop={(e) => {
      e.preventDefault();
      const systemDrop = e.dataTransfer?.getData("json/edbgs-map-pp-alert");
      if (systemDrop) {
        const system: SpanshDumpPPData = JSON.parse(systemDrop);
        if (!LoadedSystems.has(system.name)) {
          FlyToSystemOnceLoaded.value = system.name;
          data.addSystem({
            name: system.name,
            color: system.controllingPower ? Powers[system.controllingPower].color : "#ffffff",
          });
        } else {
          FlyToSystem(system.name);
        }
        return;
      }
      const droplink = e.dataTransfer?.getData("text/html");
      if (droplink) {
        // System match
        let match = droplink.match(
          /<a[^>]+(?:inara\.cz\/elite\/starsystem|spansh\.co\.uk\/system\/\d+)[^>]*>\s*(.*)\s*<\/a>/m,
        );
        if (match) {
          const name = match[1].trim().replace(/<[^>]*>/g, "");
          if (!LoadedSystems.has(name)) {
            FlyToSystemOnceLoaded.value = name;
            data.addSystem({ name });
          } else {
            FlyToSystem(name);
          }
          return;
        }
        // Faction match
        match = droplink.match(/<a[^>]+(?:inara\.cz\/elite\/minorfaction\/)[^>]*>\s*(.*)\s*<\/a>/m);
        if (match) {
          data.addFaction({ name: match[1].trim().replace(/<[^>]*>/g, "") });
          return;
        }
      }
    }}
  >
    <Canvas toneMapping={NoToneMapping}>
      <MapContent>
        {#if perfMon}
          <PerfMonitor anchorX="right" />
        {/if}
        <CameraGrid bind:cameraSetup={data.Camera} />

        {#each data.Factions as f (f.name)}
          <FactionGroup faction={f} />
        {/each}
        {#each data.Systems as s, i (s.name)}
          <SystemGroup bind:system={data.Systems[i]} />
        {/each}
        {#each data.Spheres as s, i (s.name)}
          <Sphere bind:sphere={data.Spheres[i]} bind:this={sphereRefs[i]} />
        {/each}
        {#each data.Powers as p, i (i)}
          <PowerGroup power={p} />
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
          <span class="size-4 animate-spin rounded-full border-4 border-(--ed-orange) border-t-transparent"></span>
          <span class="grow">{m.Message}</span>
        </div>
      {/each}
    </div>
  {/if}
  <div class="pointer-events-none absolute bottom-10 w-full text-center text-3xl">
    {#if HUDInfo.CurrentSystemInfo}
      <div transition:fade><SystemMouseover system={HUDInfo.CurrentSystemInfo} /></div>
    {/if}
    {#if HUDInfo.TimedMessage}
      <div transition:fade>{HUDInfo.TimedMessage}</div>
    {/if}
    {@render CurrentMeasurement.HUDSnippet()}
  </div>
  <div class="absolute top-5 left-1/2 -translate-x-1/2">
    <SystemSearch />
  </div>

  <PowerplaySystemDialog />
  <SessionManager bind:this={sessionManager} bind:mapData={data} />

  <!-- Controls Menu -->
  <button
    type="button"
    aria-label="Open Controls"
    class="hover:cur fixed top-0 left-0 z-50 p-2 text-3xl"
    onclick={() => {
      menuOpen = !menuOpen;
    }}><FaIcon icon={faBars} /></button
  >
  {#if menuOpen}
    <div
      transition:slide
      class="absolute top-0 max-h-full w-screen overflow-auto bg-(--ed-orange)/20 p-2 pt-12 backdrop-blur-xs sm:w-sm"
    >
      <h2>Controls</h2>
      <div class="absolute top-2 right-2 flex flex-col items-end">
        <button type="button" class="link" onclick={() => sessionManager.show()}>Sessions</button>
        <button type="button" class="link" onclick={() => createShortlink(data)}>Share</button>
        {#if page.route.id === "/"}
          <a data-sveltekit-reload href={resolve(`/`)}>Back</a>
        {/if}
      </div>
      <button type="button" class="link-btn" onclick={() => controlsDialog.show()}>Help</button>
      <div class="align-center flex flex-col py-2">
        <div>
          <label>
            Show Grid
            <input type="checkbox" bind:checked={HUDInfo.ShowGrid} class="ml-1" />
          </label>
        </div>
        <div class="flex items-center gap-2">
          <span>Pan Speed</span>
          <input class="grow" type="range" min="0.5" max="3" step="0.1" bind:value={HUDInfo.PanSpeed} />
          <input type="number" class="w-14 p-1" bind:value={HUDInfo.PanSpeed} min="0.5" max="3" step="0.5" />
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
            {#each Object.entries(ClickMode) as [mode, title] (mode)}
              <option value={mode}>{title}</option>
            {/each}
          </select>
        </div>
      </div>
      <hr />
      <h4>Minor Factions</h4>
      {#each data.Factions as f, i (f.name)}
        <div class="flex items-center gap-1" transition:slide>
          <label for={`mfsc-${i}`} class="grow">{f.displayName}</label>
          <div class="flex flex-col items-center">
            <input id={`mfsc-${i}`} type="checkbox" bind:checked={f.visible} title="Visibility" />
            <label for={`mfsc-${i}`} class="text-[8px]" title="Visibility">Vis</label>
          </div>
          <div class="flex flex-col items-center">
            <input id={`mfscl-${i}`} type="checkbox" bind:checked={f.labelVisible} title="Show Label" />
            <label for={`mfscl-${i}`} class="text-[8px]" title="Show Label">Lbl</label>
          </div>
          <input class="flex-none" type="color" bind:value={f.color} title="Color" />
        </div>
      {/each}
      <form class="flex items-center gap-1">
        <AutocompleteInput dataType="faction" class="grow p-1" bind:value={addFaction} />
        <input
          type="submit"
          class="px-2 py-1"
          value="Add"
          onclick={() => {
            if (addFaction) {
              data.addFaction({ name: addFaction });
              addFaction = "";
            }
          }}
        />
      </form>
      <hr />
      <h4>Individual Systems</h4>
      {#each data.Systems as s, i (s.name)}
        <div class="flex items-center gap-1" transition:slide>
          <label for={`mssc-${i}`} class="grow">{s.displayName}</label>
          <div class="flex flex-col items-center">
            <input id={`mssc-${i}`} type="checkbox" bind:checked={s.visible} title="Visibility" />
            <label for={`mssc-${i}`} class="text-[8px]" title="Visibility">Vis</label>
          </div>
          <div class="flex flex-col items-center">
            <input id={`msscl-${i}`} type="checkbox" bind:checked={s.labelVisible} title="Show Label" />
            <label for={`msscl-${i}`} class="text-[8px]" title="Show Label">Lbl</label>
          </div>
          <input class="flex-none" type="color" bind:value={s.color} title="Color" />
        </div>
      {/each}
      <form class="flex items-center gap-1">
        <AutocompleteInput dataType="system" class="grow p-1" bind:value={addSystem} />
        <input
          type="submit"
          class="px-2 py-1"
          value="Add"
          onclick={() => {
            if (addSystem) {
              data.addSystem({ name: addSystem });
              addSystem = "";
            }
          }}
        />
      </form>
      <hr />
      <h4>Ranges</h4>
      {#each data.Spheres as s, i (s.name)}
        <div class="flex items-center gap-1" transition:slide>
          <label for={`mspsc-${i}`} class="grow">{s.name}</label>
          <div class="flex flex-col items-center">
            <input id={`mspsc-${i}`} type="checkbox" bind:checked={s.visible} title="Visibility" />
            <label for={`mspsc-${i}`} class="text-[8px]" title="Visibility">Vis</label>
          </div>
          <input class="flex-none" type="color" bind:value={s.color} title="Color" />
          <select bind:value={s.type} class="p-1">
            <option>Colonization</option>
            <option>Fortified</option>
            <option>Stronghold</option>
            <option value="ExpansionCube">Expansion Cube</option>
          </select>
          {#if ["Fortified", "Stronghold"].includes(s.type) && !sphereRefs[i]?.isAcquisitionLoaded()}
            <button
              type="button"
              aria-label="Load Acquisition Targets"
              title="Load Acquisition Targets"
              class="link"
              onclick={() => sphereRefs[i]?.loadAcquisitionSystems()}
            >
              <FaIcon icon={faDownload} />
            </button>
          {:else if s.type === "Colonization" && !sphereRefs[i]?.isColonizationLoaded()}
            <button
              type="button"
              aria-label="Load Colonization Targets"
              title="Load Colonization Targets"
              class="link"
              onclick={() => sphereRefs[i]?.loadColonizationSystems()}
            >
              <FaIcon icon={faDownload} />
            </button>
          {/if}
        </div>
      {/each}
      <form class="flex items-center gap-1">
        <AutocompleteInput dataType="system" class="grow p-1" bind:value={addSphere} />
        <input
          type="submit"
          class="px-2 py-1"
          value="Add"
          onclick={() => {
            if (addSphere) {
              data.addSphere({ name: addSphere });
              addSphere = "";
            }
          }}
        />
      </form>
      <hr />
      <h4>Powers</h4>
      {#each data.Powers as p, i (i)}
        <div class="flex items-center gap-1 py-1" transition:slide>
          <label for={`mppve-${i}`} class="grow">{p.name}</label>
          <div class="flex flex-col items-center">
            <input id={`mppve-${i}`} type="checkbox" bind:checked={p.exploitedVisible} title="Exploited Systems" />
            <label for={`mppve-${i}`} class="text-[8px]" title="Exploited Systens">Exp</label>
          </div>
          <div class="flex flex-col items-center">
            <input id={`mppvf-${i}`} type="checkbox" bind:checked={p.fortifiedVisible} title="Fortified Systems" />
            <label for={`mppvf-${i}`} class="text-[8px]" title="Fortified Systens">For</label>
          </div>
          <div class="flex flex-col items-center">
            <input id={`mppvs-${i}`} type="checkbox" bind:checked={p.strongholdVisible} title="Stronghold Systems" />
            <label for={`mppvs-${i}`} class="text-[8px]" title="Stronghold Systens">Str</label>
          </div>
          <input class="flex-none" type="color" bind:value={p.color} title="Color" />
        </div>
      {/each}
      <form class="flex items-center gap-1">
        <select class="grow p-1" bind:value={addPower}>
          {#each Object.keys(Powers) as power (power)}
            <option>{power}</option>
          {/each}
        </select>
        <input
          type="submit"
          class="px-2 py-1"
          value="Add"
          onclick={() => {
            if (addPower) {
              data.addPower({ name: addPower, color: Powers[addPower].color });
              addPower = "";
            }
          }}
        />
      </form>
      <div class="mt-2 text-right text-xs text-zinc-400">
        {`v${__VERSION__} (${__COMMIT__})`}<br />{new Date(__COMMITDATE__).toLocaleDateString()}
      </div>
    </div>
  {/if}

  <!-- Controls Help dialog -->
  <HelpDialog bind:dialog={controlsDialog} />
{/if}
