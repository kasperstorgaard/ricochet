import { kv } from "#/db/kv.ts";
import type { Onboarding, Puzzle } from "#/game/types.ts";

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

export async function getUserPuzzleDraft(
  userId: string,
): Promise<Puzzle | null> {
  const res = await kv.get<Puzzle>(["user", userId, "puzzle_draft"]);
  return res.value ?? null;
}

export async function setUserPuzzleDraft(
  userId: string,
  puzzle: Puzzle,
): Promise<void> {
  await kv.set(["user", userId, "puzzle_draft"], puzzle);
}

export async function getUserName(userId: string): Promise<string | null> {
  const res = await kv.get<string>(["user", userId, "name"]);
  return res.value ?? null;
}

export async function setUserName(
  userId: string,
  name: string,
): Promise<void> {
  await kv.set(["user", userId, "name"], name);
}
