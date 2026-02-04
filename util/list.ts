type SortOptions<TItem extends object> = {
  sortBy: keyof TItem;
  sortOrder: "ascending" | "descending";
};

function getSortValue<TItem extends object>(
  item: TItem,
  key: keyof TItem,
): string | number {
  const rawValue = item[key];

  if (rawValue instanceof Date) {
    return rawValue.getTime();
  }

  const type = typeof rawValue;

  switch (type) {
    case "string":
      return rawValue as string;
    case "number":
      return rawValue as number;
    default:
      throw new Error(`Unable to sort value of type: ${type}`);
  }
}

export function sortList<TItem extends object>(
  items: TItem[],
  options: SortOptions<TItem>,
): TItem[] {
  return items.sort((a, b) => {
    const aValue = getSortValue(a, options.sortBy);
    const bValue = getSortValue(b, options.sortBy);

    if (options.sortOrder === "ascending") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });
}
