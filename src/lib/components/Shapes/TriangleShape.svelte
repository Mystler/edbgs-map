<script module lang="ts">
  import { T } from "@threlte/core";
  import { Shape, Vector2 } from "three";

  const right = 1.2;
  const top = 0.9;

  const arrowShape = new Shape([
    new Vector2(-right, top),
    new Vector2(right, top),
    new Vector2(0, -top),
    new Vector2(-right, top),
  ]);
</script>

<T.ShapeGeometry args={[arrowShape, 1]} />
