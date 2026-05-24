// App.tsx is now a thin shell — it only:
// 1. Calls hooks to get data
// 2. Wires up routes
// All data-fetching logic has moved to hooks/useMovies.ts and hooks/useWatchlist.ts

import React, { useState } from 'react';
import './App.css';
import './styles/global.css';
import Header from './components/Header';
import Footer from './components/Footer';
import MoviesGrid from './components/MoviesGrid';
import Watchlist from './components/Watchlist';
import MovieDetail from './components/MovieDetail';
import ChatPanel from './components/ChatPanel';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { useMovies } from './hooks/useMovies';
import { useWatchlist } from './hooks/useWatchlist';
import { UserProvider } from './context/UserContext';

function AppInner() {
  const { movies, loading, loadingProgress, error } = useMovies();
  const { watchlist, toggleWatchlist, isWatchlisted } = useWatchlist();
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="App">
      {/* Aurora background — 4 slow-drifting gradient orbs */}
      <div className="aurora" aria-hidden="true">
        <div className="aurora-orb orb-1" />
        <div className="aurora-orb orb-2" />
        <div className="aurora-orb orb-3" />
        <div className="aurora-orb orb-4" />
      </div>

      <div className="container">
        <Header />

        <Router>
          <nav>
            <ul>
              <li>
                <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-pill active' : 'nav-pill'}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/watchlist" className={({ isActive }) => isActive ? 'nav-pill active' : 'nav-pill'}>
                  Watchlist {watchlist.length > 0 && <span className="nav-badge">{watchlist.length}</span>}
                </NavLink>
              </li>
            </ul>
          </nav>

          {error && <div className="error-banner">{error}</div>}

          <Routes>
            <Route
              path="/"
              element={
                <MoviesGrid
                  movies={movies}
                  loading={loading}
                  loadingProgress={loadingProgress}
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                />
              }
            />
            <Route
              path="/watchlist"
              element={
                <Watchlist
                  movies={movies}
                  watchlist={watchlist}
                  toggleWatchlist={toggleWatchlist}
                  isWatchlisted={isWatchlisted}
                />
              }
            />
            <Route
              path="/movies/:id"
              element={
                <MovieDetail
                  movies={movies}
                  isWatchlisted={isWatchlisted}
                  toggleWatchlist={toggleWatchlist}
                />
              }
            />
          </Routes>

          {/* Chat FAB + panel live inside Router so useNavigate works */}
          <button className="chat-fab" onClick={() => setChatOpen(true)}>
            <span className="fab-icon">✨</span> Ask AI
          </button>
          <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
        </Router>
      </div>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppInner />
    </UserProvider>
  );
}

export default App;