# Phase 3 — SVD Collaborative Filtering + Claude API

**Status:** 🔜 Planned (after Phase 2)  
**Estimated time:** 4–5 days

---

## Goal

Add SVD matrix factorization for collaborative filtering, and integrate the **Claude API** for natural language movie search and streaming explanations.

---

## What You'll Learn

- SVD (Singular Value Decomposition) — how matrix factorization finds hidden taste patterns
- Difference between content-based (what the movie is) vs collaborative (what users like)
- `scikit-surprise` library
- Claude API — it's just HTTP POST, not magic
- Prompt engineering — how the system prompt shapes output quality
- Streaming APIs (SSE) — how to stream partial text to the browser
- React Context — when prop drilling becomes a problem

---

## New Backend Libraries

```bash
pip install scikit-surprise anthropic flask-sqlalchemy
```

---

## SVD Collaborative Filter

```python
# app/services/collab_filter.py
from surprise import SVD, Dataset, Reader

class CollaborativeFilter:
    def __init__(self):
        self.model = SVD(n_factors=50, n_epochs=20, random_state=42)

    def fit(self, ratings_df):
        # ratings_df: columns = user_id, movie_id, rating (1–5)
        reader = Reader(rating_scale=(1, 5))
        data = Dataset.load_from_df(ratings_df[['user_id', 'movie_id', 'rating']], reader)
        self.model.fit(data.build_full_trainset())

    def get_top_n(self, user_id, candidate_ids, n=10):
        preds = [(mid, self.model.predict(str(user_id), str(mid)).est)
                 for mid in candidate_ids]
        return sorted(preds, key=lambda x: x[1], reverse=True)[:n]
```

**SVD intuition:** The user × movie ratings matrix is factorized into hidden "taste dimensions." Users who like similar movies get similar vectors — even if they've never rated the same movies. This is fundamentally different from content filtering (which only looks at what the movie IS, not who likes it).

Phase 3 seeds the model with **synthetic ratings** generated from TMDB popularity + genre correlation. Real user ratings added in Phase 4.

---

## Claude API Integration

### Feature 1 — Natural Language Search

User types: *"something like Inception but more emotional"*  
→ Claude extracts intent → returns filtered movie IDs

```python
# app/services/claude_client.py
import anthropic, json

client = anthropic.Anthropic()   # reads ANTHROPIC_API_KEY from env

def get_recommendations_from_query(user_query: str, catalog: list[dict]) -> dict:
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system="""You are a movie recommendation assistant.
        Return JSON only: { "reasoning": "...", "recommended_ids": [1,2,3] }""",
        messages=[{
            "role": "user",
            "content": f"Request: {user_query}\n\nCatalog: {json.dumps(catalog[:100])}"
        }]
    )
    return json.loads(response.content[0].text)
```

### Feature 2 — Streaming "Why Recommended?"

```python
def stream_explanation(movie: dict, reasons: dict):
    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": f"Explain in 2-3 friendly sentences why '{movie['title']}' was recommended."
                       f"Content features: {reasons['tfidf_features']}. "
                       f"{reasons['similar_users']} similar users rated it {reasons['collab_score']}/5."
        }]
    ) as stream:
        for text in stream.text_stream:
            yield f"data: {text}\n\n"   # SSE format
```

---

## New API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/recommendations/collab/:userId` | SVD recs for a user |
| POST | `/api/ratings` | Submit 1–5 star rating |
| POST | `/api/chat/message` | NL query → Claude recommendations |
| POST | `/api/chat/explain` | Streaming: why was this recommended |

---

## New Frontend Components

| Component | Purpose |
|-----------|---------|
| `src/context/UserContext.tsx` | Stores userId (UUID) + ratings — eliminates prop drilling |
| `src/components/ChatPanel.tsx` | Slide-out chat: type query → see streaming Claude response |
| `src/components/RatingStars.tsx` | 5-star rating on MovieCard → POST /api/ratings |
| `src/hooks/useChat.ts` | Chat history, sendMessage, isStreaming state |

### `UserContext.tsx` — First use of React Context

```typescript
// Why Context? userId is needed by ChatPanel, RatingStars, WatchlistRecs,
// and the Watchlist page. Passing it as props through 4 levels = prop drilling.
// Context makes it available anywhere without passing through every component.

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId] = useState(() => {
    return localStorage.getItem('moviedux_user_id') ?? crypto.randomUUID();
  });
  const [ratings, setRatings] = useState<Record<number, number>>({});
  // ...
}
```

---

## Add to `.env`

```
ANTHROPIC_API_KEY=your_claude_api_key_here
```

Get key at: https://console.anthropic.com/
