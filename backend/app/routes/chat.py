import logging
from flask import Blueprint, jsonify, request, Response, stream_with_context
from ..services.gemini_client import get_recommendations_from_query, stream_explanation
from ..services.data_cache import get_movies

log = logging.getLogger("routes.chat")
chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/message", methods=["POST"])
def message():
    body = request.get_json(silent=True) or {}
    query = (body.get("query") or "").strip()
    if not query:
        return jsonify({"error": "query is required"}), 400

    log.info("POST /chat/message — query: %r", query[:80])
    movies = get_movies()
    result = get_recommendations_from_query(query, movies)

    if result.get("type") == "chat":
        return jsonify({"type": "chat", "message": result.get("message", "")})

    recommended_ids = set(result.get("recommended_ids", []))
    movie_map = {m["tmdbId"]: m for m in movies}
    matched = [movie_map[mid] for mid in recommended_ids if mid in movie_map]

    return jsonify({
        "type": "movies",
        "reasoning": result.get("reasoning", ""),
        "movies": matched,
    })


@chat_bp.route("/explain", methods=["POST"])
def explain():
    body = request.get_json(silent=True) or {}
    movie = body.get("movie", {})
    reasons = body.get("reasons", {})

    if not movie:
        return jsonify({"error": "movie is required"}), 400

    log.info("POST /chat/explain — movie: %r", movie.get("title", "?"))

    return Response(
        stream_with_context(stream_explanation(movie, reasons)),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    )
