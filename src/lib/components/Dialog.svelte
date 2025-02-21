<script lang="ts">
  let { children } = $props();

  let dialog = $state() as HTMLDialogElement;

  export const isOpen = () => dialog.open;
  export function show() {
    dialog.showModal();
    dialog.addEventListener("click", closeClickBackdrop);
  }
  export function close() {
    dialog.removeEventListener("click", closeClickBackdrop);
    dialog.close();
  }
  function closeClickBackdrop(e: MouseEvent) {
    if (e.target === dialog) {
      close();
    }
  }
</script>

<dialog bind:this={dialog} class="m-auto bg-transparent outline-none backdrop:backdrop-blur-xs">
  <button class="absolute top-2 right-2 size-6" onclick={close} aria-label="Close">🗙</button>
  <div class="max-w-3xl rounded-xl border-2 border-(--ed-orange) bg-zinc-800 p-4">
    {@render children?.()}
  </div>
</dialog>
