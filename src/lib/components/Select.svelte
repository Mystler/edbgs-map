<!--
@component A wrapper for customizeable selects.
-->
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLSelectAttributes } from "svelte/elements";

  interface Props extends HTMLSelectAttributes {
    children: Snippet;
  }
  let { children, value = $bindable(), ...rest }: Props = $props();
</script>

<select bind:value {...rest}>
  <!-- Not working (yet?) in map related uses for some reason... <button><selectedcontent></selectedcontent></button> -->
  {@render children()}
</select>

<style>
  select,
  ::picker(select) {
    appearance: base-select;
  }

  select {
    cursor: pointer;
  }

  select::picker-icon {
    color: var(--ed-orange-light);
    transition: 0.4s rotate;
  }
  select:open::picker-icon {
    rotate: 180deg;
  }

  ::picker(select) {
    opacity: 0;
    transition: all 0.4s allow-discrete;
    left: anchor(10%);
    margin: var(--spacing) 0;
    border: 2px solid var(--ed-orange-light);
    border-radius: 12px;
    background-color: var(--color-zinc-900);
  }
  ::picker(select):popover-open {
    opacity: 1;
  }
  @starting-style {
    ::picker(select):popover-open {
      opacity: 0;
    }
  }

  :global(option) {
    padding: calc(var(--spacing) * 1) calc(var(--spacing) * 2);
  }
  :global(option:checked) {
    font-weight: bold;
    background-color: var(--color-zinc-800);
  }
  :global(option::checkmark) {
    order: 1;
    margin-left: auto;
  }
  :global(option:focus) {
    outline: none;
  }
</style>
