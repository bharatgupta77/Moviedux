# MovieDux — Project Index

Full-stack AI-powered movie recommendation platform.  
Built as a learning project covering React, TypeScript, Python Flask, ML, and Claude API.

---

## Quick Start

```bash
# 1. Add your TMDB API key to .env
echo "REACT_APP_TMDB_API_KEY=your_key_here" > .env

# 2. Run the frontend
npm start                  # http://localhost:3000

# 3. Run the backend (Phase 2+)
cd backend && python run.py  # http://localhost:8000
```

Get a free TMDB key at: https://www.themoviedb.org/settings/api

---

## Documentation

| File | Contents |
|------|----------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | File map, data flow, design decisions |
| [`docs/PHASE-1.md`](docs/PHASE-1.md) | ✅ TypeScript migration + TMDB API — complete recap + learnings |
| [`docs/PHASE-2-PLAN.md`](docs/PHASE-2-PLAN.md) | ✅ Python Flask + TF-IDF content filtering — complete |
| [`docs/PHASE-3-PLAN.md`](docs/PHASE-3-PLAN.md) | 🔜 SVD collaborative filtering + Claude API |
| [`docs/PHASE-4-PLAN.md`](docs/PHASE-4-PLAN.md) | 🔜 SQLite persistence + UI polish |
| [`docs/CONCEPTS.md`](docs/CONCEPTS.md) | Plain-English guide to every concept used |
| [`docs/CODE-TMDB-SERVICE.md`](docs/CODE-TMDB-SERVICE.md) | Deep dive: how `tmdb.ts` works section by section |

---

## Phase Progress

- [x] **Phase 1** — TypeScript, TMDB API, custom hooks, pagination, enhanced UI
- [x] **Phase 1.5** — MovieDetail page full redesign (see below)
- [x] **Phase 2** — Python Flask backend, TF-IDF recommendations, WatchlistRecommendations UI
- [ ] **Phase 3** — SVD collaborative filtering, Claude API chat + AI Mood Picker + Taste Profile (Claude label)
- [ ] **Phase 4** — SQLite, skeleton screens, infinite scroll + Movie DNA polish + Taste Profile (radar chart)

---

## MovieDetail Page — What's Built

`src/components/MovieDetail.tsx` — full detail page at `/movies/:id`

### Data (all fetched in parallel via `Promise.all`)
| Field | Source |
|-------|--------|
| Title, genres, overview, rating, year | TMDB `/movie/{id}` |
| Runtime | TMDB `/movie/{id}` → `runtime` |
| Director | TMDB `/movie/{id}/credits` → crew where `job === 'Director'` |
| Cast (15 members) | TMDB `/movie/{id}/credits` → cast with `name`, `character`, `profile_path` |
| Trailer | TMDB `/movie/{id}/videos` → first official YouTube trailer |

### Layout (top → bottom inside blurred hero)
1. **Back button** — glassmorphism pill, top-left
2. **Poster + Info row**
   - Poster (220px, rounded)
   - Info column: title → tags (year + genre pills) → star rating → runtime/director meta → overview → CTA buttons
   - DNA card (240px right column, aligned from tags row)
3. **Cast carousel** — starts from poster's left edge, extends full width
   - 4 visible at a time, ‹ › nav buttons, 15 total members
   - 180×180px circular avatars with shimmer skeleton while loading
   - Orange ring on hover

### Movie DNA Card
Derived purely from existing TMDB data — no extra API calls:
| Metric | Calculation |
|--------|-------------|
| Audience Score | `rating × 10` |
| Buzz | `popularity / 400` normalized |
| Intensity | Genre keywords (Action/Thriller/Horror = high, Drama/Sci-Fi = med) |
| Pacing | Runtime inverted (90min = fast 100%, 210min = slow 0%) |

- 4 rows vertical, each with animated bar (CSS `@keyframes dna-grow`) + big colored number
- Vibe tags below: matched moods from `MOOD_MAP`

### Buttons
- **+ Add to Watchlist** / **✓ In Watchlist** — orange CTA, toggles
- **▶ Watch Trailer** — opens YouTube in new tab, only shown if TMDB has a trailer, turns red on hover

---

## Unique Features (vs IMDB)
| Feature | Status |
|---------|--------|
| Mood filter (8 moods → genre map) | ✅ Done — home page filter |
| Movie DNA card (visual metrics) | ✅ Done — detail page |
| AI Mood Picker chat ("I'm feeling...") | Phase 3 — Claude API |
| Taste Profile — Claude personality label | Phase 3 |
| Taste Profile — radar chart + stats | Phase 4 |
| Movie Night Mode (swipe to match) | Future |

---

## Key Files

| File | Purpose |
|------|---------|
| `src/types/movie.ts` | `Movie` interface, `CastMember`, `Mood`, `MOOD_MAP`, `MOOD_EMOJI` |
| `src/services/tmdb.ts` | All TMDB API calls — `fetchAllPopularMovies`, `fetchMovieById` (detail+credits+videos) |
| `src/services/api.ts` | Flask backend calls — `fetchSimilarMovies`, `fetchWatchlistRecommendations` |
| `src/hooks/useMovies.ts` | Fetches all movies with progress, returns `{movies, loading, loadingProgress, error}` |
| `src/hooks/useWatchlist.ts` | localStorage-persisted watchlist |
| `src/hooks/useMoviesGrid.ts` | Filter state, pagination logic, derived values for MoviesGrid |
| `src/hooks/useMovieDetail.ts` | Fetch + carousel state for MovieDetail |
| `src/components/MovieDetail.tsx` | Detail page layout — blurred hero, cast, trailer, buttons |
| `src/components/StarRating.tsx` | Star rating display + rating colour (good/ok/bad) |
| `src/components/MovieDNA.tsx` | DNA card — audience score, buzz, intensity, pacing bars + vibe tags |
| `src/components/CastCard.tsx` | Single cast member avatar with shimmer skeleton |
| `src/components/MoviesGrid.tsx` | Home grid JSX — search, filter bar, pagination |
| `src/components/MovieCard.tsx` | Card with hover overlay, rating badge, poster link |
| `src/components/LoadingScreen.tsx` | Dual spinning rings + rotating movie dialogues (Hollywood + Bollywood) |
| `src/components/RecommendationsPanel.tsx` | "More Like This" panel on detail page (TF-IDF) |
| `src/components/WatchlistRecommendations.tsx` | "Recommended For You" panel on watchlist page (TF-IDF) |
| `src/styles/global.css` | Reset, aurora, nav, header, footer, error/empty states |
| `src/styles/MovieCard.css` | Card, poster, hover overlay, watchlist toggle |
| `src/styles/MoviesGrid.css` | Search bar, filters, grid, pagination |
| `src/styles/MovieDetail.css` | All `md-*` classes, star rating, DNA, cast |
| `src/styles/LoadingScreen.css` | Spinner rings, quote fade animation |
| `src/styles/Recommendations.css` | All `rp-*` classes (shared by both recommendation panels) |

---

## Useful Commands

```bash
npx tsc --noEmit                           # check TypeScript errors
npm run build                              # production build check
localStorage.getItem('moviedux_watchlist') # inspect watchlist in browser console
localStorage.clear()                       # reset all stored data
```
