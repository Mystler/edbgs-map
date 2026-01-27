<script lang="ts">
  import { ClickMode } from "$lib/types/HUDInfo.svelte";
  import Dialog from "./Dialog.svelte";

  interface Props {
    dialog: Dialog;
  }
  let { dialog = $bindable() }: Props = $props();
</script>

<Dialog bind:this={dialog}>
  <h2>Controls Help</h2>
  <h4>Panning Modes</h4>
  <p>
    The control settings support two panning modes: "Screen Space" and "Elite Dangerous". The former defines left,
    right, up, down, forward, and backward based on the current view vector. It is recommended when the grid is
    disabled. The latter more closely reproduces what the game does and is more intuitive when the grid is on, as it
    follows the planes of the galactic coordinate system. You can choose freely which one you would like to use.
    However, touch screen devices should probably always keep this set to screen space.
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
    When "On System Click" is set to "Measure Distance", you can click on two systems on the map to measure the distance
    between them. The measured distance will be displayed in the bottom of the screen. Clicking on further systems will
    replace the measurement to go from the last system you clicked on to the new one. In order to hide a measurement,
    you can just click on the last system you clicked on a second time.
  </p>
  <h4>Other Hotkeys</h4>
  <ul class="list-disc pl-4">
    <li><kbd>c</kbd>: Toggle Controls Menu</li>
    <li><kbd>m</kbd>: Toggle Session Manager</li>
    <li><kbd>h</kbd>: Toggle Help</li>
    <li><kbd>g</kbd>: Toggle Grid</li>
    <li><kbd>p</kbd>: Toggle Performance Stats</li>
    <li>
      <kbd>1 to {Object.keys(ClickMode).length}</kbd>: Select the corresponding mode in "On System Click"
    </li>
  </ul>
  <h4>More Tricks</h4>
  <ul class="list-disc pl-4">
    <li>
      While the map is rendering, you can drag and drop system and faction links from INARA onto it to load data without
      having to use the inputs.
    </li>
    <li>
      When displaying Colonization ranges, there is a little download icon in the sidebar that you can click to import
      all potential colonization target systems within that sphere. The same is true for Acquisition targets on
      Fortified and Stronghold systems.
    </li>
    <li>
      You can also load the systems a faction is present in but not the controller of. To do so, add a space and "(NC)"
      (short for not controlled) to the faction name. E.g. loading "The Dark Wheel (NC)" will load all uncontrolled
      systems when just "The Dark Wheel" would load controlled systems. By loading both you can toggle and color things
      individually.<br />
      The reason this was not made accessible more easily is because I want people to consciously do it and be aware that
      loading presence systems can cause awkward overlaps when loading multiple factions that share common systems.
    </li>
  </ul>
  <h4>Credits</h4>
  <p>This tool has been developed by CMDR Mystler.</p>
  <p>
    It is open source on <a href="https://github.com/Mystler/edbgs-map" target="_blank" rel="noopener">GitHub</a>
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
    >
    as well as the <a href="https://eddn.edcd.io" target="_blank" rel="noopener">EDDN</a> realtime data relay.
  </p>
</Dialog>
