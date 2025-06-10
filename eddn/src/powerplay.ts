export function getLastPPTickDate() {
  const lastTick = new Date();
  const day = lastTick.getUTCDay();
  if (day === 4 && lastTick.getUTCHours() < 7) {
    lastTick.setDate(lastTick.getDate() - 7);
  } else if (day > 4) {
    lastTick.setDate(lastTick.getDate() - (day - 4));
  } else if (day < 4) {
    lastTick.setDate(lastTick.getDate() - (day + 3));
  }
  lastTick.setUTCHours(7, 0, 0, 0);
  return lastTick;
}
