import React from 'react';
import {useState} from "react";
import MovieCard from "./MovieCard";

function MoviesGrid({movies, toggleWatchlist, watchlist}) {

    const [searchTerm, setSearchTerm] = useState("");

    const [genre, setGenre] = useState("All Genres");
    const [rating, setRating] = useState("All");


    const handleSearchTerm = (e) => {
        setSearchTerm(e.target.value);
    }



    const matchesGenre = (movie,genre) => {
        return genre === "All Genres" || movie.genre.toLowerCase() === genre.toLowerCase();
    }

    const matchesSearchTerm = (movie,searchTem) => {
        return movie.title.toLowerCase().includes(searchTerm.toLowerCase());
    }

    const matchesRating = (movie, rating) => {
        switch (rating) {
            case "All":
                return true;
            case "Good":
                return movie.rating >= 8;
            case "Ok":
                return movie.rating >= 5 && movie.rating < 8;
            case "Bad":
                return movie.rating < 5;

            default:
                return false;
        }
    }

    const filteredMovies = movies.filter((movie) =>
        matchesGenre(movie, genre) &&
        matchesRating(movie, rating) &&
        matchesSearchTerm(movie, searchTerm)
    );
    // Main content of the MoviesGrid component.
    return (
        <div>
            <input type="text" className="search-input"
                   placeholder="Search movies..."
                   value={searchTerm}
                   onChange={handleSearchTerm} />

            <div className="filter-bar">
                <div className="filter-slot">
                    <label>Genre</label>
                    <select className="filter-dropdown" value={genre} onChange={(e) => setGenre(e.target.value)}>
                        <option value="All Genres">All Genres</option>
                        <option value="Action">Action</option>
                        <option value="Drama">Drama</option>
                        <option value="Horror">Horror</option>
                        <option value="Fantasy">Fantasy</option>
                    </select>
                </div>
                <div className="filter-slot">
                    <label>Rating</label>
                    <select className="filter-dropdown"  value={rating} onChange={(e) => setRating(e.target.value)}>
                        <option value="All">All</option>
                        <option value="Good">Good</option>
                        <option value="Ok">Ok</option>
                        <option value="Bad">Bad</option>
                    </select>
                </div>
            </div>


            <div className="movies-grid">
                {filteredMovies.map((movie) => (
                    <MovieCard movie={movie} toggleWatchlist={toggleWatchlist} isWatchlisted={watchlist.includes(movie.id)} key={movie.id}></MovieCard>
                ))}
            </div>
        </div>

    );
}

export default MoviesGrid;

