import { useState } from "react";
import { readStorage, saveStorage, STORAGE_KEY } from "../core/persistence";
import { Icon } from "../components/Icon";
export default function Notes() {
  const [value, setValue] = useState(() => {
    const saved = readStorage<unknown>(STORAGE_KEY + ":notes", "");
    return typeof saved === "string" ? saved : "";
  });
  const [saved, setSaved] = useState(true);
  return (
    <div className="notes-app">
      <div className="app-toolbar">
        <span>
          <Icon name="notes" size={17} />
          Untitled note
        </span>
        <span className="muted small">
          {saved
            ? "Saved on this device"
            : "Storage unavailable — copy your note"}
        </span>
      </div>
      <textarea
        aria-label="Personal notes"
        placeholder={
          "A thought, an idea, a little reminder…\n\nThis space is yours. Notes stay in this browser."
        }
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(saveStorage(STORAGE_KEY + ":notes", e.target.value));
        }}
      />
      <footer className="app-status">
        <span>{value.trim() ? value.trim().split(/\s+/).length : 0} words</span>
        <span>Local notes · Auto-save</span>
      </footer>
    </div>
  );
}
