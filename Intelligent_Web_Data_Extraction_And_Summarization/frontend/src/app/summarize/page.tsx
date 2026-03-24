"use client";

import { FormEvent, useMemo, useState } from "react";

import PdfPreviewPanel from "@/components/pdf-preview-panel";
import SiteHeader from "@/components/site-header";
import { usePdfPreview } from "@/hooks/use-pdf-preview";
import { createPdfBlob, createTimestampedPdfName } from "@/lib/pdf";

type SummarizeMethod = "scrape" | "crawl";

type SummarizeResponse = {
  url?: string;
  method?: SummarizeMethod;
  summary?: string;
  message?: string;
  statusCode?: number;
};

export default function SummarizePage() {
  const [url, setUrl] = useState("");
  const [method, setMethod] = useState<SummarizeMethod>("scrape");
  const [maxPages, setMaxPages] = useState(3);
  const [focus, setFocus] = useState("");
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SummarizeResponse | null>(null);

  const { previewUrl, fileName, setPdfBlob, clearPdf } = usePdfPreview();

  const summaryText = useMemo(() => result?.summary?.trim() || "", [result]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    clearPdf();

    try {
      const payload: Record<string, unknown> = {
        url,
        method,
        focus: focus || undefined,
      };

      if (method === "crawl") {
        payload.max_pages = maxPages;
      }

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data: SummarizeResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Summarize request failed.");
      }

      setResult(data);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : "Something went wrong while summarizing.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleGeneratePdf() {
    if (!summaryText.trim()) return;

    setPdfLoading(true);
    const blob = createPdfBlob({
      title: "Summary Report",
      sections: [
        { label: "URL", value: url },
        { label: "Method", value: method.toUpperCase() },
        { label: "Focus", value: focus || "General" },
      ],
      content: summaryText,
    });
    setPdfBlob(blob, createTimestampedPdfName("summary-report"));
    setPdfLoading(false);
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="page-shell px-5 pb-20 pt-10 md:px-8 lg:px-14">
        <section className="reveal-up mb-7 space-y-3">
          <span className="badge">Summarize Workspace</span>
          <h1 className="text-3xl font-semibold md:text-5xl">Summarize scraped or crawled content</h1>
          <p className="max-w-3xl text-[var(--muted)]">
            Choose a method from the dropdown, send your URL, and export the generated summary as PDF.
          </p>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <form className="surface-card reveal-up p-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="summary-url">
                    Target URL
                  </label>
                  <input
                    id="summary-url"
                    className="field-input"
                    type="url"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="summary-method">
                    Summary method
                  </label>
                  <select
                    id="summary-method"
                    className="field-input"
                    value={method}
                    onChange={(event) => setMethod(event.target.value as SummarizeMethod)}
                  >
                    <option value="scrape">Scrape</option>
                    <option value="crawl">Crawl</option>
                  </select>
                </div>

                {method === "crawl" ? (
                  <div>
                    <label className="field-label" htmlFor="summary-max-pages">
                      Maximum crawl pages (1-5)
                    </label>
                    <input
                      id="summary-max-pages"
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
                ) : null}

                <div>
                  <label className="field-label" htmlFor="summary-focus">
                    Focus prompt (optional)
                  </label>
                  <input
                    id="summary-focus"
                    className="field-input"
                    type="text"
                    value={focus}
                    onChange={(event) => setFocus(event.target.value)}
                    placeholder="e.g., business model, key updates, financial highlights"
                  />
                </div>
              </div>

              <button className="primary-btn mt-5 w-full" type="submit" disabled={loading}>
                {loading ? "Generating summary..." : "Run Summarize"}
              </button>

              {error ? (
                <p className="mt-4 rounded-xl border border-[#ffd3d3] bg-[#fff5f5] px-3 py-2 text-sm text-[#9d3b3b]">{error}</p>
              ) : null}
            </form>

            <section className="surface-card reveal-up reveal-delay-1 p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">Summary Output</h2>
                {result?.method ? (
                  <p className="text-sm text-[var(--muted)]">Method: {result.method.toUpperCase()}</p>
                ) : null}
              </div>

              <div className="response-content-fixed mt-4 max-h-[460px] overflow-auto rounded-2xl border border-[var(--border)] bg-[#fbfdff] p-4">
                <pre className="result-text text-sm text-[var(--text)]">
                  {summaryText || "Run summarize to view summary content from backend response."}
                </pre>
              </div>
            </section>
          </div>

          <PdfPreviewPanel
            title="PDF Output"
            helperText="Generate preview and download your summary report in PDF format."
            previewUrl={previewUrl}
            fileName={fileName}
            onGenerate={handleGeneratePdf}
            generateDisabled={!summaryText.trim()}
            loading={pdfLoading}
          />
        </section>
      </main>
    </div>
  );
}
