import Link from "next/link";

import SiteHeader from "@/components/site-header";

const endpointCards = [
  {
    href: "/crawl",
    label: "Crawl Workspace",
    heading: "Multi-page crawling",
    description: "Capture markdown across linked pages with a max depth of 5 and create a report instantly.",
    color: "#e6f1ff",
  },
  {
    href: "/scrape",
    label: "Scrape Workspace",
    heading: "Single-page extraction",
    description: "Scrape one target URL, inspect the returned markdown, and export an immediate PDF snapshot.",
    color: "#fff1df",
  },
  {
    href: "/summarize",
    label: "Summarize Workspace",
    heading: "Method-based summarization",
    description: "Choose Scrape or Crawl from a dropdown, generate focused summaries, and export polished PDFs.",
    color: "#e8fbf1",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="page-shell px-5 pb-20 pt-10 md:px-8 lg:px-14">
        <div className="reveal-up space-y-4">
          <span className="badge">Operations Dashboard</span>
          <h1 className="text-3xl font-semibold md:text-5xl">Choose an endpoint workspace</h1>
          <p className="max-w-3xl text-base leading-relaxed text-[var(--muted)] md:text-lg">
            Each endpoint has a dedicated full-page experience with custom form inputs, response visualization, and PDF
            preview/download actions.
          </p>
        </div>

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {endpointCards.map((card, index) => (
            <article
              key={card.href}
              className="surface-card reveal-up flex flex-col justify-between p-6"
              style={{ background: `linear-gradient(160deg, ${card.color}, #ffffff)`, animationDelay: `${index * 0.08}s` }}
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.13em] text-[#496991]">{card.label}</p>
                <h2 className="mt-3 text-2xl font-semibold">{card.heading}</h2>
                <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">{card.description}</p>
              </div>

              <Link href={card.href} className="secondary-btn mt-6 w-fit px-5 py-2.5">
                Open
              </Link>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
