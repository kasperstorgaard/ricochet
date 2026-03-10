import { ShareButton } from "#/islands/share-button.tsx";

type Props = {
  url: URL;
  back?: { href: string };
  share?: boolean | { params: boolean };
  hideProfile?: boolean;
};

export function Header({ url, back, share, hideProfile }: Props) {
  const shareUrl = typeof share === "object" && share.params
    ? url.href
    : url.origin + url.pathname;

  return (
    <header className="print:hidden flex items-center justify-between">
      {back && (
        <a href={back.href} className="text-fl-1 no-underline leading-none">
          <i className="ph ph-arrow-left" />
        </a>
      )}
      <div className="flex items-center gap-2 ml-auto">
        {share && <ShareButton url={shareUrl} />}
        {!hideProfile && (
          <a
            href="/profile"
            className="p-0 leading-none text-fl-1 text-text-2 no-underline hover:text-link"
            aria-label="Profile and settings"
          >
            <i className="ph ph-user-circle" />
          </a>
        )}
      </div>
    </header>
  );
}
