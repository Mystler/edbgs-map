import { base } from "$app/paths";
import { page } from "$app/state";
import { CurrentCamera } from "./types/CurrentCamera.svelte";
import {
  MapData,
  type FactionData,
  type PowerData,
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
    if (!x.labelVisible) params.append("fl", x.labelVisible.toString());
  }
  for (const x of data.Systems) {
    params.append("sn", x.name);
    if (x.name !== x.displayName) params.append("sd", x.displayName);
    params.append("sc", x.color);
    if (!x.visible) params.append("sv", x.visible.toString());
    if (!x.labelVisible) params.append("sl", x.labelVisible.toString());
    if (x.position) {
      params.append("sx", x.position[0].toString());
      params.append("sy", x.position[1].toString());
      params.append("sz", x.position[2].toString());
    }
  }
  for (const x of data.Spheres) {
    params.append("spn", x.name);
    params.append("spc", x.color);
    params.append("spt", x.type);
    if (!x.visible) params.append("spv", x.visible.toString());
    if (x.position) {
      params.append("spx", x.position[0].toString());
      params.append("spy", x.position[1].toString());
      params.append("spz", x.position[2].toString());
    }
  }
  for (const x of data.Powers) {
    params.append("p", x.name);
    params.append("pc", x.color);
    if (!x.exploitedVisible) params.append("pev", x.exploitedVisible.toString());
    if (!x.fortifiedVisible) params.append("pfv", x.fortifiedVisible.toString());
    if (!x.strongholdVisible) params.append("psv", x.strongholdVisible.toString());
  }

  params.append("cpx", CurrentCamera.Position[0].toFixed());
  params.append("cpy", CurrentCamera.Position[1].toFixed());
  params.append("cpz", CurrentCamera.Position[2].toFixed());
  params.append("ctx", CurrentCamera.LookAt[0].toFixed());
  params.append("cty", CurrentCamera.LookAt[1].toFixed());
  params.append("ctz", CurrentCamera.LookAt[2].toFixed());

  return params;
}

export function readCustomURL(params: URLSearchParams, data: MapData) {
  data.reset();

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
  let cp: Partial<PowerData> | undefined;
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
    } else if (key === "fl" && cf) {
      cf.labelVisible = value === "true";
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
    } else if (key === "sl" && cs) {
      cs.labelVisible = value === "true";
    } else if (key === "sx" && cs) {
      if (cs.position) cs.position[0] = parseFloat(value);
      else cs.position = [parseFloat(value), 0, 0];
    } else if (key === "sy" && cs) {
      if (cs.position) cs.position[1] = parseFloat(value);
      else cs.position = [0, parseFloat(value), 0];
    } else if (key === "sz" && cs) {
      if (cs.position) cs.position[2] = parseFloat(value);
      else cs.position = [0, 0, parseFloat(value)];
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
    } else if (key === "spx" && csp) {
      if (csp.position) csp.position[0] = parseFloat(value);
      else csp.position = [parseFloat(value), 0, 0];
    } else if (key === "spy" && csp) {
      if (csp.position) csp.position[1] = parseFloat(value);
      else csp.position = [0, parseFloat(value), 0];
    } else if (key === "spz" && csp) {
      if (csp.position) csp.position[2] = parseFloat(value);
      else csp.position = [0, 0, parseFloat(value)];
    } else if (key === "p") {
      // New power starts, add the previous one if it exists
      if (cp) {
        data.addPower(cp);
      }
      // Start reading a new one now
      cp = { name: value };
    } else if (key === "pc" && cp) {
      cp.color = value;
    } else if (key === "pev" && cp) {
      cp.exploitedVisible = value === "true";
    } else if (key === "pfv" && cp) {
      cp.fortifiedVisible = value === "true";
    } else if (key === "psv" && cp) {
      cp.strongholdVisible = value === "true";
    }
  });
  // Add remaining open objects if they exist
  if (cf) data.addFaction(cf);
  if (cs) data.addSystem(cs);
  if (csp) data.addSphere(csp);
  if (cp) data.addPower(cp);
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
