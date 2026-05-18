"""
In-memory movie cache. Populated once at startup by fetching TMDB popular movies.
All other services import `get_movies()` instead of calling TMDB directly.
"""
import json
import logging
import os
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

from .tmdb_client import fetch_popular_page

log = logging.getLogger("data_cache")

CACHE_FILE = os.path.join(os.path.dirname(__file__), "../../data/movies_cache.json")
MAX_PAGES = 500  # TMDB hard cap — 500 pages × 20 = ~10,000 movies
BATCH = 40

_movies: list = []
_lock = threading.Lock()
_ready = threading.Event()


def get_movies() -> list:
    _ready.wait()
    return _movies


def _load_cache_file():
    path = os.path.abspath(CACHE_FILE)
    if os.path.exists(path):
        log.info("Found movies_cache.json — loading from disk...")
        with open(path) as f:
            return json.load(f)
    return None


def _save_cache_file(movies: list) -> None:
    path = os.path.abspath(CACHE_FILE)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(movies, f)
    log.info("Saved %d movies to movies_cache.json", len(movies))


def _fetch_all() -> list:
    all_movies: list = []
    pages = list(range(1, MAX_PAGES + 1))
    total_batches = (len(pages) + BATCH - 1) // BATCH
    failed = 0

    log.info("Starting fetch: %d pages in batches of %d (%d batches total)", MAX_PAGES, BATCH, total_batches)
    t0 = time.time()

    for batch_num, batch_start in enumerate(range(0, len(pages), BATCH), start=1):
        batch = pages[batch_start: batch_start + BATCH]
        with ThreadPoolExecutor(max_workers=BATCH) as ex:
            futures = {ex.submit(fetch_popular_page, p): p for p in batch}
            for fut in as_completed(futures):
                try:
                    all_movies.extend(fut.result())
                except Exception as e:
                    failed += 1
                    log.warning("Page %d failed: %s", futures[fut], e)

        elapsed = time.time() - t0
        log.info("Batch %d/%d done — %d movies so far (%.1fs elapsed)", batch_num, total_batches, len(all_movies), elapsed)

    # Deduplicate by tmdbId
    seen: set = set()
    unique: list = []
    for m in all_movies:
        if m["tmdbId"] not in seen:
            seen.add(m["tmdbId"])
            unique.append(m)

    total_time = time.time() - t0
    log.info("Fetch complete — %d unique movies in %.1fs (%d pages failed)", len(unique), total_time, failed)
    return unique


def init_cache(force_refresh: bool = False) -> None:
    global _movies

    def _run():
        global _movies
        cached = None if force_refresh else _load_cache_file()
        if cached:
            log.info("Cache hit — %d movies loaded from disk instantly", len(cached))
            with _lock:
                _movies = cached
        else:
            log.info("Cache miss — fetching from TMDB (this runs once ever)...")
            fetched = _fetch_all()
            _save_cache_file(fetched)
            with _lock:
                _movies = fetched
        _ready.set()
        log.info("Movie cache READY — %d movies available", len(_movies))

    t = threading.Thread(target=_run, daemon=True, name="cache-loader")
    t.start()
    log.info("Cache loader started in background thread")
