import { useEffect } from "preact/hooks";

type UseRouterOptions = {
  onLocationUpdated?: (url: URL) => void;
};

export function updateLocation(href: string, options?: { replace?: boolean }) {
  if (options?.replace) {
    self.history.replaceState({}, "", href);
  } else {
    self.history.pushState({}, "", href);
  }

  self.dispatchEvent(new CustomEvent("location-changed"));
}

export function useRouter({ onLocationUpdated }: UseRouterOptions = {}) {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const a = (event.target as HTMLElement).closest("a");

      if (!a) return;
      event.preventDefault();
      const replace = a.hasAttribute("data-router-replace");
      updateLocation(a.href, { replace });
    };

    self.addEventListener("click", onClick);

    return () => {
      self.removeEventListener("click", onClick);
    };
  }, [updateLocation]);

  useEffect(() => {
    const handler = () => onLocationUpdated?.(new URL(self.location.href));

    self.addEventListener("popstate", handler);
    self.addEventListener("location-changed", handler);

    // Fire on initial load.
    handler();

    return () => {
      self.removeEventListener("popstate", handler);
      self.removeEventListener("location-changed", handler);
    };
  }, [onLocationUpdated]);

  return {
    updateLocation,
  };
}
