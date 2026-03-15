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
      aria-label="Share"
      className={clsx(
        "inline-flex items-center justify-center min-w-[44px] min-h-[44px] bg-transparent border-0",
        "cursor-pointer text-inherit text-5 hover:text-link transition-colors",
      )}
    >
      <Icon icon={ShareNetwork} />
    </button>
  );
}
