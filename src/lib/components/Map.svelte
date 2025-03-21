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
  import { base } from "$app/paths";
  import AutocompleteInput from "./AutocompleteInput.svelte";
  import { page } from "$app/state";
  import { createShortlink } from "$lib/CustomURL";
  import Dialog from "./Dialog.svelte";
  import { setContext } from "svelte";
  import { faBars, faDownload } from "@fortawesome/free-solid-svg-icons";
  import FaIcon from "./FaIcon.svelte";
  import SessionManager from "./SessionManager.svelte";
  import SystemSearch from "./SystemSearch.svelte";
  import { Powers } from "$lib/Constants";
  import PowerGroup from "./PowerGroup.svelte";

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
    } else if (number > 0 && number <= 5) {
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
      const droplink = e.dataTransfer?.getData("text/html");
      console.log(droplink);
      if (droplink) {
        // System match
        let match = droplink.match(
          /<a[^>]+(?:inara\.cz\/elite\/starsystem\/|spansh\.co\.uk\/system\/\d+)[^>]*>\s*(.*)\s*<\/a>/m,
        );
        if (match) {
          data.addSystem({ name: match[1].trim() });
          return;
        }
        // Faction match
        match = droplink.match(/<a[^>]+(?:inara\.cz\/elite\/minorfaction\/)[^>]*>\s*(.*)\s*<\/a>/m);
        if (match) {
          data.addFaction({ name: match[1].trim() });
          return;
        }
      }
    }}
  >
    <Canvas>
      <MapContent>
        {#if perfMon}
          <PerfMonitor anchorX="right" />
        {/if}
        <CameraGrid bind:cameraSetup={data.Camera} />

        {#each data.Factions as f, i (f.name)}
          <FactionGroup faction={data.Factions[i]} />
        {/each}
        {#each data.Systems as s, i (s.name)}
          <SystemGroup bind:system={data.Systems[i]} />
        {/each}
        {#each data.Spheres as s, i (s.name)}
          <Sphere bind:sphere={data.Spheres[i]} bind:this={sphereRefs[i]} />
        {/each}
        {#each data.Powers as p, i (p.name)}
          <PowerGroup power={data.Powers[i]} />
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
      <div transition:fade>{HUDInfo.CurrentSystem}</div>
    {/if}
    {#if HUDInfo.TimedMessage}
      <div transition:fade>{HUDInfo.TimedMessage}</div>
    {/if}
    {@render CurrentMeasurement.HUDSnippet()}
  </div>
  <div class="absolute top-5 left-1/2 -translate-x-1/2">
    <SystemSearch />
  </div>

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
          <a data-sveltekit-reload href={`${base}/`}>Back</a>
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
            <input
              id={`mfscl-${i}`}
              type="checkbox"
              bind:checked={f.labelVisible}
              title="Show Label"
            />
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
            <input
              id={`msscl-${i}`}
              type="checkbox"
              bind:checked={s.labelVisible}
              title="Show Label"
            />
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
          {#if s.type === "Colonization" && !sphereRefs[i]?.isColonizationLoaded()}
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
      {#each data.Powers as p, i (p.name)}
        <div class="flex items-center gap-1 py-1" transition:slide>
          <label for={`mppv-${i}`} class="grow">{p.name}</label>
          <div class="flex flex-col items-center">
            <input
              id={`mppv-${i}`}
              type="checkbox"
              bind:checked={p.exploitedVisible}
              title="Exploited Systems"
            />
            <label for={`mppv-${i}`} class="text-[8px]" title="Exploited Systens">Exp</label>
          </div>
          <div class="flex flex-col items-center">
            <input
              id={`mppvf-${i}`}
              type="checkbox"
              bind:checked={p.fortifiedVisible}
              title="Fortified Systems"
            />
            <label for={`mppf-${i}`} class="text-[8px]" title="Fortified Systens">For</label>
          </div>
          <div class="flex flex-col items-center">
            <input
              id={`mppvs-${i}`}
              type="checkbox"
              bind:checked={p.strongholdVisible}
              title="Stronghold Systems"
            />
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
      When "On System Click" is set to "Measure Distance", you can click on two systems on the map
      to measure the distance between them. The measured distance will be displayed in the bottom of
      the screen. Clicking on further systems will replace the measurement to go from the last
      system you clicked on to the new one. In order to hide a measurement, you can just click on
      the last system you clicked on a second time.
    </p>
    <h4>Other Hotkeys</h4>
    <ul class="list-disc pl-4">
      <li><kbd>c</kbd>: Toggle Controls Menu</li>
      <li><kbd>m</kbd>: Toggle Session Manager</li>
      <li><kbd>h</kbd>: Toggle Help</li>
      <li><kbd>g</kbd>: Toggle Grid</li>
      <li><kbd>p</kbd>: Toggle Performance Stats</li>
      <li><kbd>1 to 5</kbd>: Select the corresponding mode in "On System Click"</li>
    </ul>
    <h4>More Tricks</h4>
    <ul class="list-disc pl-4">
      <li>
        While the map is rendering, you can drag and drop system and faction links from INARA onto
        it to load data without having to use the inputs.
      </li>
      <li>
        When displaying Colonization ranges, there is a little download icon that you can click to
        import all potential colonization target systems within that sphere.
      </li>
      <li>
        You can also load the systems a faction is present in but not the controller of. To do so,
        add a space and "(NC)" (short for not controlled) to the faction name. E.g. loading "The
        Dark Wheel (NC)" will load all uncontrolled systems when just "The Dark Wheel" would load
        controlled systems. By loading both you can toggle and color things individually.<br />
        The reason this was not made accessible more easily is because I want people to consciously do
        it and be aware that loading presence systems can cause awkward overlaps when loading multiple
        factions that share common systems.
      </li>
    </ul>
    <h4>Credits</h4>
    <p>This tool has been developed by CMDR Mystler.</p>
    <p>
      It is open source on <a
        href="https://github.com/Mystler/edbgs-map"
        target="_blank"
        rel="noopener">GitHub</a
      >
      and developed using <a href="https://svelte.dev/" target="_blank" rel="noopener">Svelte</a>,
      <a href="https://threlte.xyz/" target="_blank" rel="noopener">Threlte</a>,
      <a href="https://www.typescriptlang.org/" target="_blank" rel="noopener">TypeScript</a>,
      <a href="https://tailwindcss.com/" target="_blank" rel="noopener">Tailwind CSS</a>, and
      <a href="https://fontawesome.com/" target="_blank" rel="noopener">Font Awesome</a>.
    </p>
    <p>
      The data source for all Elite Dangerous data is the amazing website of <a
        href="https://spansh.co.uk/"
        target="_blank"
        rel="noopener">Spansh.co.uk</a
      >.
    </p>
  </Dialog>
{/if}
