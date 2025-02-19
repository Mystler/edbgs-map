<script>
  import { base } from "$app/paths";
  import { page } from "$app/state";
</script>

<svelte:head>
  <title>Error {page.status}</title>
</svelte:head>

<div class="mt-2 text-center">
  <h1>Error {page.status}</h1>
  <p>
    {page.error?.message}
  </p>
  <p>
    <a href={base}>Go to Custom Map Setup</a>
  </p>
</div>
