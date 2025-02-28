<script lang="ts">
  import type { IconDefinition } from "@fortawesome/free-solid-svg-icons";

  /**
   * This is a simple DIY wrapper for FontAwesome elements to allow treeshaking without importing the entire set.
   */

  interface Props {
    icon: IconDefinition;
  }
  let { icon }: Props = $props();
</script>

{#if typeof icon.icon[4] === "string"}
  <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${icon.icon[0]} ${icon.icon[1]}`}>
    <path d={icon.icon[4]} fill="currentColor" />
  </svg>
{/if}

<style>
  svg {
    height: 1em;
  }
</style>
