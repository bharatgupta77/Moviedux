// Custom hook: useMovies
//
// WHY a custom hook instead of fetching in App.tsx directly?
// App.tsx shouldn't know HOW movies are fetched — only that it has them.
// If we later switch from TMDB to our own Flask API, we change this file only.
//
// WHAT a custom hook is:
// Any function that starts with "use" and calls React hooks inside it.
// React's rules (like "don't call hooks in loops") apply inside custom hooks too.

import { useState, useEffect } from 'react';
import { Movie } from '../types/movie';
import { fetchAllPopularMovies } from '../services/tmdb';

interface UseMoviesReturn {
  movies: Movie[];
  loading: boolean;
  loadingProgress: string;   // e.g. "Loading... 120 / 500 pages"
  error: string | null;
}

export function useMovies(): UseMoviesReturn {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAllPopularMovies((loaded, total) => {
          if (!cancelled)
            setLoadingProgress(`Loading movies... ${loaded} / ${total} pages`);
        });
        if (!cancelled) setMovies(data);
      } catch {
        if (!cancelled)
          setError('Failed to load movies. Check your REACT_APP_TMDB_API_KEY in .env');
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadingProgress('');
        }
      }
    };

    load();

    // Cleanup function: runs when the component unmounts
    return () => {
      cancelled = true;
    };
  }, []); // Empty array = run once on mount, not on every render

  return { movies, loading, loadingProgress, error };
}