<script module lang="ts">
  const gcMaxCamDistance = 50;
  const gcMaxLength = 15;
  const gcMaxDistance = 50;
  const gridConnectorMaterial = new RawShaderMaterial({
    vertexShader: `
      precision highp float;
      attribute mat4 instanceMatrix;
      attribute vec3 position;
      attribute float opacity;
      varying float f_opacity;
      uniform mat4 projectionMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 modelMatrix;
      void main() {
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
        f_opacity = opacity;
      }
    `,
    fragmentShader: `
      precision highp float;
      varying float f_opacity;
      void main() {
        gl_FragColor = vec4(1.0, 1.0, 1.0, f_opacity);
      }
    `,
    transparent: true,
    depthWrite: false,
  });
  gridConnectorMaterial.side = DoubleSide;
</script>

<script lang="ts">
  import { T } from "@threlte/core";
  import { InstancedMesh } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import SystemInstance from "./SystemInstance.svelte";
  import {
    CircleGeometry,
    DoubleSide,
    DynamicDrawUsage,
    InstancedBufferAttribute,
    PlaneGeometry,
    RawShaderMaterial,
    Vector3,
    InstancedMesh as ThreeInstancedMesh,
    Object3D,
    ShaderMaterial,
    Color,
    Uniform,
  } from "three";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { cubicIn } from "svelte/easing";
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
      precision highp float;
      varying vec3 f_color;
      void main() {
        gl_FragColor = vec4(f_color.xyz, 1.0);
      }
    `,
  });
  let hitSize = $derived(starType === "star" ? 1.5 : starType === "triangle" ? 1 : 0.5);

  $effect.pre(() => {
    const uColor = systemsMaterial.uniforms.color as Uniform<Color>;
    uColor.value.set(new Color(color).convertLinearToSRGB());
  });

  interface GridConnector {
    pointSystem: Vector3;
    pointConnector: Vector3;
    opacity: number;
  }
  function calculateGridConnectors(): GridConnector[] {
    if (CurrentCamera.Distance >= gcMaxCamDistance) return [];
    const gcSystems: GridConnector[] = [];
    for (const system of systems) {
      const pointSystem = new Vector3(system.x, system.y, -system.z);
      const pointConnector = new Vector3(
        pointSystem.x,
        CurrentCamera.LookAtVector.y,
        pointSystem.z,
      );
      const length = Math.abs(pointSystem.y - pointConnector.y);
      if (length >= gcMaxLength) continue;
      const distance = CurrentCamera.LookAtVector.distanceTo(pointConnector);
      if (distance >= gcMaxDistance) continue;
      const opacity =
        1 - // Flip curve to turn fading range into opacity
        cubicIn(
          // Easing function for our range between 0 and 1
          Math.min(
            // Create a 0-1 range that is the max of three fading thresholds
            1,
            Math.max(
              CurrentCamera.Distance / gcMaxCamDistance, // Camera zoom distance
              length / gcMaxLength, // Connector length
              distance / 50, // Connector to lookAt distance
            ),
          ),
        );
      gcSystems.push({ pointSystem, pointConnector, opacity });
    }
    return gcSystems;
  }

  const opacities = new Float32Array(systems.length);
  const opacityBuffer = new InstancedBufferAttribute(opacities, 1);
  opacityBuffer.setUsage(DynamicDrawUsage);

  const gcLine = new PlaneGeometry(0.1, 1);
  gcLine.translate(0, 0.5, 0);
  gcLine.setAttribute("opacity", opacityBuffer);
  const gcCircle = new CircleGeometry(0.33);
  gcCircle.setAttribute("opacity", opacityBuffer);
  const gcLineMesh = new ThreeInstancedMesh(gcLine, gridConnectorMaterial, systems.length);
  const gcCircleMesh = new ThreeInstancedMesh(gcCircle, gridConnectorMaterial, systems.length);
  const gcLineDummy = new Object3D();
  const gcCircleDummy = new Object3D();

  let lastConnectors = 0;
  function onCameraChange() {
    if (!HUDInfo.ShowGrid || !visible) return;
    const gridConnectors = calculateGridConnectors();
    gridConnectors.forEach((gc, i) => {
      opacities[i] = gc.opacity;
      gcLineDummy.position.set(gc.pointConnector.x, gc.pointConnector.y, gc.pointConnector.z);
      gcLineDummy.rotation.y = Math.atan2(
        CurrentCamera.PositionVector.x - gc.pointSystem.x,
        CurrentCamera.PositionVector.z - gc.pointSystem.z,
      );
      gcLineDummy.scale.y =
        gc.pointSystem.y -
        gc.pointConnector.y -
        Math.sign(gc.pointSystem.y - gc.pointConnector.y) * 0.1;
      gcLineDummy.updateMatrix();
      gcLineMesh.setMatrixAt(i, gcLineDummy.matrix);
      gcCircleDummy.position.set(gc.pointConnector.x, gc.pointConnector.y, gc.pointConnector.z);
      gcCircleDummy.rotation.x = -Math.PI / 2;
      gcCircleDummy.updateMatrix();
      gcCircleMesh.setMatrixAt(i, gcCircleDummy.matrix);
    });
    if (gridConnectors.length > 0 || lastConnectors > 0) {
      opacityBuffer.needsUpdate = true;
      gcLineMesh.count = gridConnectors.length;
      gcLineMesh.instanceMatrix.needsUpdate = true;
      gcLineMesh.computeBoundingSphere();
      gcCircleMesh.count = gridConnectors.length;
      gcCircleMesh.instanceMatrix.needsUpdate = true;
      gcCircleMesh.computeBoundingSphere();
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
<InstancedMesh
  id="visual"
  bind:ref={vMesh}
  limit={systems.length}
  range={systems.length}
  {visible}
  update={false}
>
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
