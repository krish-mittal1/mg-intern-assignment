"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { uploadContract, type UploadResult } from "@/lib/api";
import { saveRecord } from "@/lib/storage";

const MAX_MB = 10;

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [embedSign, setEmbedSign] = useState(false);

  function validate(f: File): string | null {
    if (f.type !== "application/pdf") return "Only PDF files work here.";
    if (f.size > MAX_MB * 1024 * 1024) return `Keep it under ${MAX_MB} MB.`;
    if (f.size === 0) return "That file looks empty.";
    return null;
  }

  function pick(f: File | undefined) {
    if (!f) return;
    const err = validate(f);
    if (err) {
      setError(err);
      setFile(null);
      return;
    }
    setError(null);
    setFile(f);
    setResult(null);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setProgress(0);
    setResult(null);

    try {
      const data = await uploadContract(file, setProgress);
      setResult(data);
      if (data.signatureId && data.documentId) {
        saveRecord({
          documentId: data.documentId,
          signatureId: data.signatureId,
          signatureUrl: data.signatureUrl,
          filename: file.name,
          createdAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-11 sm:px-7 sm:py-14">
      <h1 className="font-serif text-[1.9rem] text-ink">Upload</h1>
      <p className="mt-2 text-[0.95rem] text-muted">
        PDF only. We&apos;ll upload to Setu and spin up a signature request.
      </p>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files[0]);
        }}
        className={`mt-8 cursor-pointer border px-6 py-10 transition-colors ${
          dragOver
            ? "border-accent bg-surface"
            : "border-line bg-surface/50 hover:border-ink/25"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />

        {file ? (
          <div>
            <p className="text-[0.85rem] uppercase tracking-wide text-muted">selected</p>
            <p className="mt-1 font-medium text-ink">{file.name}</p>
            <p className="mt-0.5 text-[0.88rem] text-muted">
              {(file.size / 1024).toFixed(0)} KB
            </p>
          </div>
        ) : (
          <div>
            <p className="text-ink">Drop a PDF here or click to browse</p>
            <p className="mt-2 text-[0.88rem] text-muted">Max {MAX_MB} MB</p>
          </div>
        )}
      </div>

      {progress !== null && loading && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-[0.82rem] text-muted">
            <span>Uploading</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full bg-line">
            <div
              className="h-full bg-accent transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-5 border-l-2 border-accent pl-3 text-[0.92rem] text-ink">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-7 bg-ink px-6 py-2.5 text-[0.92rem] text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Working on it…" : "Upload & request signature"}
      </button>

      {result && (
        <section className="mt-12 border-t border-line pt-9">
          <p className="text-[0.82rem] uppercase tracking-[0.12em] text-muted">
            request created
          </p>

          <dl className="mt-5 space-y-3 text-[0.92rem]">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
              <dt className="w-28 shrink-0 text-muted">Document</dt>
              <dd className="break-all font-mono text-[0.85rem]">{result.documentId}</dd>
            </div>
            <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
              <dt className="w-28 shrink-0 text-muted">Signature</dt>
              <dd className="break-all font-mono text-[0.85rem]">{result.signatureId}</dd>
            </div>
          </dl>

          {result.signatureUrl && (
            <div className="mt-7">
              <div className="mb-3 flex gap-5 text-[0.88rem]">
                <button
                  type="button"
                  onClick={() => setEmbedSign(false)}
                  className={!embedSign ? "border-b border-ink text-ink" : "text-muted"}
                >
                  Open in tab
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedSign(true)}
                  className={embedSign ? "border-b border-ink text-ink" : "text-muted"}
                >
                  Sign here
                </button>
              </div>

              {!embedSign ? (
                <a
                  href={result.signatureUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block bg-accent px-5 py-2 text-[0.9rem] text-white hover:bg-[#9a3d19]"
                >
                  Go to signing page →
                </a>
              ) : (
                <iframe
                  src={result.signatureUrl}
                  title="Signing"
                  className="h-[520px] w-full border border-line bg-white"
                />
              )}
            </div>
          )}

          <p className="mt-8 text-[0.88rem] text-muted">
            Track progress on the{" "}
            <Link
              href={`/status?id=${encodeURIComponent(result.signatureId ?? "")}`}
              className="text-ink underline underline-offset-2"
            >
              status page
            </Link>
            .
          </p>
        </section>
      )}
    </div>
  );
}
