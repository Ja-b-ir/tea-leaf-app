"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "../lib/auth.js";

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const item = (path, label) => (
    <Link
      href={path}
      className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
        pathname === path ? "bg-amber text-ink font-semibold" : "text-cream/70 hover:bg-cream/10"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <aside className="w-56 shrink-0 bg-ink min-h-screen p-5 flex flex-col">
      <Link href="/" className="font-display text-cream text-lg mb-8 block">
        Tea Leaf Clinic
      </Link>
      <nav className="space-y-1 flex-1">
        {item("/admin", "Dashboard")}
        {item("/admin/history", "Prediction History")}
        {item("/admin/classes", "Disease Classes")}
      </nav>
      <button
        onClick={() => {
          clearToken();
          router.push("/admin/login");
        }}
        className="text-sm text-cream/60 hover:text-amber text-left px-4 py-2"
      >
        Log out
      </button>
    </aside>
  );
}
