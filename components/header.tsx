type Props = {
  items: {
    name: string;
    href: string;
  }[];
};

export function Header({ items }: Props) {
  return (
    <header className="mb-2">
      <nav className="flex items-center gap-1 text-fl-0">
        {items.map((item, idx) => (
          <>
            {idx > 0 && <span className="leading-mini mb-00">/</span>}

            <a
              href={item.href}
              className="underline text-link"
            >
              {item.name}
            </a>
          </>
        ))}
      </nav>
    </header>
  );
}
