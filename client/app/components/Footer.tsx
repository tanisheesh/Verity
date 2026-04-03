'use client';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  return (
    <footer
      className="text-center py-6 text-[12px]"
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      <div className="mb-2">
        Copyright © {currentYear} | Made with{' '}
        <span style={{ color: 'var(--red)' }}>❤️</span> by{' '}
        <a
          href="https://tanisheesh.is-a.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[var(--text-primary)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          Tanish Poddar
        </a>
      </div>
      <div className="flex items-center justify-center gap-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{
            background: '#00ff88',
            animation: 'pulse 2s infinite',
          }}
        />
        <a
          href={`${apiUrl}/api/health`}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-[var(--text-primary)]"
          style={{ color: 'var(--text-muted)' }}
        >
          All Systems Operational
        </a>
      </div>
    </footer>
  );
}
