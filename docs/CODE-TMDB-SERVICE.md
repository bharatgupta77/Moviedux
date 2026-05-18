# `src/services/tmdb.ts` — Deep Dive

## Layman Explanation 🍿

Think of it like a **restaurant kitchen**.

**You** (the app) sit at the table and just say *"I want movies."*

**The waiter** (`useMovies` hook) takes your order to the kitchen.

**The kitchen** is `tmdb.ts`. It does all the dirty work:

### What the kitchen does step by step

**1. It has the address of the supplier (TMDB)**
```
Like knowing: "Call this number to order ingredients"
→ https://api.themoviedb.org/3
```

**2. It keeps a cheat sheet handy — `fetchGenreMap()`**

TMDB speaks in codes. It says `genre_ids: [28, 12]`. That means nothing to us.

So the kitchen calls TMDB once and gets the translation:
```
28 = Action
12 = Adventure
35 = Comedy
```
It writes this down and **never calls again** — it just reuses the same sheet.

**3. It translates everything — `transformMovie()`**

TMDB sends something ugly:
```
vote_average: 8.367
poster_path: "/abc.jpg"
genre_ids: [28, 12]
release_date: "2010-07-16"
```
The kitchen converts it to something clean:
```
rating: 8.4
posterPath: "https://image.tmdb.org/.../abc.jpg"
genre: "Action, Adventure"
releaseYear: 2010
```

**4. It fetches ALL movies — `fetchAllPopularMovies()`**

TMDB has 500 pages (20 movies each = 10,000 movies). Instead of fetching one page at a time (slow), the kitchen sends **20 requests at the same time**, waits for all 20 to come back, then sends the next 20.

While doing this it keeps shouting updates to the loading screen:
```
"Loading... 20/500 pages"
"Loading... 40/500 pages"
```

### How a movie title ends up on your screen

```
TMDB API → tmdb.ts (cleans) → useMovies (stores) → App → MoviesGrid → MovieCard → Screen
```

Step by step:
1. App starts → `useMovies` hook fires automatically
2. `fetchAllPopularMovies()` asks TMDB for movies
3. TMDB replies with raw data: `{ "title": "Inception", "vote_average": 8.367, ... }`
4. `transformMovie()` cleans it: `{ title: "Inception", rating: 8.4, ... }`
5. `useMovies` stores it in `useState` → React knows about all movies
6. `App.tsx` passes movies to `MoviesGrid`
7. `MoviesGrid` loops and creates a `MovieCard` for each movie
8. `MovieCard` reads `movie.title` → **"Inception" appears on screen**

Each step only talks to the step next to it. `MovieCard` has no idea TMDB exists — it just gets a `movie` object and displays it.

### The golden rule of this file

**The app never goes to the supplier itself.**

Tomorrow if we replace TMDB with our own Flask backend — only the kitchen changes. The app doesn't even know the difference.

---

## What this file does

One job: **talk to TMDB and translate its data into the shape our app uses.**
Nothing else in the app knows TMDB exists — if we swap to our own Flask backend in Phase 2, only this file changes.

---

## How data flows through this file

```
TMDB API
  ↓
raw TMDBMovie { genre_ids: [28,12], vote_average: 8.4, poster_path: "/abc.jpg" }
  ↓
fetchGenreMap()  →  Map { 28 → "Action", 12 → "Adventure" }
  ↓
transformMovie()
  ↓
Our Movie { genre: "Action, Adventure", rating: 8.4, posterPath: "https://image.tmdb.org/...abc.jpg" }
  ↓
useMovies hook → App → components
```

---

## Section by Section

### 1. Constants at the top

```typescript
const TMDB_BASE       = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';
const API_KEY         = process.env.REACT_APP_TMDB_API_KEY;
```

- `TMDB_BASE` — all API calls start here
- `TMDB_IMAGE_BASE` — poster images live on a separate CDN. `w500` means 500px wide. TMDB only gives us `/abc.jpg` — we prepend this base to get the full URL
- `API_KEY` — reads from `.env`. `process.env.REACT_APP_*` is how CRA exposes env variables to the browser. **Never hardcode a key here.**

---

### 2. Internal types — `TMDBMovie` and `TMDBGenre`

```typescript
interface TMDBMovie {
  genre_ids: number[];         // [28, 12, 878]
  vote_average: number;        // 8.4
  poster_path: string | null;  // "/abc.jpg"  ← not a full URL yet
  ...
}
```

These describe **what TMDB actually sends back** — which is different from our `Movie` interface. Never exported. Only used inside this file to keep the transformation self-contained.

---

### 3. Genre cache — `fetchGenreMap()`

```typescript
let genreCache: Map<number, string> | null = null;  // module-level variable

export async function fetchGenreMap() {
  if (genreCache) return genreCache;  // already fetched → return instantly
  const { data } = await axios.get('/genre/movie/list');
  genreCache = new Map(data.genres.map(g => [g.id, g.name]));
  return genreCache;
}
```

