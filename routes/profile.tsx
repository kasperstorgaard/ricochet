import clsx from "clsx/lite";
import { page } from "fresh";

import { Header } from "#/components/header.tsx";
import { Main } from "#/components/main.tsx";
import { Panel } from "#/components/panel.tsx";
import { define } from "#/core.ts";
import { THEMES } from "#/lib/themes.ts";

export const handler = define.handlers({
  GET() {
    return page({});
  },
});

export default define.page<typeof handler>(function ProfilePage(props) {
  const url = new URL(props.req.url);
  const { email, theme } = props.state;

  const darkThemes = THEMES.filter((t) => t.mode === "dark");
  const lightThemes = THEMES.filter((t) => t.mode === "light");

  return (
    <>
      <Main className="max-lg:row-span-full">
        <Header url={url} back={{ href: "/" }} hideProfile />

        <div className="flex flex-col gap-fl-5 mt-fl-2 max-w-prose">
          {/* Identity */}
          {email
            ? (
              <div className="flex flex-col gap-fl-1">
                <h1 className="text-fl-3 leading-flat text-brand">Profile</h1>
                <div className="flex items-center justify-between gap-fl-2">
                  <span className="flex items-center gap-fl-1 text-text-2">
                    <i className="ph ph-user-circle text-fl-2" aria-hidden="true" />
                    {email}
                  </span>
                  <a
                    href="/auth/logout"
                    className="text-text-2 text-fl-0 no-underline hover:text-text-1"
                  >
                    Log out
                  </a>
                </div>
              </div>
            )
            : (
              <div
                className={clsx(
                  "flex flex-col gap-fl-2 p-fl-3 border border-surface-4",
                )}
              >
                <div className="flex flex-col gap-fl-1">
                  <h1 className="text-fl-2 text-text-1 leading-flat">
                    Sync your progress
                  </h1>
                  <p className="text-fl-0 text-text-2">
                    Log in to keep your solved puzzles and best scores across
                    all your devices.
                  </p>
                </div>
                <div>
                  <a href="/auth/login?returnTo=/profile" className="btn">
                    <i className="ph ph-envelope-simple" aria-hidden="true" />
                    Log in with email
                  </a>
                </div>
              </div>
            )}

          {/* Theme */}
          <section className="flex flex-col gap-fl-2">
            <h2 className="text-fl-1 text-text-2 leading-flat">Theme</h2>

            <form
              method="post"
              action="/api/theme"
              className="flex flex-col gap-fl-3"
            >
              <input type="hidden" name="return_to" value="/profile" />

              <div className="flex flex-col gap-fl-1">
                <p className="text-fl-0 text-text-3 uppercase tracking-wide">
                  Dark
                </p>
                <div className="flex gap-x-fl-1 gap-y-2 flex-wrap">
                  {darkThemes.map((t) => (
                    <button
                      key={t.key}
                      type="submit"
                      name="theme"
                      value={t.key}
                      className="btn"
                      autofocus={t.key === theme ? true : undefined}
                    >
                      <ThemeSwatch surface={t.surface} brand={t.brand} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-fl-1">
                <p className="text-fl-0 text-text-3 uppercase tracking-wide">
                  Light
                </p>
                <div className="flex gap-x-fl-1 gap-y-2 flex-wrap">
                  {lightThemes.map((t) => (
                    <button
                      key={t.key}
                      type="submit"
                      name="theme"
                      value={t.key}
                      className="btn"
                      autofocus={t.key === theme ? true : undefined}
                    >
                      <ThemeSwatch surface={t.surface} brand={t.brand} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </section>
        </div>
      </Main>

      <Panel />
    </>
  );
});

function ThemeSwatch(
  { surface, brand }: { surface: string; brand: string },
) {
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
      <circle cx="6" cy="7" r="6" fill={surface} />
      <circle cx="14" cy="7" r="6" fill={brand} />
    </svg>
  );
}
