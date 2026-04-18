# Phase 4 — SQLite Persistence + UI Polish

**Status:** 🔜 Planned (after Phase 3)  
**Estimated time:** 2–3 days

---

## Goal

Persist ratings and watchlist in SQLite via SQLAlchemy ORM. Add skeleton screens, error boundaries, toast notifications, infinite scroll, and a CSS variables refactor.

---

## What You'll Learn

- SQLAlchemy ORM: Python classes map to database tables
- The difference between an ORM and raw SQL
- React Error Boundaries (the only remaining use case for class components in a hooks-first app)
- `useReducer` — the natural step toward understanding Redux
- `IntersectionObserver` API — browser-native way to detect when elements enter the viewport
- CSS custom properties (variables) for maintainable theming

---

## Backend — SQLAlchemy Models

```python
# app/models/rating.py
from app import db
from datetime import datetime

class Rating(db.Model):
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.String(36), nullable=False)   # UUID
    movie_id   = db.Column(db.Integer, nullable=False)
    rating     = db.Column(db.Float, nullable=False)        # 1.0–5.0
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# app/models/watchlist.py
class WatchlistItem(db.Model):
    id       = db.Column(db.Integer, primary_key=True)
    user_id  = db.Column(db.String(36), nullable=False)
    movie_id = db.Column(db.Integer, nullable=False)
```

### New Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/watchlist` | Persist watchlist item |
| DELETE | `/api/watchlist/:movieId` | Remove from DB |
| GET | `/api/watchlist/:userId` | Fetch on app load |
| GET | `/api/ratings/:userId` | Fetch saved ratings |

The collaborative filter model retrains on a **background thread** (`threading.Thread`) when new ratings arrive — no task queue needed at this scale.

---

## Frontend Polish

### `LoadingSkeleton.tsx`
Animated CSS skeleton screens — same dimensions as MovieCard but with a shimmer animation instead of real content. Looks far more professional than a spinner.

```css
.skeleton {
  background: linear-gradient(90deg, #1e1e1e 25%, #2a2a2a 50%, #1e1e1e 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}
@keyframes shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}
```

### `ErrorBoundary.tsx`
The **only class component** in the whole app. React requires class components for error boundaries — hooks can't catch render errors.

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError)
      return <div className="error-fallback">Something went wrong. Refresh to try again.</div>;
    return this.props.children;
  }
}
```

### `ToastNotification.tsx`
Brief pop-up messages: "Added to watchlist", "Rating saved", "Recommendation ready".

Uses `useReducer` — a step up from `useState` when state has multiple sub-values or transitions:

```typescript
type Action =
  | { type: 'ADD'; message: string }
  | { type: 'REMOVE'; id: number };

function reducer(state: Toast[], action: Action): Toast[] {
  switch (action.type) {
    case 'ADD':    return [...state, { id: Date.now(), message: action.message }];
    case 'REMOVE': return state.filter(t => t.id !== action.id);
  }
}
```

### `InfiniteScroll.tsx`
Replace pagination with infinite scroll using `IntersectionObserver` — fires a callback when the last card enters the viewport.

```typescript
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) fetchNextPage();
}, { threshold: 0.1 });
observer.observe(sentinelRef.current);
```

### CSS Variables Refactor
Replace all hardcoded color values with CSS custom properties:

```css
:root {
  --color-bg:       #121212;
  --color-surface:  #1e1e1e;
  --color-surface2: #242424;
  --color-border:   rgba(255,255,255,0.08);
  --color-accent:   #FFA100;
  --color-text:     #ffffff;
  --color-muted:    rgba(255,255,255,0.45);
}
```

Every hardcoded `#1e1e1e`, `#FFA100`, `rgba(255,255,255,0.08)` becomes a variable. Changing the theme later = changing 8 lines instead of 80.
