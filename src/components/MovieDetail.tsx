// MovieDetail.tsx — NEW in Phase 1
//
// A dedicated page for a single movie, accessible at /movies/:id
// This page is the anchor point for Phase 3 AI features:
//   - "Similar Movies" panel (TF-IDF recommendations)
//   - "Why recommended?" streaming explanation (Claude API)
//
// HOW useParams works:
// React Router extracts the :id segment from the URL and gives it to us
// via useParams(). If the user visits /movies/550, id will be "550" (string).
// We convert it to a number with Number(id) to match movie.id.
//
// HOW useNavigate works:
// navigate(-1) goes back one step in browser history — like the browser Back button.

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Movie } from '../types/movie';

interface MovieDetailProps {
  movies: Movie[];
  isWatchlisted: (movieId: number) => boolean;
  toggleWatchlist: (movieId: number) => void;
}

function getRatingClass(rating: number): string {
  if (rating >= 8) return 'rating-good';
  if (rating >= 5) return 'rating-ok';
  return 'rating-bad';
}

function MovieDetail({ movies, isWatchlisted, toggleWatchlist }: MovieDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const movie = movies.find((m) => m.id === Number(id));

  if (!movie) {
    return (
      <div className="movie-detail">
        <button onClick={() => navigate(-1)} className="back-btn">← Back</button>
        <p className="empty-state">Movie not found. It may still be loading.</p>
      </div>
    );
  }

  const watchlisted = isWatchlisted(movie.id);

  return (
    <div className="movie-detail">
      <button onClick={() => navigate(-1)} className="back-btn">← Back</button>

      <div className="movie-detail-content">
        <img
          src={movie.posterPath || 'images/default.jpg'}
          alt={movie.title}
          className="movie-detail-poster"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'images/default.jpg';
          }}
        />

        <div className="movie-detail-info">
          <h1>{movie.title}</h1>

          <div className="movie-detail-meta">
            <span className="movie-card-genre">{movie.genre}</span>
            <span className={`movie-card-rating ${getRatingClass(movie.rating)}`}>
              ★ {movie.rating} / 10
            </span>
            {movie.releaseYear > 0 && (
              <span className="movie-detail-year">{movie.releaseYear}</span>
            )}
          </div>

          <p className="movie-detail-overview">{movie.overview}</p>

          <label className="switch">
            <input
              type="checkbox"
              checked={watchlisted}
              onChange={() => toggleWatchlist(movie.id)}
            />
            <span className="slider">
              <span className="slider-label">
                {watchlisted ? 'In Watchlist' : 'Add to Watchlist'}
              </span>
            </span>
          </label>

          {/* Phase 3: AI Recommendations panel will be added here */}
          {/* <RecommendationsPanel movieId={movie.id} /> */}
        </div>
      </div>
    </div>
  );
}

export default MovieDetail;