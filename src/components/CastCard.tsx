import React, { useState } from 'react';

interface CastMemberProps {
  member: { name: string; character: string; profilePath: string };
}

function CastCard({ member }: CastMemberProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  return (
    <div className="md-cast-card">
      <div className="md-cast-avatar">
        {!errored && member.profilePath && (
          <img
            src={member.profilePath}
            alt={member.name}
            className={`md-cast-img ${loaded ? 'md-cast-img-visible' : ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
          />
        )}
        {(!loaded || errored) && (
          <div className={`md-cast-placeholder ${errored || !member.profilePath ? 'md-cast-placeholder-solid' : 'md-cast-placeholder-shimmer'}`}>
            {(errored || !member.profilePath) && (
              <span className="md-cast-initial">{member.name.charAt(0)}</span>
            )}
          </div>
        )}
      </div>
      <span className="md-cast-name">{member.name}</span>
      <span className="md-cast-char">{member.character}</span>
    </div>
  );
}

export default CastCard;
