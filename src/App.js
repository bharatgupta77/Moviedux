import logo from "./logo.svg";
import "./App.css";
import "./styles.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MoviesGrid from "./components/MoviesGrid";
import Watchlist from "./components/Watchlist";
import {BrowserRouter as Router, Routes, Route, Link} from "react-router-dom";
import {useEffect, useState} from "react";


function App() {

    // State to hold the list of movies.
    const [movies, setMovies] = useState([]);
    const [watchlist, setWatchlist] = useState([]);

    // Function to fetch movie data from an external JSON file.
    const fetchMovies = async () => {
        try {
            const response = await fetch('/movies.json');
            const data = await response.json();
            setMovies(data);
        } catch (error) {
            console.error("Error fetching movies:", error);
        }
    }

    useEffect(() => {
        fetchMovies();
    }, []);
    
    const toggleWatchlist = (movieId) => {
        setWatchlist((prevWatchlist) => {
            if (prevWatchlist.includes(movieId)) {
                return prevWatchlist.filter(id => id !== movieId);
            } else {
                return [...prevWatchlist, movieId];
            }
        });
    };

  return (
    <div className="App">
      <div className="container">
          <Header />

          <Router>
              <nav>
                  <ul>
                      <li>
                          <Link to="/">Home</Link>
                      </li>
                      <li>
                          <Link to="/watchlist">Watchlist</Link>
                      </li>
                  </ul>
              </nav>

              <Routes>
                  <Route path="/" element={<MoviesGrid movies={movies} watchlist={watchlist} toggleWatchlist={toggleWatchlist}/>}/>
                  <Route path="/watchlist" element={<Watchlist movies={movies} watchlist={watchlist} toggleWatchList={toggleWatchlist}  />}/>
              </Routes>

          </Router>

      </div>

      <Footer />
    </div>
  );
}

export default App;
