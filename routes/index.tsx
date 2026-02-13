import { Header } from "#/components/header.tsx";
import { define } from "#/core.ts";
import { getSkipTutorialCookie } from "#/util/cookies.ts";
import { page } from "fresh";
import { Main } from "../components/main.tsx";

export const handler = define.handlers({
  GET(ctx) {
    const req = ctx.req;
    const skipTutorial = getSkipTutorialCookie(req.headers);

    if (!skipTutorial) {
      const redirectUrl = new URL(req.url);
      redirectUrl.pathname = "/puzzles/tutorial";

      return Response.redirect(redirectUrl);
    }

    return page();
  },
});

export default define.page(function Home(ctx) {
  const url = new URL(ctx.req.url);

  const navItems = [
    { name: "home", href: "/" },
  ];

  return (
    <Main>
      <Header url={url} items={navItems} />
    </Main>
  );
});
