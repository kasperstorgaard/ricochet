import { cn } from "../lib/style.ts";

type Props = {
  url: URL;
  items: {
    name: string;
    href: string;
  }[];
};

export function Header({ items }: Props) {
  return (
    <header>
      <nav className="flex items-center gap-1 text-1">
        {items.map((item, idx) => (
          <>
            {idx > 0 && <span className="leading-mini mb-00 text-link">/</span>}

            <a
              href={item.href}
              className={cn(
                "underline text-link visited:text-link",
              )}
            >
              {item.name}
            </a>
          </>
        ))}
      </nav>
    </header>
  );
}
