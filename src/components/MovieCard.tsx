import React from 'react';
import { Link } from 'react-router-dom';
import { Movie } from '../types/movie';
import '../styles.css';

interface MovieCardProps {
  movie: Movie;
  isWatchlisted: boolean;
  toggleWatchlist: (movieId: number) => void;
}

function getRatingClass(rating: number): string {
  if (rating >= 8) return 'rating-good';
  if (rating >= 5) return 'rating-ok';
  return 'rating-bad';
}

function MovieCard({ movie, isWatchlisted, toggleWatchlist }: MovieCardProps) {
  // Truncate overview so it fits neatly in the hover overlay
  const shortOverview = movie.overview.length > 160
    ? movie.overview.slice(0, 157) + '...'
    : movie.overview;

  return (
    <div className="movie-card">
      {/* Poster section — has rating badge + hover overlay */}
      <Link to={`/movies/${movie.id}`} className="movie-card-poster-link">
        <div className="movie-card-poster">
          <img
            src={movie.posterPath || 'images/default.jpg'}
            alt={movie.title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'images/default.jpg';
            }}
          />

          {/* Rating badge pinned to top-right of poster */}
          <span className={`poster-rating-badge ${getRatingClass(movie.rating)}`}>
            ★ {movie.rating}
          </span>

          {/* Hover overlay: slides up with overview text */}
          {shortOverview && (
            <div className="poster-overlay">
              <p className="poster-overview">{shortOverview}</p>
              <span className="poster-view-more">View details →</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info section below poster */}
      <div className="movie-card-info">
        <h3 className="movie-card-title">
          <Link to={`/movies/${movie.id}`}>{movie.title}</Link>
        </h3>

        <div className="movie-card-meta">
          <span className="movie-card-genre">{movie.genre}</span>
          {movie.releaseYear > 0 && (
            <span className="movie-card-year">{movie.releaseYear}</span>
          )}
        </div>

        <label className="switch">
          <input
            type="checkbox"
            checked={isWatchlisted}
            onChange={() => toggleWatchlist(movie.id)}
          />
          <span className="slider">
            <span className="slider-label">
              {isWatchlisted ? 'In Watchlist' : 'Add to Watchlist'}
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

export default MovieCard;