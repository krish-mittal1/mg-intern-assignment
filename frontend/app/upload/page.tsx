"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { uploadContract, type UploadResult } from "@/lib/api";

const MAX_MB = 10;

export default function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] px-6 py-16">
      <section className="mb-10">
        <h1 className="font-serif text-[2.6rem] font-bold text-ink">Upload</h1>
        <p className="mt-3 max-w-2xl text-[1.05rem] leading-relaxed text-muted">
          PDF only. We upload it to Setu and open a signature request.
        </p>
      </section>

      <div className="border border-line bg-sheet p-6 sm:p-10">
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
          className={`flex h-64 cursor-pointer flex-col items-center justify-center border border-dashed transition-colors ${
            dragOver
              ? "border-accent bg-surface"
              : "border-faint bg-paper hover:bg-surface"
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
            <div className="text-center">
              <p className="text-[0.72rem] uppercase tracking-[0.12em] text-faint">
                selected
              </p>
              <p className="mt-2 font-serif text-[1.3rem] text-ink">
                {file.name}
              </p>
              <p className="mt-1 text-[0.85rem] text-muted">
                {(file.size / 1024).toFixed(0)} KB
              </p>
            </div>
          ) : (
            <div className="text-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                className="mx-auto mb-4 h-9 w-9 text-accent/70"
              >
                <path d="M12 16V4m0 0-4 4m4-4 4 4" />
                <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
              <p className="font-serif text-[1.3rem] text-ink">
                Drop a PDF here or click to browse
              </p>
              <p className="mt-2 text-[0.72rem] uppercase tracking-[0.12em] text-faint">
                Max {MAX_MB} MB
              </p>
            </div>
          )}
        </div>

        <div className="mt-7 space-y-2">
          <div className="flex items-end justify-between">
            <span className="text-[0.72rem] uppercase tracking-[0.12em] text-faint">
              {file ? file.name : "No file selected"}
            </span>
            {progress !== null && loading && (
              <span className="text-[0.72rem] uppercase tracking-[0.12em] text-accent">
                {progress}%
              </span>
            )}
          </div>
          <div className="h-[2px] w-full bg-surface-high">
            <div
              className="h-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${progress ?? 0}%` }}
            />
          </div>
        </div>

        {error && (
          <p className="mt-6 border-l-2 border-accent pl-3 text-[0.92rem] text-ink">
            {error}
          </p>
        )}

        <div className="mt-10">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="flex items-center gap-3 bg-accent px-9 py-4 text-[0.9rem] uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Working on it…" : "Upload & request signature"}
          </button>
        </div>
      </div>

      {result && (
        <section className="rise mt-10 border border-line border-t-4 border-t-accent bg-sheet p-6 sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-signed" />
            <h3 className="text-[0.72rem] uppercase tracking-[0.14em] text-ink">
              request created
            </h3>
          </div>

          <dl className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
            <div className="space-y-1">
              <dt className="text-[0.72rem] uppercase tracking-[0.12em] text-faint">
                Document ID
              </dt>
              <dd className="break-all font-mono text-[0.9rem] text-ink">
                {result.documentId}
              </dd>
            </div>
            <div className="space-y-1">
              <dt className="text-[0.72rem] uppercase tracking-[0.12em] text-faint">
                Signature ID
              </dt>
              <dd className="break-all font-mono text-[0.9rem] text-ink">
                {result.signatureId}
              </dd>
            </div>
          </dl>

          {result.signatureUrl && (
            <div className="mt-8 border-t border-line pt-7">
              <a
                href={result.signatureUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block bg-accent px-6 py-3 text-[0.88rem] uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90"
              >
                Go to signing page
              </a>
              <p className="mt-3 text-[0.85rem] text-muted">
                Signing opens in a new tab — Setu does not allow embedded signing.
              </p>

              <div className="mt-6 border border-line bg-surface p-4">
                <p className="text-[0.72rem] uppercase tracking-[0.12em] text-faint">
                  Sandbox test values
                </p>
                <p className="mt-2 text-[0.82rem] text-muted">
                  Upload again if the signing page still shows &quot;Test Signer&quot;
                  — old links expire and use stale signer data.
                </p>
                <dl className="mt-3 space-y-1.5 text-[0.85rem] text-muted">
                  <div className="flex gap-3">
                    <dt className="w-20 shrink-0 text-faint">Name</dt>
                    <dd className="text-ink">Shivshankar Choudhury</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-20 shrink-0 text-faint">Aadhaar</dt>
                    <dd className="font-mono text-ink">999999990019</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-20 shrink-0 text-faint">OTP</dt>
                    <dd className="font-mono text-ink">123456</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          <p className="mt-8 text-[0.9rem] text-muted">
            Track progress on the{" "}
            <Link
              href={`/status?id=${encodeURIComponent(result.signatureId ?? "")}`}
              className="text-accent underline underline-offset-2"
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
