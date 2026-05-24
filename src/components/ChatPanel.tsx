import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Movie } from '../types/movie';
import useChat from '../hooks/useChat';
import '../styles/ChatPanel.css';

interface Props {
  open: boolean;
  onClose: () => void;
}

const HINTS = [
  '"Something like Inception but more emotional"',
  '"Feel-good 90s comedy for a lazy Sunday"',
  '"Dark psychological thriller, not too violent"',
  '"Animated movie the whole family will love"',
];

function ChatPanel({ open, onClose }: Props) {
  const navigate = useNavigate();
  const { messages, isLoading, explanations, sendMessage, explainMovie } = useChat();
  const [input, setInput] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, explanations]);

  const handleSend = () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput('');
    sendMessage(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleWhyClick = (movie: Movie) => {
    explainMovie(movie, {
      tfidf_features: [movie.genre],
      similar_users: Math.floor(Math.random() * 80) + 20,
      collab_score: (movie.rating / 2).toFixed(1),
    });
  };

  return (
    <>
      {open && <div className="chat-backdrop" onClick={onClose} />}
      <div className={`chat-panel ${open ? 'open' : ''}`} role="dialog" aria-label="AI movie search">
        <div className="chat-header">
          <h2><span>✨</span> Ask AI</h2>
          <button className="chat-close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="chat-body" ref={bodyRef}>
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="empty-icon">🎬</div>
              <p>Describe a mood, vibe, or movie style and I'll find matches for you.</p>
              <div className="chat-hints">
                {HINTS.map(hint => (
                  <button
                    key={hint}
                    className="chat-hint"
                    onClick={() => { setInput(hint.replace(/"/g, '')); }}
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                {msg.role === 'user' ? (
                  <span>{msg.text}</span>
                ) : (
                  <>
                    {msg.text && <p className="assistant-reasoning">{msg.text}</p>}
                    {msg.movies && msg.movies.length > 0 && (
                      <div className="chat-movie-list">
                        {msg.movies.map(movie => {
                          const exp = explanations[movie.id];
                          return (
                            <div
                              key={movie.id}
                              className="chat-movie-card"
                              onClick={() => { onClose(); navigate(`/movies/${movie.id}`); }}
                            >
                              <img
                                className="chat-movie-poster"
                                src={movie.posterPath || 'images/default.jpg'}
                                alt={movie.title}
                                onError={e => { (e.target as HTMLImageElement).src = 'images/default.jpg'; }}
                              />
                              <div className="chat-movie-info">
                                <span className="chat-movie-title">{movie.title}</span>
                                <span className="chat-movie-meta">
                                  {movie.genre}{movie.releaseYear > 0 ? ` · ${movie.releaseYear}` : ''}
                                </span>
                                <button
                                  className="why-btn"
                                  onClick={e => { e.stopPropagation(); handleWhyClick(movie); }}
                                  disabled={exp?.streaming}
                                >
                                  {exp?.streaming ? 'Explaining…' : '✦ Why this?'}
                                </button>
                                {exp && (
                                  <div className="chat-explanation">
                                    {exp.text}
                                    {exp.streaming && <span className="streaming-cursor" />}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {msg.movies?.length === 0 && (
                      <span>No matching movies found. Try a different description.</span>
                    )}
                  </>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="chat-loading">
              <span /><span /><span />
            </div>
          )}
        </div>

        <div className="chat-footer">
          <div className="chat-input-row">
            <textarea
              className="chat-input"
              placeholder="Describe a movie vibe…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="chat-send"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              aria-label="Send"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ChatPanel;
