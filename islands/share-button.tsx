import { clsx } from "clsx/lite";
import { useCallback } from "preact/hooks";

import { Icon, ShareNetwork } from "#/components/icons.tsx";

type ShareButtonProps = {
  url: string;
  title?: string;
};

export function ShareButton({ url }: ShareButtonProps) {
  const onShare = useCallback(async () => {
    const title = globalThis.document.title;

    if ("share" in navigator) {
      await globalThis.navigator.share({ title, url });
    } else {
      await globalThis.navigator.clipboard.writeText(url);
    }
  }, [url]);

  return (
    <button
      type="button"
      onClick={onShare}
      className="icon-btn"
      aria-label="Share"
    >
      <Icon icon={ShareNetwork} />
    </button>
  );
}
