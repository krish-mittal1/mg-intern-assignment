export type ContractRecord = {
  documentId: string;
  signatureId: string;
  signatureUrl?: string;
  filename: string;
  createdAt: string;
};

const KEY = "signkit_history";

export function loadHistory(): ContractRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecord(record: ContractRecord) {
  const existing = loadHistory();
  const filtered = existing.filter((r) => r.signatureId !== record.signatureId);
  const next = [record, ...filtered].slice(0, 20);
  localStorage.setItem(KEY, JSON.stringify(next));
}
