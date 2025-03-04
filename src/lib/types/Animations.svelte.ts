import { isInstanceOf } from "@threlte/core";
import { createTransition } from "@threlte/extras";
import { quintOut } from "svelte/easing";
import { slide as sv_slide, fade as sv_fade } from "svelte/transition";

// Create our own derived default presets

export const slide = (node: Element) => sv_slide(node, { easing: quintOut });
export const fade = (node: Element) => sv_fade(node, { easing: quintOut });

export const scale3d = createTransition((ref) => {
  if (!isInstanceOf(ref, "Object3D")) return;
  return {
    tick(t) {
      ref.scale.setScalar(t);
    },
    easing: quintOut,
    duration: 400,
  };
});
