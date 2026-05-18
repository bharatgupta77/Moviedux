import logging
from flask import Blueprint, jsonify, request
from ..services.content_filter import similar_movies, watchlist_recommendations

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
