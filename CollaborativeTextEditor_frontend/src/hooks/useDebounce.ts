import { useCallback, useRef } from 'react';

/**
 * Custom hook to create a debounced function.
 *
 * @param callback - The function to debounce.
 * @param delay - The debounce delay in milliseconds.
 * @returns - A debounced version of the callback function.
 */
const useDebounce = (callback: (value: string) => void, delay: number) => {
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback((value: string) => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      callback(value);
    }, delay);
  }, [callback, delay]);

  return debouncedCallback;
};

export default useDebounce;
