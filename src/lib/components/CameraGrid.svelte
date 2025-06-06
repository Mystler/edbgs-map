<script lang="ts">
  import { T, useTask } from "@threlte/core";
  import { Grid, Instance, InstancedMesh, OrbitControls, Text, useInteractivity } from "@threlte/extras";
  import { DefaultMapFont } from "../Constants";
  import type { CameraData } from "$lib/types/MapData.svelte";
  import { type SpanshSystem } from "$lib/SpanshAPI";
  import { base } from "$app/paths";
  import { CurrentCamera, FlyToTarget } from "$lib/types/CurrentCamera.svelte";
  import { HUDInfo } from "$lib/types/HUDInfo.svelte";
  import { DoubleSide, Group, type Matrix4, MOUSE, Vector3 } from "three";
  import { OrbitControls as ThreeOrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import ArrowShape from "./Shapes/ArrowShape.svelte";

  const { enabled: interactivityEnabled } = useInteractivity();

  interface Props {
    cameraSetup?: CameraData;
  }
  // See comment on CameraData for intended priority in data usage.
  let { cameraSetup = $bindable({ lookAtSystem: "", distance: 100 }) }: Props = $props();

  function updateBasePosition() {
    cameraSetup.lookAt ??= [0, 0, 0];
    if (cameraSetup.lookAtSystem || !cameraSetup.position) {
      cameraSetup.position = [
        cameraSetup.lookAt[0] + cameraSetup.distance * 0.577,
        cameraSetup.lookAt[1] + cameraSetup.distance * 0.577,
        cameraSetup.lookAt[2] + cameraSetup.distance * 0.577,
      ];
    }
  }
  updateBasePosition();

  $effect(() => {
    // Update if we get new position data from upstream and our derived target or position changed.
    if (cameraSetup.lookAt && cameraSetup.position) controls.update();
  });

  let cameraAngle = $state(0);
  let isPanning = $state(false);

  let arrowGroup = $state() as Group;
  let gridGroup = $state() as Group;
  let gridLabel = $state("");

  /**
   * The grid follows the camera on the y axis. Its origin and label then shift in increments of 10 ly with our camera movements.
   */
  function updateGrid(x: number, y: number, z: number) {
    gridGroup.position.set(Math.round(x / 10) * 10, y, Math.round(z / 10) * 10);
    gridLabel = `${gridGroup.position.x} : ${Math.round(gridGroup.position.y)} : ${-gridGroup.position.z}`;
  }

  async function fetchData(): Promise<SpanshSystem | null> {
    let response = await fetch(`${base}/api/system/${cameraSetup.lookAtSystem}`);
    if (!response.ok) {
      alert(`Error while fetching data from Spansh.co.uk for camera system: ${cameraSetup.lookAtSystem}`);
      return null;
    }
    const res = (await response.json()) as SpanshSystem | null;
    if (!res) alert(`Could not find look at system: ${cameraSetup.lookAtSystem}`);
    return res;
  }

  if (cameraSetup.lookAtSystem) {
    fetchData().then((data) => {
      if (data) {
        cameraSetup.lookAt = [data.x, data.y, -data.z];
        updateBasePosition();
      }
    });
  }

  /**
   * Orbit Conrol Customization
   *
   * Goal: Allow for panning vertically and down when not in screen space panning mode.
   * Left mouse button rotates, Middle or Left+Right pan horizontally, Right pans vertically.
   * This is very close to what Elite Dangerous does.
   *
   * In screen space panning mode, we do not change any default behavior.
   */
  const _STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_PAN: 4,
    TOUCH_DOLLY_PAN: 5,
    TOUCH_DOLLY_ROTATE: 6,
  };
  /**
   * Declare more properties and methods that are actually present on OrbitControls to allow for some customization.
   * This is a bit hacky and needs to be updated if relevant internal parts of OrbitControls change.
   * However, I tried to keep monkey patching to a minimum with very low assessed risks or maintenance effort.
   * See: https://github.com/mrdoob/three.js/blob/master/examples/jsm/controls/OrbitControls.js
   */
  interface PatchedOrbitControls extends ThreeOrbitControls {
    _pan: (deltaX: number, deltaY: number) => void;
    _panUp: (distance: number, objectMatrix: Matrix4) => void;
    _panOffset: Vector3;
    state: (typeof _STATE)[keyof typeof _STATE];
    _handleMouseDownPan: (e: MouseEvent) => void;
    _handleMouseDownRotate: (e: MouseEvent) => void;
  }
  let controls = $state() as PatchedOrbitControls;
  let panPlane = $state("vertical") as "horizontal" | "vertical";

  function onMouseChange(e: MouseEvent) {
    // Buttons Flags - 1: Left, 2: Right, 4: Middle
    if ((e.buttons & 1 && e.buttons & 2) || e.buttons === 4) {
      // Middle mouse button only or left and right mouse buttons together pans horizontally.
      panPlane = "horizontal";
      // Explicitly set pan state again to allow adding RMB when LMB is already pressed for rotation
      controls.state = _STATE.PAN;
      controls._handleMouseDownPan(e);
      isPanning = true;
    } else {
      // Otherwise pans vertically.
      if (isPanning) panPlane = "vertical";
      if (e.buttons === 1) {
        // Reset back to rotation state if only left mouse button is pressed.
        controls.state = _STATE.ROTATE;
        controls._handleMouseDownRotate(e);
        isPanning = false;
      }
    }
  }

  // Keyboard Movement
  let keyMovement = $state({ W: false, A: false, S: false, D: false, R: false, F: false });
  function onKeyDown(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement) return;
    if (e.key === "r") {
      keyMovement.R = true;
    } else if (e.key === "f") {
      keyMovement.F = true;
    } else if (e.key === "w") {
      keyMovement.W = true;
    } else if (e.key === "a") {
      keyMovement.A = true;
    } else if (e.key === "s") {
      keyMovement.S = true;
    } else if (e.key === "d") {
      keyMovement.D = true;
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (e.key === "r") {
      keyMovement.R = false;
    } else if (e.key === "f") {
      keyMovement.F = false;
    } else if (e.key === "w") {
      keyMovement.W = false;
    } else if (e.key === "a") {
      keyMovement.A = false;
    } else if (e.key === "s") {
      keyMovement.S = false;
    } else if (e.key === "d") {
      keyMovement.D = false;
    }
  }

  // Scaled based on pan speed
  const keyMovementSpeedMult = $derived(500 * HUDInfo.PanSpeed);
  // Helper vector: X for AD, Y for RF, Z for WS.
  let keyVector = $derived(
    new Vector3(
      (keyMovement.A ? 1 : 0) + (keyMovement.D ? -1 : 0),
      (keyMovement.R ? 1 : 0) + (keyMovement.F ? -1 : 0),
      (keyMovement.W ? 1 : 0) + (keyMovement.S ? -1 : 0),
    )
      .normalize()
      .multiplyScalar(keyMovementSpeedMult),
  );
  let isKeyPanning = $derived(Object.values(keyVector).some((v) => v !== 0));

  useTask(
    (delta) => {
      // Disable interactivity while panning the camera.
      interactivityEnabled.set(!isPanning && !isKeyPanning);

      let shouldUpdate = false;
      if (isKeyPanning) {
        const prevPlane = panPlane;
        if (keyVector.x !== 0 || keyVector.z !== 0) {
          panPlane = "horizontal";
          controls._pan(keyVector.x * delta, keyVector.z * delta);
        }
        if (keyVector.y !== 0) {
          panPlane = "vertical";
          controls._pan(0, keyVector.y * delta);
        }
        // If we are simultanously mouse panning, that gets priority for the visual display.
        if (controls.state === _STATE.PAN) panPlane = prevPlane;
        shouldUpdate = true;
      }
      if (FlyToTarget.current !== FlyToTarget.target) {
        controls.target.set(FlyToTarget.current.targetX, FlyToTarget.current.targetY, FlyToTarget.current.targetZ);
        controls.object.position.set(FlyToTarget.current.posX, FlyToTarget.current.posY, FlyToTarget.current.posZ);
        shouldUpdate = true;
      }
      if (shouldUpdate) controls.update();
    },
    { autoInvalidate: false },
  );
