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

export default function StatusClient() {
  const searchParams = useSearchParams();
  const [signatureId, setSignatureId] = useState("");
  const [history, setHistory] = useState<ContractRecord[]>([]);
  const [statusData, setStatusData] = useState<Record<string, unknown> | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [statusLabel, setStatusLabel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    fetchContracts()
      .then(setHistory)
      .catch(() => setHistory([]));
    const fromUrl = searchParams.get("id");
    if (fromUrl) setSignatureId(fromUrl);
  }, [searchParams]);

  const fetchStatus = useCallback(async (id: string, silent = false) => {
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
  }, [history]);

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
    setStatusLabel(null);
    setError(null);
    setPolling(false);
  }

  const done = statusLabel ? isDone(statusLabel) : false;

  return (
    <div className="mx-auto max-w-2xl px-5 py-11 sm:px-7 sm:py-14">
      <h1 className="font-serif text-[1.9rem] text-ink">Status</h1>
      <p className="mt-2 max-w-sm text-[0.95rem] text-muted">
        Paste a signature ID or pick one from your recent uploads.
      </p>

      <div className="mt-9">
        <label htmlFor="sig-id" className="text-[0.85rem] text-muted">
          Signature ID
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            id="sig-id"
            value={signatureId}
            onChange={(e) => setSignatureId(e.target.value)}
            placeholder="e.g. sig_abc123"
            className="flex-1 border border-line bg-surface px-3 py-2.5 text-[0.92rem]"
          />
          <button
            type="button"
            onClick={handleCheck}
            disabled={!signatureId.trim() || loading}
            className="bg-ink px-5 py-2.5 text-[0.9rem] text-white disabled:opacity-40"
          >
            {loading ? "Checking…" : "Check"}
          </button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-[0.82rem] uppercase tracking-wide text-muted">
            recent
          </p>
          <ul className="divide-y divide-line border border-line">
            {history.map((rec) => (
              <li key={rec.signatureId}>
                <button
                  type="button"
                  onClick={() => selectFromHistory(rec)}
                  className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-surface sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-[0.9rem] text-ink">{rec.filename}</span>
                  <span className="font-mono text-[0.78rem] text-muted">
                    {rec.signatureId.length > 18
                      ? `${rec.signatureId.slice(0, 18)}…`
                      : rec.signatureId}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p className="mt-6 border-l-2 border-accent pl-3 text-[0.92rem]">{error}</p>
      )}

      {statusLabel && (
        <section className="mt-10 border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-[0.82rem] uppercase tracking-wide text-muted">current status</p>
            <span
              className={`text-[0.95rem] font-medium ${
                done ? "text-[#2d6a3e]" : "text-ink"
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
              className="mt-5 text-[0.88rem] text-accent underline underline-offset-2 disabled:no-underline disabled:opacity-50"
            >
              {polling ? "Polling every few seconds…" : "Keep checking automatically"}
            </button>
          )}

          {done && signatureId.trim() && (
            <a
              href={downloadUrl(signatureId.trim())}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-block border border-ink px-5 py-2 text-[0.9rem] hover:bg-ink hover:text-white"
            >
              Download signed PDF
            </a>
          )}
        </section>
      )}

      {statusData && (
        <details className="mt-8 text-[0.85rem] text-muted">
          <summary className="cursor-pointer hover:text-ink">Raw response</summary>
          <pre className="mt-3 overflow-x-auto border border-line bg-paper p-4 font-mono text-[0.78rem] text-ink">
            {JSON.stringify(statusData, null, 2)}
          </pre>
        </details>
      )}

      {!statusLabel && !loading && !error && signatureId && (
        <p className="mt-10 text-[0.9rem] text-muted">
          Hit check to pull the latest status from Setu.
        </p>
      )}
    </div>
  );
}
