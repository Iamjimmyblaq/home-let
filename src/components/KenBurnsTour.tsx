import { useEffect, useState } from 'react';

/**
 * Auto-playing Ken Burns slideshow that turns a gallery of property photos
 * into a hands-free virtual walk-through. Each photo cross-fades and slowly
 * pans/zooms for a cinematic feel — no 360° source required.
 */
export const KenBurnsTour = ({ images, captions, intervalMs = 4500 }: {
  images: string[];
  captions?: string[];
  intervalMs?: number;
}) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % images.length), intervalMs);
    return () => clearInterval(t);
  }, [images.length, intervalMs]);

  if (!images.length) return null;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none" onContextMenu={(e) => e.preventDefault()}>
      <style>{`
        @keyframes kb-pan {
          0%   { transform: scale(1.05) translate(0%, 0%); }
          50%  { transform: scale(1.18) translate(-3%, -2%); }
          100% { transform: scale(1.25) translate(2%, -3%); }
        }
        .kb-frame { animation: kb-pan ${intervalMs * 2}ms ease-in-out both; }
      `}</style>
      {images.map((src, i) => (
        <img
          key={src + i}
          src={src}
          alt=""
          draggable={false}
          className={`kb-frame absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-in-out ${i === idx ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
      {/* watermark + protection overlay */}
      <div className="absolute inset-0 pointer-events-auto" style={{ background: 'transparent' }} onContextMenu={(e) => e.preventDefault()} />
      <div className="absolute bottom-4 right-4 text-white/70 text-xs tracking-widest uppercase font-medium drop-shadow">Home-let · Virtual tour</div>
      {captions?.[idx] && (
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-lg text-sm text-white">
          {captions[idx]}
        </div>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default KenBurnsTour;
