"""
Groq AI client for MovieDux Phase 3.
Two features:
  1. get_recommendations_from_query — NL search → JSON {reasoning, recommended_ids}
  2. stream_explanation — SSE generator for "why was this recommended?"
Uses llama-3.3-70b-versatile via Groq's free tier API.
"""
import json
import logging
import os
from typing import Optional

from groq import Groq

log = logging.getLogger("gemini_client")

_client: Optional[Groq] = None
MODEL = "llama-3.1-8b-instant"


def _get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            raise EnvironmentError("GROQ_API_KEY not set in environment")
        _client = Groq(api_key=api_key)
    return _client


def get_recommendations_from_query(user_query: str, catalog: list[dict]) -> dict:
    """
    Send a natural language movie query to Groq/Llama.
    Returns: { "reasoning": str, "recommended_ids": [int, ...] }
    """
    try:
        client = _get_client()
    except EnvironmentError as exc:
        log.error("Groq not configured: %s", exc)
        return {"reasoning": "GROQ_API_KEY is not set. Add it to .env and restart the backend.", "recommended_ids": []}

    slim_catalog = [
        {
            "id": m.get("tmdbId") or m.get("id"),
            "title": m["title"],
            "genre": m.get("genre", ""),
        }
        for m in catalog[:100]
    ]

    system_prompt = (
        "You are a warm, conversational movie recommendation assistant.\n\n"
        "Classify the user's message into exactly one of two cases:\n\n"
        "  A) Small talk, greeting, or too vague (e.g. 'hi', 'hello', 'I'm bored', 'what can you do')\n"
        "     → Reply warmly and ask ONE engaging question about their movie mood. Vary your response naturally.\n"
        '     Return ONLY: {"type": "chat", "message": "<your reply>"}\n\n'
        "  B) A vibe, mood, genre, or similarity request (e.g. 'dark thriller', 'something like Inception', 'feel-good 90s comedy', 'mind-bending sci-fi')\n"
        "     → Pick 6–10 movies from the catalog that best match the mood or vibe described.\n"
        '     Return ONLY: {"type": "movies", "reasoning": "<1-2 sentence explanation>", "recommended_ids": [<tmdb_id>, ...]}\n\n'
        "Return valid JSON only — no markdown, no code fences, nothing else."
    )

    user_message = (
        f'User message: "{user_query}"\n\n'
        f"Movie catalog (JSON array):\n{json.dumps(slim_catalog)}"
    )

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_message},
            ],
            response_format={"type": "json_object"},
            temperature=0.5,
        )
        raw = response.choices[0].message.content.strip()
        result = json.loads(raw)
        if result.get("type") == "movies" and "recommended_ids" not in result:
            result["recommended_ids"] = []
        return result
    except Exception as exc:
        log.error("Groq NL search failed: %s", exc)
        return {"reasoning": "Could not process your request right now.", "recommended_ids": []}


def stream_explanation(movie: dict, reasons: dict):
    """
    SSE generator — yields "data: <text chunk>\\n\\n" strings.
    reasons keys: tfidf_features (list[str]), similar_users (int), collab_score (float)
    """
    try:
        client = _get_client()
    except EnvironmentError as exc:
        log.error("Groq not configured: %s", exc)
        yield "data: GROQ_API_KEY is not set. Add it to .env and restart the backend.\n\n"
        yield "data: [DONE]\n\n"
        return

    features = ", ".join(reasons.get("tfidf_features", []))
    n_users = reasons.get("similar_users", 0)
    score = reasons.get("collab_score", 0.0)

    prompt = (
        f"Explain in exactly 2–3 friendly sentences why the movie "
        f"'{movie.get('title', 'this movie')}' was recommended to this user. "
        f"Content features that matched: {features or 'genre and style similarities'}. "
        f"{n_users} users with similar taste rated it {score}/5. "
        "Be specific, warm, and concise. Do not use bullet points."
    )

    try:
        stream = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
            temperature=0.5,
        )
        for chunk in stream:
            text = chunk.choices[0].delta.content or ""
            if text:
                yield f"data: {text}\n\n"
    except Exception as exc:
        log.error("Groq stream_explanation failed: %s", exc)
        yield "data: [Could not generate explanation]\n\n"
    finally:
        yield "data: [DONE]\n\n"
