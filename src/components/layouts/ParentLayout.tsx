'use client';

import Link from 'next/link';

interface ParentLayoutProps {
  children: React.ReactNode;
  title?: string;
  rightSlot?: React.ReactNode;
}

export function ParentLayout({ children, title, rightSlot }: ParentLayoutProps) {
  return (
    <div data-testid="parent-layout" className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#4F46E5] px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white rounded-lg shrink-0"
          aria-label="Back to Home"
        >
          ←<span className="ml-1 text-sm">首页/Home</span>
        </Link>
        <h1
          className="flex-1 text-center text-white text-xl truncate"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          {title ?? 'Parent Area / 家长区域'}
        </h1>
        <div className="min-w-[44px] flex items-center justify-end shrink-0">
          {rightSlot}
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-lg mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