TMDB sends `genre_ids: [28, 12]` but we want `"Action, Adventure"`.
This function fetches the lookup table **once** and stores it in `genreCache` (a module-level variable — lives outside the function so it persists between calls).

Every subsequent call hits the `if (genreCache) return` line and returns immediately — no extra API request.

**`Map<number, string>`** = a dictionary where keys are numbers and values are strings. Faster lookup than scanning an array.

---

### 4. The transformer — `transformMovie()`

This is the **data adapter pattern** — converts TMDB's shape into our app's `Movie` shape.
Called once per movie. The rest of the app never sees raw TMDB data.

```typescript
function transformMovie(raw: TMDBMovie, genreMap: Map<number, string>): Movie {
  return {
    rating: Math.round(raw.vote_average * 10) / 10,
    //      8.367 → 8.4  (round to 1 decimal)

    posterPath: raw.poster_path
      ? `${TMDB_IMAGE_BASE}${raw.poster_path}`  // "/abc.jpg" → full URL
      : '',                                      // no poster → empty string

    genre: raw.genre_ids
      .slice(0, 2)                               // take max 2 genres
      .map(id => genreMap.get(id) ?? 'Unknown')  // [28,12] → ["Action","Adventure"]
      .join(', '),                               // → "Action, Adventure"

    releaseYear: parseInt(raw.release_date.split('-')[0]),
    //           "2010-07-16" → ["2010","07","16"] → "2010" → 2010
  };
}
```

---

### 5. `fetchPopularMovies(page)` — single page

```typescript
export async function fetchPopularMovies(page = 1): Promise<Movie[]> {
  const [{ data }, genreMap] = await Promise.all([
    axios.get('/movie/popular', { params: { page } }),
    fetchGenreMap(),
  ]);
  return data.results.map(m => transformMovie(m, genreMap));
}
```

`Promise.all([...])` fires both requests **simultaneously** — the movie fetch and genre map fetch happen at the same time instead of waiting for one then the other. Saves ~200ms on every call.

---

### 6. `fetchAllPopularMovies()` — every page

```typescript
export async function fetchAllPopularMovies(
  onProgress?: (loaded: number, total: number) => void
): Promise<Movie[]>
```

The big one. Fetches **all ~10,000 movies** TMDB has. Strategy:

**Step 1** — Fetch page 1 to learn `total_pages` (TMDB caps at 500).

**Step 2** — Divide remaining pages into batches of 20.

**Step 3** — Each batch fires 20 requests simultaneously with `Promise.all`.

**Step 4** — After each batch, call `onProgress(loaded, total)` to update the loading screen.

```
Page 1        → fetch + learn total_pages = 500
Pages 2–21    → Promise.all (20 simultaneous) → onProgress(21, 500)
Pages 22–41   → Promise.all (20 simultaneous) → onProgress(41, 500)
Pages 42–61   → Promise.all (20 simultaneous) → onProgress(61, 500)
...continues until all 500 pages done
```

**Why batches instead of all 500 at once?**
TMDB rate-limits at ~40 requests/second. Firing 500 simultaneously gets you blocked with a 429 error. Batches of 20 stay safely within limits.

**`onProgress` is optional (`?`)**
The `?` means callers don't have to pass it. `useMovies.ts` passes it to drive the loading bar text (`"Loading movies... 40 / 500 pages"`). Other future callers can ignore it.

---

### 7. `fetchMovieById(tmdbId)` — single movie detail

Used by `MovieDetail.tsx` when you click on a movie card.

The full detail endpoint returns genres differently from the popular movies endpoint:
- `/movie/popular` → `genre_ids: [28, 12]` (just numbers)
- `/movie/:id` → `genres: [{ id: 28, name: "Action" }, ...]` (full objects)

So we extract the IDs manually before passing to `transformMovie`:
```typescript
const genreIds = data.genres.map((g: TMDBGenre) => g.id);
return transformMovie({ ...data, genre_ids: genreIds }, genreMap);
```

---

## Why a separate service file at all?

Components should not know where data comes from. Compare:

```typescript
// ❌ Bad — MoviesGrid knows about TMDB, its URL format, API key handling
function MoviesGrid() {
  useEffect(() => {
    axios.get('https://api.themoviedb.org/3/movie/popular?api_key=...')
      .then(res => setMovies(res.data.results));
  }, []);
}

// ✅ Good — MoviesGrid only knows it needs movies
function MoviesGrid() {
  const { movies } = useMovies();  // all API details hidden away
}
```

When Phase 2 arrives and we switch to our Flask backend, `MoviesGrid`, `MovieDetail`, and every other component stay **exactly the same**. Only `tmdb.ts` (renamed to `api.ts`) changes.