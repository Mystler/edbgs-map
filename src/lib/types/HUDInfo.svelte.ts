import { browser } from "$app/environment";
import type { Snippet } from "svelte";

export const ClickMode = {
  inara: "Open Inara",
  edsm: "Open EDSM",
  spansh: "Open Spansh",
  measure: "Measure Distance",
  range: "Toggle Range",
};
export type PanMode = "screen" | "grid";

export class LoadingMessage {
  Message: string;

  constructor(name: string, type: string) {
    this.Message = `Loading ${type}: ${name}`;
  }
}

export const HUDInfo = new (class {
  CurrentSystemInfo: Snippet | undefined = $state();
  LoadingMessages: LoadingMessage[] = $state([]);
  TimedMessage: string = $state("");

  #timeout: ReturnType<typeof setTimeout> | undefined;

  ShowGrid: boolean = $state(false);
  ClickMode: keyof typeof ClickMode = $state("inara");
  PanMode: PanMode = $state("screen");
  PanSpeed: number = $state(2);

  constructor() {
    if (browser) {
      const lsGridVal = localStorage.getItem("showGrid");
      if (lsGridVal) this.ShowGrid = lsGridVal === "true";
      const lsClickVal = localStorage.getItem("clickMode");
      if (lsClickVal) this.ClickMode = lsClickVal as keyof typeof ClickMode;
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

  showTimedMessage(msg: string, timeMs: number) {
    if (this.#timeout) clearTimeout(this.#timeout);
    this.TimedMessage = msg;
    this.#timeout = setTimeout(() => {
      this.TimedMessage = "";
    }, timeMs);
  }

  changeClickMode(mode: keyof typeof ClickMode) {
    this.ClickMode = mode;
    this.showTimedMessage(`Click Mode set to: ${ClickMode[mode]}`, 2000);
  }
})();
