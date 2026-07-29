"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function LeafMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <path
        d="M14 2C6 4 2 10 2 16c0 6 5 10 12 10 3-8 6-12 12-16C20 4 16 2 14 2Z"
        fill="#C97A2B"
      />
      <path d="M14 4c-4 5-6 12-6 20" stroke="#16241C" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const linkClass = (path) =>
    `text-sm tracking-wide transition-colors ${
      pathname === path ? "text-amber font-semibold" : "text-cream/80 hover:text-cream"
    }`;

  return (
    <header className="bg-ink">
      <nav className="max-w-6xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LeafMark />
          <span className="font-display text-cream text-lg tracking-tight">
            Tea Leaf Clinic
          </span>
        </Link>
        <div className="flex items-center gap-8">
          <Link href="/" className={linkClass("/")}>
            Diagnose
          </Link>
          <Link href="/about" className={linkClass("/about")}>
            About the Model
          </Link>
          <Link
            href="/admin/login"
            className="text-sm px-3 py-1.5 rounded border border-cream/25 text-cream/70 hover:border-amber hover:text-amber transition-colors"
          >
            Admin
          </Link>
        </div>
      </nav>
    </header>
  );
}
