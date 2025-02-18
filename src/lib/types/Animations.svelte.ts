import { quintOut } from "svelte/easing";
import { slide as sv_slide } from "svelte/transition";

// Create our own derived default presets

export const slide = (node: Element) => sv_slide(node, { easing: quintOut });
