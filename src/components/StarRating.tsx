import React from 'react';

function getRatingClass(rating: number): string {
  if (rating >= 8) return 'rating-good';
  if (rating >= 5) return 'rating-ok';
  return 'rating-bad';
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating / 2);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map(s => (
        <span key={s} className={s <= filled ? 'star filled' : 'star'}>★</span>
      ))}
      <span className={`md-rating-score ${getRatingClass(rating)}`}>{rating} / 10</span>
    </div>
  );
}

export default StarRating;
