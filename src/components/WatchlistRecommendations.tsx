import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie } from '../types/movie';
import { fetchWatchlistRecommendations, fetchCollabRecommendations } from '../services/api';
import { useUser } from '../context/UserContext';
import '../styles/Recommendations.css';

interface Props {
  watchlistMovies: Movie[];
  isWatchlisted: (id: number) => boolean;
  toggleWatchlist: (id: number) => void;
}

function WatchlistRecommendations({ watchlistMovies, isWatchlisted, toggleWatchlist }: Props) {
  const navigate = useNavigate();
  const { userId } = useUser();
  const [recs, setRecs] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [collabRecs, setCollabRecs] = useState<Movie[]>([]);
  const [collabLoading, setCollabLoading] = useState(false);

  useEffect(() => {
    if (watchlistMovies.length === 0) return;
    setLoading(true);
    setError(false);
    const tmdbIds = watchlistMovies.map(m => m.tmdbId);
    fetchWatchlistRecommendations(tmdbIds, 10)
      .then(results => {
        setRecs(results.filter(r => !isWatchlisted(r.id)));
      })
      .catch((err) => { console.error('[WatchlistRecs] TF-IDF fetch failed:', err); setError(true); })
      .finally(() => setLoading(false));
  }, [watchlistMovies]);

  useEffect(() => {
    setCollabLoading(true);
    fetchCollabRecommendations(userId, 10)
      .then(results => {
        setCollabRecs(results.filter(r => !isWatchlisted(r.tmdbId ?? r.id)));
      })
      .catch(() => {}) // collab section silently fails if backend not ready
      .finally(() => setCollabLoading(false));
  }, [userId]);

  if (watchlistMovies.length === 0) return null;
  if (error) return (
    <section className="rp-section">
      <h2 className="rp-heading">Recommended For You</h2>
      <p className="empty-state">Could not load recommendations — make sure the backend is running on port 8000.</p>
    </section>
  );

  return (
    <>
    <section className="rp-section">
      <h2 className="rp-heading">Recommended For You</h2>
      {loading ? (
        <div className="rp-shimmer-row">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rp-shimmer-card" />
          ))}
        </div>
      ) : recs.length === 0 ? (
        <p className="empty-state">No recommendations found.</p>
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

    {/* SVD Collaborative Filtering section */}
    {(collabLoading || collabRecs.length > 0) && (
      <section className="rp-section" style={{ marginTop: '32px' }}>
        <h2 className="rp-heading">You Might Also Like</h2>
        {collabLoading ? (
          <div className="rp-shimmer-row">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rp-shimmer-card" />
            ))}
          </div>
        ) : (
          <div className="rp-grid">
            {collabRecs.map(rec => (
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
    )}
    </>
  );
}

export default WatchlistRecommendations;