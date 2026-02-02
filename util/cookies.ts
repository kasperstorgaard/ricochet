import { getCookies, setCookie } from "@std/http/cookie";

const SKIP_TUTORIAL_KEY = "skip_tutorial";

// 3 months
const SKIP_TUTORIAL_DURATION = 1000 * 60 * 60 * 24 * 180;

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
