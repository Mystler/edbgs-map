<script lang="ts">
  import { T } from "@threlte/core";
  import { useCursor, useInteractivity } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import {
    CircleGeometry,
    DoubleSide,
    PlaneGeometry,
    Vector3,
    InstancedMesh as ThreeInstancedMesh,
    Object3D,
    ShaderMaterial,
    Color,
    Uniform,
    BufferGeometry,
    ShapeGeometry,
    SphereGeometry,
    MeshBasicMaterial,
  } from "three";
  import { CurrentCamera, FlyToSystem, FlyToSystemOnceLoaded } from "$lib/types/CurrentCamera.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { getContext, untrack } from "svelte";
  import { InstancedMesh2 } from "@three.ez/instanced-mesh";
  import { Powers } from "$lib/Constants";
  import { CurrentMeasurement } from "./Measurement.svelte";
  import type { MapData } from "$lib/types/MapData.svelte";
  import { Spring } from "svelte/motion";
  import StarShape from "../shapes/StarShape";
  import TriangleShape from "../shapes/TriangleShape";
  import { LoadedSystems } from "$lib/types/LoadedData.svelte";

  interface Props {
    systems: SpanshSystem[];
    color: string;
    visible?: boolean;
    zOffset?: number;
    starType?: "circle" | "triangle" | "star";
  }
  let { systems, color, visible = true, zOffset = 0, starType = "circle" }: Props = $props();

  const gcMaxCamDistance = 50;
  const gcMaxLength = 15;
  const gcMaxDistance = 50;
  const gcMaterial = new ShaderMaterial({
    vertexShader: `
      uniform float gcMaxCamDistance;
      uniform float gcMaxLength;
      uniform float gcMaxDistance;
      uniform vec3 target;
      uniform float camDistance;
      varying float f_opacity;
      void main() {
        vec3 sysPos = instanceMatrix[3].xyz;
        // Transform the instance vertices to connect to the grid plane
        float length = target.y - sysPos.y;
        float offset = sign(length) * 0.1;
        float scaleY = length - offset;
        vec3 newPosition = vec3(position.x, position.y * scaleY + offset, position.z);
        // Calculate fading
        float gcDist = distance(sysPos.xz, target.xz);
        float fade = min(1.0, max(max(camDistance / gcMaxCamDistance, abs(length) / gcMaxLength), gcDist / gcMaxDistance));
        float opacity = 1.0 - fade * fade * fade;
        // Rotate around Y axis towards camera
        mat4 rotY = mat4(1.0);
        float angle = atan(cameraPosition.x - sysPos.x, cameraPosition.z - sysPos.z);
        rotY[0][0] = cos(angle);
        rotY[0][2] = -sin(angle);
        rotY[2][0] = sin(angle);
        rotY[2][2] = cos(angle);
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * rotY * vec4(newPosition, 1.0);
        f_opacity = opacity;
      }
    `,
    fragmentShader: `
      varying float f_opacity;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, f_opacity);
      }
    `,
    uniforms: {
      gcMaxCamDistance: { value: gcMaxCamDistance },
      gcMaxLength: { value: gcMaxLength },
      gcMaxDistance: { value: gcMaxDistance },
      target: { value: CurrentCamera.LookAtVector },
      camDistance: { value: CurrentCamera.Distance },
    },
    transparent: true,
    depthWrite: false,
  });
  gcMaterial.side = DoubleSide;

  function calculateGridConnectors(): [x: number, y: number, z: number][] {
    if (CurrentCamera.Distance >= gcMaxCamDistance) return [];
    const gcSystems: [x: number, y: number, z: number][] = [];
    for (const system of systems) {
      const length = Math.abs(system.y - CurrentCamera.LookAtVector.y);
      if (length >= gcMaxLength) continue;
      const distance = CurrentCamera.LookAtVector.distanceTo({
        x: system.x,
        y: CurrentCamera.LookAtVector.y,
        z: -system.z,
      });
      if (distance >= gcMaxDistance) continue;
      gcSystems.push([system.x, system.y, -system.z]);
    }
    return gcSystems;
  }

  let lastConnectors = 0;
  const gcLine = new PlaneGeometry(0.1, 1);
  gcLine.translate(0, 0.5, 0);
  const gcCircle = new CircleGeometry(0.33);
  gcCircle.rotateX(-Math.PI / 2);
  gcCircle.translate(0, 1, 0);
  const gcLineMesh = new ThreeInstancedMesh(gcLine, gcMaterial, (() => systems.length)());
  gcLineMesh.count = 0;
  const gcCircleMesh = new ThreeInstancedMesh(gcCircle, gcMaterial, (() => systems.length)());
  gcCircleMesh.count = 0;
  const gcLineDummy = new Object3D();
  const gcCircleDummy = new Object3D();

  function onCameraChange() {
    if (!HUDInfo.ShowGrid || !visible) return;
    const gridConnectors = calculateGridConnectors();
    gridConnectors.forEach((gc, i) => {
      gcLineDummy.position.set(gc[0], gc[1], gc[2]);
      gcLineDummy.updateMatrix();
      gcLineMesh.setMatrixAt(i, gcLineDummy.matrix);
      gcCircleDummy.position.set(gc[0], gc[1], gc[2]);
      gcCircleDummy.updateMatrix();
      gcCircleMesh.setMatrixAt(i, gcCircleDummy.matrix);
    });
    if (gridConnectors.length > 0 || lastConnectors > 0) {
      gcLineMesh.count = gridConnectors.length;
      gcLineMesh.instanceMatrix.needsUpdate = true;
      gcLineMesh.computeBoundingSphere();
      gcCircleMesh.count = gridConnectors.length;
      gcCircleMesh.instanceMatrix.needsUpdate = true;
      gcCircleMesh.computeBoundingSphere();
      const target = gcMaterial.uniforms.target as Uniform<Vector3>;
      target.value.set(...CurrentCamera.LookAt);
      const camDistance = gcMaterial.uniforms.camDistance as Uniform<number>;
      camDistance.value = CurrentCamera.Distance;
    }
    lastConnectors = gridConnectors.length;
  }

  $effect(() => {
    // Force update when visibility is back on
    if (HUDInfo.ShowGrid && visible) {
      untrack(() => onCameraChange());
    }
  });

  $effect(() => {
    CurrentCamera.Controls?.addEventListener("change", onCameraChange);
    return () => {
      CurrentCamera.Controls?.removeEventListener("change", onCameraChange);
    };
  });

  // Create visual Mesh
  const systemsMaterial = new ShaderMaterial({
    uniforms: {
      color: { value: new Color((() => color)()).convertLinearToSRGB() },
    },
    vertexShader: `
      attribute uint instanceIndex;
      uniform highp sampler2D matricesTexture;

      mat4 getInstancedMatrix() {
        int size = textureSize( matricesTexture, 0 ).x;
        int j = int( instanceIndex ) * 4;
        int x = j % size;
        int y = j / size;
        vec4 v1 = texelFetch( matricesTexture, ivec2( x, y ), 0 );
        vec4 v2 = texelFetch( matricesTexture, ivec2( x + 1, y ), 0 );
        vec4 v3 = texelFetch( matricesTexture, ivec2( x + 2, y ), 0 );
        vec4 v4 = texelFetch( matricesTexture, ivec2( x + 3, y ), 0 );
        return mat4( v1, v2, v3, v4 );
      }

      uniform vec3 color;
      varying vec3 f_color;
      void main() {
        mat4 instanceMatrix = getInstancedMatrix();
        vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
        vec3 billboarded = right * position.x + up * position.y;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(billboarded, 1.0);
        f_color = color;
      }
    `,
    fragmentShader: `
      varying vec3 f_color;
      void main() {
        gl_FragColor = vec4(f_color, 1.0);
      }
    `,
  });

  $effect.pre(() => {
    systemsMaterial.polygonOffset = zOffset ? true : false;
    systemsMaterial.polygonOffsetFactor = -zOffset * 4;
    systemsMaterial.polygonOffsetUnits = -zOffset * 4;
  });
  $effect.pre(() => {
    const uColor = systemsMaterial.uniforms.color as Uniform<Color>;
    uColor.value.set(new Color(color).convertLinearToSRGB());
  });

  // Create visual instanced mesh
  let vMesh = $derived.by(() => {
    let geo: BufferGeometry;
    if (starType === "star") {
      geo = new ShapeGeometry(StarShape, 1);
    } else if (starType === "triangle") {
      geo = new ShapeGeometry(TriangleShape, 1);
    } else {
      geo = new CircleGeometry(0.5);
    }
    return new InstancedMesh2(geo, systemsMaterial);
  });
  $effect.pre(() => {
    vMesh.clearInstances();
    vMesh.addInstances(systems.length, (x, i) => {
      x.position = new Vector3(systems[i].x, systems[i].y, -systems[i].z);
    });
    vMesh.computeBVH();
  });

  // Create hidden mesh for raycasting onto spheres.
  const hitSize = $derived(starType === "star" ? 1.5 : starType === "triangle" ? 1 : 0.5);
  let rMesh = $derived.by(() => {
    const geo = new SphereGeometry(hitSize, 16, 16);
    return new InstancedMesh2(geo, new MeshBasicMaterial({ transparent: true, opacity: 0, depthTest: false }));
  });
  $effect.pre(() => {
    rMesh.clearInstances();
    rMesh.addInstances(systems.length, (x, i) => {
      x.position = new Vector3(systems[i].x, systems[i].y, -systems[i].z);
    });
    rMesh.computeBVH();
  });

  // Pointer event handling for our instances
  let systemScalers = $derived(
    systems.map(
      () =>
        new Spring(1, {
          stiffness: 0.15,
          damping: 0.25,
        }),
    ),
  );
  const mapData: MapData = getContext("mapData");
  const interactivity = useInteractivity();
  const { onPointerEnter: cursorEnter, onPointerLeave: cursorLeave } = useCursor();
  interface IM2InteractivityEvent {
    instanceId: number;
  }
  $effect.pre(() => {
    interactivity.addInteractiveObject(rMesh, {
      onpointerenter: (e) => {
        const ev = e as IM2InteractivityEvent;
        if (ev.instanceId === undefined) return;
        cursorEnter();
        systemScalers[ev.instanceId].target = 2;
        const system = systems[ev.instanceId];
        HUDInfo.CurrentSystemInfo = system;
      },
      onpointerleave: (e) => {
        const ev = e as IM2InteractivityEvent;
        if (ev.instanceId === undefined) return;
        cursorLeave();
        systemScalers[ev.instanceId].target = 1;
        HUDInfo.CurrentSystemInfo = undefined;
      },
      onclick: (e) => {
        const ev = e as IM2InteractivityEvent;
        if (ev.instanceId === undefined) return;
        const system = systems[ev.instanceId];
        if (HUDInfo.ClickMode === "inara") {
          window.open(`https://inara.cz/elite/starsystem/?search=${encodeURIComponent(system.name)}`, "_blank");
        } else if (HUDInfo.ClickMode === "edsm") {
          window.open(
            `https://www.edsm.net/en/system/id//name?systemName=${encodeURIComponent(system.name)}`,
            "_blank",
          );
        } else if (HUDInfo.ClickMode === "spansh") {
          if (system.id64) window.open(`https://spansh.co.uk/system/${encodeURIComponent(system.id64)}`, "_blank");
          else window.open(`https://spansh.co.uk/search/${encodeURIComponent(system.name)}`, "_blank");
        } else if (HUDInfo.ClickMode === "measure") {
          CurrentMeasurement.addSystem(system.name, system.x, system.y, system.z);
        } else if (HUDInfo.ClickMode === "range") {
          const i = mapData.Spheres.findIndex((sphere) => sphere.name === system.name);
          if (i >= 0) {
            mapData.Spheres.splice(i, 1);
          } else {
            const type =
              system.power_state === "Stronghold"
                ? "Stronghold"
                : system.power_state === "Fortified"
                  ? "Fortified"
                  : "Colonization";
            mapData.addSphere({
              name: system.name,
              color:
                type === "Stronghold" || type === "Fortified" ? Powers[system.controlling_power!].color : "#ffffff",
              position: [system.x, system.y, system.z],
              type,
            });
          }
        } else if (HUDInfo.ClickMode === "powerplay") {
          HUDInfo.CurrentPPInfo = system;
        }
      },
    });

    return () => {
      if (rMesh) interactivity.removeInteractiveObject(rMesh);
    };
  });

  const systemScaleDummy = new Object3D();
  $effect(() => {
    systemScalers.forEach((spring, i) => {
      if (spring.current !== spring.target) {
        systemScaleDummy.scale.set(spring.current, spring.current, spring.current);
        systemScaleDummy.position.set(systems[i].x, systems[i].y, -systems[i].z);
        systemScaleDummy.updateMatrix();
        vMesh.setMatrixAt(i, systemScaleDummy.matrix);
        rMesh.setMatrixAt(i, systemScaleDummy.matrix);
      }
    });
  });

  // Global system tracking
  $effect.pre(() => {
    for (const system of systems) {
      untrack(() => {
        LoadedSystems.set(system.name, system);
        if (FlyToSystemOnceLoaded.value === system.name) {
          FlyToSystem(system.name);
        }
      });
    }
  });
</script>

<!-- Render instanced meshes -->
<T is={vMesh} {visible} update={false} />
<T is={rMesh} {visible} update={false} />

<!-- Render grid connectors -->
<T is={gcLineMesh} visible={HUDInfo.ShowGrid && visible} />
<T is={gcCircleMesh} visible={HUDInfo.ShowGrid && visible} />
