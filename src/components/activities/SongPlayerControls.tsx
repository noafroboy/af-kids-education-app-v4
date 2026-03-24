'use client';

interface SongPlayerControlsProps {
  isReady: boolean;
  isPlaying: boolean;
  hasError: boolean;
  onPlayPause: () => void;
  onRetry: () => void;
  onBack: () => void;
}

export function SongPlayerControls({
  isReady,
  isPlaying,
  hasError,
  onPlayPause,
  onRetry,
  onBack,
}: SongPlayerControlsProps) {
  if (hasError) {
    return (
      <div className="flex flex-col items-center gap-4">
        <span className="text-5xl">🎵</span>
        <p className="text-xl text-slate-500 text-center">
          Song unavailable / 歌曲暂时无法播放
        </p>
        <button
          data-testid="retry-btn"
          onClick={onRetry}
          className="px-6 min-h-[88px] bg-[#FF6B35] text-white rounded-2xl font-bold"
        >
          Retry / 重试
        </button>
        <button
          onClick={onBack}
          className="px-4 min-h-[88px] flex items-center text-slate-500 font-semibold text-sm"
        >
          ← Back / 返回
        </button>
      </div>
    );
  }

  return (
    <>
      {!isReady && (
        <p className="text-sm text-slate-400 animate-pulse">
          Loading audio... / 加载中...
        </p>
      )}
      <button
        data-testid="song-play-btn"
        onClick={onPlayPause}
        disabled={!isReady}
        className="w-[88px] h-[88px] bg-[#FF6B35] text-white rounded-full text-4xl shadow-lg flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
    </>
  );
}
