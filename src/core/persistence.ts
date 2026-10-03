export const STORAGE_KEY = "xenos:v1";
export const accents = {
  mint: "#adddcc",
  blue: "#a4c5f9",
  violet: "#c3b5eb",
  amber: "#e5c18b",
};
export type Preferences = {
  accent: keyof typeof accents;
  wallpaper: "contour" | "aurora" | "midnight";
  motion: boolean;
  restore: boolean;
  icons: boolean;
};
export const defaults: Preferences = {
  accent: "mint",
  wallpaper: "contour",
  motion: true,
  restore: true,
  icons: true,
};
export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
export function saveStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function getPreferences(): Preferences {
  const data = readStorage<Partial<Preferences> | null>(
    STORAGE_KEY + ":prefs",
    null,
  );
  if (!data || typeof data !== "object") return { ...defaults };
  return {
    accent: typeof data.accent === "string" && Object.hasOwn(accents, data.accent)
      ? data.accent!
      : defaults.accent,
    wallpaper: ["contour", "aurora", "midnight"].includes(data.wallpaper || "")
      ? data.wallpaper!
      : defaults.wallpaper,
    motion: typeof data.motion === "boolean" ? data.motion : true,
    restore: typeof data.restore === "boolean" ? data.restore : true,
    icons: typeof data.icons === "boolean" ? data.icons : true,
  };
}
