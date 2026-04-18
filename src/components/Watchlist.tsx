// Watchlist.tsx
//
// CHANGES from Watchlist.jsx:
// 1. BUG FIXED: old code received prop named "toggleWatchList" (capital L)
//    but passed it to MovieCard as "toggleWatchlist" (lowercase l). This meant
//    the remove toggle on the Watchlist page was silently broken — clicking it
//    called undefined. Now the prop is consistently "toggleWatchlist".
// 2. Added empty state message when no movies are in the watchlist.
// 3. Added TypeScript guard: movies.find() can return undefined if the movie
//    hasn't loaded yet. The .filter() call safely removes those cases.
// 4. key={movie.id} is now on <MovieCard> in the .map() — the right place.

import React from 'react';
import MovieCard from './MovieCard';
import { Movie } from '../types/movie';

interface WatchlistProps {
  movies: Movie[];
  watchlist: number[];
  toggleWatchlist: (movieId: number) => void;
}

function Watchlist({ movies, watchlist, toggleWatchlist }: WatchlistProps) {
  // Find full Movie objects for each watchlist id.
  // The type guard (m): m is Movie filters out any undefined results
  // (can happen if movies haven't loaded yet when the component renders).
  const watchlistMovies = watchlist
    .map((id) => movies.find((m) => m.id === id))
    .filter((m): m is Movie => m !== undefined);

  if (watchlistMovies.length === 0) {
    return (
      <div>
        <h2>Your Watchlist</h2>
        <p className="empty-state">
          No movies added yet. Browse the home page and flip the toggle to add some!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2>Your Watchlist ({watchlistMovies.length})</h2>
      <div className="movies-grid">
        {watchlistMovies.map((movie) => (
          <MovieCard
            key={movie.id}
            movie={movie}
            toggleWatchlist={toggleWatchlist}
            isWatchlisted={true}
          />
        ))}
      </div>
    </div>
  );
}

export default Watchlist;