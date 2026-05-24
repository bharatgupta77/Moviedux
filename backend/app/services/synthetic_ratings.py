"""
Generates a synthetic ratings DataFrame to cold-start the SVD model.
200 fake users × 30–50 movies each, seeded from TMDB popularity + genre affinity.
Deterministic: random_state=42 gives identical output on every restart.
"""
import numpy as np
import pandas as pd

from .data_cache import get_movies

N_USERS = 200
MIN_RATINGS = 30
MAX_RATINGS = 50
RANDOM_STATE = 42


def generate_synthetic_ratings() -> pd.DataFrame:
    rng = np.random.default_rng(RANDOM_STATE)
    movies = get_movies()
    if not movies:
        return pd.DataFrame(columns=["user_id", "movie_id", "rating"])

    # Build a numeric popularity score (0–1) for each movie
    popularities = np.array([m.get("popularity", 0) for m in movies], dtype=float)
    max_pop = popularities.max() or 1.0
    pop_scores = popularities / max_pop  # 0–1

    # All unique genres in the catalog
    all_genres: list[str] = list({
        g.strip()
        for m in movies
        for g in str(m.get("genre", "")).split(",")
        if g.strip()
    })
    if not all_genres:
        all_genres = ["Action"]

    movie_ids = [m["tmdbId"] for m in movies]
    movie_genres = [str(m.get("genre", "")) for m in movies]

    rows: list[dict] = []

    for user_idx in range(N_USERS):
        user_id = f"synthetic_{user_idx}"
        # Each synthetic user has a favourite genre — higher affinity boost for it
        fav_genre = all_genres[rng.integers(0, len(all_genres))]

        n_ratings = int(rng.integers(MIN_RATINGS, MAX_RATINGS + 1))
        # Sample movies weighted by popularity so popular movies get more coverage
        weights = pop_scores + 0.1  # avoid zero-weight
        weights /= weights.sum()
        chosen_idxs = rng.choice(len(movies), size=n_ratings, replace=False, p=weights)

        for idx in chosen_idxs:
            base = pop_scores[idx] * 3.5 + 1.0      # 1.0 – 4.5 range
            genre_boost = 0.8 if fav_genre in movie_genres[idx] else 0.0
            noise = rng.normal(0, 0.4)
            rating = float(np.clip(base + genre_boost + noise, 1.0, 5.0))
            rows.append({
                "user_id": user_id,
                "movie_id": str(movie_ids[idx]),
                "rating": round(rating, 1),
            })

    return pd.DataFrame(rows, columns=["user_id", "movie_id", "rating"])
