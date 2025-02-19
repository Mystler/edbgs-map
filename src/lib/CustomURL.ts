import { base } from "$app/paths";
import { page } from "$app/state";
import { CurrentCamera } from "./types/CurrentCamera.svelte";
import { MapData, type SphereType } from "./types/MapData.svelte";

export function createCustomURL(data: MapData) {
  const params = new URLSearchParams();
  for (const x of data.Factions) {
    params.append("fn", x.name);
    params.append("fd", x.displayName);
    params.append("fc", x.color);
  }
  for (const x of data.Systems) {
    params.append("sn", x.name);
    params.append("sd", x.displayName);
    params.append("sc", x.color);
  }
  for (const x of data.Spheres) {
    params.append("spn", x.name);
    params.append("spc", x.color);
    params.append("spt", x.type);
  }
  if (CurrentCamera.Position) {
    params.append("cpx", CurrentCamera.Position[0].toFixed());
    params.append("cpy", CurrentCamera.Position[1].toFixed());
    params.append("cpz", CurrentCamera.Position[2].toFixed());
  }
  if (CurrentCamera.LookAt) {
    params.append("ctx", CurrentCamera.LookAt[0].toFixed());
    params.append("cty", CurrentCamera.LookAt[1].toFixed());
    params.append("ctz", CurrentCamera.LookAt[2].toFixed());
  }
  return params;
}

export function readCustomURL(params: URLSearchParams): MapData {
  const data = new MapData();

  if (params.has("cpx") && params.has("cpy") && params.has("cpz")) {
    data.Camera.position = [
      parseFloat(params.get("cpx")!),
      parseFloat(params.get("cpy")!),
      parseFloat(params.get("cpz")!),
    ];
  }
  if (params.has("ctx") && params.has("cty") && params.has("ctz")) {
    data.Camera.lookAt = [
      parseFloat(params.get("ctx")!),
      parseFloat(params.get("cty")!),
      parseFloat(params.get("ctz")!),
    ];
  }

  if (params.has("fn") && params.has("fd") && params.has("fc")) {
    const facs = params.getAll("fn");
    const displayNames = params.getAll("fd");
    const colors = params.getAll("fc");
    facs.forEach((faction, i) => {
      data.addFaction({ name: faction, displayName: displayNames[i], color: colors[i] });
    });
  }
  if (params.has("sn") && params.has("sd") && params.has("sc")) {
    const systems = params.getAll("sn");
    const displayNames = params.getAll("sd");
    const colors = params.getAll("sc");
    systems.forEach((sys, i) => {
      data.addSystem({ name: sys, displayName: displayNames[i], color: colors[i] });
    });
  }
  if (params.has("spn") && params.has("spc") && params.has("spt")) {
    const spheres = params.getAll("spn");
    const colors = params.getAll("spc");
    const sphTypes = params.getAll("spt") as SphereType[];
    spheres.forEach((sphere, i) => {
      data.addSphere({ name: sphere, color: colors[i], type: sphTypes[i] });
    });
  }

  return data;
}

export async function createShortlink(data: MapData) {
  const short = await fetch(base + "/s", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(createCustomURL(data).toString()),
  }).then((res) => res.json());
  if (!short) {
    alert("Error on creating shareable shortlink!");
    return;
  }
  const link = `${page.url.origin}${base}/s/${short}`;
  navigator.clipboard.writeText(link);
  alert("A shareable link has been copied to your clipboard!");
}
