import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-blue-700 text-white shadow">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-lg tracking-tight hover:text-blue-200 transition-colors">
          ⚽ UCL Draw
        </Link>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/matches" className="hover:text-blue-200 transition-colors">
            Matches
          </Link>
          <Link href="/teams" className="hover:text-blue-200 transition-colors">
            Teams
          </Link>
        </div>
      </div>
    </nav>
  );
}
