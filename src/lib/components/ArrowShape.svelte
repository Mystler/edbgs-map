<script module lang="ts">
  import { T } from "@threlte/core";
  import { Shape, Vector2 } from "three";

  const shaftRight = 0.3;
  const tipRight = 0.6;
  const shaftTop = 0.5;
  const tipTop = 1;

  const arrowShape = new Shape([
    new Vector2(-shaftRight, 0),
    new Vector2(-shaftRight, shaftTop),
    new Vector2(-tipRight, shaftTop),
    new Vector2(0, tipTop),
    new Vector2(tipRight, shaftTop),
    new Vector2(shaftRight, shaftTop),
    new Vector2(shaftRight, 0),
    new Vector2(-shaftRight, 0),
  ]);
</script>

<T.ShapeGeometry args={[arrowShape, 1]} />
