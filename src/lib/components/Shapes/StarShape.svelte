<script module lang="ts">
  import { T } from "@threlte/core";
  import { Shape, Vector2 } from "three";

  const tip = 2;
  const center = 0.5;

  const arrowShape = new Shape([
    new Vector2(0, tip),
    new Vector2(center, center),
    new Vector2(tip, 0),
    new Vector2(center, -center),
    new Vector2(0, -tip),
    new Vector2(-center, -center),
    new Vector2(-tip, 0),
    new Vector2(-center, center),
    new Vector2(0, tip),
  ]);
</script>

<T.ShapeGeometry args={[arrowShape, 1]} />
