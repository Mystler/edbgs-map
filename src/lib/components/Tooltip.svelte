<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    tooltip?: Snippet;
    direction?: "up" | "down";
  }
  let { children, tooltip, direction = "up" }: Props = $props();
</script>

<!--
@component
This is a simple CSS tooltip wrapper component.
To use it, wrap your actual content that should trigger the tooltip by this component. The tooltip itself should be supplied using a tooltip snippet.

```svelte
<Tooltip>
  Hover me!
  {#snippet tooltip()}
    Tooltip Content
  {/snippet}
</Tooltip>
```
-->
<span class="group relative">
  {#if tooltip}
    <div
      class={[
        "pointer-events-none invisible absolute left-1/2 w-max max-w-xs -translate-x-1/2 rounded-xl border-2 border-(--ed-orange) bg-zinc-800/50 p-2 opacity-0 backdrop-blur-sm transition-all transition-discrete duration-400 group-hover:visible group-hover:opacity-100",
        direction === "up" && "-top-1 -translate-y-full",
        direction === "down" && "-bottom-1 translate-y-full",
      ]}
    >
      {@render tooltip()}
    </div>
  {/if}
  {@render children?.()}
</span>
