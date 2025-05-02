<script lang="ts">
  import { faXmark } from "@fortawesome/free-solid-svg-icons";
  import FaIcon from "./FaIcon.svelte";
  import { on } from "svelte/events";
  import { onMount, type Snippet } from "svelte";

  interface Props {
    showImmediately?: boolean;
    children: Snippet;
    onclose?: () => void;
  }
  let { children, showImmediately = false, onclose = () => {} }: Props = $props();

  let dialog = $state() as HTMLDialogElement;
  let opened = $state(false);

  export const isOpen = () => opened;
  export function show() {
    dialog.showModal();
    opened = true;
  }
  export function close() {
    dialog.close();
  }
  function closeClickBackdrop(e: MouseEvent) {
    if (e.target === dialog) {
      close();
    }
  }

  onMount(() => {
    if (showImmediately) show();
    const off = on(dialog, "click", closeClickBackdrop);
    return off;
  });
</script>

<dialog
  bind:this={dialog}
  class="m-auto bg-transparent outline-none backdrop:backdrop-blur-xs"
  onclose={() => {
    opened = false;
    onclose();
  }}
>
  <button type="button" class="absolute top-2 right-2 p-2" onclick={close} aria-label="Close"
    ><FaIcon icon={faXmark} /></button
  >
  <div class="max-w-3xl rounded-xl border-2 border-(--ed-orange) bg-zinc-800 p-4">
    {@render children?.()}
  </div>
</dialog>
