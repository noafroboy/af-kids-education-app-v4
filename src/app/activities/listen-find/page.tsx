import Link from 'next/link';

export default function ListenFindPage() {
  return (
    <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center gap-6 p-8">
      <span className="text-8xl">👂</span>
      <h1 className="text-3xl font-bold text-[#4ECDC4] text-center">
        Listen & Find<br /><span className="text-2xl">听一听</span>
      </h1>
      <p className="text-slate-500 text-center">Coming soon! / 即将推出！</p>
      <Link href="/" className="px-8 py-4 bg-[#FF6B35] text-white rounded-2xl font-bold text-lg">
        Go Home / 回家
      </Link>
    </div>
  );
}
