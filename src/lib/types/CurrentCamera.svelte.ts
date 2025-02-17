export const CurrentCamera = new (class {
  Position?: [x: number, y: number, z: number] = $state();
  LookAt?: [x: number, y: number, z: number] = $state();

  toJSON(): Partial<typeof CurrentCamera> {
    return { Position: this.Position, LookAt: this.LookAt };
  }
})();
