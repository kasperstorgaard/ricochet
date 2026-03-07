import { getCookies, setCookie } from "@std/http/cookie";

import { define } from "#/core.ts";
import {
  setUserCompleted,
  setUserOnboarding,
  setUserPuzzleDraft,
  setUserTheme,
} from "#/db/user.ts";
import {
  getCompletedSlugs,
  getOnboardingCookie,
  getPuzzleDraftCookie,
  getThemeCookie,
} from "#/game/cookies.ts";
import { isDev } from "#/lib/env.ts";

const USER_ID_KEY = "user_id";
// 5 years in seconds
const USER_ID_DURATION = 60 * 60 * 24 * 365 * 5;

/**
 * Middleware that reads or creates the user_id cookie.
 * On first visit, migrates legacy cookie data to KV.
 * Sets ctx.state.userId.
 */
export const user = define.middleware(async (ctx) => {
  const cookies = getCookies(ctx.req.headers);

  let userId = cookies[USER_ID_KEY];
  const isNew = !userId;

  if (!userId) {
    userId = crypto.randomUUID();
  }

  ctx.state.userId = userId;

  const response = await ctx.next();

  if (isNew) {
    // One-time migration: read legacy cookies and write to KV
    await migrateLegacyCookies(ctx.req.headers, userId);

    // Set the user_id cookie on the response
    setCookie(response.headers, {
      name: USER_ID_KEY,
      value: userId,
      httpOnly: true,
      path: "/",
      secure: !isDev,
      maxAge: USER_ID_DURATION,
    });
  }

  return response;
});

/**
 * Migrates the legacy "everything in cookies" approach to user scoped kv values.
 */
async function migrateLegacyCookies(
  headers: Headers,
  userId: string,
): Promise<void> {
  const migrations: Promise<void>[] = [];

  const completedSlugs = getCompletedSlugs(headers);
  if (completedSlugs.length > 0) {
    migrations.push(setUserCompleted(userId, completedSlugs));
  }

  const theme = getThemeCookie(headers);
  if (theme) {
    migrations.push(setUserTheme(userId, theme));
  }

  const onboarding = getOnboardingCookie(headers);
  if (onboarding !== "new") {
    migrations.push(setUserOnboarding(userId, onboarding));
  }

  const draft = getPuzzleDraftCookie(headers);
  if (draft) {
    migrations.push(setUserPuzzleDraft(userId, draft));
  }

  await Promise.all(migrations);
}
