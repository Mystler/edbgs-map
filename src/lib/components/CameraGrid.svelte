<script lang="ts">
  import { T } from "@threlte/core";
  import { Grid, OrbitControls, Text } from "@threlte/extras";
  import { DefaultMapFont } from "../Constants";

  interface Props {
    showGrid?: boolean;
    position?: [number, number, number];
  }
  let { showGrid = $bindable(true), position = [5, 5, 5] }: Props = $props();

  let gridRef: [x: number, y: number, z: number] = $state([0, 0, 0]);
  let gridLabel = $derived(`${gridRef[0]} : ${Math.round(gridRef[1])} : ${-gridRef[2]}`);
</script>

<T.PerspectiveCamera makeDefault {position}>
  <OrbitControls
    onchange={(e) => {
      gridRef = [
        Math.round(e.target.target.x / 10) * 10,
        e.target.target.y,
        Math.round(e.target.target.z / 10) * 10,
      ];
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
