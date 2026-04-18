// All communication with the TMDB API lives here.
//
// WHY a separate service file?
// Components shouldn't know where data comes from. If we switch from TMDB
// to our own Flask backend (Phase 2), we only change this one file.
//
// HOW to get a TMDB API key:
// 1. Sign up at https://www.themoviedb.org/
// 2. Go to Settings → API → Create (Developer)
// 3. Add to .env as REACT_APP_TMDB_API_KEY=your_key

import axios from 'axios';
import { Movie } from '../types/movie';

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const API_KEY = process.env.REACT_APP_TMDB_API_KEY;

// --- Internal TMDB types (what the API actually returns) ---
// These are different from our Movie interface — TMDB uses genre_ids (numbers)
// while we want genre (human-readable string). We transform in transformMovie().

interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  genre_ids: number[];
  vote_average: number;
  overview: string;
  release_date: string;
  popularity: number;
}

interface TMDBGenre {
  id: number;
  name: string;
}

// Genre map is cached in module scope so we only fetch it once per session
let genreCache: Map<number, string> | null = null;

export async function fetchGenreMap(): Promise<Map<number, string>> {
  if (genreCache) return genreCache;
  const { data } = await axios.get(`${TMDB_BASE}/genre/movie/list`, {
    params: { api_key: API_KEY },
  });
  genreCache = new Map(data.genres.map((g: TMDBGenre) => [g.id, g.name]));
  return genreCache;
}

// Converts TMDB's shape into our app's Movie shape.
// This is called a "data transformer" or "mapper".
function transformMovie(raw: TMDBMovie, genreMap: Map<number, string>): Movie {
  return {
    id: raw.id,
    tmdbId: raw.id,
    title: raw.title,
    posterPath: raw.poster_path ? `${TMDB_IMAGE_BASE}${raw.poster_path}` : '',
    // Take the first 2 genre IDs and join them as a string
    genre: raw.genre_ids
      .slice(0, 2)
      .map((id) => genreMap.get(id) ?? 'Unknown')
      .join(', '),
    // Round to 1 decimal place
    rating: Math.round(raw.vote_average * 10) / 10,
    overview: raw.overview,
    releaseYear: raw.release_date ? parseInt(raw.release_date.split('-')[0]) : 0,
    popularity: raw.popularity,
  };
}

// Fetch a single page of popular movies (20 per page)
export async function fetchPopularMovies(page = 1): Promise<Movie[]> {
  const [{ data }, genreMap] = await Promise.all([
    axios.get(`${TMDB_BASE}/movie/popular`, {
      params: { api_key: API_KEY, page },
    }),
    fetchGenreMap(),
  ]);
  return data.results.map((m: TMDBMovie) => transformMovie(m, genreMap));
}

// Search TMDB by movie title
export async function searchMovies(query: string): Promise<Movie[]> {
  const [{ data }, genreMap] = await Promise.all([
    axios.get(`${TMDB_BASE}/search/movie`, {
      params: { api_key: API_KEY, query },
    }),
    fetchGenreMap(),
  ]);
  return data.results.map((m: TMDBMovie) => transformMovie(m, genreMap));
}

// Fetch ALL popular movies across every page TMDB has.
// Strategy:
//   1. Fetch page 1 to learn total_pages (TMDB caps at 500 = ~10,000 movies)
//   2. Fetch all remaining pages in parallel batches of 20
//      (batching avoids hitting TMDB's rate limit of ~40 req/s)
//   3. Flatten + return everything combined
export async function fetchAllPopularMovies(
  onProgress?: (loaded: number, total: number) => void
): Promise<Movie[]> {
  const genreMap = await fetchGenreMap();

  // Page 1 gives us total_pages
  const { data: firstPage } = await axios.get(`${TMDB_BASE}/movie/popular`, {
    params: { api_key: API_KEY, page: 1 },
  });
  const totalPages: number = Math.min(firstPage.total_pages, 500);
  const firstMovies: Movie[] = firstPage.results.map((m: TMDBMovie) =>
    transformMovie(m, genreMap)
  );

  if (onProgress) onProgress(1, totalPages);
  if (totalPages === 1) return firstMovies;

  // Build list of remaining page numbers: [2, 3, 4, ..., totalPages]
  const remainingPages = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
  const BATCH_SIZE = 20;
  const allMovies: Movie[] = [...firstMovies];

  // Process in batches to avoid rate limiting
  for (let i = 0; i < remainingPages.length; i += BATCH_SIZE) {
    const batch = remainingPages.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((page) =>
        axios
          .get(`${TMDB_BASE}/movie/popular`, { params: { api_key: API_KEY, page } })
          .then(({ data }) =>
            data.results.map((m: TMDBMovie) => transformMovie(m, genreMap))
          )
      )
    );
    allMovies.push(...results.flat());
    if (onProgress) onProgress(1 + i + batch.length, totalPages);
  }

  return allMovies;
}

// Get full detail for a single movie by its TMDB id
export async function fetchMovieById(tmdbId: number): Promise<Movie> {
  const [{ data }, genreMap] = await Promise.all([
    axios.get(`${TMDB_BASE}/movie/${tmdbId}`, {
      params: { api_key: API_KEY },
    }),
    fetchGenreMap(),
  ]);
  // Full detail endpoint returns genres as objects, not IDs
  const genreIds = data.genres.map((g: TMDBGenre) => g.id);
  return transformMovie({ ...data, genre_ids: genreIds }, genreMap);
}
