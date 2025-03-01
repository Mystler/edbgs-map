<script lang="ts">
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";
  import { MapData } from "$lib/types/MapData.svelte";
  import { SvelteMap } from "svelte/reactivity";
  import Dialog from "./Dialog.svelte";
  import { browser } from "$app/environment";
  import { slide } from "$lib/types/Animations.svelte";
  import { faTrashCan } from "@fortawesome/free-solid-svg-icons";
  import FaIcon from "./FaIcon.svelte";

  interface Props {
    mapData: MapData;
  }
  let { mapData = $bindable() }: Props = $props();

  interface Session {
    date: string;
    mapDataJSON: string;
    camData: Pick<typeof CurrentCamera, "Position" | "LookAt">;
  }

  let sessions = new SvelteMap<string, Session>(
    browser ? JSON.parse(localStorage.getItem("customMapSessions") ?? "[]") : null,
  );

  $effect(() => {
    if (browser) {
      localStorage.setItem("customMapSessions", JSON.stringify(sessions.entries().toArray()));
    }
  });

  function saveSession(name: string) {
    const session: Session = {
      date: new Date().toISOString(),
      mapDataJSON: JSON.stringify(mapData),
      camData: {
        Position: CurrentCamera.Position,
        LookAt: CurrentCamera.LookAt,
      },
    };
    sessions.set(name, session);
    saveName = "";
  }
  function loadSession(name: string) {
    const session = sessions.get(name);
    if (!session) {
      alert("No session found with that name.");
      return;
    }
    const data = MapData.fromJSON(session.mapDataJSON);
    data.sortAll();
    data.Camera.position = session.camData.Position;
    data.Camera.lookAt = session.camData.LookAt;
    mapData = data;
  }

  let dlg: Dialog;
  export const show = () => dlg.show();
  export const close = () => dlg.close();
  export const isOpen = () => dlg.isOpen();

  let saveName = $state("");
</script>

<Dialog bind:this={dlg}>
  <h2>Session Manager</h2>
  <p>
    Here, you can save your current view under a name so that you can load it again in the future.
  </p>
  <p>
    The current view settings will all be stored. Note, however, that factions will always load
    their latest system list and that colonization targets for each colonization range are also not
    stored.
  </p>
  <hr />
  <div class="flex gap-1">
    <input type="text" class="grow" bind:value={saveName} placeholder="Session Name" />
    <input type="button" value="Save" onclick={() => saveSession(saveName)} />
  </div>
  <hr />
  {#each sessions as [name, session] (name)}
    <div class="flex gap-4 p-2 hover:bg-zinc-700" transition:slide>
      <span class="grow">{name}</span>
      <span>{new Date(session.date).toLocaleString()}</span>
      <button
        type="button"
        class="link-btn"
        onclick={() => {
          if (confirm("Are you sure you want to overwrite the saved session?")) saveSession(name);
        }}>Overwrite</button
      >
      <button
        type="button"
        class="link-btn"
        onclick={() => {
          loadSession(name);
          close();
        }}>Load</button
      >
      <button
        type="button"
        class="link-btn"
        title="Delete"
        aria-label="Delete"
        onclick={() => {
          if (confirm("Are you sure you want to delete the saved session?")) sessions.delete(name);
        }}><FaIcon icon={faTrashCan} /></button
      >
    </div>
  {/each}
</Dialog>
