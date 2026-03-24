import React from 'react';

interface MascotProps {
  size?: number;
  className?: string;
}

export function Mascot({ size = 64, className = '' }: MascotProps) {
  return (
    <span role="img" aria-label="panda" className={className} style={{ fontSize: size }}>
      🐼
    </span>
  );
}
