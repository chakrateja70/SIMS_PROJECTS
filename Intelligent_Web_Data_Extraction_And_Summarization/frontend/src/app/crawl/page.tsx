"use client";

import { FormEvent, useMemo, useState } from "react";

import PdfPreviewPanel from "@/components/pdf-preview-panel";
import SiteHeader from "@/components/site-header";
import { usePdfPreview } from "@/hooks/use-pdf-preview";
import { createPdfBlob, createTimestampedPdfName } from "@/lib/pdf";

type CrawlItem = {
  url?: string;
  markdown?: string;
};

type CrawlResponse = {
  message?: string;
  statusCode?: number;
  data?: {
    pages_crawled?: number;
    markdown?: string;
    results?: CrawlItem[];
  };
};

export default function CrawlPage() {
  const [url, setUrl] = useState("");
  const [maxPages, setMaxPages] = useState(3);
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CrawlResponse | null>(null);

  const { previewUrl, fileName, setPdfBlob, clearPdf } = usePdfPreview();

  const crawlContent = useMemo(() => {
    if (!result?.data) return "";

    const pages = Array.isArray(result.data.results) ? result.data.results : [];
    if (pages.length > 0) {
      return pages
        .map((page, index) => {
          const pageUrl = page.url ? `Page ${index + 1}: ${page.url}` : `Page ${index + 1}`;
          const markdown = page.markdown?.trim() || "No markdown content received.";
          return `${pageUrl}\n${markdown}`;
        })
        .join("\n\n");
    }

    return result.data.markdown?.trim() || "";
  }, [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    clearPdf();

    try {
      const response = await fetch("/api/crawl", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          max_pages: maxPages,
          focus: focus || undefined,
        }),
      });

      const data: CrawlResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Crawl request failed.");
      }

      setResult(data);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Something went wrong while crawling.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleGeneratePdf() {
    if (!crawlContent.trim()) return;

    setPdfLoading(true);
    const blob = createPdfBlob({
      title: "Crawl Report",
      sections: [
        { label: "URL", value: url },
        { label: "Max Pages", value: String(maxPages) },
      ],
      content: crawlContent,
    });
    setPdfBlob(blob, createTimestampedPdfName("crawl-report"));
    setPdfLoading(false);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="page-shell px-5 pb-20 pt-10 md:px-8 lg:px-14">
        <section className="reveal-up mb-7 space-y-3">
          <span className="badge">Crawl Workspace</span>
          <h1 className="text-3xl font-semibold md:text-5xl">Crawl webpages up to 5 pages</h1>
          <p className="max-w-3xl text-[var(--muted)]">
            Start from one URL and collect linked page content for downstream reporting.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <form className="surface-card reveal-up p-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="crawl-url">
                    Target URL
                  </label>
                  <input
                    id="crawl-url"
                    className="field-input"
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="crawl-max-pages">
                    Maximum pages (1-5)
                  </label>
                  <input
                    id="crawl-max-pages"
                    className="field-input"
                    type="number"
                    min={1}
                    max={5}
                    value={maxPages}
                    onChange={(event) => {
                      const parsed = Number(event.target.value);
                      if (Number.isNaN(parsed)) return;
                      setMaxPages(Math.min(5, Math.max(1, parsed)));
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="crawl-focus">
                    Focus (optional)
                  </label>
                  <input
                    id="crawl-focus"
                    className="field-input"
                    type="text"
                    value={focus}
                    onChange={(event) => setFocus(event.target.value)}
                    placeholder="e.g., pricing, features, release notes"
                  />
                </div>
              </div>

              <button className="primary-btn mt-5 w-full" type="submit" disabled={loading}>
                {loading ? "Running crawl..." : "Run Crawl"}
              </button>

              {error ? (
                <p className="mt-4 rounded-xl border border-[#ffd3d3] bg-[#fff5f5] px-3 py-2 text-sm text-[#9d3b3b]">{error}</p>
              ) : null}
            </form>

            <section className="surface-card reveal-up reveal-delay-1 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">Response Content</h2>
                {result?.message ? <p className="text-sm text-[var(--muted)]">{result.message}</p> : null}
              </div>

              <div className="response-content-fixed mt-4 max-h-[460px] overflow-auto rounded-2xl border border-[var(--border)] bg-[#fbfdff] p-4">
                <pre className="result-text text-sm text-[var(--text)]">
                  {crawlContent || "Run crawl to view markdown content from backend response."}
                </pre>
              </div>
            </section>
          </div>

          <PdfPreviewPanel
            title="PDF Output"
            helperText="Generate preview and download your crawl report in PDF format."
            previewUrl={previewUrl}
            fileName={fileName}
            onGenerate={handleGeneratePdf}
            generateDisabled={!crawlContent.trim()}
            loading={pdfLoading}
          />
        </section>
      </main>
    </div>
  );
}
