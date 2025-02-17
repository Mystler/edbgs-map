<script lang="ts">
  import { T } from "@threlte/core";
  import { Grid, OrbitControls, Text } from "@threlte/extras";
  import { DefaultMapFont } from "../Constants";
  import type { CameraData } from "$lib/types/MapData.svelte";
  import { type SpanshSystem } from "$lib/SpanshAPI";
  import { base } from "$app/paths";
  import { CurrentCamera } from "$lib/types/CurrentCamera.svelte";

  interface Props {
    showGrid?: boolean;
    cameraSetup?: CameraData;
  }
  let { showGrid = true, cameraSetup = { lookAtSystem: "", distance: 100 } }: Props = $props();

  // Note comment on CameraData for intended priority in data usage.
  let target: [x: number, y: number, z: number] = $state(cameraSetup.lookAt ?? [0, 0, 0]);
  let position: [x: number, y: number, z: number] = $derived.by(() => {
    if (!cameraSetup.lookAtSystem && cameraSetup.position) return cameraSetup.position;
    return [
      target[0] + cameraSetup.distance * 0.577,
      target[1] + cameraSetup.distance * 0.577,
      target[2] + cameraSetup.distance * 0.577,
    ];
  });

  let gridRef: [x: number, y: number, z: number] = $state([0, 0, 0]);
  let gridLabel = $derived(`${gridRef[0]} : ${Math.round(gridRef[1])} : ${-gridRef[2]}`);

  /**
   * The grid follows the camera on the y axis. Its origin and label then shift in increments of 10 ly with our camera movements.
   */
  function updateGrid(x: number, y: number, z: number) {
    gridRef = [Math.round(x / 10) * 10, y, Math.round(z / 10) * 10];
  }
  $effect(() => {
    updateGrid(target[0], target[1], target[2]);
    CurrentCamera.LookAt = target;
  });

  async function fetchData(): Promise<SpanshSystem | null> {
    let response = await fetch(`${base}/api/system/${cameraSetup.lookAtSystem}`);
    if (!response.ok) {
      alert(`Could not find look at system: ${cameraSetup.lookAtSystem}`);
      return null;
    }
    return response.json();
  }

  if (cameraSetup.lookAtSystem) {
    fetchData().then((data) => {
      if (data) target = [data.x, data.y, -data.z];
    });
  }
</script>

<T.PerspectiveCamera
  makeDefault
  {position}
  fov={60}
  oncreate={(ref) => {
    ref.lookAt(target[0], target[1], target[2]);
    CurrentCamera.Position = ref.position.toArray();
  }}
>
  <OrbitControls
    {target}
    onchange={(e) => {
      updateGrid(e.target.target.x, e.target.target.y, e.target.target.z);
      CurrentCamera.LookAt = e.target.target.toArray();
      CurrentCamera.Position = e.target.object.position.toArray();
    }}
  />
</T.PerspectiveCamera>

<T.Group position={gridRef} visible={showGrid}>
  <Grid
    sectionThickness={1}
    infiniteGrid
    cellColor="#777777"
    cellSize={1}
    sectionColor="#aaaaaa"
    sectionSize={10}
    fadeDistance={200}
  />
  <Text
    position={[-0.25, 0, 0]}
    rotation={[-Math.PI / 2, 0, 0]}
    text={gridLabel}
    font={DefaultMapFont}
    fontSize={1}
    anchorX="right"
    anchorY="top"
    color="#00aaaa"
  />
</T.Group>
