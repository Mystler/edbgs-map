<script lang="ts">
  import { type Snippet } from "svelte";
  import { on } from "svelte/events";

  interface Props {
    children: Snippet;
    tooltip?: Snippet;
  }
  let { children, tooltip }: Props = $props();

  let tooltipEl = $state<HTMLDivElement>();
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
<span
  class="group relative"
  {@attach (el) => {
    const off = on(el, "mousemove", (e) => {
      if (!tooltipEl) return;
      const spacingX = 4;
      const spacingY = 16;
      tooltipEl.style.left =
        e.clientX + tooltipEl.clientWidth + 4 < document.documentElement.clientWidth
          ? e.clientX + spacingX + "px"
          : document.documentElement.clientWidth - spacingX - tooltipEl.clientWidth + "px";
      tooltipEl.style.top =
        e.clientY - spacingY - tooltipEl.clientHeight > 0 ? e.clientY - spacingY - tooltipEl.clientHeight + "px" : "0";
    });
    return () => {
      off();
    };
  }}
>
  {#if tooltip}
    <div
      bind:this={tooltipEl}
      class="pointer-events-none invisible fixed z-50 w-max max-w-xs rounded-xl border-2 border-(--ed-orange) bg-zinc-800/50 p-2 opacity-0 backdrop-blur-sm transition-[opacity,_visibility] transition-discrete duration-400 group-hover:visible group-hover:opacity-100"
    >
      {@render tooltip()}
    </div>
  {/if}
  {@render children?.()}
</span>
