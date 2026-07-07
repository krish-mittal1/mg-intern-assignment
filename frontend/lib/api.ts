export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export type UploadResult = {
  documentId: string;
  signatureId: string;
  signatureUrl?: string;
  uploadResponse?: unknown;
  signatureResponse?: unknown;
};

export function uploadContract(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append("file", file);

    xhr.open("POST", `${BACKEND_URL}/api/upload-contract`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new Error("Bad response from server"));
        }
        return;
      }
      let msg = xhr.responseText || `Upload failed (${xhr.status})`;
      try {
        const parsed = JSON.parse(xhr.responseText);
        msg = parsed.detail ?? parsed.message ?? msg;
      } catch {}
      reject(new Error(typeof msg === "string" ? msg : JSON.stringify(msg)));
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(form);
  });
}

export async function getSignatureStatus(signatureId: string) {
  const res = await fetch(
    `${BACKEND_URL}/api/signature-status/${encodeURIComponent(signatureId)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Status check failed (${res.status})`);
  }
  return res.json();
}

export function downloadUrl(signatureId: string) {
  return `${BACKEND_URL}/api/download/${encodeURIComponent(signatureId)}`;
}

export type ContractRecord = {
  documentId: string;
  signatureId: string;
  signatureUrl?: string | null;
  filename: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchContracts(): Promise<ContractRecord[]> {
  const res = await fetch(`${BACKEND_URL}/api/contracts`);
  if (!res.ok) throw new Error(`Could not load history (${res.status})`);
  return res.json();
}

export function extractDocumentId(status: Record<string, unknown>): string | null {
  const direct = status.documentId ?? status.document_id;
  if (typeof direct === "string") return direct;

  const doc = status.document;
  if (doc && typeof doc === "object" && "id" in doc) {
    return String((doc as { id: unknown }).id);
  }

  const data = status.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.documentId === "string") return d.documentId;
    if (typeof d.document_id === "string") return d.document_id;
  }

  return null;
}

export function extractStatusLabel(status: Record<string, unknown>): string {
  const raw =
    status.status ??
    status.state ??
    (status.data && typeof status.data === "object"
      ? (status.data as Record<string, unknown>).status
      : null);

  if (typeof raw === "string") return raw;
  return "unknown";
}
