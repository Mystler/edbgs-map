import { base } from "$app/paths";
import { page } from "$app/state";
import { CurrentCamera } from "./types/CurrentCamera.svelte";
import {
  MapData,
  type FactionData,
  type SphereData,
  type SphereType,
  type SystemData,
} from "./types/MapData.svelte";

export function createCustomURL(data: MapData) {
  const params = new URLSearchParams();
  for (const x of data.Factions) {
    params.append("fn", x.name);
    if (x.name !== x.displayName) params.append("fd", x.displayName);
    params.append("fc", x.color);
    if (!x.visible) params.append("fv", x.visible.toString());
  }
  for (const x of data.Systems) {
    params.append("sn", x.name);
    if (x.name !== x.displayName) params.append("sd", x.displayName);
    params.append("sc", x.color);
    if (!x.visible) params.append("sv", x.visible.toString());
  }
  for (const x of data.Spheres) {
    params.append("spn", x.name);
    params.append("spc", x.color);
    params.append("spt", x.type);
    if (!x.visible) params.append("spv", x.visible.toString());
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

  // Get camera data first
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

  // In order to allow optional parameters, we iterate the parameters when setting up display data.
  // This means, the order of the parameters is important but fields can be optional.
  let cf: Partial<FactionData> | undefined;
  let cs: Partial<SystemData> | undefined;
  let csp: Partial<SphereData> | undefined;
  params.forEach((value, key) => {
    if (key === "fn") {
      // New faction starts, add the previous one if it exists
      if (cf) {
        data.addFaction(cf);
      }
      // Start reading a new one now
      cf = { name: value };
    } else if (key === "fd" && cf) {
      cf.displayName = value;
    } else if (key === "fc" && cf) {
      cf.color = value;
    } else if (key === "fv" && cf) {
      cf.visible = value === "true";
    } else if (key === "sn") {
      // New system starts, add the previous one if it exists
      if (cs) {
        data.addSystem(cs);
      }
      // Start reading a new one now
      cs = { name: value };
    } else if (key === "sd" && cs) {
      cs.displayName = value;
    } else if (key === "sc" && cs) {
      cs.color = value;
    } else if (key === "sv" && cs) {
      cs.visible = value === "true";
    } else if (key === "spn") {
      // New sphere starts, add the previous one if it exists
      if (csp) {
        data.addSphere(csp);
      }
      // Start reading a new one now
      csp = { name: value };
    } else if (key === "spt" && csp) {
      csp.type = value as SphereType;
    } else if (key === "spc" && csp) {
      csp.color = value;
    } else if (key === "spv" && csp) {
      csp.visible = value === "true";
    }
  });
  // Add remaining open objects if they exist
  if (cf) data.addFaction(cf);
  if (cs) data.addSystem(cs);
  if (csp) data.addSphere(csp);

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
