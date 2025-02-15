import { browser } from "$app/environment";

export type ClickMode = "inara" | "measure";

export class LoadingMessage {
  Message: string;

  constructor(name: string, type: string) {
    this.Message = `Loading ${type}: ${name}`;
  }
}

export const HUDInfo = new (class {
  CurrentSystem: string = $state("");
  ClickMode: ClickMode = $state("inara");
  LoadingMessages: LoadingMessage[] = $state([]);

  constructor() {
    if (browser) {
      const lsClickVal = localStorage.getItem("clickMode");
      if (lsClickVal) this.ClickMode = lsClickVal as ClickMode;
      $effect.root(() => {
        $effect(() => {
          localStorage.setItem("clickMode", this.ClickMode);
        });
      });
    }
  }

  /** Create new loading message and return reference required for deletion. */
  showMessage(name: string, type: string) {
    const m = new LoadingMessage(name, type);
    this.LoadingMessages.push(m);
    return m;
  }

  removeMessage(m: LoadingMessage) {
    this.LoadingMessages.splice(this.LoadingMessages.indexOf(m), 1);
  }
})();
