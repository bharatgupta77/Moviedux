import React from 'react';
import MovieCard from './MovieCard';
import LoadingScreen from './LoadingScreen';
import { Movie, Mood, MOOD_MAP, MOOD_EMOJI } from '../types/movie';
import { useMoviesGrid } from '../hooks/useMoviesGrid';
import '../styles/MoviesGrid.css';

interface MoviesGridProps {
  movies: Movie[];
  loading: boolean;
  loadingProgress: string;
  watchlist: number[];
  toggleWatchlist: (movieId: number) => void;
}

function MoviesGrid({ movies, loading, loadingProgress, watchlist, toggleWatchlist }: MoviesGridProps) {
  const {
    searchTerm, setSearchTerm,
    genre, changeGenre,
    rating, setRating,
    mood, changeMood,
    genres,
    filteredMovies,
    pageMovies,
    currentPage,
    totalPages,
    goTo,
    getPageNumbers,
  } = useMoviesGrid(movies);

  if (loading) {
    return <LoadingScreen progress={loadingProgress} />;
  }

  return (
    <div>
      <input
        type="text"
        className="search-input"
        placeholder="Search movies..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <div className="filter-bar">
        <div className="filter-slot">
          <label>Genre</label>
          <select className="filter-dropdown" value={genre} onChange={(e) => changeGenre(e.target.value)}>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="filter-slot">
          <label>Rating</label>
          <select className="filter-dropdown" value={rating} onChange={(e) => setRating(e.target.value as any)}>
            <option value="All">All</option>
            <option value="Good">Good (8+)</option>
            <option value="Ok">Ok (5–7.9)</option>
            <option value="Bad">Bad (&lt;5)</option>
          </select>
        </div>
      </div>

      <div className="mood-pill-section">
        <span className="mood-label">Mood</span>
        <div className="mood-pill-row">
          {(Object.keys(MOOD_MAP) as Mood[]).filter(m => m !== 'Any').map(m => (
            <button
              key={m}
              className={`mood-pill${mood === m ? ' mood-pill-active' : ''}`}
              onClick={() => changeMood(mood === m ? 'Any' : m)}
            >
              {MOOD_EMOJI[m]} {m}
            </button>
          ))}
        </div>
      </div>

      {filteredMovies.length === 0 ? (
        <p className="empty-state">No movies match your filters.</p>
      ) : (
        <>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}>‹ Prev</button>
              <span className="page-count">Page {currentPage} of {totalPages}</span>
              {getPageNumbers(currentPage, totalPages).map((p, i) =>
                p === '...'
                  ? <span key={`dots-${i}`} className="page-dots">…</span>
                  : <button key={p} className={`page-btn ${p === currentPage ? 'page-btn-active' : ''}`} onClick={() => goTo(p as number)}>{p}</button>
              )}
              <button className="page-btn" onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}>Next ›</button>
            </div>
          )}

          <div className="movies-grid">
            {pageMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                toggleWatchlist={toggleWatchlist}
                isWatchlisted={watchlist.includes(movie.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}>‹ Prev</button>
              <span className="page-count">Page {currentPage} of {totalPages}</span>
              {getPageNumbers(currentPage, totalPages).map((p, i) =>
                p === '...'
                  ? <span key={`dots-${i}`} className="page-dots">…</span>
                  : <button key={p} className={`page-btn ${p === currentPage ? 'page-btn-active' : ''}`} onClick={() => goTo(p as number)}>{p}</button>
              )}
              <button className="page-btn" onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}>Next ›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MoviesGrid;
