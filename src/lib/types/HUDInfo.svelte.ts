import { browser } from "$app/environment";

export type ClickMode = "inara" | "edsm" | "measure" | "range";
export type PanMode = "screen" | "grid";

export class LoadingMessage {
  Message: string;

  constructor(name: string, type: string) {
    this.Message = `Loading ${type}: ${name}`;
  }
}

export const HUDInfo = new (class {
  CurrentSystem: string = $state("");
  LoadingMessages: LoadingMessage[] = $state([]);

  ShowGrid: boolean = $state(false);
  ClickMode: ClickMode = $state("inara");
  PanMode: PanMode = $state("screen");
  PanSpeed: number = $state(2);

  constructor() {
    if (browser) {
      const lsGridVal = localStorage.getItem("showGrid");
      if (lsGridVal) this.ShowGrid = lsGridVal === "true";
      const lsClickVal = localStorage.getItem("clickMode");
      if (lsClickVal) this.ClickMode = lsClickVal as ClickMode;
      const lsPanMode = localStorage.getItem("panMode");
      if (lsPanMode) this.PanMode = lsPanMode as PanMode;
      const lsPanSpeed = localStorage.getItem("panSpeed");
      if (lsPanSpeed) this.PanSpeed = parseFloat(lsPanSpeed);

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
        $effect(() => {
          localStorage.setItem("panSpeed", this.PanSpeed.toString());
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
