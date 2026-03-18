import React from 'react';
import MovieCard from "./MovieCard";

function Watchlist({movies, watchlist,  toggleWatchList}) {
    return (
        <div>
            <h2>Your Watchlist</h2>
            <div className="watchlist">
                {watchlist.map((id) => {
                        const movie = movies.find((movie) => movie.id === id);
                        return (
                            <MovieCard movie={movie} toggleWatchlist={toggleWatchList} isWatchlisted={true} ></MovieCard>
                        );
                    })}
            </div>
        </div>
    );
}

export default Watchlist;
