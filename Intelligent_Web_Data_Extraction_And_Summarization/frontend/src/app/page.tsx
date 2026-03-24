import Link from "next/link";

import SiteHeader from "@/components/site-header";

const highlights = [
  {
    title: "Crawl Intelligence",
    detail: "Scan up to 5 linked pages from a seed URL and capture structured markdown output.",
  },
  {
    title: "Precision Scraping",
    detail: "Extract page-level content fast with a focused single-URL workflow.",
  },
  {
    title: "Actionable Summaries",
    detail: "Generate targeted summaries from scrape or crawl mode with focus prompts.",
  },
];

const stats = [
  { label: "Crawl depth", value: "1 to 5 pages" },
  { label: "Exports", value: "Live PDF preview + download" },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="page-shell relative overflow-hidden px-5 pb-20 pt-12 md:px-8 lg:px-14">
        <div className="pointer-events-none absolute left-[-8%] top-[-2%] h-72 w-72 rounded-full bg-[#dfeeff] blur-3xl" />
        <div className="pointer-events-none absolute right-[-5%] top-[20%] h-72 w-72 rounded-full bg-[#fff0d9] blur-3xl" />

        <section className="reveal-up relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-7">
            <span className="badge">Intelligent Web Data Extraction & Summarization</span>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.07] md:text-6xl">
              Build clean web intelligence reports.
            </h1>
           <p className="max-w-3xl text-lg leading-relaxed text-[var(--muted)] md:text-xl">
  Extract smarter. Summarize faster. Export stakeholder-ready PDFs instantly.
</p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="/dashboard"
                className="primary-btn flex items-center gap-2 px-7 py-3.5 text-base shadow-[0_8px_24px_rgba(32,119,245,0.28)] transition-shadow hover:shadow-[0_12px_32px_rgba(32,119,245,0.38)]"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                </svg>
                Get Started
              </Link>

              <span className="hidden select-none text-[var(--border)] sm:block">|</span>

              <Link
                href="/summarize"
                className="secondary-btn flex items-center gap-2 px-7 py-3.5 text-base"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Launch Summarize
              </Link>
            </div>
          </div>

          <div className="surface-card reveal-up reveal-delay-1 p-6 md:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#436187]">Live Workflow</p>
            <div className="mt-5 space-y-3">
              {highlights.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[var(--border)] bg-[#fbfdff] p-4">
                  <h3 className="text-lg font-semibold text-[var(--text)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
          {stats.map((stat, index) => (
            <article key={stat.label} className="surface-card reveal-up p-5" style={{ animationDelay: `${index * 0.08}s` }}>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#4a6f9f]">{stat.label}</p>
              <p className="mt-3 text-xl font-semibold text-[var(--text)]">{stat.value}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
