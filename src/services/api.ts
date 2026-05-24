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

export async function fetchCollabRecommendations(userId: string, n = 10): Promise<Movie[]> {
  const { data } = await axios.get(`${BASE}/recommendations/collab/${userId}`, { params: { n } });
  return data.results as Movie[];
}

export async function postRating(userId: string, movieId: number, rating: number): Promise<void> {
  await axios.post(`${BASE}/recommendations/ratings`, { user_id: userId, movie_id: movieId, rating });
}

export async function sendChatMessage(query: string): Promise<
  | { type: 'chat'; message: string }
  | { type: 'movies'; reasoning: string; movies: Movie[] }
> {
  const { data } = await axios.post(`${BASE}/chat/message`, { query });
  return data;
}

export async function explainMovieRec(movie: Movie, reasons: object): Promise<ReadableStreamDefaultReader<Uint8Array>> {
  const response = await fetch(`${BASE}/chat/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ movie, reasons }),
  });
  if (!response.body) throw new Error('No response body for SSE stream');
  return response.body.getReader();
}
