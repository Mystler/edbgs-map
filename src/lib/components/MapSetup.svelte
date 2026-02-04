<script lang="ts">
  import { Powers } from "$lib/Constants";
  import { slide } from "$lib/types/Animations.svelte";
  import { type MapData } from "../types/MapData.svelte";
  import AutocompleteInput from "./AutocompleteInput.svelte";
  import Select from "./Select.svelte";
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
    data.Powers = data.Powers.filter((x) => x.name.trim() !== "");
    for (const x of data.Factions) if (!x.displayName) x.displayName = x.name;
    for (const x of data.Systems) if (!x.displayName) x.displayName = x.name;
    data.dedupe();
    data.sortAll();
    onConfirmRender();
    e.preventDefault();
  }
</script>

<form class="my-4 text-center">
  <h1>Elite Dangerous &ndash; Custom Factions Map Setup</h1>
  <p>Here you can create a custom map to visualize. Configuration will be stored locally for you.</p>
  <p>
    <button type="button" class="link-btn" onclick={() => sessionManager.show()}>Manage Saved Sessions</button>
  </p>
  <p>
    <button type="button" class="link-btn" onclick={() => data.reset()}>Clear All Below</button>
  </p>

  <h3>Minor Factions</h3>
  <p>
    <button
      type="button"
      class="link-btn"
      onclick={() => {
        data.Factions = [];
      }}>Clear All Factions</button
    >
  </p>
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
                  <AutocompleteInput dataType="faction" class="w-32 sm:w-52 md:w-72" bind:value={faction.name} />
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
    />
  </p>

  <h3>Individual Systems</h3>
  <p>
    <button
      type="button"
      class="link-btn"
      onclick={() => {
        data.Systems = [];
      }}>Clear All Systems</button
    >
  </p>
  {#if data.Systems.length > 0}
    <div class="overflow-auto" transition:slide>
      <table class="mx-auto">
        <thead><tr><th>System Name</th><th>Display Name</th><th>Color</th><th></th></tr></thead>
        <tbody>
          {#each data.Systems as system, index (index)}
            <tr>
              <td>
                <div transition:slide>
                  <AutocompleteInput dataType="system" class="w-32 sm:w-52 md:w-72" bind:value={system.name} />
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
    />
  </p>

  <h3>Ranges</h3>
  <p>
    <button
      type="button"
      class="link-btn"
      onclick={() => {
        data.Spheres = [];
      }}>Clear All Ranges</button
    >
  </p>
  {#if data.Spheres.length > 0}
    <div class="overflow-auto" transition:slide>
      <table class="mx-auto">
        <thead><tr><th>Center System</th><th>Color</th><th>Type</th><th></th></tr></thead>
        <tbody>
          {#each data.Spheres as sphere, index (index)}
            <tr>
              <td>
                <div transition:slide>
                  <AutocompleteInput dataType="system" class="w-32 sm:w-52 md:w-72" bind:value={sphere.name} />
                </div>
              </td>
              <td><div transition:slide><input type="color" bind:value={sphere.color} /></div></td>
              <td>
                <div transition:slide>
                  <Select bind:value={sphere.type} class="w-48">
                    <option>Colonization</option>
                    <option>Fortified</option>
                    <option>Stronghold</option>
                    <option value="ExpansionCube">Expansion Cube</option>
                  </Select>
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
    />
  </p>

  <h3>Powers</h3>
  <p>
    <button
      type="button"
      class="link-btn"
      onclick={() => {
        data.Powers = [];
      }}>Clear All Powers</button
    >
  </p>
  {#if data.Powers.length > 0}
    <div class="overflow-auto" transition:slide>
      <table class="mx-auto">
        <thead><tr><th>Power</th><th>Color</th><th></th></tr></thead>
        <tbody>
          {#each data.Powers as power, index (index)}
            <tr>
              <td>
                <div transition:slide>
                  <Select
                    class="w-48"
                    bind:value={power.name}
                    onchange={() => {
                      power.color = Powers[power.name].color;
                    }}
                  >
                    {#each Object.keys(Powers) as power (power)}
                      <option value={power}><span style:color={Powers[power].color}>{power}</span></option>
                    {/each}
                  </Select>
                </div>
              </td>
              <td><div transition:slide><input type="color" bind:value={power.color} /></div></td>
              <td>
                <div transition:slide>
                  <input
                    type="button"
                    value="X"
                    onclick={() => {
                      data.Powers.splice(index, 1);
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
        data.addPower();
      }}
    />
  </p>

  <h3>Camera Setup</h3>
  <p>
    By default, the camera will re-use the position from your last visit or the loaded session.<br />
    If you want to initialize the camera to look at a specific system instead, please enter name and distance here:<br
    />
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
