import type { SpanshSystem } from "$lib/SpanshAPI";
import { SvelteMap } from "svelte/reactivity";

export const LoadedSystems = new SvelteMap<string, SpanshSystem>();
