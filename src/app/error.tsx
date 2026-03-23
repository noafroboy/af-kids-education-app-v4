'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center gap-6 p-8">
      <span className="text-8xl" role="img" aria-label="Panda">🐼</span>
      <h1 className="text-3xl font-bold text-center text-slate-700">
        出错了 / Something went wrong
      </h1>
      <p className="text-slate-500 text-center max-w-sm">
        {error.message || 'An unexpected error occurred. / 发生了意外错误。'}
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-6 py-4 bg-[#4ECDC4] text-white rounded-2xl text-lg font-semibold min-h-[56px]"
        >
          Try Again / 重试
        </button>
        <Link
          href="/"
          className="px-6 py-4 bg-[#FF6B35] text-white rounded-2xl text-lg font-semibold min-h-[56px] flex items-center"
        >
          Go Home 回家
        </Link>
      </div>
    </div>
  );
}
