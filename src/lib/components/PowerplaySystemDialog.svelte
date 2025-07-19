<script lang="ts">
  import { base } from "$app/paths";
  import type { SpanshDumpPPData, SpanshSystem } from "$lib/SpanshAPI";
  import Dialog from "./Dialog.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import PowerplaySystemInfo from "./PowerplaySystemInfo.svelte";
  import CopyToClipboardButton from "./CopyToClipboardButton.svelte";

  async function fetchPPData(): Promise<SpanshDumpPPData | null> {
    const system = HUDInfo.CurrentPPInfo;
    if (!system) return null;
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
    response = await fetch(`${base}/api/power/system/${id64}`);
    if (!response.ok) {
      alert(`Error while fetching powerplay data for system: ${system.name}`);
      return null;
    }
    const res = (await response.json()) as SpanshDumpPPData | null;
    return res;
  }
</script>

{#key HUDInfo.CurrentPPInfo}
  {#if HUDInfo.CurrentPPInfo}
    {@const ppData = fetchPPData()}
    <Dialog
      onclose={() => {
        HUDInfo.CurrentPPInfo = undefined;
      }}
      showImmediately={true}
    >
      <div class="text-center sm:min-w-sm">
        <h2 class="px-6">
          {HUDInfo.CurrentPPInfo.name}
          <CopyToClipboardButton text={HUDInfo.CurrentPPInfo.name} />
        </h2>
        {#await ppData}
          <div class="flex justify-center overflow-hidden">
            <span class="size-32 animate-spin rounded-full border-24 border-(--ed-orange) border-t-transparent"></span>
          </div>
        {:then ppInfo}
          <PowerplaySystemInfo data={ppInfo} />
        {/await}
      </div>
    </Dialog>
  {/if}
{/key}
