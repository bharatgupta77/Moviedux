import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import '../styles/RatingStars.css';

interface Props {
  movieId: number;
}

function RatingStars({ movieId }: Props) {
  const { ratings, submitRating } = useUser();
  const saved = ratings[movieId] ?? 0;
  const [hovered, setHovered] = useState(0);

  const handleClick = (e: React.MouseEvent, star: number) => {
    e.preventDefault();
    e.stopPropagation();
    submitRating(movieId, star);
  };

  return (
    <div className="rating-stars" onClick={e => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          className={`star ${star <= (hovered || saved) ? 'filled' : ''}`}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={e => handleClick(e, star)}
          role="button"
          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default RatingStars;
