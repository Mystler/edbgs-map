import type { SpanshSystem } from "#lib/SpanshAPI.js";
import { SvelteMap } from "svelte/reactivity";

export const LoadedSystems = new SvelteMap<string, SpanshSystem>();
