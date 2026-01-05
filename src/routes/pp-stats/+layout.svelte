<script lang="ts">
  import FaIcon from "$lib/components/FaIcon.svelte";
  import PowerplayPageNav from "$lib/components/PowerplayPageNav.svelte";
  import { faRotate } from "@fortawesome/free-solid-svg-icons";
  import type { LayoutProps } from "./$types";
  import Time from "svelte-time/Time.svelte";
  import { goto, invalidate } from "$app/navigation";
  import { page } from "$app/state";
  import { untrack } from "svelte";
  import { resolve } from "$app/paths";

  let { data, children }: LayoutProps = $props();

  let lastRefresh = $state(new Date());

  function refresh() {
    invalidate("app:pp-stats");
    lastRefresh = new Date();
  }

  $effect(() => {
    if (page.url)
      untrack(() => {
        lastRefresh = new Date();
      });
  });
</script>

<svelte:head>
  <title>Cycle Stats</title>
  <meta name="description" content="An approximated view of Powerplay Cycle Stats." />
</svelte:head>

<PowerplayPageNav />
<div class="mx-auto max-w-400 px-1 pb-4">
  <!-- Intro section -->
  <h1 class="text-center">Cycle Stats</h1>
  <p class="text-center text-sm">
    See this and past cycle's stats. Note that these are based on known data and subject to inaccuracies from missing or
    outdated information.
  </p>
  {#await data.history then history}
    <div class="text-center">
      <select
        onchange={(e) => {
          goto(resolve(`/pp-stats/${e.currentTarget.value}`));
        }}
      >
        <option value="">Live Data</option>
        {#each history as cycle (cycle.id)}
          <option value={cycle.id} selected={page.params.id ? parseInt(page.params.id) === cycle.id : false}
            >Cycle 2.{cycle.cycle}</option
          >
        {/each}
      </select>
    </div>
  {/await}
  <p class="mx-auto text-right text-xs text-zinc-500">
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
  {@render children()}
</div>
