import clsx from "clsx/lite";
import { useEffect, useState } from "preact/hooks";

import { Dialog } from "./dialog.tsx";

type Theme = {
  key: string;
  label: string;
  surface: string;
  brand: string;
  mode: "dark" | "light";
};

const THEMES: Theme[] = [
  {
    key: "skub",
    label: "Skub",
    surface: "#1c1e22",
    brand: "#be185d",
    mode: "dark",
  },
  {
    key: "one-dark",
    label: "One Dark",
    surface: "#21252b",
    brand: "#98c379",
    mode: "dark",
  },
  {
    key: "dracula",
    label: "Dracula",
    surface: "#282a36",
    brand: "#ff79c6",
    mode: "dark",
  },
  {
    key: "acid",
    label: "Acid",
    surface: "#0d0d0d",
    brand: "#00ff41",
    mode: "dark",
  },
  {
    key: "github-light",
    label: "GitHub Light",
    surface: "#ffffff",
    brand: "#0969da",
    mode: "light",
  },
  {
    key: "solarized-light",
    label: "Solarized Light",
    surface: "#fdf6e3",
    brand: "#b58900",
    mode: "light",
  },
  {
    key: "catppuccin",
    label: "Catppuccin",
    surface: "#eff1f5",
    brand: "#8839ef",
    mode: "light",
  },
];

type Props = {
  className?: string;
};

export function ThemePicker({ className }: Props) {
  const [activeTheme, setActiveTheme] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setActiveTheme(globalThis.document.documentElement.dataset.theme ?? "");
  }, []);

  const darkThemes = THEMES.filter((t) => t.mode === "dark");
  const lightThemes = THEMES.filter((t) => t.mode === "light");

  return (
    <>
      <button
        type="button"
        aria-label="Pick theme"
        onClick={() => setOpen(true)}
        className={clsx(
          "bg-transparent border-0 cursor-pointer text-fl-1 text-link opacity-70 transition-opacity",
          "hover:opacity-100",
          className,
        )}
      >
        <i className="ph ph-palette" aria-hidden="true" />
      </button>

      <Dialog open={open}>
        <h2 className="text-fl-2 leading-flat text-text-1">Pick a theme</h2>

        <form method="post" action="/api/theme" className="grid gap-fl-3">
          <input
            type="hidden"
            name="return_to"
            value={globalThis.location?.href ?? ""}
          />

          <ThemeGroup
            label="Dark"
            themes={darkThemes}
            active={activeTheme}
          />
          <ThemeGroup
            label="Light"
            themes={lightThemes}
            active={activeTheme}
          />

          <div className="flex justify-end">
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

type ThemeGroupProps = {
  label: string;
  themes: Theme[];
  active: string;
};

function ThemeGroup({ label, themes, active }: ThemeGroupProps) {
  return (
    <div className="flex flex-col gap-fl-1">
      <p className="text-fl-0 text-text-2 leading-tight">{label}</p>

      <div className="flex gap-x-fl-1 gap-y-2 flex-wrap">
        {themes.map((theme) => (
          <button
            key={theme.key}
            type="submit"
            name="theme"
            value={theme.key}
            className="btn"
            autofocus={theme.key === active ? true : undefined}
          >
            <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true">
              <circle
                cx="6"
                cy="7"
                r="6"
                fill={theme.surface}
              />
              <circle cx="14" cy="7" r="6" fill={theme.brand} />
            </svg>
            {theme.label}
          </button>
        ))}
      </div>
    </div>
  );
}
