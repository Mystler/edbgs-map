<script lang="ts">
  import { randomColor } from "../Helpers";
  import { type MapData } from "../types/MapData.svelte";

  interface Props {
    data: MapData;
    onConfirmRender: () => void;
  }
  let { data = $bindable(), onConfirmRender }: Props = $props();

  function confirm() {
    // Clean up before we give the ok to render
    data.Factions = data.Factions.filter((x) => x.name.trim() !== "");
    data.Systems = data.Systems.filter((x) => x.name.trim() !== "");
    data.Spheres = data.Spheres.filter((x) => x.name.trim() !== "");
    for (const x of data.Factions) if (!x.displayName) x.displayName = x.name;
    for (const x of data.Systems) if (!x.displayName) x.displayName = x.name;
    data.sortAll();
    onConfirmRender();
  }
</script>

<div class="mt-2 text-center">
  <h1>Elite Dangerous &ndash; Custom Factions Map Setup</h1>
  <p>
    Here you can create a custom map to visualize. Configuration will be stored locally for you.
  </p>

  <h3>Minor Factions</h3>
  {#if data.Factions.length > 0}
    <div class="overflow-auto">
      <table class="mx-auto">
        <thead>
          <tr>
            <th>Faction Name<br /><span class="text-[10px]">(Case Sensitive!)</span></th>
            <th>Display Name</th><th>Color</th><th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.Factions as faction, index}
            <tr>
              <td><input type="text" class="w-32 sm:w-52 md:w-72" bind:value={faction.name} /></td>
              <td
                ><input
                  type="text"
                  class="w-32 sm:w-52 md:w-72"
                  bind:value={faction.displayName}
                  placeholder="optional"
                /></td
              >
              <td><input type="color" bind:value={faction.color} /></td>
              <td>
                <input
                  type="button"
                  value="X"
                  onclick={() => {
                    data.Factions.splice(index, 1);
                  }}
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  <p>
    <input
      type="button"
      value="+"
      onclick={() => {
        data.Factions.push({ name: "", displayName: "", color: randomColor(), visible: true });
      }}
    /><br />
    <button
      type="button"
      class="link-btn"
      onclick={() => {
        data.Factions = [];
      }}>Clear All Factions</button
    >
  </p>

  <h3>Individual Systems</h3>
  {#if data.Systems.length > 0}
    <div class="overflow-auto">
      <table class="mx-auto">
        <thead><tr><th>System Name</th><th>Display Name</th><th>Color</th><th></th></tr></thead>
        <tbody>
          {#each data.Systems as system, index}
            <tr>
              <td><input type="text" class="w-32 sm:w-52 md:w-72" bind:value={system.name} /></td>
              <td
                ><input
                  type="text"
                  class="w-32 sm:w-52 md:w-72"
                  bind:value={system.displayName}
                  placeholder="optional"
                /></td
              >
              <td><input type="color" bind:value={system.color} /></td>
              <td>
                <input
                  type="button"
                  value="X"
                  onclick={() => {
                    data.Systems.splice(index, 1);
                  }}
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  <p>
    <input
      type="button"
      value="+"
      onclick={() => {
        data.Systems.push({ name: "", displayName: "", color: randomColor(), visible: true });
      }}
    /><br />
    <button
      type="button"
      class="link-btn"
      onclick={() => {
        data.Systems = [];
      }}>Clear All Systems</button
    >
  </p>

  <h3>Powerplay Spheres</h3>
  {#if data.Spheres.length > 0}
    <div class="overflow-auto">
      <table class="mx-auto">
        <thead><tr><th>Sphere</th><th>Color</th><th>Type</th><th></th></tr></thead>
        <tbody>
          {#each data.Spheres as sphere, index}
            <tr>
              <td><input type="text" class="w-32 sm:w-52 md:w-72" bind:value={sphere.name} /></td>
              <td><input type="color" bind:value={sphere.color} /></td>
              <td>
                <select bind:value={sphere.type}>
                  <option>Fortified</option>
                  <option>Stronghold</option>
                </select>
              </td>
              <td>
                <input
                  type="button"
                  value="X"
                  onclick={() => {
                    data.Spheres.splice(index, 1);
                  }}
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
  <p>
    <input
      type="button"
      value="+"
      onclick={() => {
        data.Spheres.push({ name: "", type: "Fortified", color: randomColor(), visible: true });
      }}
    /><br />
    <button
      type="button"
      class="link-btn"
      onclick={() => {
        data.Spheres = [];
      }}>Clear All Spheres</button
    >
  </p>

  <h3>Camera Setup</h3>
  <!---<p id="cam-reset-area" style="display: none">
    Stored camera setup has been found and will be re-used.<br /><a class="small" id="cam-reset"
      >Reset Camera</a
    >
  </p>-->
  <p>
    If you want to override the camera to look at a specific system, please enter name and distance
    here:<br />
    <input
      type="text"
      placeholder="System to look at (optional)"
      bind:value={data.Camera.lookAtSystem}
    />
    <input type="number" step="1" bind:value={data.Camera.distance} />
  </p>
  <p><input type="button" value="Render Map" onclick={confirm} /></p>
</div>
