import { useState } from 'react';
import { Movie } from '../types/movie';
import { sendChatMessage, explainMovieRec } from '../services/api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  text?: string;
  movies?: Movie[];
}

export interface ExplainState {
  movieId: number;
  text: string;
  streaming: boolean;
}

function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [explanations, setExplanations] = useState<Record<number, ExplainState>>({});

  const sendMessage = async (query: string) => {
    if (!query.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setIsLoading(true);
    try {
      const result = await sendChatMessage(query);
      if (result.type === 'chat') {
        setMessages(prev => [...prev, { role: 'assistant', text: result.message }]);
      } else {
        setMessages(prev => [
          ...prev,
          { role: 'assistant', text: result.reasoning, movies: result.movies },
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Sorry, something went wrong. Is the backend running?' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const explainMovie = async (movie: Movie, reasons: object) => {
    const id = movie.id;
    setExplanations(prev => ({ ...prev, [id]: { movieId: id, text: '', streaming: true } }));

    try {
      const reader = await explainMovieRec(movie, reasons);
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        // Parse SSE lines: "data: <text>\n\n"
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') {
            setExplanations(prev => ({
              ...prev,
              [id]: { ...prev[id], streaming: false },
            }));
            return;
          }
          setExplanations(prev => ({
            ...prev,
            [id]: { ...prev[id], text: (prev[id]?.text ?? '') + payload },
          }));
        }
      }
    } catch {
      setExplanations(prev => ({
        ...prev,
        [id]: { movieId: id, text: 'Could not load explanation.', streaming: false },
      }));
    }
  };

  return { messages, isLoading, explanations, sendMessage, explainMovie };
}

export default useChat;
