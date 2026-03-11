import { define } from "#/core.ts";
import { kv } from "#/db/kv.ts";
import { User } from "#/db/types.ts";
import type { Onboarding } from "#/game/types.ts";

/**
 * GET /api/migrate-user?secret=<MIGRATE_SECRET>
 *
 * Migrates per-field user KV keys to a single User object:
 *   ["user", userId, "theme"]      → user.theme
 *   ["user", userId, "onboarding"] → user.onboarding
 *   ["user", userId, "email"]      → user.email
 *   ["user", userId, "name"]       → user.name
 *
 * Idempotent: skips users whose ["user", userId] key already exists.
 * Deletes old keys after writing the new user record.
 *
 * DELETE this route after confirming migration output.
 */
export const handler = define.handlers({
  GET(ctx) {
    const secret = ctx.url.searchParams.get("secret");
    const migrateSecret = Deno.env.get("MIGRATE_SECRET");

    if (!migrateSecret || secret !== migrateSecret) {
      return new Response("Unauthorized", { status: 401 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const log = (msg: string) =>
          controller.enqueue(encoder.encode(msg + "\n"));

        log("Starting migration: consolidate user KV keys into User");

        // Collect all userIds that have old-format field keys
        const userIds = new Set<string>();
        for await (const { key } of kv.list({ prefix: ["user"] })) {
          userIds.add(key[1] as string);
        }

        log(`Found ${userIds.size} users`);

        let skipped = 0;
        let migrated = 0;

        for (const userId of userIds) {
          const existing = await kv.get<User>(["user", userId]);

          if (existing.value?.id != null) {
            skipped++;
            log(`${userId}: already migrated, skipping`);
            continue;
          }

          const theme = (await kv.get<string>(["user", userId, "theme"])).value;
          const onboarding =
            (await kv.get<Onboarding>(["user", userId, "onboarding"])).value;
          const email = (await kv.get<string>(["user", userId, "email"])).value;
          const name = (await kv.get<string>(["user", userId, "name"])).value;

          const user: Partial<User> = { id: userId };
          if (theme) user.theme = theme;
          if (onboarding) user.onboarding = onboarding ?? "new";
          if (email) user.email = email;
          if (name) user.name = name;

          await kv.atomic()
            .set(["user", userId], user)
            .delete(["user", userId, "theme"])
            .delete(["user", userId, "onboarding"])
            .delete(["user", userId, "email"])
            .delete(["user", userId, "name"])
            .commit();

          migrated++;
          log(`${userId}: migrated (${Object.keys(user).join(", ")})`);
        }

        log(`\nDone.`);
        log(`  Migrated: ${migrated}`);
        log(`  Skipped (already migrated): ${skipped}`);

        controller.close();
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  },
});
