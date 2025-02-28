<script module lang="ts">
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

  interface Props {
    systems: SpanshSystem[];
    color: string;
    visible?: boolean;
  }
  let { systems, color, visible = true }: Props = $props();

  interface GridConnector {
    pointSystem: Vector3;
    pointConnector: Vector3;
    opacity: number;
  }
  let gridConnectors: GridConnector[] = $derived.by(() => {
    if (!HUDInfo.ShowGrid || !visible || CurrentCamera.Distance >= 50) return [];
    return systems
      .map((system) => {
        const pointSystem = new Vector3(system.x, system.y, -system.z);
        const pointConnector = new Vector3(
          pointSystem.x,
          CurrentCamera.LookAtVector.y,
          pointSystem.z,
        );
        const opacity =
          1 - // Flip curve to turn fading range into opacity
          cubicIn(
            // Easing function for our range between 0 and 1
            Math.min(
              // Create a 0-1 range that is the max of three fading thresholds
              1,
              Math.max(
                CurrentCamera.Distance / 50, // Camera zoom distance
                pointConnector.distanceTo(pointSystem) / 15, // Connector length
                CurrentCamera.LookAtVector.distanceTo(pointConnector) / 50, // Connector to lookAt distance
              ),
            ),
          );
        return { pointSystem, pointConnector, opacity };
      })
      .filter((x) => x.opacity > 0);
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
  <T.CircleGeometry args={[0.5]} />
  <T.MeshBasicMaterial {color} />

  {#each systems as system (system.id64)}
    <SystemInstance {system} />
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
