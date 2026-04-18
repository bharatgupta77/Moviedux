// Custom hook: useWatchlist
//
// NEW in Phase 1: watchlist now persists across browser refreshes via localStorage.
// Before, it was just useState([]) in App.js — refresh = empty watchlist.
//
// HOW localStorage works:
// localStorage is a browser built-in key-value store. It survives page refreshes
// and even browser restarts. Values are always strings, so we JSON.stringify/parse.

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'moviedux_watchlist';

interface UseWatchlistReturn {
  watchlist: number[];
  toggleWatchlist: (movieId: number) => void;
  isWatchlisted: (movieId: number) => boolean;
}

export function useWatchlist(): UseWatchlistReturn {
  // useState initializer function: runs once on mount to read from localStorage.
  // Using a function here (lazy initialization) is more efficient than:
  //   useState(JSON.parse(localStorage.getItem(STORAGE_KEY)))
  // because the function only runs once, not on every render.
  const [watchlist, setWatchlist] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as number[]) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage whenever the watchlist changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  }, [watchlist]);

  const toggleWatchlist = (movieId: number) => {
    setWatchlist((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
  };

  const isWatchlisted = (movieId: number) => watchlist.includes(movieId);

  return { watchlist, toggleWatchlist, isWatchlisted };
}