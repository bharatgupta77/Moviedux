import React from 'react';
import { Movie } from '../types/movie';
import { useMovieDetail } from '../hooks/useMovieDetail';
import StarRating from './StarRating';
import MovieDNA from './MovieDNA';
import CastCard from './CastCard';
import RecommendationsPanel from './RecommendationsPanel';
import '../styles/MovieDetail.css';

interface MovieDetailProps {
  movies: Movie[];
  isWatchlisted: (movieId: number) => boolean;
  toggleWatchlist: (movieId: number) => void;
}

function formatRuntime(mins: number): string {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function MovieDetail({ movies, isWatchlisted, toggleWatchlist }: MovieDetailProps) {
  const {
    movie, navigate, watchlisted, genres, cast, visibleCast,
    castIndex, prevCast, nextCast, canGoPrev, canGoNext, notFound,
  } = useMovieDetail(movies, isWatchlisted);

  if (notFound || !movie) {
    return (
      <div className="md-wrap">
        <button onClick={() => navigate(-1)} className="md-back-btn">← Back</button>
        <p className="empty-state">Movie not found. It may still be loading.</p>
      </div>
    );
  }

  return (
    <div className="md-wrap">
      <div className="md-hero">
        {movie.posterPath && (
          <div className="md-hero-bg" style={{ backgroundImage: `url(${movie.posterPath})` }} />
        )}
        <div className="md-hero-overlay" />

        <button onClick={() => navigate(-1)} className="md-back-btn">← Back</button>

        <div className="md-hero-content">
          <img
            src={movie.posterPath || 'images/default.jpg'}
            alt={movie.title}
            className="md-poster"
            onError={(e) => { (e.target as HTMLImageElement).src = 'images/default.jpg'; }}
          />

          <div className="md-info">
            <h1 className="md-title">{movie.title}</h1>
            <div className="md-info-body">
              <div className="md-info-left">
                <div className="md-tags">
                  {movie.releaseYear > 0 && (
                    <span className="md-tag md-tag-year">{movie.releaseYear}</span>
                  )}
                  {genres.map(g => (
                    <span key={g} className="md-tag">{g}</span>
                  ))}
                </div>
                <StarRating rating={movie.rating} />
                <div className="md-meta-row">
                  {movie.runtime ? <span className="md-meta-item">⏱ {formatRuntime(movie.runtime)}</span> : null}
                  {movie.director ? <span className="md-meta-item">🎬 {movie.director}</span> : null}
                </div>
                <p className="md-overview">{movie.overview}</p>
                <div className="md-cta-row">
                  <button
                    className={`md-watchlist-btn ${watchlisted ? 'md-watchlist-btn-active' : ''}`}
                    onClick={() => toggleWatchlist(movie.id)}
                  >
                    {watchlisted ? '✓ In Watchlist' : '+ Add to Watchlist'}
                  </button>
                  {movie.trailerKey && (
                    <a
                      href={`https://www.youtube.com/watch?v=${movie.trailerKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="md-trailer-btn"
                    >
                      ▶ Watch Trailer
                    </a>
                  )}
                </div>

                {cast.length > 0 && (
                  <div className="md-cast-bar">
                    <div className="md-cast-bar-header">
                      <span className="md-cast-heading">Cast</span>
                      <div className="md-cast-nav">
                        <button className="md-cast-nav-btn" onClick={prevCast} disabled={!canGoPrev}>‹</button>
                        <button className="md-cast-nav-btn" onClick={nextCast} disabled={!canGoNext}>›</button>
                      </div>
                    </div>
                    <div className="md-cast-track">
                      {visibleCast.map(member => (
                        <CastCard key={member.name} member={member} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <MovieDNA movie={movie} />
            </div>
          </div>
        </div>
      </div>

      <RecommendationsPanel
        movie={movie}
        allMovies={movies}
        isWatchlisted={isWatchlisted}
        toggleWatchlist={toggleWatchlist}
      />
    </div>
  );
}

export default MovieDetail;
