<script lang="ts">
  import { resolve } from "$app/paths";
</script>

<div class="flex justify-between gap-2 px-2 py-1">
  <div class="flex gap-4">
    <a class="link-btn" href={resolve(`/pp-alerts`)}>Alerts</a>
    <a class="link-btn" href={resolve(`/pp-snipes`)}>Snipes</a>
    <a class="link-btn" href={resolve(`/pp-stats`)}>Stats</a>
  </div>
  <div class="text-right text-[0.6rem] text-zinc-500">
    v{__VERSION__} ({__COMMIT__}, {new Date(__COMMITDATE__).toLocaleDateString()})
  </div>
</div>
