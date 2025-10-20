import { Shape, Vector2 } from "three";

const right = 1.2;
const top = 0.9;

const TriangleShape = new Shape([
  new Vector2(-right, top),
  new Vector2(right, top),
  new Vector2(0, -top),
  new Vector2(-right, top),
]);

export default TriangleShape;
