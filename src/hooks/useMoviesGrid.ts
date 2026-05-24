import { useState, useEffect, useMemo } from 'react';
import { Movie, RatingFilter, Mood, MOOD_MAP } from '../types/movie';

const MOVIES_PER_PAGE = 20;

function matchesRating(rating: number, filter: RatingFilter): boolean {
  switch (filter) {
    case 'Good': return rating >= 8;
    case 'Ok':   return rating >= 5 && rating < 8;
    case 'Bad':  return rating < 5;
    default:     return true;
  }
}

// Always shows: first, last, current, and 2 neighbours. Uses "..." for gaps.
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

export function useMoviesGrid(movies: Movie[]) {
  const [searchTerm, setSearchTerm] = useState('');
  const [genre, setGenre]           = useState('All Genres');
  const [rating, setRating]         = useState<RatingFilter>('All');
  const [mood, setMood]             = useState<Mood>('Any');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, genre, rating, mood]);

  const genres = useMemo(() => {
    const all = movies.flatMap((m) => m.genre.split(', '));
    return ['All Genres', ...Array.from(new Set(all)).sort()];
  }, [movies]);

  const filteredMovies = useMemo(() => {
    const seen = new Set<number>();
    return movies.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return (
        (genre === 'All Genres' || m.genre.toLowerCase().includes(genre.toLowerCase())) &&
        matchesRating(m.rating, rating) &&
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (mood === 'Any' || MOOD_MAP[mood].some(g => m.genre.toLowerCase().includes(g.toLowerCase())))
      );
    });
  }, [movies, genre, rating, searchTerm, mood]);

  const totalPages = Math.ceil(filteredMovies.length / MOVIES_PER_PAGE);
  const pageMovies = filteredMovies.slice(
    (currentPage - 1) * MOVIES_PER_PAGE,
    currentPage * MOVIES_PER_PAGE
  );

  const changeMood = (newMood: Mood) => {
    setMood(newMood);
    if (newMood !== 'Any') setGenre('All Genres');
  };

  const changeGenre = (newGenre: string) => {
    setGenre(newGenre);
    if (newGenre !== 'All Genres') setMood('Any');
  };

  const goTo = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
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
  };
}
