import React from 'react';
import {useState, useEffect} from "react";
import movieCard from "./MovieCard";
import MovieCard from "./MovieCard";

function MoviesGrid() {
    // State to hold the list of movies.
    const [movies, setMovies] = useState([]);

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

    // Main content of the MoviesGrid component.
    return (
        <div className="movies-grid">
            {movies.map((movie) => (
                <MovieCard movie={movie} key={movie.id}></MovieCard>
            ))}
        </div>
    );
}

export default MoviesGrid;