</script>

<svelte:window onmouseup={onMouseChange} onmousedown={onMouseChange} onkeydown={onKeyDown} onkeyup={onKeyUp} />

<T.PerspectiveCamera
  makeDefault
  position={cameraSetup.position}
  fov={60}
  near={1}
  far={2000}
  oncreate={(ref) => {
    if (cameraSetup.lookAt) ref.lookAt(cameraSetup.lookAt[0], cameraSetup.lookAt[1], cameraSetup.lookAt[2]);
  }}
>
  <OrbitControls
    maxDistance={1000}
    target={cameraSetup.lookAt}
    panSpeed={HUDInfo.PanSpeed}
    onchange={(e) => {
      updateGrid(e.target.target.x, e.target.target.y, e.target.target.z);
      CurrentCamera.LookAt = e.target.target.toArray();
      CurrentCamera.Position = e.target.object.position.toArray();
      cameraAngle = e.target.getAzimuthalAngle();
      arrowGroup.position.set(...e.target.target.toArray());
    }}
    bind:ref={controls}
    mouseButtons={{ LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }}
    screenSpacePanning={HUDInfo.PanMode === "screen" ? true : false}
    oncreate={(ref) => {
      cameraAngle = ref.getAzimuthalAngle();
      // HACK: Monkey patching OrbitControls to allow for panning up when not in screen space.
      const controls = ref as PatchedOrbitControls;
      const v = new Vector3();
      controls._panUp = (distance: number, objectMatrix: Matrix4) => {
        if (controls.screenSpacePanning === true && panPlane === "horizontal") {
          v.setFromMatrixColumn(objectMatrix, 2).multiplyScalar(-1);
        } else if (controls.screenSpacePanning === true) {
          v.setFromMatrixColumn(objectMatrix, 1);
        } else if (panPlane === "horizontal") {
          v.setFromMatrixColumn(objectMatrix, 0);
          v.crossVectors(controls.object.up, v);
        } else if (panPlane === "vertical") {
          v.set(controls.object.up.x, controls.object.up.y, controls.object.up.z);
        }
        v.multiplyScalar(distance);
        controls._panOffset.add(v);
      };
      CurrentCamera.Controls = ref;
    }}
    onstart={() => {
      if (controls.state === _STATE.PAN) isPanning = true;
    }}
    onend={() => {
      isPanning = false;
    }}
  />
