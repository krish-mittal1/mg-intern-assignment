"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  downloadUrl,
  extractDocumentId,
  extractStatusLabel,
  fetchContracts,
  getSignatureStatus,
  type ContractRecord,
} from "@/lib/api";

const POLL_MS = 4000;

function isDone(status: string) {
  const s = status.toLowerCase();
  return (
    s.includes("complete") ||
    s.includes("signed") ||
    s === "success" ||
    s === "sign_complete"
  );
}

function statusTone(label: string) {
  if (isDone(label)) return "signed" as const;
  if (label.toLowerCase().includes("fail") || label.toLowerCase().includes("error"))
    return "error" as const;
  return "pending" as const;
}

function formatWhen(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function StatusClient() {
  const searchParams = useSearchParams();
  const [signatureId, setSignatureId] = useState("");
  const [history, setHistory] = useState<ContractRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  useEffect(() => {
    setHistoryLoading(true);
    fetchContracts()
      .then((rows) => {
        setHistory(rows);
        setHistoryError(null);
      })
      .catch(() => {
        setHistory([]);
        setHistoryError("Could not load recent uploads. Is the backend running?");
      })
      .finally(() => setHistoryLoading(false));

    const fromUrl = searchParams.get("id");
    if (fromUrl) setSignatureId(fromUrl);
  }, [searchParams]);

  const fetchStatus = useCallback(
    async (id: string, silent = false) => {
      if (!id.trim()) return;
      if (!silent) {
        setLoading(true);
        setError(null);
      }

      try {
        const data = await getSignatureStatus(id.trim());
        setStatusData(data);

        const label = extractStatusLabel(data);
        setStatusLabel(label);

        let docId = extractDocumentId(data);
        if (!docId) {
          const match = history.find((h) => h.signatureId === id.trim());
          docId = match?.documentId ?? null;
        }
        setDocumentId(docId);

        if (isDone(label)) setPolling(false);
      } catch (e) {
        if (!silent) {
          setError(e instanceof Error ? e.message : "Could not fetch status");
          setStatusData(null);
          setStatusLabel(null);
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [history]
  );

  useEffect(() => {
    if (!polling || !signatureId.trim()) return;
    const t = setInterval(() => fetchStatus(signatureId, true), POLL_MS);
    return () => clearInterval(t);
  }, [polling, signatureId, fetchStatus]);

  function handleCheck() {
    setPolling(false);
    fetchStatus(signatureId);
  }

  function startPolling() {
    setPolling(true);
    fetchStatus(signatureId, true);
  }

  function selectFromHistory(rec: ContractRecord) {
    setSignatureId(rec.signatureId);
    setDocumentId(rec.documentId);
    setStatusData(null);
    setStatusLabel(rec.status ?? null);
    setError(null);
    setPolling(false);
  }

  const done = statusLabel ? isDone(statusLabel) : false;
  const tone = statusLabel ? statusTone(statusLabel) : null;
  const activeRecord = history.find((h) => h.signatureId === signatureId.trim());

  return (
    <div className="mx-auto w-full max-w-[1120px] px-6 py-16">
      <header className="mb-10">
        <h1 className="font-serif text-[2.6rem] font-bold text-ink">Status</h1>
        <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
          Paste a signature ID or pick one from your recent uploads.
        </p>
      </header>

      <section className="mb-12">
        <label
          htmlFor="sig-id"
          className="text-[0.72rem] uppercase tracking-[0.12em] text-faint"
        >
          Signature ID
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="sig-id"
            value={signatureId}
            onChange={(e) => setSignatureId(e.target.value)}
            placeholder="e.g. sig_abc123"
            className="flex-1 border border-line bg-transparent px-4 py-3 font-mono text-[0.92rem] placeholder:text-faint/60"
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={!signatureId.trim() || loading}
            className="bg-accent px-9 py-3 text-[0.88rem] uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Checking…" : "Check status"}
          </button>
        </div>
      </section>

      {statusLabel && (
        <section className="rise mb-12 border border-line bg-sheet p-6 sm:p-8">
          <div className="grid items-start gap-8 md:grid-cols-2">
            <div>
              <span className="mb-2 block text-[0.72rem] uppercase tracking-[0.12em] text-accent">
                Active query
              </span>
              <h2 className="font-serif text-[1.4rem] font-semibold text-ink">
                {activeRecord?.filename ?? "Signature request"}
              </h2>
              <div className="mt-5 space-y-3 text-[0.92rem] text-muted">
                {documentId && (
                  <div className="flex justify-between border-b border-line/60 pb-2">
                    <span className="text-[0.68rem] uppercase tracking-[0.1em] text-faint">
                      Document
                    </span>
                    <span className="max-w-[60%] truncate font-mono text-xs text-ink">
                      {documentId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-b border-line/60 pb-2">
                  <span className="text-[0.68rem] uppercase tracking-[0.1em] text-faint">
                    Signature
                  </span>
                  <span className="max-w-[60%] truncate font-mono text-xs text-ink">
                    {signatureId.trim()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex h-full flex-col items-start justify-between md:items-end">
              <div
                className={`flex items-center gap-3 border px-4 py-2 ${
                  tone === "signed"
                    ? "border-signed/30 bg-signed/5"
                    : tone === "error"
                      ? "border-red-300 bg-red-50"
                      : "border-line bg-surface"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    tone === "signed"
                      ? "bg-signed"
                      : tone === "error"
                        ? "bg-red-600"
                        : "animate-pulse bg-accent"
                  }`}
                />
                <span
                  className={`text-[0.72rem] uppercase tracking-[0.1em] ${
                    tone === "signed"
                      ? "text-signed"
                      : tone === "error"
                        ? "text-red-700"
                        : "text-accent"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              {!done && (
                <button
                  type="button"
                  onClick={startPolling}
                  disabled={polling}
                  className="mt-6 text-[0.88rem] text-accent underline underline-offset-2 disabled:no-underline disabled:opacity-50"
                >
                  {polling
                    ? "Polling every few seconds…"
                    : "Keep checking automatically"}
                </button>
              )}

              {done && signatureId.trim() && (
                <a
                  href={downloadUrl(signatureId.trim())}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 flex items-center gap-2 border border-ink px-7 py-3 text-[0.88rem] uppercase tracking-[0.06em] text-ink transition-colors hover:bg-ink hover:text-white"
                >
                  Download signed PDF
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {error && (
        <div className="mb-10 border border-red-200 bg-red-50 px-5 py-4 text-[0.92rem] text-red-900">
          {error}
        </div>
      )}

      <div className="grid gap-12 md:grid-cols-3">
        <section className="md:col-span-2">
          <h3 className="mb-5 border-b border-line pb-2 text-[0.72rem] uppercase tracking-[0.12em] text-faint">
            Recent uploads
          </h3>

          {historyLoading && (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-14 animate-pulse border border-line bg-surface"
                />
              ))}
            </div>
          )}

          {!historyLoading && historyError && (
            <p className="border-l-2 border-accent pl-3 text-[0.92rem] text-muted">
              {historyError}
            </p>
          )}

          {!historyLoading && !historyError && history.length === 0 && (
            <div className="border border-dashed border-line px-6 py-12 text-center">
              <p className="font-serif text-[1.2rem] text-ink">Nothing here yet</p>
              <p className="mt-2 text-[0.92rem] text-muted">
                Upload a PDF first — it will show up in this list.
              </p>
            </div>
          )}

          {!historyLoading && history.length > 0 && (
            <div className="divide-y divide-line border border-line">
              {history.map((rec) => {
                const recTone = rec.status ? statusTone(rec.status) : "pending";
                return (
                  <button
                    key={rec.signatureId}
                    type="button"
                    onClick={() => selectFromHistory(rec)}
                    className="flex w-full flex-col items-start gap-2 px-4 py-5 text-left transition-colors hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <span className="text-[0.95rem] font-medium text-ink">
                        {rec.filename}
                      </span>
                      {rec.createdAt && (
                        <span className="mt-0.5 block text-[0.72rem] text-faint">
                          {formatWhen(rec.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      <span className="bg-surface px-2 py-1 font-mono text-[0.72rem] text-muted">
                        {rec.signatureId.length > 16
                          ? `${rec.signatureId.slice(0, 16)}…`
                          : rec.signatureId}
                      </span>
                      {rec.status && (
                        <span className="flex items-center gap-2">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              recTone === "signed" ? "bg-signed" : "bg-accent"
                            }`}
                          />
                          <span
                            className={`text-[0.68rem] uppercase tracking-[0.08em] ${
                              recTone === "signed" ? "text-signed" : "text-accent"
                            }`}
                          >
                            {rec.status}
                          </span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="border border-line bg-surface p-6">
            <h4 className="mb-4 text-[0.72rem] uppercase tracking-[0.12em] text-faint">
              Quick note
            </h4>
            <p className="text-[0.9rem] leading-relaxed text-muted">
              Status checks hit our backend, which asks Setu for the latest state.
              Turn on auto-polling if you are waiting on a signature.
            </p>
          </div>

          {statusData && (
            <div className="border border-line">
              <button
                type="button"
                onClick={() => setRawOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 text-[0.68rem] uppercase tracking-[0.12em] text-muted transition-colors hover:bg-surface-high"
              >
                Raw response
                <span className="text-ink">{rawOpen ? "−" : "+"}</span>
              </button>
              {rawOpen && (
                <pre className="max-h-64 overflow-auto border-t border-line bg-ink p-4 font-mono text-[0.72rem] leading-relaxed text-line">
                  {JSON.stringify(statusData, null, 2)}
                </pre>
              )}
            </div>
          )}
        </section>
      </div>

      {!statusLabel && !loading && !error && signatureId && (
        <p className="mt-10 text-[0.9rem] text-muted">
          Hit check to pull the latest status from Setu.
        </p>
      )}
    </div>
  );
}
