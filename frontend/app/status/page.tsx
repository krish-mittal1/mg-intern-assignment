import { Suspense } from "react";
import StatusClient from "./StatusClient";

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-5 py-14 text-[0.9rem] text-muted">
          Loading…
        </div>
      }
    >
      <StatusClient />
    </Suspense>
  );
}
