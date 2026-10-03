import { useEffect, useState } from "react";
import {
  childrenOf,
  getFile,
  normalizePath,
  type FileNode,
} from "../core/filesystem";
import { useDesktop } from "../core/context";
import { Icon } from "../components/Icon";
import { projects } from "../data/portfolio";
export default function Files({ initialPath = "/" }: { initialPath?: string }) {
  const { open } = useDesktop();
  const [history, setHistory] = useState([
    getFile(initialPath)?.type === "folder" ? initialPath : "/",
  ]);
  const [cursor, setCursor] = useState(0);
  const [query, setQuery] = useState("");
  const [list, setList] = useState(false);
  const path = history[cursor];
  function go(p: string) {
    if (getFile(p)?.type !== "folder") return;
    setHistory((h) => [...h.slice(0, cursor + 1), p]);
    setCursor((c) => c + 1);
    setQuery("");
  }
  useEffect(() => {
    if (getFile(initialPath)?.type === "folder") {
      setHistory([initialPath]);
      setCursor(0);
    }
  }, [initialPath]);
  const items = childrenOf(path).filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  );
  function launch(f: FileNode) {
    if (f.type === "folder") go(f.path);
    else if (f.type === "project") open("project", f.target);
    else if (f.type === "image") open("image", f.target);
    else if (f.type === "link")
      window.open(f.target, "_blank", "noopener,noreferrer");
    else if (f.name === "Resume.md") open("resume");
    else if (f.name === "Skills.md") open("skills");
    else if (f.name === "Contact.txt") open("contact");
    else if (f.name === "About.md") open("about");
    else open("document", f.path);
  }
  return (
    <div className="explorer-app">
      <div className="app-toolbar files-toolbar">
        <div className="nav-buttons">
          <button
            className="icon-button"
            aria-label="Back"
            disabled={cursor === 0}
            onClick={() => {
              setCursor((c) => c - 1);
              setQuery("");
            }}
          >
            <Icon name="left" />
          </button>
          <button
            className="icon-button"
            aria-label="Forward"
            disabled={cursor === history.length - 1}
            onClick={() => {
              setCursor((c) => c + 1);
              setQuery("");
            }}
          >
            <Icon name="right" />
          </button>
          <button
            className="icon-button"
            aria-label="Parent folder"
            disabled={path === "/"}
            onClick={() => go(normalizePath("..", path))}
          >
            <Icon name="up" size={16} />
          </button>
        </div>
        <div className="breadcrumbs">
          <button onClick={() => go("/")}>
            <Icon name="home" size={15} />
            Home
          </button>
          {path
            .split("/")
            .filter(Boolean)
            .map((seg, i, parts) => (
              <span key={seg}>
                <Icon name="right" size={12} />
                <button
                  onClick={() => go("/" + parts.slice(0, i + 1).join("/"))}
                >
                  {seg}
                </button>
              </span>
            ))}
        </div>
        <button
          className="icon-button"
          aria-label={list ? "Switch to grid view" : "Switch to list view"}
          onClick={() => setList(!list)}
        >
          <Icon name={list ? "grid" : "menu"} size={16} />
        </button>
      </div>
      <div className="explorer-body">
        <aside className="explorer-sidebar">
          <span className="eyebrow">PLACES</span>
          {["Home", "Projects", "Documents", "Pictures", "Links"].map(
            (name) => (
              <button
                key={name}
                className={`side-link ${(name === "Home" ? path === "/" : path === "/" + name) ? "selected" : ""}`}
                onClick={() => go(name === "Home" ? "/" : "/" + name)}
              >
                <Icon
                  name={
                    name === "Home"
                      ? "home"
                      : name === "Pictures"
                        ? "image"
                        : name === "Links"
                          ? "link"
                          : name === "Documents"
                            ? "file"
                            : "folder"
                  }
                  size={17}
                />
                {name}
              </button>
            ),
          )}
          <div className="sidebar-divider" />
          <span className="eyebrow">WORKSPACE</span>
          <div className="virtual-drive">
            <Icon name="monitor" size={25} />
            <div>
              Xenos Home<small>Portfolio files</small>
            </div>
          </div>
        </aside>
        <div className="files-main scroll-area">
          <label className="search-field">
            <Icon name="search" size={16} />
            <input
              aria-label="Search this folder"
              placeholder="Search this folder…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className={`file-grid ${list ? "file-list" : ""}`}>
            {items.map((f) => {
              const p =
                f.type === "project"
                  ? projects.find((p) => p.id === f.target)
                  : null;
              return (
                <button
                  className="file-item"
                  key={f.path}
                  onClick={() => launch(f)}
                  title={p?.name || f.name}
                >
                  {f.type === "image" ? (
                    <img
                      className="file-thumbnail"
                      src={f.target}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <span
                      className={`file-icon ${f.type === "folder" ? "amber" : f.type === "project" ? "mint" : "blue"}`}
                    >
                      <Icon
                        name={
                          f.type === "folder"
                            ? "folder"
                            : f.type === "link"
                              ? "link"
                              : f.type === "project"
                                ? "code"
                                : "file"
                        }
                        size={35}
                      />
                    </span>
                  )}
                  <span>{p?.name || f.name}</span>
                  <small>
                    {f.type === "folder"
                      ? `${childrenOf(f.path).length} items`
                      : f.type}
                  </small>
                </button>
              );
            })}
          </div>
          {!items.length && (
            <div className="empty-state">
              <Icon name="search" />
              <p>No matching files in this folder.</p>
            </div>
          )}
        </div>
      </div>
      <footer className="app-status">
        <span>{items.length} items</span>
        <span>~{path === "/" ? "" : path} · Virtual portfolio filesystem</span>
      </footer>
    </div>
  );
}
export function DocumentViewer({ path }: { path?: string }) {
  const file = getFile(path || "");
  return (
    <div className="text-viewer scroll-area">
      <pre>{file?.content || "This document could not be found."}</pre>
    </div>
  );
}
export function ImageViewer({ src }: { src?: string }) {
  const [zoom, setZoom] = useState(0);
  return (
    <div className="image-viewer">
      <div className="app-toolbar">
        <span className="muted small">{src?.split("/").pop()}</span>
        <div className="button-row">
          <button
            className="icon-button"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(25, (z || 100) - 25))}
          >
            <Icon name="zoomOut" />
          </button>
          <button className="text-button" onClick={() => setZoom(0)}>
            {zoom ? `${zoom}%` : "Fit"}
          </button>
          <button
            className="icon-button"
            aria-label="Zoom in"
            onClick={() => setZoom((z) => Math.min(300, (z || 100) + 25))}
          >
            <Icon name="zoomIn" />
          </button>
          <a
            className="icon-button"
            href={src}
            target="_blank"
            rel="noreferrer"
            aria-label="Open original image"
          >
            <Icon name="external" size={16} />
          </a>
        </div>
      </div>
      <div className={`image-canvas ${zoom ? "zoomed" : ""}`}>
        <img
          src={src}
          alt={src?.split("/").pop()?.replace(/[-_]/g, " ") || "Project image"}
          style={
            zoom
              ? { width: `${zoom}%`, maxWidth: "none", maxHeight: "none" }
              : {}
          }
        />
      </div>
    </div>
  );
}
