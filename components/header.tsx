import { ShareButton } from "#/islands/share-button.tsx";

type Props = {
  url: URL;
  back?: { href: string };
  share?: boolean | { params: boolean };
};

export function Header({ url, back, share }: Props) {
  const shareUrl = typeof share === "object" && share.params
    ? url.href
    : url.origin + url.pathname;

  return (
    <header className="print:hidden flex items-center justify-between">
      {back && (
        <a href={back.href} className="text-fl-1 no-underline">
          <i className="ph ph-arrow-left" />
        </a>
      )}
      {share && <ShareButton url={shareUrl} />}
    </header>
  );
}
