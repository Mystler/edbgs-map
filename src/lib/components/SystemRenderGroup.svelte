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
  import { Instance, InstancedMesh } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import SystemInstance from "./SystemInstance.svelte";
  import {
    DoubleSide,
    DynamicDrawUsage,
    InstancedBufferAttribute,
    RawShaderMaterial,
    Vector3,
  } from "three";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { cubicIn } from "svelte/easing";
  import TriangleShape from "./Shapes/TriangleShape.svelte";
  import StarShape from "./Shapes/StarShape.svelte";

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
  let gridConnectors: GridConnector[] = $derived.by(() => {
    if (!HUDInfo.ShowGrid || !visible || CurrentCamera.Distance >= gcMaxCamDistance) return [];
    const gcSystems: GridConnector[] = [];
    for (const system of systems) {
      const pointSystem = new Vector3(system.x, system.y, -system.z);
      const pointConnector = new Vector3(
        pointSystem.x,
        CurrentCamera.LookAtVector.y,
        pointSystem.z,
      );
      const length = pointConnector.distanceTo(pointSystem);
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
  });

  const opacities = new Float32Array(systems.length);
  const opacityBuffer = new InstancedBufferAttribute(opacities, 1);
  opacityBuffer.setUsage(DynamicDrawUsage);

  $effect(() => {
    gridConnectors.forEach((x, i) => {
      opacities[i] = x.opacity;
    });
    opacityBuffer.needsUpdate = true;
  });
</script>

<!-- Render systems themselves -->
<InstancedMesh limit={systems.length} range={systems.length} {visible}>
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
    <SystemInstance {system} {zOffset} />
  {/each}
</InstancedMesh>

<!-- Render grid connectors -->
<InstancedMesh id="line" limit={systems.length} range={systems.length} frustumCulled={false}>
  <T.PlaneGeometry
    args={[0.1, 1]}
    oncreate={(ref) => {
      ref.translate(0, 0.5, 0);
      ref.setAttribute("opacity", opacityBuffer);
    }}
  />
  <T is={gridConnectorMaterial} />

  <InstancedMesh id="circle" limit={systems.length} range={systems.length} frustumCulled={false}>
    <T.CircleGeometry
      args={[0.33]}
      oncreate={(ref) => {
        ref.setAttribute("opacity", opacityBuffer);
      }}
    />
    <T is={gridConnectorMaterial} />

    {#each gridConnectors as { pointSystem, pointConnector }, i (i)}
      <Instance
        id="line"
        position={pointConnector.toArray()}
        rotation.y={Math.atan2(
          CurrentCamera.PositionVector.x - pointSystem.x,
          CurrentCamera.PositionVector.z - pointSystem.z,
        )}
        scale.y={pointSystem.y -
          pointConnector.y -
          Math.sign(pointSystem.y - pointConnector.y) * 0.1}
      />
      <Instance id="circle" position={pointConnector.toArray()} rotation={[-Math.PI / 2, 0, 0]} />
    {/each}
  </InstancedMesh>
</InstancedMesh>
