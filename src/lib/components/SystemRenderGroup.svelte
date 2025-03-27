<script module lang="ts">
  const gridConnectorMaterial = new ShaderMaterial({
    vertexShader: `
      const float gcMaxCamDistance = 50.0;
      const float gcMaxLength = 15.0;
      const float gcMaxDistance = 50.0;
      uniform vec3 target;
      uniform vec3 camPosition;
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
        float sysDist = distance(sysPos, target);
        float fade = min(1.0, max(max(camDistance / gcMaxCamDistance, abs(length) / gcMaxLength), sysDist / gcMaxDistance));
        float opacity = 1.0 - fade * fade * fade;
        // Rotate around Y axis towards camera
        mat4 rotY = mat4(1.0);
        float angle = atan(camPosition.x - sysPos.x, camPosition.z - sysPos.z);
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
      target: {
        value: CurrentCamera.LookAtVector,
      },
      camPosition: {
        value: CurrentCamera.PositionVector,
      },
      camDistance: {
        value: CurrentCamera.Distance,
      },
    },
    transparent: true,
    depthWrite: false,
  });
  gridConnectorMaterial.side = DoubleSide;

  function onCameraChange() {
    const target = gridConnectorMaterial.uniforms.target as Uniform<Vector3>;
    target.value.set(...CurrentCamera.LookAt);
    const camPosition = gridConnectorMaterial.uniforms.camPosition as Uniform<Vector3>;
    camPosition.value.set(...CurrentCamera.Position);
    const camDistance = gridConnectorMaterial.uniforms.camDistance as Uniform<number>;
    camDistance.value = CurrentCamera.Distance;
  }
  $effect.root(() => {
    $effect(() => {
      CurrentCamera.Controls?.addEventListener("change", onCameraChange);
      untrack(() => {
        onCameraChange();
      });
      return () => {
        CurrentCamera.Controls?.removeEventListener("change", onCameraChange);
      };
    });
  });
</script>

<script lang="ts">
  import { T } from "@threlte/core";
  import { Instance, InstancedMesh } from "@threlte/extras";
  import { type SpanshSystem } from "../SpanshAPI";
  import SystemInstance from "./SystemInstance.svelte";
  import {
    DoubleSide,
    Vector3,
    InstancedMesh as ThreeInstancedMesh,
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
<InstancedMesh id="line" visible={HUDInfo.ShowGrid && visible} update={false} frustumCulled={false}>
  <T.PlaneGeometry
    args={[0.1, 1]}
    oncreate={(ref) => {
      ref.translate(0, 0.5, 0);
    }}
  />
  <T is={gridConnectorMaterial} />
  <InstancedMesh
    id="circle"
    visible={HUDInfo.ShowGrid && visible}
    update={false}
    frustumCulled={false}
  >
    <T.CircleGeometry
      args={[0.33]}
      oncreate={(ref) => {
        ref.rotateX(-Math.PI / 2);
        ref.translate(0, 1, 0);
      }}
    />
    <T is={gridConnectorMaterial} />
    {#each systems as system (system.name)}
      <T.Group position={[system.x, system.y, -system.z]}>
        <Instance id="line" />
        <Instance id="circle" />
      </T.Group>
    {/each}
  </InstancedMesh>
</InstancedMesh>
