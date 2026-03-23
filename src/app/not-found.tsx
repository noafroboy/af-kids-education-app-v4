import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center gap-6 p-8">
      <span className="text-8xl" role="img" aria-label="Panda">🐼</span>
      <h1 className="text-3xl font-bold text-center text-slate-700">
        404 — 找不到页面 / Page Not Found
      </h1>
      <p className="text-slate-500 text-center">
        This page doesn&apos;t exist yet. / 这个页面还不存在。
      </p>
      <Link
        href="/"
        className="px-8 py-4 bg-[#FF6B35] text-white rounded-2xl text-lg font-semibold min-h-[56px] flex items-center"
      >
        Go Home 回家
      </Link>
    </div>
  );
}
