<script lang="ts">
  import { faCopy } from "@fortawesome/free-solid-svg-icons";
  import FaIcon from "./FaIcon.svelte";

  let { text }: { text: string } = $props();
</script>

<button
  class="align-super text-xs text-(--ed-orange)"
  title="Copy to Clipboard"
  onclick={() => navigator.clipboard.writeText(text)}
>
  <FaIcon icon={faCopy} class="inline" />
</button>
