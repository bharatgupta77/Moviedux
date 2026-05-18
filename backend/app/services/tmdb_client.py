import os
import requests
from dotenv import load_dotenv

load_dotenv()

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
API_KEY = os.getenv("TMDB_API_KEY")

_genre_cache: dict = None


def _get(path: str, **params) -> dict:
    resp = requests.get(f"{TMDB_BASE}{path}", params={"api_key": API_KEY, **params}, timeout=10)
    resp.raise_for_status()
    return resp.json()


def fetch_genre_map() -> dict[int, str]:
    global _genre_cache
    if _genre_cache is None:
        data = _get("/genre/movie/list")
        _genre_cache = {g["id"]: g["name"] for g in data["genres"]}
    return _genre_cache


def _transform(raw: dict, genre_map: dict[int, str]) -> dict:
    genres = [genre_map.get(gid, "Unknown") for gid in raw.get("genre_ids", [])[:3]]
    return {
        "id": raw["id"],
        "tmdbId": raw["id"],
        "title": raw["title"],
        "posterPath": f"{TMDB_IMAGE_BASE}{raw['poster_path']}" if raw.get("poster_path") else "",
        "genre": ", ".join(genres),
        "rating": round(raw.get("vote_average", 0) * 10) / 10,
        "overview": raw.get("overview", ""),
        "releaseYear": int(raw["release_date"][:4]) if raw.get("release_date") else 0,
        "popularity": raw.get("popularity", 0),
    }


def fetch_popular_page(page: int = 1) -> list[dict]:
    genre_map = fetch_genre_map()
    data = _get("/movie/popular", page=page)
    return [_transform(m, genre_map) for m in data["results"]]


def fetch_movie_detail(tmdb_id: int) -> dict:
    genre_map = fetch_genre_map()
    detail, credits, videos = (
        _get(f"/movie/{tmdb_id}"),
        _get(f"/movie/{tmdb_id}/credits"),
        _get(f"/movie/{tmdb_id}/videos"),
    )
    genre_ids = [g["id"] for g in detail.get("genres", [])]
    base = _transform({**detail, "genre_ids": genre_ids}, genre_map)

    cast = [
        {
            "name": c["name"],
            "character": c["character"],
            "profilePath": f"{TMDB_IMAGE_BASE}{c['profile_path']}" if c.get("profile_path") else "",
        }
        for c in credits.get("cast", [])[:15]
    ]
    director = next(
        (c["name"] for c in credits.get("crew", []) if c["job"] == "Director"), ""
    )
    trailer = next(
        (v for v in videos.get("results", []) if v["site"] == "YouTube" and v["type"] == "Trailer" and v.get("official")),
        next((v for v in videos.get("results", []) if v["site"] == "YouTube" and v["type"] == "Trailer"), None),
    )
    return {
        **base,
        "runtime": detail.get("runtime") or 0,
        "director": director,
        "cast": cast,
        "trailerKey": trailer["key"] if trailer else "",
    }
