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
cd backend && python run.py  # http://localhost:5000
```

Get a free TMDB key at: https://www.themoviedb.org/settings/api

---

## Documentation

| File | Contents |
|------|----------|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | File map, data flow, design decisions |
| [`docs/PHASE-1.md`](docs/PHASE-1.md) | ✅ TypeScript migration + TMDB API — complete recap + learnings |
| [`docs/PHASE-2-PLAN.md`](docs/PHASE-2-PLAN.md) | 🔜 Python Flask + TF-IDF content filtering |
| [`docs/PHASE-3-PLAN.md`](docs/PHASE-3-PLAN.md) | 🔜 SVD collaborative filtering + Claude API |
| [`docs/PHASE-4-PLAN.md`](docs/PHASE-4-PLAN.md) | 🔜 SQLite persistence + UI polish |
| [`docs/CONCEPTS.md`](docs/CONCEPTS.md) | Plain-English guide to every concept used |

---

## Phase Progress

- [x] **Phase 1** — TypeScript, TMDB API, custom hooks, pagination, enhanced UI
- [ ] **Phase 2** — Python Flask backend, TF-IDF recommendations
- [ ] **Phase 3** — SVD collaborative filtering, Claude API chat
- [ ] **Phase 4** — SQLite, skeleton screens, infinite scroll

---

## Useful Commands

```bash
npx tsc --noEmit                          # check TypeScript errors
localStorage.getItem('moviedux_watchlist') # inspect watchlist in browser console
localStorage.clear()                       # reset all stored data
```