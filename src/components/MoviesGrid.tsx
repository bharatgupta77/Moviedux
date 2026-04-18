import React, { useMemo, useState, useEffect } from 'react';
import MovieCard from './MovieCard';
import LoadingScreen from './LoadingScreen';
import { Movie, RatingFilter } from '../types/movie';

const MOVIES_PER_PAGE = 20;

interface MoviesGridProps {
  movies: Movie[];
  loading: boolean;
  loadingProgress: string;
  watchlist: number[];
  toggleWatchlist: (movieId: number) => void;
}

function matchesRating(rating: number, filter: RatingFilter): boolean {
  switch (filter) {
    case 'Good': return rating >= 8;
    case 'Ok':   return rating >= 5 && rating < 8;
    case 'Bad':  return rating < 5;
    default:     return true;
  }
}

// Build the page numbers to show in the bar.
// Always shows: first, last, current, and 2 neighbours. Uses "..." for gaps.
// e.g. [1, '...', 4, 5, 6, '...', 20]
function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '...')[] = [];
  const near = new Set([1, total, current - 1, current, current + 1].filter(n => n >= 1 && n <= total));
  let prev = 0;
  for (const n of Array.from(near).sort((a, b) => a - b)) {
    if (n - prev > 1) pages.push('...');
    pages.push(n);
    prev = n;
  }
  return pages;
}

function MoviesGrid({ movies, loading, loadingProgress, watchlist, toggleWatchlist }: MoviesGridProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [genre, setGenre]           = useState('All Genres');
  const [rating, setRating]         = useState<RatingFilter>('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever filters or search change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, genre, rating]);

  const genres = useMemo(() => {
    const all = movies.flatMap((m) => m.genre.split(', '));
    return ['All Genres', ...Array.from(new Set(all)).sort()];
  }, [movies]);

  const filteredMovies = useMemo(() =>
    movies.filter((m) =>
      (genre === 'All Genres' || m.genre.toLowerCase().includes(genre.toLowerCase())) &&
      matchesRating(m.rating, rating) &&
      m.title.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [movies, genre, rating, searchTerm]
  );

  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
  const pageMovies = filteredMovies.slice(
    (currentPage - 1) * MOVIES_PER_PAGE,
    currentPage * MOVIES_PER_PAGE
  );

  const goTo = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <select className="filter-dropdown" value={genre} onChange={(e) => setGenre(e.target.value)}>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="filter-slot">
          <label>Rating</label>
          <select className="filter-dropdown" value={rating} onChange={(e) => setRating(e.target.value as RatingFilter)}>
            <option value="All">All</option>
            <option value="Good">Good (8+)</option>
            <option value="Ok">Ok (5–7.9)</option>
            <option value="Bad">Bad (&lt;5)</option>
          </select>
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