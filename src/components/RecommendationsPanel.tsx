import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie } from '../types/movie';
import { fetchSimilarMovies } from '../services/api';
import '../styles/Recommendations.css';

interface Props {
  movie: Movie;
  allMovies: Movie[];
  isWatchlisted: (id: number) => boolean;
  toggleWatchlist: (id: number) => void;
}

function RecommendationsPanel({ movie, allMovies, isWatchlisted, toggleWatchlist }: Props) {
  const navigate = useNavigate();
  const [recs, setRecs] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchSimilarMovies(movie.tmdbId, 8)
      .then(results => setRecs(
        results
          .map(r => allMovies.find(m => m.tmdbId === r.id))
          .filter((m): m is Movie => m !== undefined)
      ))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [movie.tmdbId]);

  if (error) return null; // backend not running — fail silently

  return (
    <section className="rp-section">
      <h2 className="rp-heading">More Like This</h2>
      {loading ? (
        <div className="rp-shimmer-row">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rp-shimmer-card" />
          ))}
        </div>
      ) : recs.length === 0 ? (
        <p className="empty-state">No similar movies found.</p>
      ) : (
        <div className="rp-grid">
          {recs.map(rec => (
            <div
              key={rec.id}
              className="rp-card"
              onClick={() => navigate(`/movies/${rec.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && navigate(`/movies/${rec.id}`)}
            >
              <div className="rp-card-poster-wrap">
                <img
                  src={rec.posterPath || 'images/default.jpg'}
                  alt={rec.title}
                  className="rp-card-poster"
                  onError={e => { (e.target as HTMLImageElement).src = 'images/default.jpg'; }}
                />
                <button
                  className={`rp-wl-btn ${isWatchlisted(rec.id) ? 'rp-wl-btn-active' : ''}`}
                  onClick={e => { e.stopPropagation(); toggleWatchlist(rec.id); }}
                  title={isWatchlisted(rec.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {isWatchlisted(rec.id) ? '✓' : '+'}
                </button>
              </div>
              <div className="rp-card-info">
                <span className="rp-card-title">{rec.title}</span>
                <span className="rp-card-meta">{rec.releaseYear > 0 ? rec.releaseYear : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default RecommendationsPanel;
