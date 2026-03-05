import { ShareButton } from "#/islands/share-button.tsx";
import { ThemePicker } from "#/islands/theme-picker.tsx";

type Props = {
  url: URL;
  back?: { href: string };
  share?: boolean | { params: boolean };
  themePicker?: boolean;
};

export function Header({ url, back, share, themePicker }: Props) {
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
      <div className="flex items-center gap-1 ml-auto">
        {share && <ShareButton url={shareUrl} />}
        {themePicker && <ThemePicker />}
      </div>
    </header>
  );
}
