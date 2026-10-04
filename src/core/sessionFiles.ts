import { useSyncExternalStore } from "react";

export type SessionEntry = {
  path: string;
  name: string;
  type: "folder" | "session";
  target?: string;
  content?: string;
};

let entries: SessionEntry[] = [];
const listeners = new Set<() => void>();
const publish = (next: SessionEntry[]) => {
  entries = next;
  listeners.forEach((listener) => listener());
};

export const getSessionEntries = () => entries;
export const subscribeSessionEntries = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const useSessionEntries = () =>
  useSyncExternalStore(subscribeSessionEntries, getSessionEntries);

function safeName(input: string) {
  return input
    .replace(/[\\/<>:"|?*]/g, "_")
    .trim()
    .replace(/[. ]+$/, "")
    .slice(0, 80);
}

function insert(parent: string, input: string, type: SessionEntry["type"]) {
  const name = safeName(input);
  if (!name) return null;
  const path = `${parent === "/" ? "" : parent}/${name}`;
  if (entries.some((entry) => entry.path.toLowerCase() === path.toLowerCase()))
    return null;
  const entry: SessionEntry = {
    path,
    name,
    type,
    ...(type === "session" ? { target: `session:${path}`, content: "" } : {}),
  };
  publish([...entries, entry]);
  return entry;
}

export const createSessionFolder = (parent: string, name: string) =>
  insert(parent, name, "folder");
export const createSessionTextFile = (parent: string, name: string) =>
  insert(parent, name, "session");
export const getSessionTextFile = (target?: string) =>
  entries.find((entry) => entry.type === "session" && entry.target === target);
export function updateSessionTextFile(target: string, content: string) {
  const file = getSessionTextFile(target);
  if (!file) return false;
  publish(
    entries.map((entry) =>
      entry.target === target ? { ...entry, content } : entry,
    ),
  );
  return true;
}
export function removeSessionEntry(path: string) {
  const remaining = entries.filter(
    (entry) => entry.path !== path && !entry.path.startsWith(path + "/"),
  );
  if (remaining.length === entries.length) return false;
  publish(remaining);
  return true;
}
