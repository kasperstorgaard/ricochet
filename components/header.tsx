import clsx from "clsx/lite";

import { ArrowLeft, Icon, UserCircle } from "#/components/icons.tsx";
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
    <header className="print:hidden flex items-center justify-between text-3">
      {back && (
        <a href={back.href} className="icon-btn" aria-label="Back">
          <Icon icon={ArrowLeft} />
        </a>
      )}
      <div className="flex items-center gap-2 ml-auto">
        {share && <ShareButton url={shareUrl} />}
        {!hideProfile && (
          <a
            href="/profile"
            className="icon-btn"
            aria-label="Profile and settings"
          >
            <Icon icon={UserCircle} />
          </a>
        )}
      </div>
    </header>
  );
}
