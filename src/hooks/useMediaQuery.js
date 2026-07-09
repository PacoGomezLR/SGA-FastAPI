import { useSyncExternalStore } from "react";

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024
};

function subscribe(query, callback) {
  const mediaQueryList = window.matchMedia(query);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (callback) => subscribe(query, callback),
    () => window.matchMedia(query).matches,
    () => false
  );
}

export function useIsMobile() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobile}px)`);
}

export function useIsTabletDown() {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.tablet}px)`);
}
