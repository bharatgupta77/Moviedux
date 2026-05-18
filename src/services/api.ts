import axios from 'axios';
import { Movie } from '../types/movie';

const BASE = 'http://localhost:8000/api';

export async function fetchSimilarMovies(tmdbId: number, n = 8): Promise<Movie[]> {
  const { data } = await axios.get(`${BASE}/recommendations/similar/${tmdbId}`, { params: { n } });
  return data.results as Movie[];
}

export async function fetchWatchlistRecommendations(tmdbIds: number[], n = 10): Promise<Movie[]> {
  const { data } = await axios.post(`${BASE}/recommendations/watchlist`, { tmdb_ids: tmdbIds, n });
  return data.results as Movie[];
}
