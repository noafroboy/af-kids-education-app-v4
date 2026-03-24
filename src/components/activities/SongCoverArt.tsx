'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SongCoverArtProps {
  src: string;
  alt: string;
  size?: number;
}

export function SongCoverArt({ src, alt, size = 128 }: SongCoverArtProps) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-purple-50 flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {imgError ? (
        <span className="text-4xl">🎵</span>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
