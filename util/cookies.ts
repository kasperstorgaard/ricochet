import { getCookies, setCookie } from "@std/http/cookie";

// 3 months
const SKIP_TUTORIAL_KEY = "skip_tutorial";
const SKIP_TUTORIAL_DURATION = 1000 * 60 * 60 * 24 * 180;

export function setSkipTutorialCookie(headers: Headers, skip: boolean) {
  const isDenoDeploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

  setCookie(headers, {
    name: SKIP_TUTORIAL_KEY,
    value: skip ? "true" : "false",
    httpOnly: false,
    path: "/",
    secure: isDenoDeploy,
    maxAge: SKIP_TUTORIAL_DURATION,
  });

  return headers;
}

export function getSkipTutorialCookie(headers: Headers) {
  const cookies = getCookies(headers);

  return cookies[SKIP_TUTORIAL_KEY] === "true";
}
