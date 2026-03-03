import { clsx } from "clsx/lite";
import { useCallback } from "preact/hooks";

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
      className={clsx(
        "p-0 bg-transparent border-0 cursor-pointer text-fl-1 leading-none text-link opacity-70 transition-opacity",
        "hover:opacity-100",
      )}
    >
      <i className="ph ph-share-network" />
    </button>
  );
}
