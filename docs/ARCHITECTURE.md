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
│   └── movie.ts              ← Movie interface — single source of truth for data shape
│
├── services/
│   └── tmdb.ts               ← All TMDB API calls + data transformation (genre IDs → names)
│
├── hooks/
│   ├── useMovies.ts          ← Fetches all TMDB pages, manages loading/error state
│   └── useWatchlist.ts       ← Watchlist state with localStorage persistence
│
├── components/
│   ├── Header.tsx            ← Logo + subtitle (presentational)
│   ├── Footer.tsx            ← Copyright (presentational)
│   ├── MovieCard.tsx         ← Single movie card with hover overlay + rating badge
│   ├── MoviesGrid.tsx        ← Search + filter + pagination grid
│   ├── Watchlist.tsx         ← Watchlist page
│   ├── MovieDetail.tsx       ← /movies/:id page (Phase 3 AI panel anchor)
│   └── LoadingScreen.tsx     ← Animated loader with rotating movie dialogues
│
├── App.tsx                   ← Thin shell: calls hooks, wires routes
├── styles.css                ← All styles (aurora, cards, pagination, nav, loader)
├── declarations.d.ts         ← Tells TypeScript that .css/.svg imports are valid
└── react-app-env.d.ts        ← CRA TypeScript reference
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
| Service file for TMDB calls | Single place to change if backend replaces TMDB |
| `useMemo` for filter/genre derivation | Avoids recalculating on every keystroke |
| `localStorage` for watchlist | Persistence without a backend in Phase 1 |
| Fisher-Yates shuffle in LoadingScreen | True randomness without bias toward early items |
| `NavLink` over `Link` for nav | Built-in active state detection per route |
| Aurora in CSS only | Zero JS overhead, pure `@keyframes` |
| `aspect-ratio: 3/4` on posters | Uniform card heights regardless of TMDB image dimensions |
