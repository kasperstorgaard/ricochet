import { getCookies, setCookie } from "@std/http/cookie";

const SKIP_TUTORIAL_KEY = "skip_tutorial";
const TRACKING_ID_KEY = "tracking_id";

// 3 months
const SKIP_TUTORIAL_DURATION = 1000 * 60 * 60 * 24 * 180;
// 1 year
const TRACKING_DURATION = 1000 * 60 * 60 * 24 * 365;

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
