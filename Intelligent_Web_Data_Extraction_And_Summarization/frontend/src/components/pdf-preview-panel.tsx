"use client";

import React, { useEffect, useState } from "react";

type PdfPreviewPanelProps = {
  title: string;
  helperText: string;
  previewUrl: string | null;
  fileName: string;
  onGenerate: () => void;
  generateDisabled: boolean;
  loading?: boolean;
};

function DocIllustration({ ready }: { ready: boolean }) {
  return (
    <div className="relative h-32 w-24 select-none">
      {/* stacked shadow pages */}
      <div className="absolute left-4 top-3 h-24 w-16 rounded-xl bg-blue-100/70" />
      <div className="absolute left-2 top-1.5 h-24 w-16 rounded-xl bg-blue-200/50" />
      {/* front page */}
      <div
        className="absolute left-0 top-0 flex h-24 w-16 flex-col overflow-hidden rounded-xl border border-blue-200 bg-white shadow-lg"
        style={{ boxShadow: "0 8px 24px rgba(32,119,245,0.18)" }}
      >
        {/* fold corner */}
        <div
          className="absolute right-0 top-0 h-4 w-4 bg-[var(--primary-soft)]"
          style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
        />
        <div className="flex flex-1 flex-col gap-1.5 p-2 pt-3">
          <div className={`h-1.5 rounded ${ready ? "bg-blue-400/70" : "bg-blue-300/60"}`} />
          <div className={`h-1.5 w-4/5 rounded ${ready ? "bg-blue-300/80" : "bg-blue-200/80"}`} />
          <div className={`h-1.5 w-3/5 rounded ${ready ? "bg-blue-400/70" : "bg-blue-300/60"}`} />
          <div className={`h-1.5 rounded ${ready ? "bg-blue-300/80" : "bg-blue-200/80"}`} />
          <div className={`h-1.5 w-4/5 rounded ${ready ? "bg-blue-400/70" : "bg-blue-300/60"}`} />
        </div>
        <div className="bg-gradient-to-r from-[var(--primary)] to-[#60b3ff] py-1 text-center text-[7px] font-bold uppercase tracking-widest text-white">
          PDF
        </div>
      </div>
      {ready && (
        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow">
          <svg className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function PdfPreviewPanel({
  title,
  helperText,
  previewUrl,
  fileName,
  onGenerate,
  generateDisabled,
  loading = false,
}: PdfPreviewPanelProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    if (!isPreviewOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsPreviewOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isPreviewOpen]);

  function handlePreviewClick() {
    onGenerate();
    setIframeLoading(true);
    setIsPreviewOpen(true);
  }

  const hasResult = Boolean(previewUrl);

  return (
    <>
      <section className="surface-card flex h-full flex-col overflow-hidden">
        {/* accent gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#2077f5] via-[#60b3ff] to-[#a5cfff]" />

        <div className="flex flex-1 flex-col p-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)]">
                <svg className="h-5 w-5 text-[var(--primary)]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--text)]">{title}</h2>
                <p className="mt-0.5 text-sm text-[var(--muted)]">{helperText}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="secondary-btn flex items-center gap-1.5 text-sm"
                onClick={handlePreviewClick}
                disabled={generateDisabled || loading}
                type="button"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {loading ? "Preparing…" : "Preview PDF"}
              </button>
              <a
                className={`primary-btn flex items-center gap-1.5 text-sm ${hasResult ? "" : "pointer-events-none opacity-50"}`}
                href={previewUrl ?? undefined}
                download={fileName}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PDF
              </a>
            </div>
          </div>

          {/* Body */}
          <div
            className="pdf-panel-body mt-6 flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border px-6 py-10 text-center"
            style={{
              borderColor: hasResult ? "#bfdbfe" : "var(--border)",
              background: hasResult
                ? "linear-gradient(145deg, #eff6ff 0%, #f8fbff 55%, #f0fdf4 100%)"
                : "linear-gradient(145deg, #f5f9ff 0%, #fdfeff 60%, #fff8f3 100%)",
            }}
          >
            {hasResult ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-blue-100 blur-2xl opacity-60" />
                  <DocIllustration ready />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">PDF is ready!</p>
                  <p className="mt-1 max-w-[200px] truncate text-xs text-[var(--muted)]" title={fileName}>{fileName}</p>
                </div>
                <button
                  onClick={handlePreviewClick}
                  type="button"
                  className="primary-btn flex items-center gap-1.5 px-6 text-sm"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open Full Preview
                </button>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-blue-50 blur-2xl opacity-80" />
                  <DocIllustration ready={false} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">Your PDF export will appear here</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Click <span className="font-semibold text-[var(--primary)]">Preview PDF</span> to generate &amp; preview
                  </p>
                </div>
                {/* feature chips */}
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    { icon: "✦", label: "Formatted Content" },
                    { icon: "⬡", label: "Print-Ready Layout" },
                    { icon: "↓", label: "Instant Download" },
                  ].map((chip) => (
                    <span
                      key={chip.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--muted)] shadow-sm"
                    >
                      <span className="text-[var(--primary)]">{chip.icon}</span>
                      {chip.label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Modal */}
      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="PDF preview modal"
          style={{ animation: "pdf-fade-in 0.18s ease both" }}
        >
          {/* backdrop */}
          <button
            type="button"
            aria-label="Close preview"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsPreviewOpen(false)}
          />

          {/* dialog */}
          <div
            className="surface-card relative z-10 flex h-[88vh] w-[92vw] max-w-6xl flex-col overflow-hidden"
            style={{ animation: "pdf-scale-in 0.22s cubic-bezier(0.34,1.56,0.64,1) both" }}
          >
            {/* modal header */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-soft)] px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)]">
                  <svg className="h-4 w-4 text-[var(--primary)]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)]">PDF Preview</p>
                  {fileName && <p className="truncate text-xs text-[var(--muted)]">{fileName}</p>}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {previewUrl && (
                  <a
                    className="primary-btn flex items-center gap-1.5 py-1.5 text-xs"
                    href={previewUrl}
                    download={fileName}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                )}
                <button
                  type="button"
                  aria-label="Close"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--muted)] transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* iframe / empty state */}
            <div className="relative min-h-0 flex-1 bg-gray-50">
              {iframeLoading && previewUrl && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
                  <p className="text-sm text-[var(--muted)]">Loading preview…</p>
                </div>
              )}
              {previewUrl ? (
                <iframe
                  title="PDF preview"
                  src={previewUrl}
                  className="h-full w-full border-0"
                  onLoad={() => setIframeLoading(false)}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-soft)]">
                    <svg className="h-7 w-7 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-[var(--text)]">No PDF generated yet</p>
                  <p className="max-w-xs text-xs text-[var(--muted)]">Generate a PDF from the latest response to preview it here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
