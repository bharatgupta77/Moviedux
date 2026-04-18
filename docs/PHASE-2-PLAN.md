# Phase 2 — Python Flask Backend + NLP Content Filtering

**Status:** 🔜 Next  
**Estimated time:** 3–4 days

---

## Goal

Move TMDB calls server-side (API key hidden), build a REST API in Python Flask, and implement **TF-IDF + cosine similarity** content-based movie recommendations.

---

## What You'll Learn

- Flask Blueprints (how to organize a Python API into modules)
- REST API design: resource naming, HTTP verbs, status codes
- CORS — why browsers block cross-origin requests and how `flask-cors` fixes it
- **TF-IDF**: terms that appear in few documents get high weight ("cyberpunk" is more meaningful than "the")
- **Cosine similarity**: measures angle between vectors — better than Euclidean distance for sparse text data
- scikit-learn `fit` / `transform` pattern (same pattern used for ALL sklearn models)
- The concept of a user profile vector (averaging item vectors)

---

## Setup

```bash
mkdir backend && cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install flask flask-cors scikit-learn pandas requests python-dotenv
pip freeze > requirements.txt
```

---

## Backend Structure

```
backend/
├── app/
│   ├── __init__.py            ← Flask app factory
│   ├── routes/
│   │   ├── movies.py          ← /api/movies/* (TMDB proxy)
│   │   └── recommendations.py ← /api/recommendations/*
│   ├── services/
│   │   ├── tmdb_client.py     ← Server-side TMDB calls
│   │   ├── content_filter.py  ← TF-IDF model
│   │   └── data_cache.py      ← In-memory movie store (500 movies)
├── data/
│   └── movies_cache.json
├── .env
├── requirements.txt
└── run.py
```

---

## Flask App Factory Pattern

```python
# app/__init__.py
from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000"])

    from .routes.movies import movies_bp
    from .routes.recommendations import recs_bp
    app.register_blueprint(movies_bp, url_prefix='/api/movies')
    app.register_blueprint(recs_bp, url_prefix='/api/recommendations')

    return app
```

**Why Blueprints?** Each file in `routes/` is a self-contained mini-app registered at a URL prefix. Same idea as React Router's `<Route>` nesting.

---

## API Endpoints

### Movies (`/api/movies`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/movies/popular?page=1` | Popular movies (TMDB proxied) |
| GET | `/api/movies/search?q=inception` | Search by title |
| GET | `/api/movies/:id` | Full movie detail |
| GET | `/api/movies/genres` | All genre IDs + names |

### Recommendations (`/api/recommendations`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/recommendations/similar/:movieId` | TF-IDF similar movies |
| POST | `/api/recommendations/batch` | `{ movie_ids: [] }` → watchlist-based recs |

---

## The TF-IDF Content Filter

```python
# app/services/content_filter.py
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

class ContentFilter:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
        self.tfidf_matrix = None
        self.movies_df = None

    def fit(self, movies: list[dict]):
        # Each movie becomes one "document": title + overview + genres + cast
        corpus = [
            f"{m['title']} {m['overview']} {m['genres']} {m.get('cast', '')}"
            for m in movies
        ]
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)

    def get_similar(self, movie_id: int, n=10) -> list[dict]:
        idx = self.movies_df.index[self.movies_df['id'] == movie_id][0]
        scores = cosine_similarity(self.tfidf_matrix[idx], self.tfidf_matrix).flatten()
        top = np.argsort(scores)[::-1][1:n+1]   # skip index 0 (itself)
        return self.movies_df.iloc[top].to_dict('records')

    def get_watchlist_recommendations(self, movie_ids: list[int], n=10) -> list[dict]:
        # Average the TF-IDF vectors of all watchlist movies = "user profile vector"
        indices = [self.movies_df.index[self.movies_df['id'] == mid][0] for mid in movie_ids]
        profile = self.tfidf_matrix[indices].mean(axis=0)
        scores = cosine_similarity(profile, self.tfidf_matrix).flatten()
        seen = set(movie_ids)
        results = []
        for idx in np.argsort(scores)[::-1]:
            movie = self.movies_df.iloc[idx].to_dict()
            if movie['id'] not in seen:
                results.append(movie)
            if len(results) >= n:
                break
        return results
```

The `ContentFilter` instance is created **once at app startup**, fitted with ~500 TMDB movies, stored as an app-level singleton. Fit once → predict many times.

---

## Frontend Changes for Phase 2

### `src/services/api.ts` (new)
All calls go to `http://localhost:5000/api/...` instead of TMDB directly.

```typescript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const api = {
  getPopularMovies: (page: number) =>
    axios.get<Movie[]>(`${API_BASE}/api/movies/popular?page=${page}`),
  getSimilarMovies: (movieId: number) =>
    axios.get<Movie[]>(`${API_BASE}/api/recommendations/similar/${movieId}`),
  getWatchlistRecs: (ids: number[]) =>
    axios.post<Movie[]>(`${API_BASE}/api/recommendations/batch`, { movie_ids: ids }),
};
```

### New components
- `RecommendationsPanel.tsx` — "Similar Movies" on MovieDetail page
- `WatchlistRecommendations.tsx` — "Because you watched…" on /watchlist

---

## Run Phase 2

```bash
# Terminal 1 — Frontend
npm start

# Terminal 2 — Backend
cd backend
source venv/bin/activate
python run.py
```

Add to `.env`:
```
REACT_APP_API_URL=http://localhost:5000
```
