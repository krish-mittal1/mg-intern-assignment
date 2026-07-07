import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Upload your document.",
    body: "Drop a PDF (up to 10 MB). It goes straight to our backend and on to Setu — your API keys never touch the browser.",
  },
  {
    n: "02",
    title: "Create the request.",
    body: "The backend registers the document with Setu and opens a signature request, handing back a signing link.",
  },
  {
    n: "03",
    title: "Track and download.",
    body: "Watch the status update in real time. Once it's signed, pull the finished PDF back down.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1120px] px-6 pb-24 pt-16 sm:pt-24">
      <section className="grid grid-cols-1 items-start gap-12 md:grid-cols-12">
        <div className="flex flex-col items-start gap-7 md:col-span-7">
          <span className="text-[0.75rem] uppercase tracking-[0.2em] text-accent">
            Contract signing
          </span>
          <h1 className="font-serif text-[2.6rem] font-bold leading-[1.08] text-ink sm:text-[3.2rem]">
            Send a PDF.
            <br />
            Get it signed.
          </h1>
          <p className="max-w-xl text-[1.05rem] leading-relaxed text-muted">
            Upload a contract, kick off a signature request through Setu, and
            follow it all the way to a signed document. The keys stay
            server-side; the browser only ever talks to our own backend.
          </p>
          <div className="flex flex-col gap-4 pt-2 sm:flex-row">
            <Link
              href="/upload"
              className="bg-accent px-8 py-3.5 text-[0.9rem] uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90"
            >
              Upload contract
            </Link>
            <Link
              href="/status"
              className="border border-ink px-8 py-3.5 text-[0.9rem] uppercase tracking-[0.08em] text-ink transition-colors hover:bg-surface"
            >
              Check status
            </Link>
          </div>
        </div>

        <div className="relative mt-4 md:col-span-5 md:mt-0">
          <div
            className="mx-auto flex w-full max-w-[360px] flex-col justify-between border border-line bg-sheet p-10"
            style={{ aspectRatio: "1 / 1.32" }}
          >
            <div className="space-y-4">
              <div className="h-1 w-12 bg-accent" />
              <div className="space-y-2">
                <div className="h-2 w-full bg-surface-high" />
                <div className="h-2 w-full bg-surface-high" />
                <div className="h-2 w-3/4 bg-surface-high" />
              </div>
              <div className="space-y-2 pt-6">
                <div className="h-2 w-full bg-surface-high" />
                <div className="h-2 w-5/6 bg-surface-high" />
              </div>
            </div>

            <div className="mt-auto border-t border-dashed border-line pt-8">
              <div className="flex items-end justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-[0.1em] text-faint">
                    Signatory
                  </span>
                  <div className="font-serif text-sm italic text-ink/40">
                    Jonathan Doe
                  </div>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-accent">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-4 w-4"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-6 -left-2 hidden w-60 border border-line bg-sheet p-5 sm:block">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <span className="text-[10px] uppercase tracking-[0.14em] text-ink">
                Server-side keys
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted">
              Setu credentials live only on the backend, never in the client.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-28 border-t border-b border-line py-16">
        <div className="flex flex-col gap-8 md:flex-row md:gap-6">
          <div className="md:w-1/3">
            <h2 className="font-serif text-[2rem] font-semibold text-ink">
              How it works
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-10 md:w-2/3">
            {steps.map((s, i) => (
              <div
                key={s.n}
                className={`flex flex-col items-start gap-5 sm:flex-row ${
                  i < steps.length - 1 ? "border-b border-line pb-10" : ""
                }`}
              >
                <span className="font-serif text-3xl leading-none text-accent">
                  {s.n}
                </span>
                <div className="space-y-3">
                  <h3 className="font-serif text-[1.4rem] font-semibold text-ink">
                    {s.title}
                  </h3>
                  <p className="max-w-lg leading-relaxed text-muted">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-24 border border-line bg-sheet py-20 text-center">
        <div className="mx-auto max-w-xl space-y-8 px-6">
          <h2 className="font-serif text-[2.2rem] font-bold text-ink">
            The signed file is the proof.
          </h2>
          <p className="leading-relaxed text-muted">
            Ready to try it? Upload a PDF and watch the whole thing run.
          </p>
          <Link
            href="/upload"
            className="inline-block bg-accent px-10 py-4 text-[0.9rem] uppercase tracking-[0.08em] text-white transition-opacity hover:opacity-90"
          >
            Upload a contract
          </Link>
        </div>
      </section>
    </div>
  );
}
