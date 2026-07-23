"use client";

import useSWR, { type SWRConfiguration } from "swr";

/**
 * Polls a Server Action every `refreshInterval` (default 8s), starting from
 * the data already rendered server-side (`initialData`) so there's no
 * loading flash on first paint.
 */
export function usePolledData<T>(
  key: string | readonly unknown[] | null,
  fetcher: () => Promise<T>,
  initialData: T,
  options?: SWRConfiguration<T>,
) {
  return useSWR<T>(key, fetcher, {
    fallbackData: initialData,
    refreshInterval: 8000,
    revalidateOnFocus: true,
    dedupingInterval: 4000,
    ...options,
  });
}
