"use client";

import { FormEvent, useMemo, useState } from "react";

import PdfPreviewPanel from "@/components/pdf-preview-panel";
import SiteHeader from "@/components/site-header";
import { usePdfPreview } from "@/hooks/use-pdf-preview";
import { createPdfBlob, createTimestampedPdfName } from "@/lib/pdf";

type ScrapeResponse = {
  message?: string;
  statusCode?: number;
  data?: {
    url?: string;
    markdown?: string;
  };
};

export default function ScrapePage() {
  const [url, setUrl] = useState("");
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScrapeResponse | null>(null);

  const { previewUrl, fileName, setPdfBlob, clearPdf } = usePdfPreview();

  const scrapeContent = useMemo(() => result?.data?.markdown?.trim() || "", [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    clearPdf();

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          focus: focus || undefined,
        }),
      });

      const data: ScrapeResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Scrape request failed.");
      }

      setResult(data);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Something went wrong while scraping.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleGeneratePdf() {
    if (!scrapeContent.trim()) return;

    setPdfLoading(true);
    const blob = createPdfBlob({
      title: "Scrape Report",
      sections: [{ label: "URL", value: url }],
      content: scrapeContent,
    });
    setPdfBlob(blob, createTimestampedPdfName("scrape-report"));
    setPdfLoading(false);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="page-shell px-5 pb-20 pt-10 md:px-8 lg:px-14">
        <section className="reveal-up mb-7 space-y-3">
          <span className="badge">Scrape Workspace</span>
          <h1 className="text-3xl font-semibold md:text-5xl">Scrape a single webpage</h1>
          <p className="max-w-3xl text-[var(--muted)]">
            Extract markdown from one URL and export it as a professional PDF report.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="min-w-0 space-y-6">
            <form className="surface-card reveal-up p-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="scrape-url">
                    Target URL
                  </label>
                  <input
                    id="scrape-url"
                    className="field-input"
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="scrape-focus">
                    Focus (optional)
                  </label>
                  <input
                    id="scrape-focus"
                    className="field-input"
                    type="text"
                    value={focus}
                    onChange={(event) => setFocus(event.target.value)}
                    placeholder="e.g., key facts, plan details"
                  />
                </div>
              </div>

              <button className="primary-btn mt-5 w-full" type="submit" disabled={loading}>
                {loading ? "Running scrape..." : "Run Scrape"}
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

              <div className="response-content-fixed mt-4 max-h-[460px] w-full overflow-auto rounded-2xl border border-[var(--border)] bg-[#fbfdff] p-4">
                <pre className="result-text text-sm text-[var(--text)]">
                  {scrapeContent || "Run scrape to view markdown content from backend response."}
                </pre>
              </div>
            </section>
          </div>

          <div className="min-w-0">
            <PdfPreviewPanel
              title="PDF Output"
              helperText="Generate preview and download your scrape report in PDF format."
              previewUrl={previewUrl}
              fileName={fileName}
              onGenerate={handleGeneratePdf}
              generateDisabled={!scrapeContent.trim()}
              loading={pdfLoading}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