</T.PerspectiveCamera>

<T.Group bind:ref={gridGroup} visible={HUDInfo.ShowGrid}>
  <Grid
    sectionThickness={1}
    infiniteGrid
    cellColor="#777777"
    cellSize={1}
    sectionColor="#aaaaaa"
    sectionSize={10}
    fadeDistance={200}
    fadeStrength={3}
    fadeOrigin={new Vector3(
      CurrentCamera.LookAt[0],
      CurrentCamera.LookAt[1] + CurrentCamera.Distance / 2,
      CurrentCamera.LookAt[2],
    )}
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

<T.Group bind:ref={arrowGroup} visible={HUDInfo.ShowGrid} scale={CurrentCamera.Distance / 40}>
  <T.Mesh rotation={[-Math.PI / 2, 0, 0]}>
    <T.RingGeometry args={[1, 1.2, 32]} />
    <T.MeshBasicMaterial color="#00aaaa" side={DoubleSide} />
  </T.Mesh>

  <InstancedMesh>
    <ArrowShape />
    <T.MeshBasicMaterial color="#00aaaa" side={DoubleSide} />

    {#if HUDInfo.PanMode === "grid" && (isPanning || isKeyPanning) && panPlane === "vertical"}
      <T.Group rotation={[0, cameraAngle, 0]}>
        <Instance position={[0, 0.5, 0]} />
        <Instance position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]} />
      </T.Group>
    {/if}
    {#if HUDInfo.PanMode === "grid" && (isPanning || isKeyPanning) && panPlane === "horizontal"}
      <T.Group>
        <Instance position={[0, 0, 1.5]} rotation={[-Math.PI / 2, 0, Math.PI]} />
        <Instance position={[0, 0, -1.5]} rotation={[-Math.PI / 2, 0, 0]} />
        <Instance position={[1.5, 0, 0]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]} />
        <Instance position={[-1.5, 0, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} />
      </T.Group>
    {/if}
  </InstancedMesh>
</T.Group>
