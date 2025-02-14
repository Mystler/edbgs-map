<script lang="ts">
  import { interactivity } from "@threlte/extras";

  let { children } = $props();

  /** Using this wrapper to enable interactivity on a parent level for all content that we slot into it. */

  interactivity({
    filter: (hits) => {
      // Only return the first hit
      return hits.slice(0, 1);
    },
  });
</script>

{@render children?.()}
