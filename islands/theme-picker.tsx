import { useEffect, useState } from "preact/hooks";

import { Dialog } from "./dialog.tsx";
import clsx from "clsx/lite";

type Theme = {
  key: string;
  label: string;
  brand: string;
  mode: "dark" | "light";
};

const THEMES: Theme[] = [
  { key: "skub", label: "Skub", brand: "#be185d", mode: "dark" },
  { key: "one-dark", brand: "#98c379", label: "One Dark", mode: "dark" },
  { key: "dracula", brand: "#ff79c6", label: "Dracula", mode: "dark" },
  {
    key: "github-light",
    brand: "#0969da",
    label: "GitHub Light",
    mode: "light",
  },
  {
    key: "solarized-light",
    brand: "#b58900",
    label: "Solarized Light",
    mode: "light",
  },
  { key: "acid", label: "Acid", brand: "#00ff41", mode: "dark" },
  { key: "catppuccin", brand: "#8839ef", label: "Catppuccin", mode: "light" },
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
          "bg-transparent border-0 cursor-pointer text-link opacity-70 transition-opacity",
          "hover:opacity-100",
          className,
        )}
      >
        <i className="ph ph-palette" aria-hidden="true" />
      </button>

      <Dialog open={open}>
        <h2 className="text-fl-2 leading-flat text-text-1">Theme</h2>

        <form method="post" action="/api/theme" className="grid gap-fl-3">
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
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <circle cx="7" cy="7" r="6" fill={theme.brand} />
            </svg>
            {theme.label}
          </button>
        ))}
      </div>
    </div>
  );
}
