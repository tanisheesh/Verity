'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1000] transition-shadow duration-300 ${
        scrolled ? 'shadow-[0_8px_32px_rgba(0,0,0,0.5)]' : ''
      }`}
      style={{
        background: 'rgba(8,8,8,0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-bright)',
        borderRadius: '9999px',
        padding: '8px 16px',
      }}
    >
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-[20px] tracking-[0.1em]"
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            color: 'var(--accent)',
          }}
        >
          VERITY
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center">
          <Link
            href="/how-it-works"
            className={`transition-colors px-3 ${
              pathname === '/how-it-works'
                ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            style={{ fontSize: '13px' }}
          >
            How It Works
          </Link>
        </div>

        {/* CTA Button */}
        <Link
          href="/analyze"
          className="text-[13px] font-semibold px-4 py-1.5 rounded-full transition-all hover:brightness-110 hover:scale-105"
          style={{
            background: 'var(--accent)',
            color: '#080808',
          }}
        >
          Analyze
        </Link>
      </div>
    </nav>
  );
}
