import React from 'react';
import {useState, useEffect} from "react";
import movieCard from "./MovieCard";
import MovieCard from "./MovieCard";

function MoviesGrid() {
    // State to hold the list of movies.
    const [movies, setMovies] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");



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

    const handleSearchTerm = (e) => {
        setSearchTerm(e.target.value);
    }

    const filteredMovies = movies.filter((movie) =>
        movie.title.toLowerCase().includes(searchTerm.toLowerCase()))

    // Main content of the MoviesGrid component.
    return (
        <div>
            <input type="text" className="search-input"
                   placeholder="Search movies..."
                   value={searchTerm}
                   onChange={handleSearchTerm} />
            <div className="movies-grid">
                {filteredMovies.map((movie) => (
                    <MovieCard movie={movie} key={movie.id}></MovieCard>
                ))}
            </div>
        </div>

    );
}

export default MoviesGrid;

