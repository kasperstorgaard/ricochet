import { clsx } from "clsx/lite";
import { useCallback, useState } from "preact/hooks";

type ShareButtonProps = {
  url: string;
  title?: string;
};

export function ShareButton({ url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const onShare = useCallback(async () => {
    const title = globalThis.document.title;

    if ("share" in navigator) {
      await globalThis.navigator.share({ title, url });
    } else {
      await globalThis.navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <button
      type="button"
      aria-label={copied ? "Copied!" : "Share"}
      onClick={onShare}
      className={clsx(
        "p-0 bg-transparent border-0 cursor-pointer text-fl-1 leading-none",
        "transition-opacity opacity-70 hover:opacity-100",
      )}
      style={{ color: "var(--color-link)" }}
    >
      <i className={clsx(copied ? "ph ph-check" : "ph ph-share-network")} />
    </button>
  );
}
