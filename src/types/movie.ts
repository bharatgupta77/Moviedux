// The single source of truth for what a Movie looks like in this app.
// Everything — components, hooks, services — imports from here.

export interface Movie {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string;       // Full TMDB image URL (https://image.tmdb.org/t/p/w500/...)
  genre: string;            // Human-readable, e.g. "Action, Adventure"
  rating: number;           // 0–10 scale, always a number (was a string bug in v1)
  overview: string;         // Plot summary from TMDB
  releaseYear: number;
  popularity: number;       // TMDB popularity score (used later for sorting)
}

// The three possible rating filter values
export type RatingFilter = 'All' | 'Good' | 'Ok' | 'Bad';