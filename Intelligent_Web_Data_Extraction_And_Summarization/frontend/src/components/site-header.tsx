"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/crawl", label: "Crawl" },
  { href: "/scrape", label: "Scrape" },
  { href: "/summarize", label: "Summarize" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/90 backdrop-blur-lg">
      <div className="page-shell flex w-full items-center justify-between gap-4 px-5 py-4 md:px-8 lg:px-14">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold tracking-[0.15em] text-[var(--text)]">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--primary)]" />
          WEBINTEL STUDIO
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-2">
          {links.map((link) => {
            const active = isActive(pathname, link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                    : "text-[var(--muted)] hover:bg-white hover:text-[var(--text)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
