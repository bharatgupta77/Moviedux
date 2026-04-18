# Key Concepts — MovieDux Learning Guide

A plain-English reference for every major concept used in this project.

---

## React Concepts

### Custom Hooks
A function that starts with `use` and calls React's built-in hooks inside it. Used to extract stateful logic out of components so multiple components can share the same logic without duplicating code.

```typescript
// Instead of putting fetch logic in every component that needs movies:
function useMovies() {
  const [movies, setMovies] = useState<Movie[]>([]);
  useEffect(() => { /* fetch */ }, []);
  return { movies, loading, error };
}

// Any component just does:
const { movies } = useMovies();
```

### `useMemo`
Caches a computed value and only recalculates when its dependencies change. Use it when a calculation is expensive and you don't want it running on every render.

```typescript
// Without useMemo — filteredMovies recalculates on EVERY render (even unrelated state changes)
const filteredMovies = movies.filter(...);

// With useMemo — only recalculates when movies, genre, rating, or searchTerm change
const filteredMovies = useMemo(() => movies.filter(...), [movies, genre, rating, searchTerm]);
```

### `useEffect` Cleanup
The function returned from `useEffect` runs when the component unmounts. Critical for async operations — prevents updating state on an unmounted component.

```typescript
useEffect(() => {
  let cancelled = false;
  fetchData().then(data => {
    if (!cancelled) setState(data);   // only update if still mounted
  });
  return () => { cancelled = true; }; // cleanup
}, []);
```

### Lazy `useState` Initializer
Pass a function to `useState` when the initial value is expensive to compute. The function runs once on mount, not on every render.

```typescript
// Runs localStorage.getItem on EVERY render — wasteful
const [list, setList] = useState(JSON.parse(localStorage.getItem('key') ?? '[]'));

// Runs only once on mount — correct
const [list, setList] = useState(() => JSON.parse(localStorage.getItem('key') ?? '[]'));
```

### React Context
Makes data available to any component in the tree without passing it as props through every level. Use it when 3+ components at different levels all need the same data.

```typescript
const UserContext = createContext<UserContextType | null>(null);

// Wrap your app:
<UserProvider><App /></UserProvider>

// Any component, anywhere in the tree:
const { userId } = useContext(UserContext);
```

### `useReducer`
An alternative to `useState` for complex state with multiple transitions. Think of it as a mini state machine.

```typescript
// useState for simple value:
const [count, setCount] = useState(0);

// useReducer for state with multiple possible transitions:
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'ADD_TOAST', message: 'Saved!' });
dispatch({ type: 'REMOVE_TOAST', id: 123 });
```

### `NavLink` vs `Link`
Both navigate between routes. `NavLink` additionally adds an `active` CSS class to the element when the current URL matches the `to` prop. Used for navigation menus where you want to highlight the current page.

---

## TypeScript Concepts

### Interface
Describes the shape of an object — what properties it has and what types they are.

```typescript
interface Movie {
  id: number;
  title: string;
  rating: number;   // TypeScript enforces this is always a number
}
```

### Type Guard
A condition that narrows a type. Used when TypeScript can't infer a type from context.

```typescript
// movies.find() returns Movie | undefined
// The filter below tells TypeScript: "after this, it's definitely Movie, not undefined"
const watchlistMovies = ids
  .map(id => movies.find(m => m.id === id))
  .filter((m): m is Movie => m !== undefined);
```

### Generic Types
Types that work with any type you specify. Like a template.

```typescript
useState<Movie[]>([])          // state holds an array of Movies
useState<string | null>(null)  // state holds a string or null
```

---

## JavaScript / Async Concepts

### `Promise.all`
Runs multiple async operations **in parallel** instead of one after another. Returns when all have resolved.

```typescript
// Sequential — slow (each waits for the previous)
const page1 = await fetchPage(1);
const page2 = await fetchPage(2);

// Parallel — fast (all fire simultaneously)
const [page1, page2, page3] = await Promise.all([fetchPage(1), fetchPage(2), fetchPage(3)]);
```

### Fisher-Yates Shuffle
The correct way to randomly shuffle an array. Simple approach (`sort(() => Math.random() - 0.5)`) produces biased results. Fisher-Yates is unbiased.

```typescript
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

### Data Adapter / Transformer Pattern
External APIs return data in their own shape. Transform it into your app's shape at the boundary so the rest of your code never needs to know about the external format.

```typescript
// TMDB shape (external)          → Our shape (internal)
{ vote_average: 8.4 }            → { rating: 8.4 }
{ genre_ids: [18, 53] }          → { genre: "Drama, Thriller" }
{ poster_path: "/abc.jpg" }      → { posterPath: "https://image.tmdb.org/...abc.jpg" }
```

---

## ML Concepts (Phase 2–3)

### TF-IDF (Term Frequency–Inverse Document Frequency)
A way to measure how important a word is to a document in a collection. Words that appear in every document (like "the") get low weight. Words that appear in few documents (like "cyberpunk") get high weight. Used to represent movies as vectors.

### Cosine Similarity
Measures the angle between two vectors rather than their distance. Why use angle instead of distance? Two short documents and two long documents about the same topic should score as similar — cosine similarity handles this, Euclidean distance doesn't.

### SVD (Singular Value Decomposition)
Decomposes a user × movie ratings matrix into hidden "taste" dimensions. Two users who like similar movies end up with similar vectors, even if they've never rated the same movies. This is the math behind Netflix-style recommendations.

### Content-Based vs Collaborative Filtering
- **Content-based**: recommends movies similar to ones you like, based on features (genre, cast, plot). Works for new users. Doesn't discover unexpected films.
- **Collaborative**: recommends what users like *you* have enjoyed, regardless of content features. Discovers unexpected gems. Requires existing rating data (cold start problem).

---

## CSS Concepts

### `aspect-ratio`
Maintains a fixed width:height ratio regardless of the element's width. `aspect-ratio: 3/4` means height is always 4/3 of the width.

### `object-fit: cover`
Scales an image to fill its container while maintaining aspect ratio, cropping if necessary. Without it, images stretch or compress to fit.

### CSS Custom Properties (Variables)
```css
:root { --color-accent: #FFA100; }
.button { background: var(--color-accent); }
```
Change the variable in one place → updates everywhere it's used.

### `appearance: none`
Removes the browser's default styling from form elements (like `<select>`). Lets you fully control the visual style with CSS.

### `IntersectionObserver`
Browser API that fires a callback when an element enters or leaves the viewport. Used for lazy loading, infinite scroll, and animation triggers — without scroll event listeners.
