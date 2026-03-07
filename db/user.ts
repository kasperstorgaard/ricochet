import type { Onboarding, Puzzle } from "#/game/types.ts";
import { kv } from "#/db/kv.ts";

export async function getUserCompleted(userId: string): Promise<string[]> {
  const res = await kv.get<string[]>(["user", userId, "completed"]);
  return res.value ?? [];
}

export async function setUserCompleted(
  userId: string,
  slugs: string[],
): Promise<void> {
  await kv.set(["user", userId, "completed"], slugs);
}

export async function getUserTheme(userId: string): Promise<string | null> {
  const res = await kv.get<string>(["user", userId, "theme"]);
  return res.value ?? null;
}

export async function setUserTheme(
  userId: string,
  theme: string | null,
): Promise<void> {
  if (theme === null) {
    await kv.delete(["user", userId, "theme"]);
  } else {
    await kv.set(["user", userId, "theme"], theme);
  }
}

export async function getUserOnboarding(userId: string): Promise<Onboarding> {
  const res = await kv.get<Onboarding>(["user", userId, "onboarding"]);
  return res.value ?? "new";
}

export async function setUserOnboarding(
  userId: string,
  value: Onboarding,
): Promise<void> {
  await kv.set(["user", userId, "onboarding"], value);
}

export async function getUserStoredPuzzle(
  userId: string,
): Promise<Puzzle | null> {
  const res = await kv.get<Puzzle>(["user", userId, "stored_puzzle"]);
  return res.value ?? null;
}

export async function setUserStoredPuzzle(
  userId: string,
  puzzle: Puzzle,
): Promise<void> {
  await kv.set(["user", userId, "stored_puzzle"], puzzle);
}
