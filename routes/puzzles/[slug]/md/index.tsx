import { Puzzle } from "#/db/types.ts";
import { formatPuzzle } from "#/util/formatter.ts";
import { getPuzzle } from "#/util/loader.ts";
import { define } from "../../../core.ts";

export const handler = define.handlers<Puzzle>({
  async GET(ctx) {
    const { slug } = ctx.params;

    const puzzle = await getPuzzle(slug);
    if (!puzzle) throw new Error(`Unable to find puzzle with slug: ${slug}`);

    return new Response(formatPuzzle(puzzle));
  },
});
