import logging
from flask import Blueprint, jsonify, request
from ..services.content_filter import similar_movies, watchlist_recommendations
from ..services.collab_filter import collab_filter
from ..services.data_cache import get_movies

log = logging.getLogger("routes.recommendations")
recs_bp = Blueprint("recommendations", __name__)


@recs_bp.route("/similar/<int:tmdb_id>")
def similar(tmdb_id: int):
    n = int(request.args.get("n", 10))
    log.info("GET /similar/%d n=%d", tmdb_id, n)
    results = similar_movies(tmdb_id, n)
    return jsonify({"results": results, "tmdbId": tmdb_id})


@recs_bp.route("/watchlist", methods=["POST"])
def watchlist():
    body = request.get_json(silent=True) or {}
    tmdb_ids: list = body.get("tmdb_ids", [])
    n = int(body.get("n", 10))
    if not tmdb_ids:
        log.warning("POST /watchlist called with empty tmdb_ids")
        return jsonify({"error": "tmdb_ids is required"}), 400
    log.info("POST /watchlist — %d movies, n=%d", len(tmdb_ids), n)
    results = watchlist_recommendations(tmdb_ids, n)
    return jsonify({"results": results})


@recs_bp.route("/collab/<user_id>")
def collab(user_id: str):
    n = int(request.args.get("n", 10))
    log.info("GET /collab/%s n=%d", user_id, n)
    movies = get_movies()
    candidate_ids = [m["tmdbId"] for m in movies]
    top_n = collab_filter.get_top_n(user_id, candidate_ids, n)
    # Enrich with full movie objects
    movie_map = {m["tmdbId"]: m for m in movies}
    results = [movie_map[mid] for mid, _ in top_n if mid in movie_map]
    return jsonify({"results": results, "userId": user_id})


@recs_bp.route("/ratings", methods=["POST"])
def submit_rating():
    body = request.get_json(silent=True) or {}
    user_id = body.get("user_id")
    movie_id = body.get("movie_id")
    rating = body.get("rating")
    if not user_id or movie_id is None or rating is None:
        return jsonify({"error": "user_id, movie_id, and rating are required"}), 400
    rating_val = float(rating)
    if not (1 <= rating_val <= 5):
        return jsonify({"error": "rating must be between 1 and 5"}), 400
    log.info("POST /ratings — user=%s movie=%s rating=%.1f", user_id, movie_id, rating_val)
    collab_filter.add_rating(str(user_id), int(movie_id), rating_val)
    return jsonify({"ok": True})
