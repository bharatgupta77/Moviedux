# MovieDux — Architecture & File Reference

## Project Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, React Router v6 |
| Styling | Pure CSS (no framework), CSS custom animations |
| Data | TMDB API (free) |
| State | React Hooks only (no Redux/Zustand) |
| Persistence | localStorage (Phase 1), SQLite via SQLAlchemy (Phase 4) |
| Backend | Python Flask (Phase 2+) |
| ML | scikit-learn TF-IDF, scikit-surprise SVD (Phase 2-3) |
| AI | Anthropic Claude API (Phase 3) |

---

## Frontend File Map

```
src/
├── types/
│   └── movie.ts                    ← Movie interface — single source of truth for data shape
│
├── services/
│   ├── tmdb.ts                     ← TMDB API calls + data transformation (genre IDs → names)
│   └── api.ts                      ← Flask backend calls (similar movies, watchlist recs)
│
├── hooks/
│   ├── useMovies.ts                ← Fetches all TMDB pages, manages loading/error state
│   ├── useWatchlist.ts             ← Watchlist state with localStorage persistence
│   ├── useMoviesGrid.ts            ← Filter state, pagination, derived values for MoviesGrid
│   └── useMovieDetail.ts           ← Fetch + carousel state for MovieDetail
│
├── components/
│   ├── Header.tsx                  ← Logo + subtitle (presentational)
│   ├── Footer.tsx                  ← Copyright (presentational)
│   ├── MovieCard.tsx               ← Single movie card with hover overlay + rating badge
│   ├── MoviesGrid.tsx              ← Search + filter + pagination grid (pure JSX)
│   ├── Watchlist.tsx               ← Watchlist page
│   ├── MovieDetail.tsx             ← /movies/:id page layout (pure JSX)
│   ├── StarRating.tsx              ← Star display + rating colour helper
│   ├── MovieDNA.tsx                ← DNA card (audience score, buzz, intensity, pacing)
│   ├── CastCard.tsx                ← Cast avatar with shimmer skeleton
│   ├── LoadingScreen.tsx           ← Animated loader with rotating movie dialogues
│   ├── RecommendationsPanel.tsx    ← "More Like This" on detail page (TF-IDF)
│   └── WatchlistRecommendations.tsx← "Recommended For You" on watchlist page (TF-IDF)
│
├── styles/
│   ├── global.css                  ← Reset, aurora, nav, header, footer, error/empty states
│   ├── MovieCard.css
│   ├── MoviesGrid.css              ← Search bar, filters, grid, pagination
│   ├── MovieDetail.css             ← All md-* classes, star rating, DNA, cast
│   ├── LoadingScreen.css
│   └── Recommendations.css         ← All rp-* classes (shared by both panels)
│
├── App.tsx                         ← Thin shell: calls hooks, wires routes
├── declarations.d.ts               ← Tells TypeScript that .css/.svg imports are valid
└── react-app-env.d.ts              ← CRA TypeScript reference
```

## Backend File Map (Phase 2+)

```
backend/
├── app/
│   ├── __init__.py           ← Flask app factory, registers blueprints
│   ├── routes/
│   │   ├── movies.py         ← TMDB proxy endpoints
│   │   └── recommendations.py ← Content filter + collaborative filter endpoints
│   ├── services/
│   │   ├── tmdb_client.py    ← Server-side TMDB calls (hides API key)
│   │   ├── content_filter.py ← TF-IDF + cosine similarity (scikit-learn)
│   │   ├── collab_filter.py  ← SVD matrix factorization (scikit-surprise)
│   │   └── claude_client.py  ← Claude API — NL search + streaming explanations
│   └── models/
│       ├── rating.py         ← SQLAlchemy Rating model
│       └── watchlist.py      ← SQLAlchemy WatchlistItem model
├── data/
│   ├── movies_cache.json     ← TMDB data cached at startup
│   └── generate_ratings.py  ← Script to seed synthetic user ratings
├── .env                      ← TMDB_API_KEY, ANTHROPIC_API_KEY (never commit)
├── requirements.txt
└── run.py                    ← Entry point: python run.py
```

---

## Data Flow

```
Browser
  │
  ├─ GET /                    → MoviesGrid (search, filter, paginate)
  ├─ GET /watchlist           → Watchlist page
  └─ GET /movies/:id          → MovieDetail page
          │
          ↓
      useMovies hook
          │
          ↓
      src/services/tmdb.ts    (Phase 1: direct)
          │                   (Phase 2+: via Flask /api/movies/*)
          ↓
      TMDB API  /  Flask backend
```

---

## Key Design Decisions

| Decision | Why |
|----------|-----|
| Custom hooks over logic in App.tsx | Separation of concerns — App only wires routes |
| Logic extracted into `useMoviesGrid` / `useMovieDetail` | `.tsx` files are pure JSX; all state + effects live in hooks |
| Sub-components extracted from MovieDetail | `StarRating`, `MovieDNA`, `CastCard` each in their own file — easier to find and reuse |
| CSS split into `src/styles/` per component | 1349-line monolith → 6 focused files; edit MovieCard styles without scrolling past DNA styles |
| Service file for TMDB calls | Single place to change if backend replaces TMDB direct calls |
| `useMemo` for filter/genre derivation | Avoids recalculating on every keystroke |
| `localStorage` for watchlist | Persistence without a backend in Phase 1 |
| Remap backend rec IDs to internal IDs | Backend returns TMDB IDs; watchlist stores internal IDs — remap via `allMovies.find(m => m.tmdbId === r.id)` to keep them in sync |
| Fisher-Yates shuffle in LoadingScreen | True randomness without bias toward early items |
| `NavLink` over `Link` for nav | Built-in active state detection per route |
| Aurora in CSS only | Zero JS overhead, pure `@keyframes` |
| `aspect-ratio: 3/4` on posters | Uniform card heights regardless of TMDB image dimensions |
