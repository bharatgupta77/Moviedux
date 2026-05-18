import React from 'react';
import { Movie, Mood, MOOD_MAP, MOOD_EMOJI } from '../types/movie';

const HIGH_INTENSITY = ['action', 'thriller', 'horror', 'crime', 'war', 'mystery'];
const MED_INTENSITY  = ['adventure', 'science fiction', 'fantasy', 'drama', 'history'];

function MovieDNA({ movie }: { movie: Movie }) {
  const genres = movie.genre.toLowerCase().split(', ');

  const intensityRaw = genres.reduce((acc, g) => {
    if (HIGH_INTENSITY.some(h => g.includes(h))) return acc + 50;
    if (MED_INTENSITY.some(m => g.includes(m))) return acc + 28;
    return acc + 12;
  }, 0);
  const intensity = Math.min(100, intensityRaw);

  const pacing = movie.runtime
    ? Math.max(0, Math.min(100, Math.round((210 - movie.runtime) / 120 * 100)))
    : 55;

  const buzz = Math.min(100, Math.round((movie.popularity || 0) / 400 * 100));
  const audienceScore = Math.round(movie.rating * 10);

  const bars = [
    { label: 'Audience Score', value: audienceScore, color: '#FFA100' },
    { label: 'Buzz',           value: buzz,          color: '#7b2ff7' },
    { label: 'Intensity',      value: intensity,     color: '#ff2d78' },
    { label: 'Pacing',         value: pacing,        color: '#0af' },
  ];

  const vibes = (Object.entries(MOOD_MAP) as [Mood, string[]][])
    .filter(([mood, moodGenres]) =>
      mood !== 'Any' && moodGenres.some(mg => genres.some(g => g.includes(mg.toLowerCase())))
    );

  return (
    <div className="md-dna">
      <h3 className="md-dna-heading">Movie DNA</h3>
      <div className="md-dna-grid">
        {bars.map(({ label, value, color }, i) => (
          <div key={label} className="md-dna-card">
            <span className="md-dna-value" style={{ color }}>{value}<span className="md-dna-pct">%</span></span>
            <div className="md-dna-track">
              <div
                className="md-dna-fill"
                style={{ '--fill': `${value}%`, background: color, animationDelay: `${i * 0.12}s` } as React.CSSProperties}
              />
            </div>
            <span className="md-dna-label">{label}</span>
          </div>
        ))}
      </div>
      {vibes.length > 0 && (
        <div className="md-dna-vibes">
          <span className="md-dna-vibes-label">Vibes</span>
          <div className="md-dna-vibe-tags">
            {vibes.map(([mood]) => (
              <span key={mood} className="md-dna-vibe-tag">
                {MOOD_EMOJI[mood]} {mood}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MovieDNA;
