import { browser } from "$app/environment";

export type ClickMode = "inara" | "measure";
export type PanMode = "screen" | "grid";

export class LoadingMessage {
  Message: string;

  constructor(name: string, type: string) {
    this.Message = `Loading ${type}: ${name}`;
  }
}

export const HUDInfo = new (class {
  ShowGrid: boolean = $state(false);
  CurrentSystem: string = $state("");
  ClickMode: ClickMode = $state("inara");
  PanMode: PanMode = $state("screen");
  LoadingMessages: LoadingMessage[] = $state([]);

  constructor() {
    if (browser) {
      const lsGridVal = localStorage.getItem("showGrid");
      if (lsGridVal) this.ShowGrid = lsGridVal === "true";
      const lsClickVal = localStorage.getItem("clickMode");
      if (lsClickVal) this.ClickMode = lsClickVal as ClickMode;
      const lsPanMode = localStorage.getItem("panMode");
      if (lsPanMode) this.PanMode = lsPanMode as PanMode;

      $effect.root(() => {
        $effect(() => {
          localStorage.setItem("showGrid", JSON.stringify(this.ShowGrid));
        });
        $effect(() => {
          localStorage.setItem("clickMode", this.ClickMode);
        });
        $effect(() => {
          localStorage.setItem("panMode", this.PanMode);
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
