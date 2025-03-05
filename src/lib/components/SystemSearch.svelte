<script lang="ts">
  import { CurrentCamera, FlyToTarget } from "$lib/types/CurrentCamera.svelte";
  import { LoadedSystems } from "$lib/types/LoadedData.svelte";
  import { Vector3 } from "three";
</script>

<input
  type="text"
  class="opacity-10 transition-opacity duration-400 focus:opacity-100 [@media(pointer:fine)]:hover:opacity-100"
  placeholder="Go to loaded system..."
  list="knownSystems"
  onchange={(e) => {
    if (e.currentTarget.value) {
      const system = LoadedSystems.get(e.currentTarget.value.trim());
      if (system) {
        if (
          CurrentCamera.LookAtVector.distanceTo(new Vector3(system.x, system.y, -system.z)) > 0.1
        ) {
          // Hard set tween to current position first
          FlyToTarget.set(
            {
              targetX: CurrentCamera.LookAt[0],
              targetY: CurrentCamera.LookAt[1],
              targetZ: CurrentCamera.LookAt[2],
              posX: CurrentCamera.Position[0],
              posY: CurrentCamera.Position[1],
              posZ: CurrentCamera.Position[2],
            },
            { duration: 0 },
          );
          // Set actual fly targets for both lookAt and position, maintaining camera distance
          FlyToTarget.set({
            targetX: system.x,
            targetY: system.y,
            targetZ: -system.z,
            posX: system.x + CurrentCamera.Position[0] - CurrentCamera.LookAt[0],
            posY: system.y + CurrentCamera.Position[1] - CurrentCamera.LookAt[1],
            posZ: -system.z + CurrentCamera.Position[2] - CurrentCamera.LookAt[2],
          });
        }
        e.currentTarget.value = "";
        e.currentTarget.blur();
      }
    }
  }}
/>
<datalist id="knownSystems">
  {#each LoadedSystems.keys().toArray().sort() as name (name)}
    <option>{name}</option>
  {/each}
</datalist>
