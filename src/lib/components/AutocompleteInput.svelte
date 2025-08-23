<script lang="ts">
  import { resolve } from "$app/paths";
  import type { HTMLInputAttributes } from "svelte/elements";

  type AutoCompleteType = "faction" | "system";
  interface Props extends HTMLInputAttributes {
    dataType: AutoCompleteType;
  }

  let { dataType, value = $bindable(), ...rest }: Props = $props();
  const uid = $props.id();

  let timeout: ReturnType<typeof setTimeout> | undefined;
  let options: string[] = $state([]);
</script>

<input
  type="text"
  bind:value
  oninput={(e) => {
    if (timeout) clearTimeout(timeout);
    const string = (e.target as HTMLInputElement).value;
    if (!string) {
      options = [];
      return;
    }
    timeout = setTimeout(async () => {
      const response = await fetch(resolve(`/api/${dataType}/${encodeURIComponent(string)}/autocomplete`));
      if (response.ok) {
        options = await response.json();
      }
    }, 500);
  }}
  list={`autocomplete-${uid}`}
  {...rest}
/>
<datalist id={`autocomplete-${uid}`}>
  {#each options as option (option)}
    <option>{option}</option>
  {/each}
</datalist>
