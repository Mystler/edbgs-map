<script lang="ts">
  import { onNavigate } from "$app/navigation";
  import "../app.css";
  let { children } = $props();

  onNavigate((navigation) => {
    if (navigation.shallow) return;
    if (!document.startViewTransition) return;

    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });
</script>

{@render children()}
