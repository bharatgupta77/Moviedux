export interface CastMember {
  name: string;
  character: string;
  profilePath: string;      // Full TMDB image URL or empty string
}

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
  // Detail-only fields — only populated by fetchMovieById, undefined on list movies
  runtime?: number;         // Minutes, e.g. 148
  director?: string;        // First credited director
  cast?: CastMember[];      // Top 15 cast members with photo + character
  trailerKey?: string;      // YouTube video key for the official trailer
}

// The three possible rating filter values
export type RatingFilter = 'All' | 'Good' | 'Ok' | 'Bad';

// Mood filter — maps a feeling to the genres that match it
export type Mood = 'Any' | 'Happy' | 'Emotional' | 'Scary' | 'Action-packed' | 'Romantic' | 'Mind-bending' | 'Chill' | 'Epic';

export const MOOD_MAP: Record<Mood, string[]> = {
  'Any':          [],
  'Happy':        ['Comedy', 'Animation', 'Family'],
  'Emotional':    ['Drama', 'Romance'],
  'Scary':        ['Horror', 'Thriller'],
  'Action-packed':['Action', 'Adventure'],
  'Romantic':     ['Romance', 'Drama'],
  'Mind-bending': ['Science Fiction', 'Mystery', 'Thriller'],
  'Chill':        ['Documentary', 'Music', 'Comedy'],
  'Epic':         ['Fantasy', 'Adventure', 'History', 'War'],
};

export const MOOD_EMOJI: Record<Mood, string> = {
  'Any':          '🎬',
  'Happy':        '😄',
  'Emotional':    '😢',
  'Scary':        '😱',
  'Action-packed':'💥',
  'Romantic':     '💕',
  'Mind-bending': '🤯',
  'Chill':        '😎',
  'Epic':         '⚔️',
};