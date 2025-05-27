<script lang="ts">
  import { T } from "@threlte/core";
  import { InstancedMesh } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import SystemInstance from "./SystemInstance.svelte";
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
  } from "three";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import TriangleShape from "./Shapes/TriangleShape.svelte";
  import StarShape from "./Shapes/StarShape.svelte";
  import { untrack } from "svelte";

  interface Props {
    systems: SpanshSystem[];
    color: string;
    visible?: boolean;
    zOffset?: number;
    starType?: "circle" | "triangle" | "star";
  }
  let { systems, color, visible = true, zOffset = 0, starType = "circle" }: Props = $props();

  const systemsMaterial = new ShaderMaterial({
    uniforms: {
      color: { value: new Color(color).convertLinearToSRGB() },
    },
    vertexShader: `
      uniform vec3 color;
      varying vec3 f_color;
      void main() {
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
  let hitSize = $derived(starType === "star" ? 1.5 : starType === "triangle" ? 1 : 0.5);

  $effect.pre(() => {
    const uColor = systemsMaterial.uniforms.color as Uniform<Color>;
    uColor.value.set(new Color(color).convertLinearToSRGB());
  });

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
  const gcLineMesh = new ThreeInstancedMesh(gcLine, gcMaterial, systems.length);
  gcLineMesh.count = 0;
  const gcCircleMesh = new ThreeInstancedMesh(gcCircle, gcMaterial, systems.length);
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
  let vMesh = $state() as ThreeInstancedMesh;
  let rMesh = $state() as ThreeInstancedMesh;
</script>

<!-- Render systems themselves -->
<InstancedMesh id="visual" bind:ref={vMesh} limit={systems.length} range={systems.length} {visible} update={false}>
  {#if starType === "circle"}
    <T.CircleGeometry args={[0.5]} />
  {:else if starType === "triangle"}
    <TriangleShape />
  {:else if starType === "star"}
    <StarShape />
  {/if}
  <T
    is={systemsMaterial}
    {color}
    polygonOffset={zOffset ? true : false}
    polygonOffsetFactor={-zOffset * 4}
    polygonOffsetUnits={-zOffset * 4}
  />

  <InstancedMesh
    id="raycast"
    bind:ref={rMesh}
    limit={systems.length}
    range={systems.length}
    visible={false}
    update={false}
  >
    <T.SphereGeometry args={[hitSize, 16, 16]} />
    <T.MeshBasicMaterial />

    {#each systems as system, i (system.name)}
      <SystemInstance
        {system}
        {zOffset}
        {visible}
        update={(mat) => {
          // Reusing the same matrix for both meshes since they should be equal.
          vMesh.setMatrixAt(i, mat);
          vMesh.instanceMatrix.needsUpdate = true;
          rMesh.setMatrixAt(i, mat); // Do not need to set needsUpdate for this since we don't draw it.
        }}
      />
    {/each}
  </InstancedMesh>
</InstancedMesh>

<!-- Render grid connectors -->
<T is={gcLineMesh} visible={HUDInfo.ShowGrid && visible} />
<T is={gcCircleMesh} visible={HUDInfo.ShowGrid && visible} />
