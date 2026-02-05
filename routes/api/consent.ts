import { define } from "#/core.ts";
import { generateTrackingId, setTrackingCookie } from "#/util/cookies.ts";

export const handler = define.handlers({
  async POST(ctx) {
    const formData = await ctx.req.formData();
    const action = formData.get("action");
    const referer = ctx.req.headers.get("referer") || "/";

    const headers = new Headers();
    headers.set("Location", referer);

    if (action === "accept") {
      const trackingId = generateTrackingId();
      setTrackingCookie(headers, trackingId);
    } else {
      setTrackingCookie(headers, "declined");
    }

    return new Response("", {
      status: 302,
      headers,
    });
  },
});
