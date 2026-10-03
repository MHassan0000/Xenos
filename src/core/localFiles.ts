import { useSyncExternalStore } from "react";
import { readStorage, saveStorage, STORAGE_KEY } from "./persistence";
export type LocalFile = {
  id: string;
  name: string;
  content: string;
  modified: number;
  deleted: boolean;
};
const raw = readStorage<unknown>(STORAGE_KEY + ":documents", []);
let documents: LocalFile[] = Array.isArray(raw)
  ? raw
      .filter(
        (v) =>
          v &&
          typeof v.id === "string" &&
          typeof v.name === "string" &&
          typeof v.content === "string" &&
          typeof v.modified === "number" &&
          typeof v.deleted === "boolean",
      )
      .slice(0, 1000)
  : [];
const listeners = new Set<() => void>();
export const getDocuments = () => documents;
export const subscribeDocuments = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export const useDocuments = () =>
  useSyncExternalStore(subscribeDocuments, getDocuments);
function commit(next: LocalFile[]) {
  if (!saveStorage(STORAGE_KEY + ":documents", next)) return false;
  documents = next;
  listeners.forEach((fn) => fn());
  return true;
}
export function saveDocument(name: string, content: string, id?: string) {
  if (!id && documents.length >= 1000) return null;
  let safe =
    name
      .replace(/[\\/<>:"|?*]/g, "_")
      .trim()
      .slice(0, 80) || "Untitled.txt";
  const base = safe;
  let count = 1;
  while (
    documents.some(
      (d) =>
        d.id !== id &&
        !d.deleted &&
        d.name.toLowerCase() === safe.toLowerCase(),
    ) ||
    ["about.md", "resume.md", "skills.md", "contact.txt"].includes(
      safe.toLowerCase(),
    )
  ) {
    safe = base.replace(/(\.[^.]+)?$/, ` (${count++})$1`);
  }
  const file = {
    id: id || crypto.randomUUID(),
    name: safe,
    content,
    modified: Date.now(),
    deleted: false,
  };
  return commit([...documents.filter((d) => d.id !== file.id), file])
    ? file
    : null;
}
export const trashDocument = (id: string) =>
  commit(documents.map((d) => (d.id === id ? { ...d, deleted: true } : d)));
export const restoreDocument = (id: string) => {
  const file = documents.find((d) => d.id === id);
  return file ? !!saveDocument(file.name, file.content, id) : false;
};
export const removeDocument = (id?: string) =>
  commit(documents.filter((d) => (id ? d.id !== id : !d.deleted)));
export function downloadText(name: string, content: string) {
  const url = URL.createObjectURL(
    new Blob([content], { type: "text/plain;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
