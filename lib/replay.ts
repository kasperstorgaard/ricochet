export function getReplaySpeed(type: string | null) {
  return type === "slow" ? 1.5 : 1;
}
