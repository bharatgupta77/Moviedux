"""
TF-IDF content-based recommendation engine.

HOW IT WORKS:
  1. Build a text "document" for each movie: title + overview + genres + cast names
  2. Fit a TF-IDF vectorizer on all documents → sparse matrix (movies × terms)
  3. For "similar to movie X": cosine similarity between X's vector and all others
  4. For "watchlist recs": average watchlist vectors → cosine similarity against catalog
"""
import logging
import threading
import time

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .data_cache import get_movies

log = logging.getLogger("content_filter")

_vectorizer = None
_matrix = None
_id_to_idx: dict = {}
_movies_snapshot: list = []
_fit_lock = threading.Lock()


def _build_corpus(movies: list) -> list:
    docs = []
    for m in movies:
        cast_names = " ".join(c["name"] for c in m.get("cast", []))
        doc = f"{m['title']} {m['title']} {m['overview']} {m['genre']} {cast_names}"
        docs.append(doc.lower())
    return docs


def _ensure_fitted() -> None:
    global _vectorizer, _matrix, _id_to_idx, _movies_snapshot

    movies = get_movies()
    if not movies:
        log.warning("No movies in cache — cannot fit TF-IDF")
        return

    with _fit_lock:
        if _vectorizer is not None and len(_movies_snapshot) == len(movies):
            return

        log.info("Fitting TF-IDF on %d movies...", len(movies))
        t0 = time.time()

        corpus = _build_corpus(movies)
        vec = TfidfVectorizer(stop_words="english", max_features=8000, ngram_range=(1, 2))
        mat = vec.fit_transform(corpus)

        _vectorizer = vec
        _matrix = mat
        _movies_snapshot = movies
        _id_to_idx = {m["tmdbId"]: i for i, m in enumerate(movies)}

        log.info("TF-IDF ready — %d movies × %d features (%.2fs)", mat.shape[0], mat.shape[1], time.time() - t0)


def similar_movies(tmdb_id: int, n: int = 10) -> list:
    _ensure_fitted()
    if _matrix is None:
        log.error("TF-IDF matrix not available")
        return []
    if tmdb_id not in _id_to_idx:
        log.warning("tmdbId %d not found in index", tmdb_id)
        return []

    idx = _id_to_idx[tmdb_id]
    scores = cosine_similarity(_matrix[idx], _matrix).flatten()
    scores[idx] = -1

    top_indices = np.argsort(scores)[::-1][:n]
    results = [
        {**_movies_snapshot[i], "similarityScore": round(float(scores[i]), 4)}
        for i in top_indices if scores[i] > 0
    ]
    log.info("similar_movies(%d) → %d results (top score: %.4f)", tmdb_id, len(results), results[0]["similarityScore"] if results else 0)
    return results


def watchlist_recommendations(tmdb_ids: list, n: int = 10) -> list:
    _ensure_fitted()
    if _matrix is None:
        return []

    valid_indices = [_id_to_idx[tid] for tid in tmdb_ids if tid in _id_to_idx]
    if not valid_indices:
        log.warning("None of the watchlist tmdb_ids found in index: %s", tmdb_ids)
        return []

    profile_vec = np.asarray(_matrix[valid_indices].mean(axis=0))
    scores = cosine_similarity(profile_vec, _matrix).flatten()
    for i in valid_indices:
        scores[i] = -1

    top_indices = np.argsort(scores)[::-1][:n]
    results = [
        {**_movies_snapshot[i], "similarityScore": round(float(scores[i]), 4)}
        for i in top_indices if scores[i] > 0
    ]
    log.info("watchlist_recs(%d movies) → %d results", len(tmdb_ids), len(results))
    return results
