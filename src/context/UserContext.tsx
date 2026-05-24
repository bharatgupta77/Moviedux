import React, { createContext, useContext, useState } from 'react';
import { postRating } from '../services/api';

interface UserContextType {
  userId: string;
  ratings: Record<number, number>;
  submitRating: (movieId: number, rating: number) => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId] = useState<string>(() => {
    const stored = localStorage.getItem('moviedux_user_id');
    if (stored) return stored;
    const newId = crypto.randomUUID();
    localStorage.setItem('moviedux_user_id', newId);
    return newId;
  });

  const [ratings, setRatings] = useState<Record<number, number>>(() => {
    try {
      const stored = localStorage.getItem('moviedux_ratings');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const submitRating = async (movieId: number, rating: number) => {
    setRatings(prev => {
      const next = { ...prev, [movieId]: rating };
      localStorage.setItem('moviedux_ratings', JSON.stringify(next));
      return next;
    });
    try {
      await postRating(userId, movieId, rating);
    } catch {
      // Rating stored locally even if backend is down
    }
  };

  return (
    <UserContext.Provider value={{ userId, ratings, submitRating }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside <UserProvider>');
  return ctx;
}
