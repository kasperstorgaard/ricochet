import { Puzzle } from "#/db/types.ts";
import { Handlers } from "$fresh/server.ts";
import { formatPuzzle } from "#/util/formatter.ts";
import { getPuzzle } from "#/util/loader.ts";

export const handler: Handlers<Puzzle> = {
  async GET(_req, ctx) {
    const { slug } = ctx.params;

    const puzzle = await getPuzzle(slug);
    if (!puzzle) throw new Error(`Unable to find puzzle with slug: ${slug}`);

    return new Response(formatPuzzle(puzzle));
  },
};
