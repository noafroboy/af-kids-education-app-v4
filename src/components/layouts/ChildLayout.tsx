'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ChildLayoutProps {
  children: React.ReactNode;
  showHomeButton?: boolean;
}

export function ChildLayout({ children, showHomeButton = true }: ChildLayoutProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <div className="relative max-w-[428px] mx-auto min-h-screen bg-[#FFF9F0] flex flex-col">
      {children}
      {showHomeButton && !isHome && (
        <Link
          href="/"
          className="fixed bottom-6 right-4 w-[88px] h-[88px] bg-[#FF6B35] rounded-full flex items-center justify-center text-4xl shadow-lg z-50"
          aria-label="Go Home"
          style={{ maxWidth: 'calc(428px - 1rem)', right: 'max(1rem, calc(50vw - 214px + 1rem))' }}
        >
          🏠
        </Link>
      )}
    </div>
  );
}
