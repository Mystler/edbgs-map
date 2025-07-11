<script lang="ts">
  import { type Snippet } from "svelte";
  import { on } from "svelte/events";

  interface Props {
    children: Snippet;
    tooltip?: Snippet;
    direction?: "up" | "down";
    anchor?: "left" | "center" | "right" | "mouse";
  }
  let { children, tooltip, direction = "up", anchor = "center" }: Props = $props();

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
    if (anchor !== "mouse") return;
    const off = on(el, "mousemove", (e) => {
      if (!tooltipEl) return;
      tooltipEl.style.left =
        e.clientX + tooltipEl.clientWidth + 4 < document.documentElement.clientWidth
          ? e.clientX + 4 + "px"
          : document.documentElement.clientWidth - 4 - tooltipEl.clientWidth + "px";
      tooltipEl.style.top =
        e.clientY - 4 - tooltipEl.clientHeight > 0 ? e.clientY - 4 - tooltipEl.clientHeight + "px" : "0";
    });
    return () => {
      off();
    };
  }}
>
  {#if tooltip}
    <div
      bind:this={tooltipEl}
      class={[
        "pointer-events-none invisible z-50 w-max max-w-xs rounded-xl border-2 border-(--ed-orange) bg-zinc-800/50 p-2 opacity-0 backdrop-blur-sm transition-[opacity,_visibility] transition-discrete duration-400 group-hover:visible group-hover:opacity-100",
        direction === "up" && anchor !== "mouse" && "-top-1 -translate-y-full",
        direction === "down" && anchor !== "mouse" && "-bottom-1 translate-y-full",
        anchor === "center" && "left-1/2 -translate-x-1/2",
        anchor === "left" && "left-0",
        anchor === "right" && "right-0",
        anchor !== "mouse" && "absolute",
        anchor === "mouse" && "fixed",
      ]}
    >
      {@render tooltip()}
    </div>
  {/if}
  {@render children?.()}
</span>
