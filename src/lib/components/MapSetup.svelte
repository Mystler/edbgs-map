<script lang="ts">
  import { slide } from "$lib/types/Animations.svelte";
  import { type MapData } from "../types/MapData.svelte";
  import AutocompleteInput from "./AutocompleteInput.svelte";
  import SessionManager from "./SessionManager.svelte";

  interface Props {
    data: MapData;
    onConfirmRender: () => void;
  }
  let { data = $bindable(), onConfirmRender }: Props = $props();
  let sessionManager = $state() as SessionManager;

  function confirm(e: MouseEvent) {
    // Clean up before we give the ok to render
    data.Factions = data.Factions.filter((x) => x.name.trim() !== "");
    data.Systems = data.Systems.filter((x) => x.name.trim() !== "");
    data.Spheres = data.Spheres.filter((x) => x.name.trim() !== "");
    for (const x of data.Factions) if (!x.displayName) x.displayName = x.name;
    for (const x of data.Systems) if (!x.displayName) x.displayName = x.name;
    data.sortAll();
    onConfirmRender();
    e.preventDefault();
  }
</script>

<form class="my-4 text-center">
  <h1>Elite Dangerous &ndash; Custom Factions Map Setup</h1>
  <p>
    Here you can create a custom map to visualize. Configuration will be stored locally for you.
  </p>
  <p>
    <button type="button" class="link-btn" onclick={() => sessionManager.show()}
      >Manage Saved Sessions</button
    >
  </p>

  <h3>Minor Factions</h3>
  {#if data.Factions.length > 0}
    <div class="overflow-auto" transition:slide>
      <table class="mx-auto">
        <thead>
          <tr>
            <th>Faction Name</th>
            <th>Display Name</th><th>Color</th><th></th>
          </tr>
        </thead>
        <tbody>
          {#each data.Factions as faction, index (index)}
            <tr>
              <td>
                <div transition:slide>
                  <AutocompleteInput
                    dataType="faction"
                    class="w-32 sm:w-52 md:w-72"
                    bind:value={faction.name}
                  />
                </div>
              </td>
              <td>
                <div transition:slide>
                  <input
                    type="text"
                    class="w-32 sm:w-52 md:w-72"
                    bind:value={faction.displayName}
                    placeholder="optional"
                  />
                </div>
              </td>
              <td>
                <div transition:slide><input type="color" bind:value={faction.color} /></div>
              </td>
              <td>
                <div transition:slide>
                  <input
                    type="button"
                    value="X"
                    onclick={() => {
                      data.Factions.splice(index, 1);
                    }}
                  />
                </div>
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
        data.addFaction();
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
    <div class="overflow-auto" transition:slide>
      <table class="mx-auto">
        <thead><tr><th>System Name</th><th>Display Name</th><th>Color</th><th></th></tr></thead>
        <tbody>
          {#each data.Systems as system, index (index)}
            <tr>
              <td>
                <div transition:slide>
                  <AutocompleteInput
                    dataType="system"
                    class="w-32 sm:w-52 md:w-72"
                    bind:value={system.name}
                  />
                </div>
              </td>
              <td>
                <div transition:slide>
                  <input
                    type="text"
                    class="w-32 sm:w-52 md:w-72"
                    bind:value={system.displayName}
                    placeholder="optional"
                  />
                </div>
              </td>
              <td><div transition:slide><input type="color" bind:value={system.color} /></div></td>
              <td>
                <div transition:slide>
                  <input
                    type="button"
                    value="X"
                    onclick={() => {
                      data.Systems.splice(index, 1);
                    }}
                  />
                </div>
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
        data.addSystem();
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

  <h3>Ranges</h3>
  {#if data.Spheres.length > 0}
    <div class="overflow-auto" transition:slide>
      <table class="mx-auto">
        <thead><tr><th>Center System</th><th>Color</th><th>Type</th><th></th></tr></thead>
        <tbody>
          {#each data.Spheres as sphere, index (index)}
            <tr>
              <td>
                <div transition:slide>
                  <AutocompleteInput
                    dataType="system"
                    class="w-32 sm:w-52 md:w-72"
                    bind:value={sphere.name}
                  />
                </div>
              </td>
              <td><div transition:slide><input type="color" bind:value={sphere.color} /></div></td>
              <td>
                <div transition:slide>
                  <select bind:value={sphere.type}>
                    <option>Colonization</option>
                    <option>Fortified</option>
                    <option>Stronghold</option>
                    <option value="ExpansionCube">Expansion Cube</option>
                  </select>
                </div>
              </td>
              <td>
                <div transition:slide>
                  <input
                    type="button"
                    value="X"
                    onclick={() => {
                      data.Spheres.splice(index, 1);
                    }}
                  />
                </div>
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
        data.addSphere();
      }}
    /><br />
    <button
      type="button"
      class="link-btn"
      onclick={() => {
        data.Spheres = [];
      }}>Clear All Ranges</button
    >
  </p>

  <h3>Camera Setup</h3>
  <p>
    By default, the camera will re-use the position from your last visit or the loaded session.<br
    />
    If you want to initialize the camera to look at a specific system instead, please enter name and
    distance here:<br />
    <AutocompleteInput
      dataType="system"
      placeholder="System to look at (optional)"
      bind:value={data.Camera.lookAtSystem}
    />
    <input type="number" step="1" bind:value={data.Camera.distance} />
  </p>
  <p><input type="submit" value="Render Map" onclick={confirm} /></p>
  <div class="mt-2 text-xs text-zinc-400">
    {`v${__VERSION__} (${__COMMIT__})`}<br />{new Date(__COMMITDATE__).toLocaleDateString()}
  </div>
</form>

<SessionManager bind:this={sessionManager} bind:mapData={data} />
