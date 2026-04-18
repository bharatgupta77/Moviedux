# Phase 1 — TypeScript Migration + TMDB API

**Status:** ✅ Complete  
**Date:** 2026-04-17  
**Branch:** `v2-ai-recommendations`

---

## What We Built

### 1. TypeScript Migration
Converted every `.js`/`.jsx` to `.ts`/`.tsx`. Added `tsconfig.json` with `allowArbitraryExtensions: true` (needed for CRA + TypeScript 6 to accept CSS imports without errors).

**Why TypeScript?**
TypeScript adds types to JavaScript. Types are contracts — they tell you exactly what shape data must have, and the compiler enforces it before the code ever runs.

```typescript
// JS — this works silently, but it's wrong (string compared to number)
if (movie.rating >= 8) { ... }   // rating was "7.5" (string) in the old JSON

// TS — compile error catches it immediately
const movie: Movie = { rating: "7.5" }  // ERROR: string not assignable to number
```

**3 real bugs TypeScript caught and we fixed:**

| Bug | Old code | Fix |
|-----|----------|-----|
| `rating` type | `"7.5"` (string) compared as number | `rating: number` in Movie interface |
| Prop casing | App passed `toggleWatchList` (capital L), MovieCard expected `toggleWatchlist` — remove silently broken | Consistent `toggleWatchlist` everywhere |
| `key` placement | `key={movie.id}` on the inner `<div>` inside MovieCard | Moved to `<MovieCard key={movie.id}>` in `.map()` caller |

---

### 2. `src/types/movie.ts` — The Data Contract

```typescript
export interface Movie {
  id: number;
  tmdbId: number;
  title: string;
  posterPath: string;    // full TMDB image URL
  genre: string;         // "Action, Adventure" (derived from genre_ids)
  rating: number;        // always a number, never a string
  overview: string;
  releaseYear: number;
  popularity: number;
}
```

Every component, hook, and service imports `Movie` from here. One change here propagates everywhere.

---

### 3. `src/services/tmdb.ts` — Data Transformation

TMDB returns movies in its own shape. We transform it into our `Movie` shape before the rest of the app sees it. This is called a **data adapter**.

```typescript
// What TMDB sends:
{ id: 550, genre_ids: [18, 53], vote_average: 8.4, poster_path: "/abc.jpg" }

// What our app uses:
{ id: 550, genre: "Drama, Thriller", rating: 8.4, posterPath: "https://image.tmdb.org/..." }
```

Key functions:
- `fetchAllPopularMovies()` — fetches page 1 to learn `total_pages`, then fetches all remaining pages in **batches of 20** with `Promise.all`. Accepts an `onProgress` callback.
- `fetchGenreMap()` — fetches genre ID → name mapping once, caches it in module scope
- `searchMovies(query)` — TMDB search endpoint
- `fetchMovieById(id)` — full movie detail

---

### 4. Custom Hooks

**Why hooks instead of logic in App.tsx?**  
App.tsx shouldn't know *how* data is fetched — only *that* it has movies. When we switch to our Flask backend in Phase 2, we change `useMovies.ts` only. App.tsx doesn't change at all.

#### `src/hooks/useMovies.ts`
```typescript
const { movies, loading, loadingProgress, error } = useMovies();
```
- Fetches all TMDB pages in batches of 20 simultaneously
- Returns `loadingProgress` string ("Loading movies... 40 / 500 pages") for the loader
- Uses `cancelled` flag to prevent stale async updates on unmounted components

#### `src/hooks/useWatchlist.ts`
```typescript
const { watchlist, toggleWatchlist, isWatchlisted } = useWatchlist();
```
- Watchlist persists via `localStorage` — survives page refreshes
- Uses **lazy useState initializer** (function passed to useState) to read localStorage only once on mount, not every render
- `useEffect` syncs to localStorage on every change

---

### 5. Pagination — `MoviesGrid.tsx`

