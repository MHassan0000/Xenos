import { createContext, useContext } from "react";
import type { AppId } from "./registry";
import type { Preferences } from "./persistence";
import type { WindowState } from "./windows";
export type DesktopAPI = {
  open: (app: AppId, arg?: string) => void;
  notify: (message: string) => void;
  prefs: Preferences;
  setPrefs: (patch: Partial<Preferences>) => void;
  reset: () => void;
  windows: WindowState[];
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  power: (action: "lock" | "logout" | "restart" | "off") => void;
};
export const DesktopContext = createContext<DesktopAPI>(null!);
export const useDesktop = () => useContext(DesktopContext);
