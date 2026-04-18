import React, { useState, useEffect, useMemo } from 'react';

const ALL_QUOTES = [
  // Hollywood
  { line: "Here's looking at you, kid.",                                              film: "Casablanca (1942)" },
  { line: "I'm gonna make him an offer he can't refuse.",                             film: "The Godfather (1972)" },
  { line: "Get busy living, or get busy dying.",                                      film: "The Shawshank Redemption (1994)" },
  { line: "Why so serious?",                                                          film: "The Dark Knight (2008)" },
  { line: "All those moments will be lost in time, like tears in rain.",              film: "Blade Runner (1982)" },
  { line: "You can't handle the truth!",                                              film: "A Few Good Men (1992)" },
  { line: "Life is like a box of chocolates — you never know what you're gonna get.", film: "Forrest Gump (1994)" },
  { line: "May the Force be with you.",                                               film: "Star Wars (1977)" },
  { line: "You is kind, you is smart, you is important.",                             film: "The Help (2011)" },
  { line: "Frankly my dear, I don't give a damn.",                                    film: "Gone with the Wind (1939)" },
  { line: "I see dead people.",                                                       film: "The Sixth Sense (1999)" },
  { line: "To infinity and beyond!",                                                  film: "Toy Story (1995)" },
  { line: "I'm the king of the world!",                                               film: "Titanic (1997)" },
  { line: "You talking to me?",                                                       film: "Taxi Driver (1976)" },
  // Bollywood
  { line: "Mere paas maa hai.",                                                       film: "Deewar (1975)" },
  { line: "Don ko pakadna mushkil hi nahi, namumkin hai.",                            film: "Don (1978)" },
  { line: "Bade bade deshon mein aisi chhoti chhoti baatein hoti rehti hain.",        film: "Dilwale Dulhania Le Jayenge (1995)" },
  { line: "Zindagi badi honi chahiye, lambi nahi.",                                   film: "Anand (1971)" },
  { line: "Bacha hai tu mera.",                                                        film: "Dhurandhar The Revenge (2026)" },
  { line: "Ghar ki yaad nahi aayi tujhe Jassi?",                                      film: "Dhurandhar The Revenge (2026)" },
  // Dhurandar Bollywood (5 extra)
  { line: "Rishtey mein toh hum tumhare baap lagte hain, naam hai Shahenshah.",       film: "Shahenshah (1988)" },
  { line: "Ek baar jo maine commitment kar di, toh phir main apne aap ki bhi nahi sunta.", film: "Wanted (2009)" },
  { line: "Hum jahan khade ho jaate hain, line wahi se shuru hoti hai.",              film: "Kaalia (1981)" },
  { line: "Picture abhi baaki hai mere dost.",                                        film: "Om Shanti Om (2007)" },
  { line: "Agar kisi cheez ko dil se chaho toh poori kaynaat use tumse milane ki koshish mein lag jaati hai.", film: "3 Idiots (2009)" },
];

// Fisher-Yates shuffle — returns a new randomly ordered array
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface LoadingScreenProps {
  progress: string;
}

export default function LoadingScreen({ progress }: LoadingScreenProps) {
  // Shuffle once on mount so every load feels different
  const quotes = useMemo(() => shuffle(ALL_QUOTES), []);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % quotes.length);
        setVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(id);
  }, [quotes]);

  const current = quotes[index];

  return (
    <div className="ls-wrap">
      {/* Spinning rings */}
      <div className="ls-ring-wrap">
        <div className="ls-ring" />
        <div className="ls-ring ls-ring-2" />
        <span className="ls-icon">🎬</span>
      </div>

      <h2 className="ls-title">Sit back &amp; relax.</h2>

      {/* Dialogue section */}
      <p className="ls-dialogue-label">🎭 Iconic Movie Dialogue</p>

      <div className={`ls-quote-wrap ${visible ? 'ls-quote-in' : 'ls-quote-out'}`}>
        <p className="ls-quote">"{current.line}"</p>
        <span className="ls-quote-film">— {current.film}</span>
      </div>

      <p className="ls-progress">{progress || 'Fetching your cinema universe…'}</p>
    </div>
  );
}