- 20 movies per page
- `useMemo` for filtered movies and genre list — only recalculates when dependencies change, not on every keystroke
- Genres derived **dynamically** from loaded movies — not hardcoded (old code had `["Action", "Drama", "Horror", "Fantasy"]` which only matched the fake JSON)
- `getPageNumbers()` — smart page bar: shows first, last, current ±2, with `…` for gaps
- Pagination bar at **top and bottom**
- Filters + search auto-reset to page 1 via `useEffect`

---

### 6. Movie Cards — `MovieCard.tsx`

| Feature | How |
|---------|-----|
| Fixed poster height | `aspect-ratio: 3/4` + `object-fit: cover` |
| Hover overlay | `.poster-overlay` with `opacity: 0` → `1` transition on `.movie-card:hover` |
| Rating badge | `position: absolute` top-right of poster |
| Smooth lift | `translateY(-6px)` on hover instead of `scale()` |
| Title link | `<Link to="/movies/:id">` on title and poster |

---

### 7. `src/components/MovieDetail.tsx` — New Page

Route: `/movies/:id`

Uses `useParams<{ id: string }>()` to get movie ID from URL. Converted to number with `Number(id)` to match `movie.id`. Back button uses `useNavigate(-1)` — browser history back.

**Phase 3 anchor:** The `{/* Phase 3: AI Recommendations panel */}` comment marks where `<RecommendationsPanel movieId={movie.id} />` will be inserted.

---

### 8. UI Enhancements

#### Aurora Background
4 slow-drifting gradient orbs in `App.tsx` — `position: fixed`, `filter: blur(90px)`, `opacity: 0.13`. Pure CSS `@keyframes`. Each orb has a different size, color (purple/orange/blue/pink), and animation duration (18–26s).

#### Nav Pills
Switched from `<Link>` to `<NavLink>` — automatically adds `active` class to current route. Active pill = solid orange (`#FFA100`) with black text. Watchlist shows count badge.

#### Filter Pills
`appearance: none` on `<select>` removes browser default styling. Custom `▾` arrow via `.filter-slot::after`. Label in muted uppercase. Orange border on focus.

#### Loading Screen — `LoadingScreen.tsx`
- Two counter-rotating CSS rings (orange + purple) at different speeds
- Pulsing 🎬 icon in centre
- 25 iconic dialogues (Hollywood + Bollywood + Dhurandhar 2026) shuffled with **Fisher-Yates** on every mount
- Quote fades in/out every 3.2s
- Live progress text at bottom

---

## Concepts Learned in Phase 1

| Concept | Where used |
|---------|-----------|
| TypeScript interfaces | `src/types/movie.ts` |
| Generic types (`useState<Movie[]>`) | All hooks and components |
| Type guards (`.filter((m): m is Movie => ...)`) | `Watchlist.tsx` |
| Custom hooks | `useMovies.ts`, `useWatchlist.ts` |
| `useMemo` for derived state | `MoviesGrid.tsx` |
| `useEffect` cleanup (cancelled flag) | `useMovies.ts` |
| Lazy `useState` initializer | `useWatchlist.ts` |
| Data transformation / adapter pattern | `tmdb.ts` `transformMovie()` |
| `Promise.all` for parallel requests | `tmdb.ts` `fetchAllPopularMovies()` |
| `localStorage` persistence | `useWatchlist.ts` |
| React Router `useParams` | `MovieDetail.tsx` |
| React Router `NavLink` active state | `App.tsx` |
| Fisher-Yates shuffle | `LoadingScreen.tsx` |
| CSS `aspect-ratio` | `styles.css` movie card poster |
| CSS `@keyframes` + `position: fixed` | Aurora background |
| CSS `appearance: none` custom select | Filter pills |

---

## How to Run

```bash
# 1. Create .env in project root
echo "REACT_APP_TMDB_API_KEY=your_key_here" > .env

# 2. Start dev server
npm start

# 3. Check TypeScript errors without building
npx tsc --noEmit
```

Get TMDB key free at: https://www.themoviedb.org/settings/api
