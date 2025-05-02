<script lang="ts">
  import { Instance, useCursor, useInteractivity } from "@threlte/extras";
  import { type SpanshDumpPPData, type SpanshSystem } from "../SpanshAPI";
  import { Spring } from "svelte/motion";
  import { CurrentMeasurement } from "./Measurement.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { getContext } from "svelte";
  import type { MapData } from "$lib/types/MapData.svelte";
  import { LoadedSystems } from "$lib/types/LoadedData.svelte";
  import { Powers } from "$lib/Constants";
  import { T } from "@threlte/core";
  import type { Group, Matrix4 } from "three";
  import { base } from "$app/paths";
  import Dialog from "./Dialog.svelte";

  interface Props {
    system: SpanshSystem;
    zOffset?: number;
    visible?: boolean;
    update?: (mat: Matrix4) => void;
  }
  let { system, visible = true, update = () => {} }: Props = $props();

  useInteractivity();
  const { onPointerEnter: cursorEnter, onPointerLeave: cursorLeave } = useCursor();

  const systemScale = new Spring(1, {
    stiffness: 0.15,
    damping: 0.25,
  });

  const mapData: MapData = getContext("mapData");

  LoadedSystems.set(system.name, system);
  let vInstance: Group;

  $effect.pre(() => {
    if (systemScale.target != systemScale.current) {
      // Only cause matrix recalculations when we are actually animating. Re-use same matrix for both visual and raycast mesh.
      vInstance.updateMatrix();
      update(vInstance.matrixWorld);
    }
  });

  let ppData = $state<Promise<SpanshDumpPPData | null>>();
  let showPPData = $state(false);
  async function fetchPPData(): Promise<SpanshDumpPPData | null> {
    let id64 = system.id64;
    let response;
    if (!id64) {
      response = await fetch(`${base}/api/system/${system.name}`);
      if (!response.ok) {
        alert(`Error while fetching data for system: ${system.name}`);
        return null;
      }
      const idquery = (await response.json()) as SpanshSystem | null;
      id64 = idquery?.id64;
    }
    response = await fetch(`${base}/api/power/system/${system.id64}`);
    if (!response.ok) {
      alert(`Error while fetching powerplay data for system: ${system.name}`);
      return null;
    }
    const res = (await response.json()) as SpanshDumpPPData | null;
    return res;
  }
</script>

<T.Group position={[system.x, system.y, -system.z]} scale={systemScale.current}>
  <Instance
    oncreate={(ref) => {
      vInstance = ref as Group;
    }}
    id="visual"
  />
  <Instance
    id="raycast"
    {visible}
    onpointerenter={() => {
      cursorEnter();
      systemScale.target = 2;
      HUDInfo.CurrentSystemInfo = systemInfo;
    }}
    onpointerleave={() => {
      cursorLeave();
      systemScale.target = 1;
      HUDInfo.CurrentSystemInfo = undefined;
    }}
    onclick={() => {
      if (HUDInfo.ClickMode === "inara") {
        window.open(
          `https://inara.cz/elite/starsystem/?search=${encodeURIComponent(system.name)}`,
          "_blank",
        );
      } else if (HUDInfo.ClickMode === "edsm") {
        window.open(
          `https://www.edsm.net/en/system/id//name?systemName=${encodeURIComponent(system.name)}`,
          "_blank",
        );
      } else if (HUDInfo.ClickMode === "spansh") {
        if (system.id64)
          window.open(`https://spansh.co.uk/system/${encodeURIComponent(system.id64)}`, "_blank");
        else
          window.open(`https://spansh.co.uk/search/${encodeURIComponent(system.name)}`, "_blank");
      } else if (HUDInfo.ClickMode === "measure") {
        CurrentMeasurement.addSystem(system.name, system.x, system.y, system.z);
      } else if (HUDInfo.ClickMode === "range") {
        const i = mapData.Spheres.findIndex((sphere) => sphere.name === system.name);
        if (i >= 0) {
          mapData.Spheres.splice(i, 1);
        } else {
          const type =
            system.power_state === "Stronghold"
              ? "Stronghold"
              : system.power_state === "Fortified"
                ? "Fortified"
                : "Colonization";
          mapData.addSphere({
            name: system.name,
            color:
              type === "Stronghold" || type === "Fortified"
                ? Powers[system.controlling_power!].color
                : "#ffffff",
            position: [system.x, system.y, system.z],
            type,
          });
        }
      } else if (HUDInfo.ClickMode === "powerplay") {
        if (!ppData) {
          ppData = fetchPPData();
        }
        showPPData = true;
        HUDInfo.CurrentPPInfo = systemPPInfo;
      }
    }}
  />
</T.Group>

{#snippet systemInfo()}
  <div>{system.name}</div>
  {#if system.controlling_power}
    <div class="text-2xl" style={`color: ${Powers[system.controlling_power].color}`}>
      {system.controlling_power} ({system.power_state})
    </div>
  {/if}
{/snippet}

{#snippet systemPPInfo()}
  {#if ppData && showPPData}
    <Dialog
      onclose={() => {
        showPPData = false;
      }}
      showImmediately={true}
    >
      <div>
        <h2>{system.name}</h2>
        {#await ppData}
          <div
            class="mx-auto size-32 animate-spin rounded-full border-24 border-(--ed-orange) border-t-transparent"
          ></div>
        {:then ppInfo}
          <p><i>(This dialog is a Work in Progress.)</i></p>
          {#if ppInfo?.controllingPower}
            <h3 style={`color: ${Powers[ppInfo.controllingPower].color}`}>
              {ppInfo.controllingPower}
            </h3>
            <h4>{ppInfo.powerState}</h4>
            <div class="flex flex-col gap-2">
              <div>
                <b>Progress:</b>
                {((ppInfo.powerStateControlProgress ?? 0) * 100).toFixed(2)}%
              </div>
              <div>
                <b>Reinforcement:</b>
                {ppInfo.powerStateReinforcement?.toLocaleString("en-US")}
              </div>
              <div>
                <b>Undermining:</b>
                {ppInfo.powerStateUndermining?.toLocaleString("en-US")}
              </div>
            </div>
          {:else if ppInfo?.powerConflictProgress}
            <h3>Acquisition System</h3>
            <div class="flex flex-col gap-2">
              {#each ppInfo.powerConflictProgress.sort((a, b) => b.progress - a.progress) as acqPower, index (acqPower.power)}
                <div>
                  <b>{index + 1}.</b>
                  <b style={`color: ${Powers[acqPower.power].color}`}>{acqPower.power}:</b>
                  {(acqPower.progress * 100).toFixed(2)}%
                </div>
              {/each}
            </div>
          {:else}
            <p>No Powerplay information found for this system.</p>
          {/if}
        {/await}
      </div>
    </Dialog>
  {/if}
{/snippet}
