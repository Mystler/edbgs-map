<script lang="ts">
  import { invalidate } from "$app/navigation";
  import FaIcon from "$lib/components/FaIcon.svelte";
  import PowerplayPageNav from "$lib/components/PowerplayPageNav.svelte";
  import { faRotate } from "@fortawesome/free-solid-svg-icons";
  import Time from "svelte-time/Time.svelte";
  import type { PageProps } from "./$types";
  import CollateralPage from "./CollateralPage.svelte";

  let { data }: PageProps = $props();

  function refresh() {
    invalidate("app:pp-collateral");
  }
</script>

<svelte:head>
  <title>Collateral Damage</title>
  <meta name="description" content="Showing vulnerable Powerplay spheres." />
</svelte:head>

<PowerplayPageNav />
<div class="mx-auto px-1 pb-4 xl:max-w-(--breakpoint-xl)">
  <!-- Intro section -->
  <h1 class="text-center">Collateral Damage</h1>
  <p class="text-center text-sm">
    This view shows an analysis of Powerplay spheres that would lead to collateral damage when dropping in tiers.
  </p>
  <p class="text-right text-xs text-zinc-500">
    Last Updated:
    {#await data.cache then cache}
      {#key cache.lastUpdated}<Time relative live={5000} timestamp={cache.lastUpdated} title={undefined} />{/key}
    {/await}
    <button
      type="button"
      class="size-6"
      onclick={(e) => {
        const button = e.currentTarget;
        const icon = button.querySelector("svg");
        icon?.classList.add("animate-spin");
        button.disabled = true;
        refresh();
        setTimeout(() => {
          icon?.classList.remove("animate-spin");
          button.disabled = false;
        }, 1000);
      }}><FaIcon class="inline" icon={faRotate} /></button
    >
  </p>
  {#await data.cache}
    <div class="flex justify-center overflow-hidden">
      <span class="size-32 animate-spin rounded-full border-24 border-(--ed-orange) border-t-transparent"></span>
    </div>
  {:then cache}
    <CollateralPage spheres={cache.spheres} />
  {/await}
</div>
