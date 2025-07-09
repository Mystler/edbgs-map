<script lang="ts">
  import Time from "svelte-time";
  import type { PageProps } from "./$types";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import FaIcon from "$lib/components/FaIcon.svelte";
  import { faRotate } from "@fortawesome/free-solid-svg-icons";
  import PowerplayPageNav from "$lib/components/PowerplayPageNav.svelte";
  import AlertsPage from "./AlertsPage.svelte";

  let { data }: PageProps = $props();

  let lastRefresh = $state(new Date());

  function refresh() {
    invalidate("app:pp-alerts");
    lastRefresh = new Date();
  }
  onMount(() => {
    const refreshId = setInterval(refresh, 600000);
    return () => {
      clearInterval(refreshId);
    };
  });
</script>

<svelte:head>
  <title>Powerplay Alerts</title>
  <meta name="description" content="Frontier did not give us the War Room, so I made my own..." />
</svelte:head>

<PowerplayPageNav />

<div class="mx-auto px-1 pb-4 xl:max-w-(--breakpoint-xl)">
  <!-- Intro section -->
  <h1 class="text-center">Powerplay Alerts</h1>
  <p class="text-center">Welcome to the War Room.</p>
  <p class="text-center text-sm">
    This shows all systems that were recently detected with more than 10k of total CP movement (for Control Systems) or
    above the 30% threshold (for Acquisitions).
  </p>
  <p class="text-right text-xs text-zinc-500">
    Last Refresh:
    {#key lastRefresh}<Time relative live={5000} timestamp={lastRefresh} title={undefined} />{/key}
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
  {#await data.systems}
    <div class="flex justify-center overflow-hidden">
      <span class="size-32 animate-spin rounded-full border-24 border-(--ed-orange) border-t-transparent"></span>
    </div>
  {:then systems}
    <AlertsPage {systems} />
  {/await}
</div>
