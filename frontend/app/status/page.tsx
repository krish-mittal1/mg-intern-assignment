import { Suspense } from "react";
import StatusClient from "./StatusClient";

export default function StatusPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-[1120px] px-6 py-16">
          <div className="h-10 w-48 animate-pulse bg-surface" />
          <div className="mt-6 h-4 w-96 animate-pulse bg-surface" />
        </div>
      }
    >
      <StatusClient />
    </Suspense>
  );
}
