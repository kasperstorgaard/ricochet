type Props = {
  url: URL;
  back?: { href: string };
};

export function Header({ back }: Props) {
  return (
    <header className="print:hidden">
      {back && (
        <a href={back.href} className="text-link text-fl-1 hover:no-underline">
          <i className="ph ph-arrow-left" />
        </a>
      )}
    </header>
  );
}
