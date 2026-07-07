import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-20 pt-14 sm:px-7 sm:pt-20">
      <p className="mb-3 text-[0.82rem] uppercase tracking-[0.14em] text-muted">
        contract signing
      </p>

      <h1 className="font-serif text-[2.4rem] leading-[1.15] text-ink sm:text-[2.85rem]">
        Send a PDF.
        <br />
        Get it signed.
      </h1>

      <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed text-muted">
        Upload a contract, create a signature request through Setu, and track
        when it&apos;s done. Everything goes through our backend — your keys
        stay server-side.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/upload"
          className="bg-accent px-6 py-2.5 text-[0.95rem] text-white hover:bg-[#9a3d19]"
        >
          Upload contract
        </Link>
        <Link
          href="/status"
          className="border border-line bg-surface px-5 py-2.5 text-[0.95rem] text-ink hover:border-ink/30"
        >
          Check status
        </Link>
      </div>

      <div className="mt-16 border-t border-line pt-8">
        <p className="mb-5 text-[0.88rem] font-medium text-ink">How it works</p>
        <ol className="space-y-4 text-[0.95rem] text-muted">
          <li className="flex gap-3">
            <span className="font-serif text-ink">1.</span>
            <span>Upload a PDF (max 10 MB). We send it to Setu and create a signature request.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-serif text-ink">2.</span>
            <span>Open the signing link in a new tab or sign inline on the upload page.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-serif text-ink">3.</span>
            <span>Poll status on the status page. Download the signed PDF when it&apos;s ready.</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
