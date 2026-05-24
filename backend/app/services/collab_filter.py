"""
SVD collaborative filter.
Trained once at startup on synthetic ratings; real user ratings appended in memory.
Phase 4 will replace the in-memory store with SQLite.
"""
import logging
from surprise import SVD, Dataset, Reader
import pandas as pd

log = logging.getLogger("collab_filter")


class CollaborativeFilter:
    def __init__(self):
        self.model = SVD(n_factors=50, n_epochs=20, random_state=42)
        self._fitted = False
        self._extra_rows: list[dict] = []  # real user ratings added at runtime

    def fit(self, ratings_df: pd.DataFrame) -> None:
        if ratings_df.empty:
            log.warning("CollaborativeFilter.fit called with empty DataFrame — skipping")
            return
        log.info("Training SVD on %d ratings from %d users…",
                 len(ratings_df), ratings_df["user_id"].nunique())
        reader = Reader(rating_scale=(1, 5))
        data = Dataset.load_from_df(ratings_df[["user_id", "movie_id", "rating"]], reader)
        self.model.fit(data.build_full_trainset())
        self._fitted = True
        log.info("SVD training complete")

    def get_top_n(self, user_id: str, candidate_ids: list, n: int = 10) -> list[tuple]:
        """Return [(movie_id, predicted_score), ...] sorted best-first."""
        if not self._fitted:
            log.warning("get_top_n called before fit — returning empty list")
            return []
        preds = [
            (mid, self.model.predict(str(user_id), str(mid)).est)
            for mid in candidate_ids
        ]
        return sorted(preds, key=lambda x: x[1], reverse=True)[:n]

    def add_rating(self, user_id: str, movie_id: int, rating: float) -> None:
        """Store a real user rating in memory (used for future retrains)."""
        self._extra_rows.append({
            "user_id": str(user_id),
            "movie_id": str(movie_id),
            "rating": float(rating),
        })
        log.debug("Stored rating: user=%s movie=%s rating=%.1f", user_id, movie_id, rating)


# Module-level singleton — imported by routes
collab_filter = CollaborativeFilter()
