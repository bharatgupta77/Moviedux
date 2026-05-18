import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Movie } from '../types/movie';
import { fetchMovieById } from '../services/tmdb';

const VISIBLE = 4;

export function useMovieDetail(movies: Movie[], isWatchlisted: (id: number) => boolean) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const baseMovie = movies.find((m) => m.id === Number(id));

  const [detail, setDetail] = useState<Movie | null>(null);
  const [castIndex, setCastIndex] = useState(0);

  useEffect(() => {
    if (!baseMovie) return;
    fetchMovieById(baseMovie.tmdbId).then(setDetail).catch(() => {});
  }, [baseMovie]);

  useEffect(() => { setCastIndex(0); }, [id]);

  const movie = detail ?? baseMovie ?? null;
  const watchlisted = movie ? isWatchlisted(movie.id) : false;
  const genres = movie ? movie.genre.split(', ') : [];
  const cast = movie?.cast ?? [];
  const visibleCast = cast.slice(castIndex, castIndex + VISIBLE);

  const prevCast = () => setCastIndex(i => Math.max(0, i - VISIBLE));
  const nextCast = () => setCastIndex(i => Math.min(cast.length - VISIBLE, i + VISIBLE));

  return {
    movie,
    navigate,
    watchlisted,
    genres,
    cast,
    visibleCast,
    castIndex,
    prevCast,
    nextCast,
    canGoPrev: castIndex > 0,
    canGoNext: castIndex + VISIBLE < cast.length,
    notFound: !baseMovie,
  };
}
