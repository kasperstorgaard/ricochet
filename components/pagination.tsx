import { cn } from "#/lib/style.ts";

type Props = {
  page: number;
  totalPages: number;
  baseUrl: string;
};

export function Pagination({ page, totalPages, baseUrl }: Props) {
  const hasPrevious = page > 1;
  const hasNext = page < totalPages;

  const getPageUrl = (page: number) => {
    const url = new URL(baseUrl);
    if (page === 1) {
      url.searchParams.delete("page");
    } else {
      url.searchParams.set("page", page.toString());
    }
    return url.pathname + url.search;
  };

  return (
    <nav
      className="flex items-center justify-center gap-fl-2 self-end max-lg:w-full"
      aria-label="Pagination"
    >
      <a
        href={hasPrevious ? getPageUrl(page - 1) : undefined}
        className={cn(
          "flex items-center rounded-1 px-2 border-[currentColor] border-1 aspect-square text-text-1",
          "hover:no-underline",
          !hasPrevious && "opacity-40 pointer-events-none",
        )}
        aria-disabled={!hasPrevious}
        aria-label="Previous page"
      >
        <i className="ph-caret-left ph-light" />
      </a>

      <span className="text-fl-0 text-text-2">
        Page {page} of {totalPages}
      </span>

      <a
        href={hasNext ? getPageUrl(page + 1) : undefined}
        className={cn(
          "flex items-center rounded-1 px-2 border-[currentColor] border-1 aspect-square text-text-1",
          "hover:no-underline",
          !hasNext && "opacity-40 pointer-events-none",
        )}
        aria-disabled={!hasNext}
        aria-label="Next page"
      >
        <i className="ph-caret-right ph-light" />
      </a>
    </nav>
  );
}
