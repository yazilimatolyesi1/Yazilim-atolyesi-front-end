"use client";
import { useEffect, useState } from "react";

/** Arama kutuları için ortak bekleme süresi. */
export const SEARCH_DEBOUNCE_MS = 300;

/**
 * Değeri gecikmeyle yayınlar. Arama kutusuna her tuşta istek atılmasını engeller.
 * İlk değer beklemez; yalnızca sonraki değişiklikler gecikmeye tabidir.
 */
export function useDebouncedValue<T>(value: T, delay = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (delay <= 0) {
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
