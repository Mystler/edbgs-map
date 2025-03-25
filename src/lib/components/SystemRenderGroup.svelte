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
</script>

<!-- Render systems themselves -->
<InstancedMesh limit={systems.length} range={systems.length} {visible} update={visible}>
  {#if starType === "circle"}
    <T.CircleGeometry args={[0.5]} />
  {:else if starType === "triangle"}
    <TriangleShape />
  {:else if starType === "star"}
    <StarShape />
  {/if}
  <T.MeshBasicMaterial
    {color}
    polygonOffset={zOffset ? true : false}
    polygonOffsetFactor={-zOffset * 4}
    polygonOffsetUnits={-zOffset * 4}
  />

  {#each systems as system (system.name)}
    <SystemInstance {system} {zOffset} {visible} />
  {/each}
</InstancedMesh>

<!-- Render grid connectors -->
<T is={gcLineMesh} visible={HUDInfo.ShowGrid && visible} />
<T is={gcCircleMesh} visible={HUDInfo.ShowGrid && visible} />
