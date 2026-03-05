import { getCookies, setCookie } from "@std/http/cookie";

import { formatPuzzle } from "./formatter.ts";
import { parsePuzzle } from "./parser.ts";
import type { Puzzle } from "./types.ts";

const SKIP_TUTORIAL_KEY = "skip_tutorial";
const TRACKING_ID_KEY = "tracking_id";

// ~6 months
const STORED_PUZZLE_KEY = "stored_puzzle";
const STORED_PUZZLE_DURATION = 1000 * 60 * 60 * 24 * 180;

// ~6 months
const SKIP_TUTORIAL_DURATION = 1000 * 60 * 60 * 24 * 180;
// 1 year
const TRACKING_DURATION = 1000 * 60 * 60 * 24 * 365;

const THEME_VALUES = [
  "skub",
  "one-dark",
  "dracula",
  "acid",
  "github-light",
  "solarized-light",
  "catppuccin",
] as const;
const THEME_KEY = "theme";
// 1 year in seconds
const THEME_DURATION = 60 * 60 * 24 * 365;

const HINT_COUNT_KEY = "hint_count";
// 24 h in seconds
const HINT_COUNT_DURATION = 60 * 60 * 24;

/**
 * Sets the skip tutorial cookie, so the user won't see the tutorial again.
 * @param headers
 * @param skip
 * @returns updated headers
 */
export function setSkipTutorialCookie(headers: Headers, skip: boolean) {
  /**
   * Check if we are running in deno deploy.
   * see: https://docs.deno.com/deploy/reference/env_vars_and_contexts/#predefined-environment-variables
   */
  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") != null;

  setCookie(headers, {
    name: SKIP_TUTORIAL_KEY,
    value: skip ? "true" : "false",
    httpOnly: false,
    path: "/",
    secure: isDenoDeploy, // http for localhost
    maxAge: SKIP_TUTORIAL_DURATION,
  });

  return headers;
}

/**
 * Checks cookies, to see if user has opted to skip the tutorial.
 * @param headers
 * @returns true if skipped, otherwise false
 */
export function getSkipTutorialCookie(headers: Headers) {
  const cookies = getCookies(headers);

  return cookies[SKIP_TUTORIAL_KEY] === "true";
}

/**
 * Generates a tracking ID using Web Crypto API.
 * @returns a UUID string
 */
export function generateTrackingId() {
  return crypto.randomUUID();
}

/**
 * Sets the tracking_id cookie for analytics consent.
 * @param headers
 * @param id - the tracking ID, or "declined" if user declined
 * @returns updated headers
 */
export function setTrackingCookie(headers: Headers, id: string) {
  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") != null;

  setCookie(headers, {
    name: TRACKING_ID_KEY,
    value: id,
    httpOnly: false, // needs to be readable client-side to hide banner
    path: "/",
    secure: isDenoDeploy,
    maxAge: TRACKING_DURATION,
  });

  return headers;
}

/**
 * Gets the tracking_id cookie value.
 * @param headers
 * @returns the tracking ID, "declined", or undefined if not set
 */
export function getTrackingCookie(headers: Headers) {
  const cookies = getCookies(headers);

  return cookies[TRACKING_ID_KEY];
}

/**
 * Serializes a puzzle to markdown and stores it in a cookie for editor persistence.
 * The value is URI-encoded to satisfy RFC2616 cookie character restrictions.
 * @param headers - response headers to attach the Set-Cookie header to
 * @param puzzle - the puzzle to store
 * @returns updated headers
 */
export function setStoredPuzzleCookie(headers: Headers, puzzle: Puzzle) {
  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") != null;

  setCookie(headers, {
    name: STORED_PUZZLE_KEY,
    value: encodeURIComponent(formatPuzzle(puzzle)),
    httpOnly: isDenoDeploy,
    path: "/",
    secure: isDenoDeploy,
    maxAge: STORED_PUZZLE_DURATION,
  });

  return headers;
}

/**
 * Reads and parses the stored puzzle from cookies, if present.
 * @param headers - request headers containing the Cookie header
 * @returns the parsed puzzle, or null if no cookie is set
 */
export function getStoredPuzzle(headers: Headers) {
  const cookies = getCookies(headers);
  const raw = cookies[STORED_PUZZLE_KEY];

  return raw ? parsePuzzle(decodeURIComponent(raw)) : null;
}

/**
 * Gets the explicit theme override, or null if the user is using the OS default.
 */
export function getThemeCookie(headers: Headers): string | null {
  const cookies = getCookies(headers);
  const value = cookies[THEME_KEY] || null;

  return THEME_VALUES.some((accepted) => value === accepted) ? value : null;
}

/**
 * Sets or clears the theme cookie.
 * Pass null to clear (sets maxAge: 0).
 */
export function setThemeCookie(
  headers: Headers,
  theme: string | null,
): Headers {
  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") != null;

  setCookie(headers, {
    name: THEME_KEY,
    value: theme ?? "",
    httpOnly: false,
    path: "/",
    secure: isDenoDeploy,
    maxAge: theme ? THEME_DURATION : 0,
  });

  return headers;
}

// Tracks puzzles solved in the minimum number of moves (optimal solutions only).
const COMPLETED_KEY = "completed_puzzles";
// 1 year in seconds
const COMPLETED_DURATION = 60 * 60 * 24 * 365;

export function getCompletedSlugs(headers: Headers): string[] {
  return getCookies(headers)[COMPLETED_KEY]?.split(",").filter(Boolean) ?? [];
}

export function setCompletedSlugs(headers: Headers, slugs: string[]): void {
  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") != null;
  setCookie(headers, {
    name: COMPLETED_KEY,
    value: slugs.join(","),
    httpOnly: false,
    path: "/",
    secure: isDenoDeploy,
    maxAge: COMPLETED_DURATION,
  });
}

/**
 * Reads the hint count for a puzzle from the request cookies.
 * Resets automatically after 24 hours (enforced by cookie expiry).
 */
export function getHintCount(headers: Headers) {
  const cookies = getCookies(headers);
  const raw = cookies[HINT_COUNT_KEY];
  return raw ? parseInt(raw, 10) : 0;
}

type SetHintCookieOptions = {
  path: string;
  value: number | string;
};

/**
 * Sets the hint count cookie for a specific puzzle.
 * Path-scoped to /puzzles/<slug> and expires after 24 hours.
 */
export function setHintCount(
  headers: Headers,
  { path, value }: SetHintCookieOptions,
) {
  setCookie(headers, {
    name: HINT_COUNT_KEY,
    value: value.toString(),
    path,
    maxAge: HINT_COUNT_DURATION,
    httpOnly: true,
  });
}
