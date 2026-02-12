import { define } from "#/core.ts";
import { generate, type GenerateOptions } from "#/util/generator.ts";

// POST endpoint for puzzle generation.
export const handler = define.handlers({
  async POST(ctx) {
    let body: GenerateOptions;

    try {
      body = await ctx.req.json();
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const { solveRange, wallsRange, bouncersRange, wallSpread } = body;

    if (
      !solveRange || !wallsRange || !bouncersRange || !wallSpread ||
      solveRange[0] > solveRange[1] ||
      wallsRange[0] > wallsRange[1] ||
      bouncersRange[0] > bouncersRange[1] ||
      solveRange[0] < 1 || wallsRange[0] < 0 || bouncersRange[0] < 0
    ) {
      return new Response("Invalid options", { status: 400 });
    }

    try {
      const result = generate(body);

      return Response.json(result);
    } catch {
      return new Response("Generation failed", { status: 500 });
    }
  },
});
