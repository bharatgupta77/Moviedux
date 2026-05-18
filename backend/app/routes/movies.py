import logging
from flask import Blueprint, jsonify, request
from ..services.data_cache import get_movies
from ..services.tmdb_client import fetch_movie_detail, fetch_popular_page

log = logging.getLogger("routes.movies")
movies_bp = Blueprint("movies", __name__)


@movies_bp.route("/popular")
def popular():
    page = int(request.args.get("page", 1))
    all_movies = get_movies()
    if all_movies:
        per_page = 20
        start = (page - 1) * per_page
        end = start + per_page
        log.info("GET /popular page=%d → %d movies (total: %d)", page, len(all_movies[start:end]), len(all_movies))
        return jsonify({
            "results": all_movies[start:end],
            "total": len(all_movies),
            "page": page,
            "totalPages": (len(all_movies) + per_page - 1) // per_page,
        })
    log.warning("Cache not ready — falling back to direct TMDB fetch for page %d", page)
    return jsonify({"results": fetch_popular_page(page), "page": page})


@movies_bp.route("/search")
def search():
    q = request.args.get("q", "").strip().lower()
    if not q:
        return jsonify({"results": []})
    movies = [m for m in get_movies() if q in m["title"].lower()]
    log.info("GET /search q='%s' → %d results", q, len(movies[:50]))
    return jsonify({"results": movies[:50]})


@movies_bp.route("/<int:tmdb_id>")
def detail(tmdb_id: int):
    log.info("GET /movies/%d — fetching detail from TMDB", tmdb_id)
    try:
        movie = fetch_movie_detail(tmdb_id)
        return jsonify(movie)
    except Exception as e:
        log.error("Failed to fetch detail for tmdbId %d: %s", tmdb_id, e)
        return jsonify({"error": str(e)}), 500
